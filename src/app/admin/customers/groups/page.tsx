import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import CustomerGroupForm from '@/components/admin/CustomerGroupForm';

async function getCustomerGroups() {
  const groups = await prisma.customerGroup.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          members: true,
          categoryDiscounts: true,
          tieredPrices: true,
        },
      },
    },
  });

  return groups;
}

export default async function CustomerGroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const groups = await getCustomerGroups();

  const activeGroups = groups.filter((g) => g.isActive).length;
  const totalMembers = groups.reduce((sum, g) => sum + g._count.members, 0);
  const totalDiscounts = groups.reduce(
    (sum, g) => sum + g._count.categoryDiscounts,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage customer groups and tiered pricing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Groups</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {groups.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Active Groups</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {activeGroups}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Members</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {totalMembers}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Total Discounts
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {totalDiscounts}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create New Customer Group
        </h2>
        <CustomerGroupForm />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Existing Groups
          </h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category Discounts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiered Prices
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="text-center">
                    <p className="text-lg font-medium">No customer groups yet</p>
                    <p className="text-sm mt-1">
                      Create your first customer group above
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {group.name}
                      </div>
                      {group.description && (
                        <div className="text-sm text-gray-500">
                          {group.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {Number(group.defaultDiscount)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {group._count.members}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {group._count.categoryDiscounts}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {group._count.tieredPrices}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        group.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/admin/customers/groups/${group.id}`}
                      className="text-safety-green-600 hover:text-safety-green-900"
                    >
                      Manage
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
