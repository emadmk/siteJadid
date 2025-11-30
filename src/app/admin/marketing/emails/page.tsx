'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  description: string | null;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  availableVariables: string[];
  fromName: string;
  fromEmail: string | null;
  replyToEmail: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const templateTypes = [
  { value: 'ORDER_CONFIRMATION', label: 'Order Confirmation' },
  { value: 'ORDER_SHIPPED', label: 'Order Shipped' },
  { value: 'ORDER_DELIVERED', label: 'Order Delivered' },
  { value: 'ORDER_CANCELLED', label: 'Order Cancelled' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'REFUND_PROCESSED', label: 'Refund Processed' },
  { value: 'ABANDONED_CART', label: 'Abandoned Cart' },
  { value: 'WELCOME', label: 'Welcome Email' },
  { value: 'PASSWORD_RESET', label: 'Password Reset' },
  { value: 'EMAIL_VERIFICATION', label: 'Email Verification' },
  { value: 'STOCK_NOTIFICATION', label: 'Stock Notification' },
  { value: 'GIFT_CARD', label: 'Gift Card' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'QUOTE', label: 'Quote' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const [formData, setFormData] = useState({
    type: 'CUSTOM' as string,
    name: '',
    description: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    availableVariables: '',
    fromName: 'Store Name',
    fromEmail: '',
    replyToEmail: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');
    setMessage(null);

    try {
      const url = editingTemplate
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : '/api/admin/email-templates';
      const method = editingTemplate ? 'PATCH' : 'POST';

      const submitData = {
        ...formData,
        availableVariables: formData.availableVariables
          ? formData.availableVariables.split(',').map(v => v.trim()).filter(Boolean)
          : [],
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
          text: editingTemplate ? 'Template updated successfully' : 'Template created successfully',
        });
        setShowModal(false);
        resetForm();
        fetchTemplates();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save template' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setActionLoading(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        setMessage({ type: 'success', text: 'Template deleted successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete template' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleTemplateStatus = async (template: EmailTemplate) => {
    setActionLoading(template.id);

    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (res.ok) {
        setTemplates(prev =>
          prev.map(t => (t.id === template.id ? { ...t, isActive: !t.isActive } : t))
        );
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || '',
      availableVariables: template.availableVariables.join(', '),
      fromName: template.fromName,
      fromEmail: template.fromEmail || '',
      replyToEmail: template.replyToEmail || '',
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      type: 'CUSTOM',
      name: '',
      description: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      availableVariables: '',
      fromName: 'Store Name',
      fromEmail: '',
      replyToEmail: '',
      isActive: true,
    });
  };

  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    if (filter === 'active') return template.isActive;
    if (filter === 'inactive') return !template.isActive;
    return template.type === filter;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    inactive: templates.filter(t => !t.isActive).length,
  };

  const getTypeLabel = (type: string) => {
    const found = templateTypes.find(t => t.value === type);
    return found ? found.label : type;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage email templates for automated notifications
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
          Create Template
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Templates</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</div>
          <div className="text-2xl font-bold text-gray-500 mt-1">{stats.inactive}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No templates found</p>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(template => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                      {template.description && (
                        <div className="text-sm text-gray-500">{template.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {getTypeLabel(template.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {template.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          template.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleTemplateStatus(template)}
                          disabled={actionLoading === template.id}
                          className={`p-2 rounded-lg transition-colors ${
                            template.isActive
                              ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                              : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                          title={template.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {actionLoading === template.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : template.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          disabled={actionLoading === template.id}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
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
                      Template Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      disabled={!!editingTemplate}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      {templateTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="e.g., Order Confirmation Email"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this template"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    placeholder="e.g., Your Order #{{orderNumber}} has been confirmed"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.fromName}
                      onChange={e => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
                      placeholder="Store Name"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={formData.fromEmail}
                      onChange={e => setFormData(prev => ({ ...prev, fromEmail: e.target.value }))}
                      placeholder="noreply@store.com"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reply-To Email
                    </label>
                    <input
                      type="email"
                      value={formData.replyToEmail}
                      onChange={e => setFormData(prev => ({ ...prev, replyToEmail: e.target.value }))}
                      placeholder="support@store.com"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Available Variables (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.availableVariables}
                    onChange={e => setFormData(prev => ({ ...prev, availableVariables: e.target.value }))}
                    placeholder="e.g., orderNumber, customerName, totalAmount"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    HTML Content *
                  </label>
                  <textarea
                    value={formData.htmlContent}
                    onChange={e => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                    required
                    rows={8}
                    placeholder="Enter HTML email content..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white font-mono text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plain Text Content (optional)
                  </label>
                  <textarea
                    value={formData.textContent}
                    onChange={e => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                    rows={4}
                    placeholder="Plain text version for email clients that don't support HTML..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>

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
                    {editingTemplate ? 'Update Template' : 'Create Template'}
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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Preview: {previewTemplate.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Subject: {previewTemplate.subject}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div
                  className="bg-white border border-gray-200 rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
