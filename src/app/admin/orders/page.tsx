import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Search, Download, Filter } from 'lucide-react';
import { db } from '@/lib/db';

async function getOrders(searchParams: {
  status?: string;
  search?: string;
  accountType?: string;
}) {
  const where: any = {};

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.accountType) {
    where.accountType = searchParams.accountType;
  }

  if (searchParams.search) {
    where.OR = [
      { orderNumber: { contains: searchParams.search, mode: 'insensitive' } },
      { user: { name: { contains: searchParams.search, mode: 'insensitive' } } },
      { user: { email: { contains: searchParams.search, mode: 'insensitive' } } },
    ];
  }

  const orders = await db.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountType: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return orders;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; accountType?: string };
}) {
  const orders = await getOrders(searchParams);

  const stats = {
    total: await db.order.count(),
    pending: await db.order.count({ where: { status: 'PENDING' } }),
    processing: await db.order.count({ where: { status: 'PROCESSING' } }),
    shipped: await db.order.count({ where: { status: 'SHIPPED' } }),
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    ON_HOLD: 'bg-orange-100 text-orange-800',
  };

  const paymentStatusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AUTHORIZED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-safety-green-100 text-safety-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Orders</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Orders</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">{stats.processing}</div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-cyan-600 mb-1">{stats.shipped}</div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Order number, customer name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Account Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              name="accountType"
              defaultValue={searchParams.accountType || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Types</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
              <option value="GSA">GSA</option>
            </select>
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Link href="/admin/orders">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-black mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.status || searchParams.accountType
                  ? 'Try adjusting your filters'
                  : 'Orders will appear here once customers place them'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{order.orderNumber}</div>
                      {order.purchaseOrderNumber && (
                        <div className="text-xs text-gray-600">PO: {order.purchaseOrderNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{order.user.name || 'N/A'}</div>
                      <div className="text-xs text-gray-600">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-black">
                        ${Number(order.total).toFixed(2)}
                      </div>
                      {Number(order.discount) > 0 && (
                        <div className="text-xs text-gray-600">
                          Discount: ${Number(order.discount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                        {order.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
