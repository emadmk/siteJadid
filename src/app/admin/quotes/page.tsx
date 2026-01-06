import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, Eye, Package, Phone, Mail, Building2 } from 'lucide-react';
import { BulkOrderActions } from './BulkOrderActions';

type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
type QuoteRequestStatus = 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';

async function getBulkOrderRequests() {
  const requests = await db.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return requests;
}

async function getBulkOrderStats() {
  const [pending, contacted, converted, closed, total] = await Promise.all([
    db.quoteRequest.count({ where: { status: 'PENDING' } }),
    db.quoteRequest.count({ where: { status: 'CONTACTED' } }),
    db.quoteRequest.count({ where: { status: 'CONVERTED' } }),
    db.quoteRequest.count({ where: { status: 'CLOSED' } }),
    db.quoteRequest.count(),
  ]);

  return { pending, contacted, converted, closed, total };
}

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
  const [draft, sent, accepted, rejected, converted, total] = await Promise.all([
    db.quote.count({ where: { status: 'DRAFT' } }),
    db.quote.count({ where: { status: 'SENT' } }),
    db.quote.count({ where: { status: 'ACCEPTED' } }),
    db.quote.count({ where: { status: 'REJECTED' } }),
    db.quote.count({ where: { status: 'CONVERTED' } }),
    db.quote.count(),
  ]);

  const totalValue = await db.quote.aggregate({
    _sum: { total: true },
    where: { status: { in: ['DRAFT', 'SENT', 'ACCEPTED'] } },
  });

  return {
    draft,
    sent,
    pending: draft + sent, // Combined for display
    accepted,
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
    redirect('/account');
  }

  const [quotes, stats, bulkOrders, bulkOrderStats] = await Promise.all([
    getQuotes(),
    getQuoteStats(),
    getBulkOrderRequests(),
    getBulkOrderStats(),
  ]);

  const statusColors: Record<QuoteStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-yellow-100 text-yellow-800',
    VIEWED: 'bg-orange-100 text-orange-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CONVERTED: 'bg-blue-100 text-blue-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  const requestStatusColors: Record<QuoteRequestStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONTACTED: 'bg-blue-100 text-blue-800',
    CONVERTED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
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
            <span className="text-2xl font-bold text-black">{stats.accepted}</span>
          </div>
          <div className="text-sm text-gray-600">Accepted</div>
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

      {/* Bulk Order Requests Section */}
      {bulkOrderStats.total > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-black flex items-center gap-2">
                <Package className="w-5 h-5 text-safety-green-600" />
                Bulk Order Requests
              </h2>
              <p className="text-sm text-gray-600">
                {bulkOrderStats.pending} pending requests need attention
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company / Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkOrders.map((request: any) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-black">{request.companyName}</div>
                            <div className="text-xs text-gray-500">{request.contactName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${request.email}`} className="hover:text-safety-green-600">
                              {request.email}
                            </a>
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${request.phone}`} className="hover:text-safety-green-600">
                                {request.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black max-w-xs">
                          <pre className="whitespace-pre-wrap font-sans text-xs bg-gray-50 p-2 rounded">
                            {request.products}
                          </pre>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{request.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{request.timeline || 'Not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            requestStatusColors[request.status as QuoteRequestStatus]
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <BulkOrderActions requestId={request.id} currentStatus={request.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                        {(quote.status === 'DRAFT' || quote.status === 'SENT' || quote.status === 'VIEWED') && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Accept
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
                        {quote.status === 'ACCEPTED' && (
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
