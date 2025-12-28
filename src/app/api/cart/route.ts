import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // Enrich items with minimumOrderQty from product
    const enrichedItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { minimumOrderQty: true },
        });
        return {
          ...item,
          product: {
            ...item.product,
            minimumOrderQty: product?.minimumOrderQty || 1,
          },
        };
      })
    );

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.price.toString()) * item.quantity;
    }, 0);

    const result = {
      ...cart,
      items: enrichedItems,
      subtotal,
      itemCount: enrichedItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
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

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
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

      if (variant.stockQuantity < quantity) {
        return NextResponse.json({ error: 'Insufficient stock for this variant' }, { status: 400 });
      }
    } else {
      // Check product stock if no variant
      if (product.trackInventory && product.stockQuantity < quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }
    }

    // Determine price based on user account type
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { b2bProfile: true, gsaProfile: true },
    });

    // Check if user is approved GSA (must have accountType GSA AND gsaApprovalStatus APPROVED)
    const isApprovedGSA = user?.accountType === 'GSA' && user?.gsaApprovalStatus === 'APPROVED';

    // Use variant prices if variant is selected, otherwise use product prices
    let price: number;
    if (variant) {
      // Use variant prices
      if (user?.accountType === 'B2B' && variant.wholesalePrice) {
        price = parseFloat(variant.wholesalePrice.toString());
      } else if (isApprovedGSA && variant.gsaPrice) {
        price = parseFloat(variant.gsaPrice.toString());
      } else {
        price = parseFloat(variant.salePrice?.toString() || variant.basePrice.toString());
      }
    } else {
      // Use product prices
      if (user?.accountType === 'B2B' && product.wholesalePrice) {
        price = parseFloat(product.wholesalePrice.toString());
      } else if (isApprovedGSA && product.gsaPrice) {
        price = parseFloat(product.gsaPrice.toString());
      } else {
        price = parseFloat(product.salePrice?.toString() || product.basePrice.toString());
      }
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
