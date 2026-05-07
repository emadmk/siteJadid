export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { computeShippingAndHandling, cartToLines } from '@/lib/services/shipping-engine';

/**
 * Returns the live shipping + handling breakdown for the current user's cart.
 *
 * Body:
 *   { shippoRate?: { cost, carrier?, service? }, isGovernmentOrder?: boolean }
 *
 * Response:
 *   { shippingTotal, handlingFee, combinedTotal, groups: [...], splitMessage }
 *
 * Used by the cart drawer and the checkout page so they always show the same
 * "Shipping + Handling Fee" number that order creation will charge.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const shippoRate = body.shippoRate && typeof body.shippoRate.cost === 'number' ? body.shippoRate : undefined;
    const isGovernmentOrder = !!body.isGovernmentOrder;

    const cart = await db.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { defaultSupplierId: true, defaultWarehouseId: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({
        shippingTotal: 0,
        handlingFee: 0,
        combinedTotal: 0,
        groups: [],
        cartSubtotal: 0,
        splitMessage: '',
        handlingTierId: null,
        handlingTierLabel: null,
      });
    }

    const lines = cartToLines(cart);
    const result = await computeShippingAndHandling(lines, { isGovernmentOrder, shippoRate });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('compute-shipping error:', e);
    return NextResponse.json({ error: 'Failed to compute shipping' }, { status: 500 });
  }
}
