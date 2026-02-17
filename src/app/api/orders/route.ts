import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateProductDiscount } from '@/lib/discounts';
import { calculateShippingCost } from '@/lib/shipping-calculator';
import { sendOrderConfirmation } from '@/lib/email-notifications';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
          approvals: {
            include: {
              approver: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          costCenter: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      shippingAddressId,
      billingAddressId,
      shippingMethod,
      shippingRateId,
      shippingCost: providedShippingCost,
      shippingCarrier,
      shippingServiceName,
      paymentMethod,
      paymentIntentId: providedPaymentIntentId,
      costCenterId,
      notes,
      couponCode,
    } = body;

    // Get cart with product details including supplier, warehouse, category, brand
    const cart = await db.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                defaultSupplier: {
                  select: { id: true, name: true },
                },
                defaultWarehouse: {
                  select: { id: true, name: true },
                },
                category: {
                  select: { id: true, name: true },
                },
                brand: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate raw subtotal for minimum order discount checks
    const rawSubtotal = cart.items.reduce((sum: number, item: any) => {
      const price = Number(item.product.salePrice || item.product.basePrice);
      return sum + price * item.quantity;
    }, 0);

    // Get user account type and B2B membership
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true, gsaApprovalStatus: true },
    });

    const b2bMembership = await db.b2BAccountMember.findFirst({
      where: { userId: session.user.id },
      include: {
        b2bProfile: {
          select: {
            members: {
              where: {
                isActive: true,
                role: { in: ['ACCOUNT_ADMIN', 'APPROVER'] }
              },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    // Map account type for discount calculation
    const isApprovedGSA = user?.accountType === 'GSA' && user?.gsaApprovalStatus === 'APPROVED';
    let accountType = user?.accountType || 'B2C';
    if (isApprovedGSA) {
      accountType = 'GOVERNMENT';
    } else if (accountType === 'B2B') {
      accountType = 'VOLUME_BUYER';
    } else if (accountType === 'B2C') {
      accountType = 'PERSONAL';
    }

    // Calculate totals with discount system
    let subtotal = 0;
    const orderItemsPromises = cart.items.map(async (item: any) => {
      // Calculate discount for this product
      const discountResult = await calculateProductDiscount(
        {
          id: item.product.id,
          categoryId: item.product.categoryId,
          brandId: item.product.brandId,
          defaultSupplierId: item.product.defaultSupplierId,
          defaultWarehouseId: item.product.defaultWarehouseId,
          basePrice: parseFloat(item.product.basePrice.toString()),
          salePrice: item.product.salePrice ? parseFloat(item.product.salePrice.toString()) : null,
          wholesalePrice: item.product.wholesalePrice ? parseFloat(item.product.wholesalePrice.toString()) : null,
          gsaPrice: item.product.gsaPrice ? parseFloat(item.product.gsaPrice.toString()) : null,
        },
        accountType as any,
        rawSubtotal
      );

      const price = discountResult.discountedPrice;
      const itemTotal = price * item.quantity;

      // Determine stock source based on availability
      let stockSource: 'OUR_WAREHOUSE' | 'SUPPLIER_STOCK' | 'BACKORDER' = 'OUR_WAREHOUSE';
      const availableStock = item.product.stockQuantity || 0;

      if (availableStock < item.quantity) {
        // Not enough stock in our warehouse
        if (item.product.defaultSupplierId) {
          stockSource = 'SUPPLIER_STOCK'; // Will be ordered from supplier
        } else {
          stockSource = 'BACKORDER'; // No supplier, backorder
        }
      }

      return {
        productId: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        price,
        total: itemTotal,
        supplierId: item.product.defaultSupplierId || null,
        warehouseId: item.product.defaultWarehouseId || null,
        stockSource,
      };
    });

    // Await all order items
    const orderItems = await Promise.all(orderItemsPromises);

    // Calculate subtotal from order items
    subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    // Fix #2: Validate and apply coupon discount server-side
    let couponDiscount = 0;
    let validatedCoupon: any = null;
    if (couponCode) {
      validatedCoupon = await db.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          startsAt: { lte: new Date() },
          OR: [
            { endsAt: null },
            { endsAt: { gte: new Date() } },
          ],
        },
      });

      if (validatedCoupon) {
        // Check usage limits
        const withinUsageLimit = !validatedCoupon.usageLimit || validatedCoupon.usageCount < validatedCoupon.usageLimit;
        const meetsMinPurchase = !validatedCoupon.minPurchase || subtotal >= Number(validatedCoupon.minPurchase);

        if (withinUsageLimit && meetsMinPurchase) {
          if (validatedCoupon.type === 'PERCENTAGE') {
            couponDiscount = subtotal * (Number(validatedCoupon.value) / 100);
            if (validatedCoupon.maxDiscount) {
              couponDiscount = Math.min(couponDiscount, Number(validatedCoupon.maxDiscount));
            }
          } else if (validatedCoupon.type === 'FIXED_AMOUNT') {
            couponDiscount = Math.min(Number(validatedCoupon.value), subtotal);
          } else if (validatedCoupon.type === 'FREE_SHIPPING') {
            // Will be handled in shipping cost
          }
        }
      }
    }

    const totalWeight = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.product.weight || 0) * item.quantity;
    }, 0);

    // SECURITY FIX: Calculate shipping cost server-side (ignore client-supplied value)
    const shippingResult = calculateShippingCost({
      subtotal,
      totalWeight,
      isFreeShippingCoupon: validatedCoupon?.type === 'FREE_SHIPPING',
    });
    const shippingCost = shippingResult.cost;

    // Fix #7: Use only normalized accountType for tax calculation
    const isTaxExempt = accountType === 'GOVERNMENT' || accountType === 'VOLUME_BUYER';
    const taxableAmount = subtotal - couponDiscount;
    const tax = isTaxExempt ? 0 : taxableAmount * 0.08;

    // Fix #2: Apply coupon discount to total
    const total = subtotal - couponDiscount + shippingCost + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Determine if approval is needed
    const requiresApproval =
      b2bMembership &&
      b2bMembership.requiresApproval &&
      b2bMembership.approvalThreshold &&
      total > Number(b2bMembership.approvalThreshold);

    // Determine payment status based on payment method
    const initialPaymentStatus = paymentMethod === 'net30' || paymentMethod === 'invoice'
      ? 'PENDING' // Invoice-based payments start as pending
      : providedPaymentIntentId
        ? 'PENDING' // Card payments will be confirmed via Stripe webhook
        : 'PENDING';

    // Fix #9: Use transaction for order creation + inventory update
    const order = await db.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          accountType: user?.accountType || 'B2C',
          ...(b2bMembership && { createdByMemberId: b2bMembership.id }),
          status: requiresApproval ? 'ON_HOLD' : 'PENDING',
          paymentStatus: initialPaymentStatus,
          paymentMethod: paymentMethod || 'CREDIT_CARD',
          paymentIntentId: providedPaymentIntentId || null,
          shippingMethod: shippingServiceName || shippingMethod || 'GROUND',
          shippingCarrier: shippingCarrier || null,
          subtotal,
          shipping: shippingCost,
          tax,
          taxAmount: tax,
          shippingCost: shippingCost,
          totalAmount: total,
          discount: couponDiscount,
          total,
          shippingAddressId,
          billingAddressId,
          costCenterId: costCenterId || b2bMembership?.costCenterId,
          customerNotes: notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Create approval request if needed
      if (requiresApproval && b2bMembership?.b2bProfile.members[0]) {
        await tx.orderApproval.create({
          data: {
            orderId: newOrder.id,
            requestedById: b2bMembership.id,
            approverId: b2bMembership.b2bProfile.members[0].id,
            orderTotal: total,
            status: 'PENDING',
          },
        });
      }

      // Increment coupon usage count
      if (validatedCoupon) {
        await tx.coupon.update({
          where: { id: validatedCoupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Update inventory
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    // Send order confirmation email (non-blocking)
    const orderUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    if (orderUser?.email) {
      const shippingAddr = order.shippingAddress;
      sendOrderConfirmation({
        email: orderUser.email,
        userName: orderUser.name || 'Customer',
        orderNumber: order.orderNumber,
        items: order.items.map((item: any) => ({
          name: item.name,
          sku: item.sku || '',
          quantity: item.quantity,
          price: Number(item.price),
          image: item.product?.images?.[0] ? `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''}${item.product.images[0]}` : undefined,
        })),
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping || order.shippingCost || 0),
        tax: Number(order.tax || order.taxAmount || 0),
        discount: Number(order.discount || 0),
        total: Number(order.total || order.totalAmount),
        shippingAddress: shippingAddr ? {
          name: shippingAddr.fullName || (shippingAddr.firstName ? `${shippingAddr.firstName} ${shippingAddr.lastName || ''}`.trim() : undefined),
          street: shippingAddr.addressLine1 || shippingAddr.address1 || '',
          city: shippingAddr.city || '',
          state: shippingAddr.state || '',
          zip: shippingAddr.zipCode || '',
        } : { street: '', city: '', state: '', zip: '' },
        paymentMethod: paymentMethod === 'net30' ? 'Net 30 Invoice' : paymentMethod === 'invoice' ? 'Invoice' : 'Credit Card',
        userId: session.user.id,
        orderId: order.id,
      }).catch(err => console.error('Failed to send order confirmation email:', err));
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
