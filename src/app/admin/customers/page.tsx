import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Search, Mail, Phone, Eye, Shield } from 'lucide-react';
import { db } from '@/lib/db';

async function getCustomers(searchParams: {
  search?: string;
  accountType?: string;
  role?: string;
}) {
  const where: any = {};

  if (searchParams.accountType) {
    where.accountType = searchParams.accountType;
  }

  if (searchParams.role) {
    where.role = searchParams.role;
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      { phone: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const customers = await db.user.findMany({
    where,
    include: {
      _count: {
        select: {
          orders: true,
          addresses: true,
        },
      },
      orders: {
        select: {
          totalAmount: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return customers;
}

async function getStats() {
  const [total, personal, volumeBuyer, government, pendingApproval] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { accountType: { in: ['B2C', 'PERSONAL'] } } }),
    db.user.count({ where: { accountType: { in: ['B2B', 'VOLUME_BUYER'] } } }),
    db.user.count({ where: { accountType: { in: ['GSA', 'GOVERNMENT'] } } }),
    db.user.count({
      where: {
        OR: [
          { approvalStatus: 'PENDING' },
          { gsaApprovalStatus: 'PENDING' },
        ],
      },
    }),
  ]);

  return { total, personal, volumeBuyer, government, pendingApproval };
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string; accountType?: string; role?: string };
}) {
  const [customers, stats] = await Promise.all([
    getCustomers(searchParams),
    getStats(),
  ]);

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    PERSONAL: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    VOLUME_BUYER: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
    GOVERNMENT: 'bg-safety-green-100 text-safety-green-800',
  };

  const accountTypeLabels: Record<string, string> = {
    B2C: 'Personal',
    PERSONAL: 'Personal',
    B2B: 'Volume Buyer',
    VOLUME_BUYER: 'Volume Buyer',
    GSA: 'Government',
    GOVERNMENT: 'Government',
  };

  const roleColors: Record<string, string> = {
    USER: 'bg-gray-100 text-gray-800',
    ADMIN: 'bg-orange-100 text-orange-800',
    SUPER_ADMIN: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Customers</h1>
          <p className="text-gray-600">Manage your customer accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats.personal}</div>
          <div className="text-sm text-gray-600">Personal Buyers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">{stats.volumeBuyer}</div>
          <div className="text-sm text-gray-600">Volume Buyers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">{stats.government}</div>
          <div className="text-sm text-gray-600">Government</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-orange-600 mb-1">{stats.pendingApproval}</div>
          <div className="text-sm text-gray-600">Pending Approval</div>
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
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
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
              <option value="PERSONAL">Personal</option>
              <option value="VOLUME_BUYER">Volume Buyer</option>
              <option value="GOVERNMENT">Government</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              name="role"
              defaultValue={searchParams.role || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/customers">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/customers/personal">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Personal Buyers</div>
                <div className="text-sm text-gray-600">View personal accounts</div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/customers/volume-buyer">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Volume Buyers</div>
                <div className="text-sm text-gray-600">View business accounts</div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/customers/government">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-safety-green-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-safety-green-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Government</div>
                <div className="text-sm text-gray-600">View government accounts</div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/customers/approvals">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Pending Approvals</div>
                <div className="text-sm text-gray-600">{stats.pendingApproval} pending</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No customers found</h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.accountType || searchParams.role
                  ? 'Try adjusting your filters'
                  : 'No customers registered yet'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => {
                  const totalSpent = customer.orders.reduce(
                    (sum, order) => sum + Number(order.totalAmount),
                    0
                  );

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-black">{customer.name}</div>
                            <div className="text-xs text-gray-600">
                              ID: {customer.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            accountTypeColors[customer.accountType] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {accountTypeLabels[customer.accountType] || customer.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            roleColors[customer.role]
                          }`}
                        >
                          {customer.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-black">
                          {customer._count.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-safety-green-600">
                          ${totalSpent.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/customers/${customer.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
