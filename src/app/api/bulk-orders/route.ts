import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/bulk-orders - Get bulk order templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await db.bulkOrderTemplate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                wholesalePrice: true,
                gsaPrice: true,
                images: true,
                stockQuantity: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Get bulk order templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bulk-orders - Create bulk order template or process bulk order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, isRecurring, frequency, items, csvData } = await request.json();

    // If csvData provided, parse and add to cart
    if (csvData) {
      const lines = csvData.split('\n').filter((line: string) => line.trim());
      const results: {
        success: Array<{ sku: string; quantity: number; productName: string }>;
        errors: Array<{ line?: string; sku?: string; error: string; available?: number }>;
      } = {
        success: [],
        errors: [],
      };

      for (const line of lines) {
        const [sku, quantityStr] = line.split(',').map((s: string) => s.trim());
        const quantity = parseInt(quantityStr);

        if (!sku || !quantity || quantity < 1) {
          results.errors.push({ line, error: 'Invalid format' });
          continue;
        }

        try {
          const product = await db.product.findUnique({
            where: { sku },
          });

          if (!product) {
            results.errors.push({ sku, error: 'Product not found' });
            continue;
          }

          if (product.stockQuantity < quantity) {
            results.errors.push({ sku, error: 'Insufficient stock', available: product.stockQuantity });
            continue;
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

          // Get user for pricing
          const user = await db.user.findUnique({
            where: { id: session.user.id },
          });

          let price = parseFloat(product.salePrice?.toString() || product.basePrice.toString());

          if (user?.accountType === 'B2B' && product.wholesalePrice) {
            price = parseFloat(product.wholesalePrice.toString());
          } else if (user?.accountType === 'GSA' && product.gsaPrice) {
            price = parseFloat(product.gsaPrice.toString());
          }

          // Add to cart
          const existingItem = await db.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: product.id,
            },
          });

          if (existingItem) {
            await db.cartItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: existingItem.quantity + quantity,
                price,
              },
            });
          } else {
            await db.cartItem.create({
              data: {
                cartId: cart.id,
                productId: product.id,
                quantity,
                price,
              },
            });
          }

          results.success.push({ sku, quantity, productName: product.name });
        } catch (error) {
          results.errors.push({ sku, error: 'Processing error' });
        }
      }

      return NextResponse.json(results);
    }

    // Create template
    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Name and items are required' }, { status: 400 });
    }

    const template = await db.bulkOrderTemplate.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isRecurring: isRecurring || false,
        frequency,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            sku: item.sku,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Process bulk order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
