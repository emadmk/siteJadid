import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Award,
  Eye,
} from 'lucide-react';
import { db } from '@/lib/db';

async function getCustomerInsights() {
  const [
    totalCustomers,
    b2cCount,
    b2bCount,
    gsaCount,
    customersWithOrders,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { accountType: 'B2C' } }),
    db.user.count({ where: { accountType: 'B2B' } }),
    db.user.count({ where: { accountType: 'GSA' } }),
    db.user.count({
      where: {
        orders: {
          some: {},
        },
      },
    }),
  ]);

  return {
    totalCustomers,
    b2cCount,
    b2bCount,
    gsaCount,
    customersWithOrders,
    customersWithoutOrders: totalCustomers - customersWithOrders,
  };
}

async function getTopCustomers() {
  const customers = await db.user.findMany({
    include: {
      orders: {
        where: {
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        select: {
          totalAmount: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  const customersWithSpending = customers.map((customer) => {
    const totalSpent = customer.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      accountType: customer.accountType,
      totalOrders: customer._count.orders,
      totalSpent,
      avgOrderValue: customer._count.orders > 0 ? totalSpent / customer._count.orders : 0,
    };
  });

  return customersWithSpending
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
}

async function getCustomersByAccountType() {
  const accountTypes = await db.user.groupBy({
    by: ['accountType'],
    _count: {
      id: true,
    },
  });

  const accountTypesWithRevenue = await Promise.all(
    accountTypes.map(async (type) => {
      const revenue = await db.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          accountType: type.accountType,
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      });

      const orders = await db.order.count({
        where: {
          accountType: type.accountType,
        },
      });

      return {
        accountType: type.accountType,
        customerCount: type._count.id,
        totalRevenue: Number(revenue._sum.totalAmount || 0),
        totalOrders: orders,
        avgRevenuePerCustomer:
          type._count.id > 0
            ? Number(revenue._sum.totalAmount || 0) / type._count.id
            : 0,
      };
    })
  );

  return accountTypesWithRevenue;
}

async function getNewCustomersOverTime() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [last30Days, days3160, days6190] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    db.user.count({
      where: {
        createdAt: { gte: ninetyDaysAgo, lt: sixtyDaysAgo },
      },
    }),
  ]);

  return {
    last30Days,
    days3160,
    days6190,
  };
}

export default async function CustomerInsightsPage() {
  const [insights, topCustomers, accountTypeData, newCustomers] = await Promise.all([
    getCustomerInsights(),
    getTopCustomers(),
    getCustomersByAccountType(),
    getNewCustomersOverTime(),
  ]);

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/analytics">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Customer Insights</h1>
          <p className="text-gray-600">Analyze customer behavior and spending patterns</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {insights.totalCustomers}
          </div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-safety-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {insights.customersWithOrders}
          </div>
          <div className="text-sm text-gray-600">Active Customers</div>
          <div className="text-xs text-gray-500 mt-1">
            {insights.totalCustomers > 0
              ? ((insights.customersWithOrders / insights.totalCustomers) * 100).toFixed(1)
              : 0}
            % conversion
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {insights.customersWithoutOrders}
          </div>
          <div className="text-sm text-gray-600">No Orders Yet</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {newCustomers.last30Days}
          </div>
          <div className="text-sm text-gray-600">New (Last 30 Days)</div>
        </div>
      </div>

      {/* Customer Growth */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-6">Customer Growth</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Last 30 Days</div>
            <div className="text-3xl font-bold text-black">{newCustomers.last30Days}</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">31-60 Days Ago</div>
            <div className="text-3xl font-bold text-black">{newCustomers.days3160}</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">61-90 Days Ago</div>
            <div className="text-3xl font-bold text-black">{newCustomers.days6190}</div>
          </div>
        </div>
      </div>

      {/* Customer Breakdown by Account Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-6">
          Performance by Account Type
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Customers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Avg Revenue/Customer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accountTypeData.map((data) => (
                <tr key={data.accountType} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        accountTypeColors[data.accountType]
                      }`}
                    >
                      {data.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    {data.customerCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    {data.totalOrders}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                    ${data.totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    ${data.avgRevenuePerCustomer.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Award className="w-5 h-5 text-safety-green-600" />
            Top Customers
          </h2>
          <Link href="/admin/customers">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300 hover:border-safety-green-600"
            >
              View All
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Avg Order Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : index === 1
                          ? 'bg-gray-100 text-gray-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-black">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        accountTypeColors[customer.accountType]
                      }`}
                    >
                      {customer.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    {customer.totalOrders}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    ${customer.avgOrderValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/customers/${customer.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
