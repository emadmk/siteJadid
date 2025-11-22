import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Search, Mail, Phone, Eye, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';

async function getB2BCustomers(searchParams: { search?: string }) {
  const where: any = {
    accountType: 'B2B',
  };

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
        },
      },
      orders: {
        select: {
          totalAmount: true,
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

export default async function B2BCustomersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const customers = await getB2BCustomers(searchParams);

  const totalRevenue = customers.reduce((sum, customer) => {
    const customerTotal = customer.orders.reduce(
      (orderSum, order) => orderSum + Number(order.totalAmount),
      0
    );
    return sum + customerTotal;
  }, 0);

  const totalOrders = customers.reduce(
    (sum, customer) => sum + customer._count.orders,
    0
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/customers">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Customers
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">B2B Customers</h1>
            <p className="text-gray-600">Business-to-Business customer accounts</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {customers.length}
          </div>
          <div className="text-sm text-gray-600">Total B2B Customers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{totalOrders}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search B2B customers by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>
          <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
            Search
          </Button>
          {searchParams.search && (
            <Link href="/admin/customers/b2b">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                No B2B customers found
              </h3>
              <p className="text-gray-600">
                {searchParams.search
                  ? 'Try adjusting your search'
                  : 'No B2B customers registered yet'}
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
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Member Since
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
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
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
                        <span className="text-sm font-medium text-black">
                          {customer._count.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-safety-green-600">
                          ${totalSpent.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {new Date(customer.createdAt).toLocaleDateString()}
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
