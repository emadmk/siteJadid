'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Calendar,
  Percent,
  DollarSign,
  Truck,
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  autoApply: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState({ status: '', type: '', search: '' });

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
    value: string;
    minPurchase: string;
    maxDiscount: string;
    usageLimit: string;
    perUserLimit: string;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    autoApply: boolean;
  }>({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    usageLimit: '',
    perUserLimit: '',
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: '',
    isActive: true,
    autoApply: false,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');
    setMessage(null);

    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      const method = editingCoupon ? 'PATCH' : 'POST';

      const submitData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
        endsAt: formData.endsAt || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully',
        });
        setShowModal(false);
        resetForm();
        fetchCoupons();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save coupon' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    setActionLoading(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        setMessage({ type: 'success', text: 'Coupon deleted successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete coupon' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    setActionLoading(coupon.id);

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      if (res.ok) {
        setCoupons(prev =>
          prev.map(c => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: String(Number(coupon.value)),
      minPurchase: coupon.minPurchase ? String(Number(coupon.minPurchase)) : '',
      maxDiscount: coupon.maxDiscount ? String(Number(coupon.maxDiscount)) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : '',
      startsAt: new Date(coupon.startsAt).toISOString().split('T')[0],
      endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
      autoApply: coupon.autoApply,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: '',
      minPurchase: '',
      maxDiscount: '',
      usageLimit: '',
      perUserLimit: '',
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: '',
      isActive: true,
      autoApply: false,
    });
  };

  const filteredCoupons = coupons.filter(coupon => {
    const now = new Date();
    const isExpired = coupon.endsAt && new Date(coupon.endsAt) < now;
    const isActive = coupon.isActive && !isExpired;

    if (filter.status === 'active' && !isActive) return false;
    if (filter.status === 'expired' && !isExpired) return false;
    if (filter.status === 'disabled' && coupon.isActive) return false;
    if (filter.type && coupon.type !== filter.type) return false;
    if (
      filter.search &&
      !coupon.code.toLowerCase().includes(filter.search.toLowerCase()) &&
      !coupon.name.toLowerCase().includes(filter.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive && (!c.endsAt || new Date(c.endsAt) > new Date())).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.usageCount, 0),
    expired: coupons.filter(c => c.endsAt && new Date(c.endsAt) < new Date()).length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-4 h-4" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="w-4 h-4" />;
      case 'FREE_SHIPPING':
        return <Truck className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coupon Codes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage discount coupon codes
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Coupons</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Times Used</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalUsage}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.expired}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search coupon codes..."
                value={filter.search}
                onChange={e => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filter.status}
            onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
          <select
            value={filter.type}
            onChange={e => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed Amount</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No coupons found</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map(coupon => {
                  const isExpired = coupon.endsAt && new Date(coupon.endsAt) < new Date();
                  const status = !coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : 'Active';
                  const statusColor =
                    status === 'Active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : status === 'Expired'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="font-mono font-medium text-gray-900 dark:text-white">
                          {coupon.code}
                        </div>
                        <div className="text-sm text-gray-500">{coupon.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          {getTypeIcon(coupon.type)}
                          {coupon.type === 'PERCENTAGE'
                            ? 'Percentage'
                            : coupon.type === 'FIXED_AMOUNT'
                            ? 'Fixed Amount'
                            : coupon.type === 'FREE_SHIPPING'
                            ? 'Free Shipping'
                            : 'Buy X Get Y'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {coupon.type === 'PERCENTAGE'
                          ? `${Number(coupon.value)}%`
                          : coupon.type === 'FIXED_AMOUNT'
                          ? `$${Number(coupon.value).toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {coupon.usageCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {coupon.endsAt
                          ? new Date(coupon.endsAt).toLocaleDateString()
                          : 'No expiration'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCouponStatus(coupon)}
                            disabled={actionLoading === coupon.id}
                            className={`p-2 rounded-lg transition-colors ${
                              coupon.isActive
                                ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                                : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                            title={coupon.isActive ? 'Disable' : 'Enable'}
                          >
                            {actionLoading === coupon.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : coupon.isActive ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            disabled={actionLoading === coupon.id}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      required
                      disabled={!!editingCoupon}
                      placeholder="e.g., SUMMER20"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Coupon Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="e.g., Summer Sale"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Optional description"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    >
                      <option value="PERCENTAGE">Percentage Off</option>
                      <option value="FIXED_AMOUNT">Fixed Amount</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {formData.type === 'PERCENTAGE' ? 'Discount Percentage *' : 'Discount Amount *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.type === 'PERCENTAGE' ? '%' : '$'}
                      </span>
                      <input
                        type="number"
                        step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                        min="0"
                        max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                        value={formData.value}
                        onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        required={formData.type !== 'FREE_SHIPPING'}
                        disabled={formData.type === 'FREE_SHIPPING'}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Purchase
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minPurchase}
                        onChange={e => setFormData(prev => ({ ...prev, minPurchase: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Discount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.maxDiscount}
                        onChange={e => setFormData(prev => ({ ...prev, maxDiscount: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Usage Limit (Total)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={e => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                      placeholder="Unlimited"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Per User Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.perUserLimit}
                      onChange={e => setFormData(prev => ({ ...prev, perUserLimit: e.target.value }))}
                      placeholder="Unlimited"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.startsAt}
                        onChange={e => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.endsAt}
                        onChange={e => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoApply}
                      onChange={e => setFormData(prev => ({ ...prev, autoApply: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-apply at checkout
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={actionLoading === 'submit'}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {actionLoading === 'submit' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
