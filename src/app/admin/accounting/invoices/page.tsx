'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Search, Download, Eye, Printer, RefreshCw, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Invoice {
  id: string;
  orderNumber: string;
  accountType: string;
  createdAt: string;
  totalAmount: number;
  paymentStatus: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    accountType: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
  };
}

interface InvoiceStats {
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    overdueAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (accountTypeFilter) params.append('accountType', accountTypeFilter);

      const response = await fetch(`/api/admin/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setStats(data.stats || {
          total: 0,
          paid: 0,
          unpaid: 0,
          overdue: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          overdueAmount: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAccountTypeFilter('');
    setTimeout(fetchInvoices, 0);
  };

  const handleDownload = async (invoiceId: string, orderNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
      if (response.ok) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderNumber}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = async (invoiceId: string) => {
    setPrintingId(invoiceId);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
      if (response.ok) {
        const html = await response.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
    } finally {
      setPrintingId(null);
    }
  };

  const handleExportAll = async () => {
    // Export all invoices as CSV
    const csvContent = [
      ['Invoice #', 'Customer', 'Email', 'Account Type', 'Issue Date', 'Due Date', 'Amount', 'Status'].join(','),
      ...invoices.map(invoice => {
        const dueDate = new Date(invoice.createdAt);
        dueDate.setDate(dueDate.getDate() + 30);
        const status = getInvoiceStatus(invoice);
        return [
          `INV-${invoice.orderNumber}`,
          invoice.user?.name || 'Guest',
          invoice.user?.email || '',
          invoice.accountType,
          new Date(invoice.createdAt).toLocaleDateString(),
          dueDate.toLocaleDateString(),
          Number(invoice.totalAmount).toFixed(2),
          status,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
  };

  const getInvoiceStatus = (order: Invoice) => {
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-300"
            onClick={fetchInvoices}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="border-gray-300"
            onClick={handleExportAll}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="text-3xl font-bold text-black mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Invoices</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            {stats.paid}
          </div>
          <div className="text-sm text-gray-600">Paid Invoices</div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats.paidAmount.toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.unpaid}</div>
          <div className="text-sm text-gray-600">Unpaid Invoices</div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats.unpaidAmount.toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="text-3xl font-bold text-red-600 mb-1">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue Invoices</div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats.overdueAmount.toFixed(2)}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
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
            <Button type="button" variant="outline" className="border-gray-300" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-safety-green-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No invoices found</h3>
              <p className="text-gray-600">
                {search || statusFilter || accountTypeFilter
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
                <AnimatePresence>
                  {invoices.map((invoice, index) => {
                    const status = getInvoiceStatus(invoice);
                    const dueDate = new Date(invoice.createdAt);
                    dueDate.setDate(dueDate.getDate() + 30);

                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50"
                      >
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
                              accountTypeColors[invoice.accountType] || 'bg-gray-100 text-gray-800'
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
                              onClick={() => handleDownload(invoice.id, invoice.orderNumber)}
                              disabled={downloadingId === invoice.id}
                            >
                              {downloadingId === invoice.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-gray-600 hover:text-gray-600"
                              onClick={() => handlePrint(invoice.id)}
                              disabled={printingId === invoice.id}
                            >
                              {printingId === invoice.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Printer className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
