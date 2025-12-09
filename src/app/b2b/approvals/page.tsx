import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import Link from 'next/link';

async function getApprovalData(userId: string) {
  const membership = await db.b2BAccountMember.findFirst({
    where: {
      userId,
    },
  });

  if (!membership) {
    return null;
  }

  const [pendingApprovals, myRequests] = await Promise.all([
    db.orderApproval.findMany({
      where: {
        approverId: membership.id,
        status: 'PENDING',
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
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
        },
        requester: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    }),
    db.orderApproval.findMany({
      where: {
        requestedById: membership.id,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
        },
        approver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 10,
    }),
  ]);

  return { pendingApprovals, myRequests };
}

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/b2b/approvals');
  }

  if (session.user.accountType !== 'B2B') {
    redirect('/account');
  }

  const data = await getApprovalData(session.user.id);

  if (!data) {
    redirect('/account');
  }

  const { pendingApprovals, myRequests } = data;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-safety-green-100 text-safety-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
    CANCELLED: XCircle,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black">Order Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve team orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Pending Approval</span>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-black">{pendingApprovals.length}</div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">My Requests</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-black">{myRequests.length}</div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Pending Requests</span>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {myRequests.filter((r) => r.status === 'PENDING').length}
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Pending Your Approval</h2>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => {
                const StatusIcon = statusIcons[approval.status];
                return (
                  <div key={approval.id} className="bg-white rounded-lg border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/orders/${approval.order.orderNumber}`}
                            className="text-lg font-semibold text-black hover:text-safety-green-700"
                          >
                            {approval.order.orderNumber}
                          </Link>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[approval.status]}`}>
                            <div className="flex items-center gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {approval.status}
                            </div>
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Requested by <span className="font-medium">{approval.requester.user.name || approval.requester.user.email}</span>
                          {' • '}
                          {new Date(approval.requestedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {approval.reason && (
                          <div className="text-sm text-gray-700 mb-3">
                            <span className="font-medium">Reason:</span> {approval.reason}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-black">${Number(approval.orderTotal).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{approval.order.items.length} items</div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="border-t pt-4 mb-4">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {approval.order.items.slice(0, 5).map((item) => {
                          const images = item.product.images as string[];
                          return (
                            <div key={item.id} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded">
                              {images[0] ? (
                                <img src={images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" />
                              ) : (
                                <Package className="w-full h-full p-3 text-gray-400" />
                              )}
                            </div>
                          );
                        })}
                        {approval.order.items.length > 5 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                            +{approval.order.items.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {approval.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <Button className="flex-1 bg-safety-green-600 hover:bg-safety-green-700 gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50 gap-2">
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                        <Link href={`/orders/${approval.order.orderNumber}`}>
                          <Button variant="outline">View Details</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Requests */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-4">My Requests</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myRequests.map((approval) => {
                  const StatusIcon = statusIcons[approval.status];
                  return (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/orders/${approval.order.orderNumber}`}
                          className="font-medium text-black hover:text-safety-green-700"
                        >
                          {approval.order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ${Number(approval.orderTotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(approval.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {approval.approver.user.name || approval.approver.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[approval.status]}`}>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {approval.status}
                          </div>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
