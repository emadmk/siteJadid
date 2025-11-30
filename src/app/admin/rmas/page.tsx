import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RotateCcw, Clock, CheckCircle, XCircle, Package, DollarSign } from 'lucide-react';

async function getRMAData() {
  const [rmas, stats] = await Promise.all([
    db.rMA.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),
    db.rMA.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        refundAmount: true,
      },
    }),
  ]);

  return { rmas, stats };
}

export default async function RMAsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/rmas');
  }

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
  if (!adminRoles.includes(session.user.role)) {
    redirect('/admin');
  }

  const { rmas, stats } = await getRMAData();

  const pending = stats.find((s) => s.status === 'REQUESTED')?._count || 0;
  const approved = stats.find((s) => s.status === 'APPROVED')?._count || 0;
  const totalRefunds = stats.reduce((sum, s) => sum + Number(s._sum.refundAmount || 0), 0);

  const statusColors: Record<string, string> = {
    REQUESTED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-safety-green-100 text-safety-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ITEMS_RECEIVED: 'bg-blue-100 text-blue-800',
    INSPECTION: 'bg-purple-100 text-purple-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    REPLACED: 'bg-teal-100 text-teal-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  const statusIcons: Record<string, any> = {
    REQUESTED: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
    ITEMS_RECEIVED: Package,
    INSPECTION: Clock,
    REFUNDED: DollarSign,
    REPLACED: RotateCcw,
    CLOSED: CheckCircle,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Returns & RMA Management</h1>
        <p className="text-gray-600">Process return merchandise authorizations and refunds</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending RMAs</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-black">{pending}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Approved RMAs</span>
            <CheckCircle className="w-5 h-5 text-safety-green-600" />
          </div>
          <div className="text-3xl font-bold text-black">{approved}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total RMAs</span>
            <RotateCcw className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-black">{rmas.length}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Refunds</span>
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-black">${totalRefunds.toFixed(2)}</div>
        </div>
      </div>

      {/* RMA List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-black">Recent RMAs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RMA Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rmas.map((rma) => {
                const StatusIcon = statusIcons[rma.status];
                return (
                  <tr key={rma.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/rmas/${rma.id}`}
                        className="font-medium text-black hover:text-safety-green-700"
                      >
                        {rma.rmaNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-black">{rma.user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{rma.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${rma.order.id}`}
                        className="text-sm text-safety-green-600 hover:text-safety-green-700"
                      >
                        {rma.order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate">{rma.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rma.items.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      {rma.refundAmount ? `$${Number(rma.refundAmount).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[rma.status]}`}>
                        <div className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {rma.status}
                        </div>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(rma.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/admin/rmas/${rma.id}`}
                        className="text-safety-green-600 hover:text-safety-green-900 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {rmas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No RMAs found
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
