import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

async function getCommissions() {
  const [commissions, salesReps] = await Promise.all([
    prisma.commission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        salesRep: {
          select: {
            id: true,
            code: true,
            defaultCommissionRate: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
    }),
    prisma.salesRep.findMany({
      include: {
        _count: {
          select: {
            commissions: true,
          },
        },
      },
    }),
  ]);

  return { commissions, salesReps };
}

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];
  if (!session || !adminRoles.includes(session.user.role)) {
    redirect('/');
  }

  const { commissions, salesReps } = await getCommissions();

  const totalCommissions = commissions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  );
  const pendingAmount = commissions
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-600 mt-1">
            Manage sales rep commissions
          </p>
        </div>
        <Link
          href="/admin/sales-reps"
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
        >
          Manage Sales Reps
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Commissions</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            ${totalCommissions.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            ${pendingAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Paid</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            $
            {commissions
              .filter((c) => c.status === 'PAID')
              .reduce((sum, c) => sum + Number(c.commissionAmount), 0)
              .toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Sales Reps</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {salesReps.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sales Rep
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Commission Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Commission Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No commissions found
                </td>
              </tr>
            ) : (
              commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {comm.salesRep.user.name || 'N/A'}
                    </div>
                    <div className="text-gray-500">{comm.salesRep.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {comm.order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${Number(comm.order.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {Number(comm.commissionRate)}%
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${Number(comm.commissionAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(comm.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        comm.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : comm.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : comm.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {comm.status}
                    </span>
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
