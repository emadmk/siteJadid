import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';

async function getContracts() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountType: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return contracts;
}

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const contracts = await getContracts();

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE').length;
  const totalValue = contracts
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + Number(c.minimumSpend || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600 mt-1">
            Manage long-term pricing agreements
          </p>
        </div>
        <Link
          href="/admin/contracts/new"
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
        >
          New Contract
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Contracts</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {contracts.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {activeContracts}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            ${totalValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Expiring Soon</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">
            {
              contracts.filter(
                (c) =>
                  c.status === 'ACTIVE' &&
                  new Date(c.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ).length
            }
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contract #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Min Purchase
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No contracts found
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {contract.contractNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{contract.user.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{contract.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${Number(contract.minimumSpend || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {contract._count.items}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        contract.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : contract.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-800'
                          : contract.status === 'EXPIRED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/contracts/${contract.id}`}
                      className="text-safety-green-600 hover:text-safety-green-900"
                    >
                      View
                    </Link>
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
