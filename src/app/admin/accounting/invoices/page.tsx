import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Search, Download, Eye, Printer } from 'lucide-react';
import { db } from '@/lib/db';

async function getInvoices(searchParams: {
  status?: string;
  accountType?: string;
  search?: string;
}) {
  const where: any = {};

  // Map invoice status filter to order status
  if (searchParams.status === 'paid') {
    where.paymentStatus = 'PAID';
  } else if (searchParams.status === 'unpaid') {
    where.paymentStatus = { in: ['PENDING', 'FAILED'] };
  } else if (searchParams.status === 'overdue') {
    where.AND = [
      { paymentStatus: { in: ['PENDING', 'FAILED'] } },
      {
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
    ];
  }

  if (searchParams.accountType) {
    where.accountType = searchParams.accountType;
  }

  if (searchParams.search) {
    where.OR = [
      { orderNumber: { contains: searchParams.search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: searchParams.search, mode: 'insensitive' } },
            { email: { contains: searchParams.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const invoices = await db.order.findMany({
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
      billingAddress: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return invoices;
}

async function getInvoiceStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, paid, unpaid, overdue] = await Promise.all([
    db.order.count(),
    db.order.count({
      where: {
        paymentStatus: 'PAID',
      },
    }),
    db.order.count({
      where: {
        paymentStatus: { in: ['PENDING', 'FAILED'] },
      },
    }),
    db.order.count({
      where: {
        paymentStatus: { in: ['PENDING', 'FAILED'] },
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    }),
  ]);

  const [paidAmount, unpaidAmount, overdueAmount] = await Promise.all([
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'PAID' },
    }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: { in: ['PENDING', 'FAILED'] } },
    }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentStatus: { in: ['PENDING', 'FAILED'] },
        createdAt: { lt: thirtyDaysAgo },
      },
    }),
  ]);

  return {
    total,
    paid,
    unpaid,
    overdue,
    paidAmount: Number(paidAmount._sum.totalAmount || 0),
    unpaidAmount: Number(unpaidAmount._sum.totalAmount || 0),
    overdueAmount: Number(overdueAmount._sum.totalAmount || 0),
  };
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; accountType?: string; search?: string };
}) {
  const [invoices, stats] = await Promise.all([
    getInvoices(searchParams),
    getInvoiceStats(),
  ]);

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
  };

  const getInvoiceStatus = (order: any) => {
    if (order.paymentStatus === 'PAID') return 'paid';
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (
      (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') &&
      new Date(order.createdAt) < thirtyDaysAgo
    ) {
      return 'overdue';
    }
    return 'unpaid';
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-safety-green-100 text-safety-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Invoices</h1>
          <p className="text-gray-600">Manage and track customer invoices</p>
        </div>
        <Button variant="outline" className="border-gray-300">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Invoices</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            {stats.paid}
          </div>
          <div className="text-sm text-gray-600">Paid Invoices</div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats.paidAmount.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.unpaid}</div>
          <div className="text-sm text-gray-600">Unpaid Invoices</div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats.unpaidAmount.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-red-600 mb-1">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue Invoices</div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats.overdueAmount.toFixed(2)}
          </div>
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
                placeholder="Search by invoice number, customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
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
              Apply Filters
            </Button>
            <Link href="/admin/accounting/invoices">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No invoices found</h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.status || searchParams.accountType
                  ? 'Try adjusting your filters'
                  : 'No invoices have been generated yet'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice);
                  const dueDate = new Date(invoice.createdAt);
                  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-black">
                          INV-{invoice.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black">
                          {invoice.user?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {invoice.user?.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            accountTypeColors[invoice.accountType]
                          }`}
                        >
                          {invoice.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dueDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                        ${Number(invoice.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getInvoiceStatusColor(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/orders/${invoice.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-gray-600 hover:text-gray-600"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
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
