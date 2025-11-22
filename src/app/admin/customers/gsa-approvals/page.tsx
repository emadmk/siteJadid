import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Mail, Phone, ArrowLeft, Clock } from 'lucide-react';
import { db } from '@/lib/db';
import { GSAApprovalActions } from '@/components/admin/GSAApprovalActions';

async function getPendingGSAApprovals() {
  const pendingApprovals = await db.user.findMany({
    where: {
      gsaApprovalStatus: 'PENDING',
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return pendingApprovals;
}

async function getRecentDecisions() {
  const recentDecisions = await db.user.findMany({
    where: {
      gsaApprovalStatus: {
        in: ['APPROVED', 'REJECTED'],
      },
      updatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  });

  return recentDecisions;
}

export default async function GSAApprovalsPage() {
  const [pendingApprovals, recentDecisions] = await Promise.all([
    getPendingGSAApprovals(),
    getRecentDecisions(),
  ]);

  const approvalStatusColors: Record<string, string> = {
    APPROVED: 'bg-safety-green-100 text-safety-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/customers">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-600" />
            GSA Approval Requests
          </h1>
          <p className="text-gray-600">
            Review and approve GSA account requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {pendingApprovals.length}
          </div>
          <div className="text-sm text-gray-600">Pending Approvals</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">
            {recentDecisions.length}
          </div>
          <div className="text-sm text-gray-600">Recent Decisions (7 days)</div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Pending Approvals</h2>
        </div>
        <div className="p-6">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No pending GSA approval requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((user) => (
                <div
                  key={user.id}
                  className="p-6 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-black mb-1">
                            {user.name}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">GSA Number</div>
                          <div className="text-sm font-mono text-black">
                            {user.gsaNumber || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Requested</div>
                          <div className="text-sm text-black">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Previous Orders</div>
                          <div className="text-sm text-black">
                            {user._count.orders}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Customer ID</div>
                          <div className="text-sm font-mono text-black">
                            {user.id.slice(0, 13)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <GSAApprovalActions userId={user.id} userName={user.name || ''} />
                      <Link href={`/admin/customers/${user.id}`}>
                        <Button
                          variant="outline"
                          className="w-full border-gray-300 hover:border-blue-600 hover:text-blue-600"
                        >
                          View Full Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Recent Decisions</h2>
        </div>
        <div className="overflow-x-auto">
          {recentDecisions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No recent decisions</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    GSA Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Decision
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
                {recentDecisions.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-black">
                        {user.gsaNumber || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          approvalStatusColors[user.gsaApprovalStatus || 'PENDING']
                        }`}
                      >
                        {user.gsaApprovalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/customers/${user.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
                        >
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
