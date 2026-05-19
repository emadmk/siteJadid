export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateProductDiscount } from '@/lib/discounts';

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let cart = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId: session.user.id,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
              variant: true,
            },
          },
        },
      });
    }

    // Normalize the user's account type once for live discount lookups.
    const userAccountTypeForDiscount = (session.user.accountType || 'B2C') as any;

    // First pass: rough subtotal using stored item.price. We need this so the
    // discount engine can apply order-amount-based tiers when re-pricing each
    // line below. We don't return this to the client.
    const rawSubtotal = cart.items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.price.toString()) * item.quantity,
      0,
    );

    // Enrich items with minimumOrderQty and the *live* effective price.
    // The price stored on a cart item is whatever was current when the item
    // was added. If the admin later activates / changes a volume-buyer or
    // tier discount, we must surface the new effective price here so the
    // customer sees the actual amount they'll pay and the cart total
    // matches the order total at checkout.
    const enrichedItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const minOrder = await db.product.findUnique({
          where: { id: item.productId },
          select: { minimumOrderQty: true },
        });

        const originalPrice = parseFloat(item.price.toString());
        let effectivePrice = originalPrice;
        try {
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
            userAccountTypeForDiscount,
            rawSubtotal,
          );
          // Only ever take the cheaper of the two — never raise the price
          // above what the customer was originally quoted on add-to-cart.
          if (discountResult.discountedPrice < originalPrice) {
            effectivePrice = discountResult.discountedPrice;
          }
        } catch (e) {
          // If discount calculation fails, fall back to the stored price.
        }

        return {
          ...item,
          // Mutate price the UI reads so summary lines stay in sync without
          // changes elsewhere. Original kept for "you saved" displays.
          price: effectivePrice,
          originalPrice,
          effectivePrice,
          product: {
            ...item.product,
            minimumOrderQty: minOrder?.minimumOrderQty || 1,
          },
        };
      }),
    );

    // Totals computed from the (possibly re-discounted) effective prices.
    const subtotal = enrichedItems.reduce(
      (sum: number, item: any) => sum + Number(item.effectivePrice) * item.quantity,
      0,
    );
    const originalSubtotal = enrichedItems.reduce(
      (sum: number, item: any) => sum + Number(item.originalPrice) * item.quantity,
      0,
    );
    const totalSavings = Math.max(0, originalSubtotal - subtotal);

    // Fetch discount tiers for this user
    const userAccountType = session.user.accountType || 'B2C';
    let normalizedType: 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT' = 'PERSONAL';
    if (userAccountType === 'B2B' || userAccountType === 'VOLUME_BUYER') normalizedType = 'VOLUME_BUYER';
    else if (userAccountType === 'GSA' || userAccountType === 'GOVERNMENT') normalizedType = 'GOVERNMENT';

    const discountSettings = await db.userTypeDiscountSettings.findMany({
      where: {
        accountType: normalizedType,
        isActive: true,
        categoryId: null,
        brandId: null,
        supplierId: null,
        warehouseId: null,
      },
      orderBy: { minimumOrderAmount: 'asc' },
      select: { id: true, discountPercentage: true, minimumOrderAmount: true },
    });

    const discountTiers = discountSettings.map((d) => ({
      id: d.id,
      discountPercentage: Number(d.discountPercentage),
      minimumOrderAmount: Number(d.minimumOrderAmount),
    }));

    const discountAccountLabel = normalizedType === 'VOLUME_BUYER' ? 'Volume Buyer' : normalizedType === 'GOVERNMENT' ? 'Government' : 'Member';

    const result = {
      ...cart,
      items: enrichedItems,
      subtotal,
      originalSubtotal,
      totalSavings,
      itemCount: enrichedItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
      discountTiers,
      discountAccountLabel,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity = 1, variantId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get product with category and brand for discount calculation
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true } },
        brand: { select: { id: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }

    // If variantId is provided, validate it
    let variant: Awaited<ReturnType<typeof db.productVariant.findUnique>> = null;
    if (variantId) {
      variant = await db.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      }

      if (!variant.isActive) {
        return NextResponse.json({ error: 'Variant is not available' }, { status: 400 });
      }

      // Stock check is bypassed when the requested quantity meets the
      // product's minimum order qty — these products are typically supplier-
      // stocked / drop-shipped, so the order will fall through to
      // SUPPLIER_STOCK or BACKORDER at fulfilment time. Without this, an
      // item with MOQ 3,000 and warehouse stock 100 could never be ordered.
      const moq = product.minimumOrderQty || 1;
      const isSupplierStocked =
        !!product.defaultSupplierId || quantity >= moq;
      if (!isSupplierStocked && variant.stockQuantity < quantity) {
        return NextResponse.json({ error: 'Insufficient stock for this variant' }, { status: 400 });
      }
    } else {
      // Same logic at the product level: MOQ-meeting orders or supplier-
      // stocked items skip the warehouse stock check.
      const moq = product.minimumOrderQty || 1;
      const isSupplierStocked =
        !!product.defaultSupplierId || quantity >= moq;
      if (
        product.trackInventory &&
        !isSupplierStocked &&
        product.stockQuantity < quantity
      ) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }
    }

    // Determine price based on user account type and applicable discounts
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { b2bProfile: true, gsaProfile: true },
    });

    // Check if user is approved GSA (must have accountType GSA AND gsaApprovalStatus APPROVED)
    const isApprovedGSA = user?.accountType === 'GSA' && user?.gsaApprovalStatus === 'APPROVED';

    // Map account type for discount calculation
    let accountType = user?.accountType || 'B2C';
    if (isApprovedGSA) {
      accountType = 'GOVERNMENT';
    } else if (accountType === 'B2B') {
      accountType = 'VOLUME_BUYER';
    } else if (accountType === 'B2C') {
      accountType = 'PERSONAL';
    }

    // Use variant prices if variant is selected, otherwise use product prices
    let price: number;
    if (variant) {
      // Calculate discount for variant
      const discountResult = await calculateProductDiscount(
        {
          id: variant.id,
          categoryId: product.categoryId,
          brandId: product.brandId,
          defaultSupplierId: product.defaultSupplierId,
          defaultWarehouseId: product.defaultWarehouseId,
          basePrice: parseFloat(variant.basePrice.toString()),
          salePrice: variant.salePrice ? parseFloat(variant.salePrice.toString()) : null,
          wholesalePrice: variant.wholesalePrice ? parseFloat(variant.wholesalePrice.toString()) : null,
          gsaPrice: variant.gsaPrice ? parseFloat(variant.gsaPrice.toString()) : null,
        },
        accountType as any
      );
      price = discountResult.discountedPrice;
    } else {
      // Calculate discount for product
      const discountResult = await calculateProductDiscount(
        {
          id: product.id,
          categoryId: product.categoryId,
          brandId: product.brandId,
          defaultSupplierId: product.defaultSupplierId,
          defaultWarehouseId: product.defaultWarehouseId,
          basePrice: parseFloat(product.basePrice.toString()),
          salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : null,
          wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice.toString()) : null,
          gsaPrice: product.gsaPrice ? parseFloat(product.gsaPrice.toString()) : null,
        },
        accountType as any
      );
      price = discountResult.discountedPrice;
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Check if item already in cart (same product + same variant)
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          price, // Update price in case it changed
        },
      });
    } else {
      // Add new item
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          price,
        },
      });
    }

    // Return updated cart with totals
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    // Enrich items with minimumOrderQty from product
    const enrichedItems = await Promise.all(
      (updatedCart?.items || []).map(async (item: any) => {
        const productData = await db.product.findUnique({
          where: { id: item.productId },
          select: { minimumOrderQty: true },
        });
        return {
          ...item,
          product: {
            ...item.product,
            minimumOrderQty: productData?.minimumOrderQty || 1,
          },
        };
      })
    );

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.price.toString()) * item.quantity;
    }, 0);

    const result = {
      ...updatedCart,
      items: enrichedItems,
      subtotal,
      itemCount: enrichedItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (cart) {
      await db.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
