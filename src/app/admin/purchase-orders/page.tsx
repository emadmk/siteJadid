import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { FileText, Package } from 'lucide-react';

export default async function PurchaseOrdersPage() {
  const pos = await db.purchaseOrder.findMany({
    include: { supplier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Purchase Orders</h1>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">PO #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po: any) => (
              <tr key={po.id}>
                <td className="px-6 py-4">{po.poNumber}</td>
                <td className="px-6 py-4">{po.supplier.name}</td>
                <td className="px-6 py-4">${Number(po.total).toFixed(2)}</td>
                <td className="px-6 py-4">{po.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
