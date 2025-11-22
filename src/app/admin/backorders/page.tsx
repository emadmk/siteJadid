import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

async function getBackorders() {
  const backorders = await prisma.backOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
    },
  });

  return backorders;
}

export default async function BackordersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const backorders = await getBackorders();

  const pendingCount = backorders.filter((b) => b.status === 'PENDING').length;
  const totalQuantity = backorders
    .filter((b) => b.status === 'PENDING')
    .reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backorders</h1>
          <p className="text-gray-600 mt-1">
            Manage out-of-stock customer orders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Backorders</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {backorders.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {pendingCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Units</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {totalQuantity}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Fulfilled</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {backorders.filter((b) => b.status === 'FULFILLED').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expected Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notify
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {backorders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No backorders found
                </td>
              </tr>
            ) : (
              backorders.map((backorder) => (
                <tr key={backorder.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {backorder.user.name || 'N/A'}
                    </div>
                    <div className="text-gray-500">{backorder.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {backorder.product.name}
                    </div>
                    <div className="text-gray-500">{backorder.product.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {backorder.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {backorder.order?.orderNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {backorder.expectedDate
                      ? new Date(backorder.expectedDate).toLocaleDateString()
                      : 'TBD'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {backorder.product.stockQuantity}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        backorder.status === 'FULFILLED'
                          ? 'bg-green-100 text-green-800'
                          : backorder.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : backorder.status === 'NOTIFIED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {backorder.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {backorder.notifiedAt ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
