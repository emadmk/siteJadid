export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE /api/admin/orders/[id] - Delete an order (SUPER_ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete orders
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admin can delete orders.' }, { status: 403 });
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete order and all related records in a transaction
    await db.$transaction(async (tx) => {
      // 1. Delete nested shipment relations first
      const shipments = await tx.shipment.findMany({
        where: { orderId: params.id },
        select: { id: true },
      });
      if (shipments.length > 0) {
        const shipmentIds = shipments.map(s => s.id);
        await tx.shipmentTracking.deleteMany({ where: { shipmentId: { in: shipmentIds } } });
        await tx.shipmentItem.deleteMany({ where: { shipmentId: { in: shipmentIds } } });
      }

      // 2. Delete nested invoice relations
      const invoices = await tx.invoice.findMany({
        where: { orderId: params.id },
        select: { id: true },
      });
      if (invoices.length > 0) {
        const invoiceIds = invoices.map(i => i.id);
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      }

      // 3. Delete nested RMA relations
      const rmas = await tx.rMA.findMany({
        where: { orderId: params.id },
        select: { id: true },
      });
      if (rmas.length > 0) {
        const rmaIds = rmas.map(r => r.id);
        await tx.rMAItem.deleteMany({ where: { rmaId: { in: rmaIds } } });
      }

      // 4. Delete all direct relations (non-cascading ones)
      await tx.shipment.deleteMany({ where: { orderId: params.id } });
      await tx.invoice.deleteMany({ where: { orderId: params.id } });
      await tx.rMA.deleteMany({ where: { orderId: params.id } });
      await tx.commission.deleteMany({ where: { orderId: params.id } });
      await tx.subscriptionOrder.deleteMany({ where: { orderId: params.id } });
      await tx.backOrder.deleteMany({ where: { orderId: params.id } });

      // 5. Delete cascading relations (these auto-delete but being explicit)
      await tx.orderStatusHistory.deleteMany({ where: { orderId: params.id } });
      await tx.orderApproval.deleteMany({ where: { orderId: params.id } });
      await tx.orderItem.deleteMany({ where: { orderId: params.id } });

      // 6. Finally delete the order itself
      await tx.order.delete({ where: { id: params.id } });
    });

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}
