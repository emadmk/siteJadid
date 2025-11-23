import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, Eye } from 'lucide-react';

type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'EXPIRED';

async function getQuotes() {
  const quotes = await db.quote.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          accountType: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return quotes;
}

async function getQuoteStats() {
  const [pending, approved, rejected, converted, total] = await Promise.all([
    db.quote.count({ where: { status: 'PENDING' } }),
    db.quote.count({ where: { status: 'APPROVED' } }),
    db.quote.count({ where: { status: 'REJECTED' } }),
    db.quote.count({ where: { status: 'CONVERTED' } }),
    db.quote.count(),
  ]);

  const totalValue = await db.quote.aggregate({
    _sum: { total: true },
    where: { status: { in: ['PENDING', 'APPROVED'] } },
  });

  return {
    pending,
    approved,
    rejected,
    converted,
    total,
    totalValue: Number(totalValue._sum.total || 0),
  };
}

export default async function QuotesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
  if (!adminRoles.includes(session.user.role as string)) {
    redirect('/dashboard');
  }

  const [quotes, stats] = await Promise.all([getQuotes(), getQuoteStats()]);

  const statusColors: Record<QuoteStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CONVERTED: 'bg-blue-100 text-blue-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Quote Management</h1>
        <p className="text-gray-600">Manage customer quote requests and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.pending}</span>
          </div>
          <div className="text-sm text-gray-600">Pending Quotes</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.approved}</span>
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.rejected}</span>
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.converted}</span>
          </div>
          <div className="text-sm text-gray-600">Converted to Orders</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-lg font-bold text-black">
              ${stats.totalValue.toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-600">Total Quote Value</div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No quotes found
                  </td>
                </tr>
              ) : (
                quotes.map((quote: any) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">{quote.quoteNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-black">
                        {quote.user.name || quote.user.email}
                      </div>
                      <div className="text-xs text-gray-500">{quote.user.accountType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote._count.items} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black">
                        ${Number(quote.total).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[quote.status as QuoteStatus]
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quote.validUntil
                        ? new Date(quote.validUntil).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/quotes/${quote.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {quote.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {quote.status === 'APPROVED' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Convert to Order
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
