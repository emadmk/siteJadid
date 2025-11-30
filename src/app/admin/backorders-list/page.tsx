import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Clock, Package, CheckCircle, AlertCircle } from 'lucide-react';

async function getBackorderData() {
  const backorders = await db.backOrder.findMany({
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
          sku: true,
          name: true,
          images: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  const stats = await db.backOrder.groupBy({
    by: ['status'],
    _count: true,
    _sum: {
      quantity: true,
    },
  });

  return { backorders, stats };
}

export default async function BackordersListPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/backorders-list');
  }

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'];
  if (!adminRoles.includes(session.user.role)) {
    redirect('/admin');
  }

  const { backorders, stats } = await getBackorderData();

  const pending = stats.find((s) => s.status === 'PENDING')?._count || 0;
  const fulfilled = stats.find((s) => s.status === 'FULFILLED')?._count || 0;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    FULFILLED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    IN_PROGRESS: Package,
    FULFILLED: CheckCircle,
    CANCELLED: AlertCircle,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Backorder Management</h1>
        <p className="text-gray-600">Track and fulfill out-of-stock product orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-black">{pending}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Fulfilled</span>
            <CheckCircle className="w-5 h-5 text-safety-green-600" />
          </div>
          <div className="text-3xl font-bold text-black">{fulfilled}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Backorders</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-black">{backorders.length}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Units Backordered</span>
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-black">
            {stats.reduce((sum, s) => sum + (s._sum.quantity || 0), 0)}
          </div>
        </div>
      </div>

      {/* Backorders Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-black">Active Backorders</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {backorders.map((backorder) => {
                const StatusIcon = statusIcons[backorder.status];
                const images = backorder.product.images as string[];

                return (
                  <tr key={backorder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {images[0] ? (
                            <img src={images[0]} alt={backorder.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-black">{backorder.product.name}</div>
                          <div className="text-sm text-gray-600">SKU: {backorder.product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-black">{backorder.user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{backorder.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {backorder.order ? (
                        <Link
                          href={`/admin/orders/${backorder.order.id}`}
                          className="text-sm text-safety-green-600 hover:text-safety-green-700"
                        >
                          {backorder.order.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">{backorder.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {backorder.expectedDate ? new Date(backorder.expectedDate).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[backorder.status]}`}>
                        <div className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {backorder.status}
                        </div>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(backorder.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}

              {backorders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No backorders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
