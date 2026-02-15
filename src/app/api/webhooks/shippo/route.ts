import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/shippo
 * Handle Shippo tracking webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    switch (event) {
      case 'track_updated': {
        const { tracking_number, tracking_status, carrier } = data;

        if (!tracking_number) break;

        // Find shipment by tracking number
        const shipment = await prisma.shipment.findFirst({
          where: { trackingNumber: tracking_number },
        });

        if (!shipment) {
          console.log(`Shippo webhook: No shipment found for tracking ${tracking_number}`);
          break;
        }

        // Map Shippo status to our status
        const statusMap: Record<string, string> = {
          UNKNOWN: 'PENDING',
          PRE_TRANSIT: 'PENDING',
          TRANSIT: 'IN_TRANSIT',
          DELIVERED: 'DELIVERED',
          RETURNED: 'RETURNED',
          FAILURE: 'FAILED',
        };

        const newStatus = statusMap[tracking_status?.status] || 'IN_TRANSIT';

        // Update shipment status
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: newStatus as any,
            ...(newStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
          },
        });

        // Create tracking event
        if (tracking_status) {
          await prisma.shipmentTracking.create({
            data: {
              shipmentId: shipment.id,
              status: tracking_status.status || 'UNKNOWN',
              location: tracking_status.location?.city
                ? `${tracking_status.location.city}, ${tracking_status.location.state}`
                : null,
              message: tracking_status.status_details || null,
              timestamp: tracking_status.status_date
                ? new Date(tracking_status.status_date)
                : new Date(),
            },
          });
        }

        // If delivered, update the order too
        if (newStatus === 'DELIVERED' && shipment.orderId) {
          await prisma.order.update({
            where: { id: shipment.orderId },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date(),
            },
          });

          await prisma.orderStatusHistory.create({
            data: {
              orderId: shipment.orderId,
              status: 'DELIVERED',
              notes: `Package delivered via ${carrier || shipment.carrier} (${tracking_number})`,
              changedBy: 'system',
            },
          });
        }

        break;
      }

      default:
        console.log(`Shippo webhook: Unhandled event type: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Shippo webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
