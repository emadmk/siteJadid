'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  Search,
  FileText,
  User,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

interface EmailComposerProps {
  /** Pre-fill recipient email */
  defaultEmail?: string;
  /** Pre-fill recipient name */
  defaultName?: string;
  /** Associated order ID for logging */
  orderId?: string;
  /** Close handler */
  onClose?: () => void;
  /** Compact mode (inline in page vs modal) */
  compact?: boolean;
}

const QUICK_TEMPLATES = [
  {
    category: 'Order & Shipping',
    templates: [
      { title: 'Order Received', subject: 'Your Order Has Been Received', body: 'Thank you for your order! We have received your order and it is currently being processed. We will notify you once your order has been shipped.\n\nIf you have any questions about your order, please don\'t hesitate to reach out to us.' },
      { title: 'Order Shipped', subject: 'Your Order Has Been Shipped', body: 'Great news! Your order has been shipped. You can track your shipment using the tracking information provided in your order details.\n\nPlease allow 3-5 business days for delivery. If you have any questions, feel free to contact us.' },
      { title: 'Shipping Delay', subject: 'Update on Your Order Shipping', body: 'We wanted to let you know that there is a slight delay in shipping your order. We apologize for any inconvenience and are working to get your order to you as soon as possible.\n\nWe will send you an update once your order has been shipped. Thank you for your patience.' },
      { title: 'Tracking Info', subject: 'Your Tracking Information', body: 'Here is the tracking information for your recent order:\n\nTracking Number: [TRACKING_NUMBER]\nCarrier: [CARRIER]\n\nYou can track your package using the carrier\'s website. Please allow 24-48 hours for tracking information to update.' },
      { title: 'Delivery Confirmation', subject: 'Your Order Has Been Delivered', body: 'Your order has been successfully delivered! We hope everything arrived in great condition.\n\nIf you have any issues with your order or need to return any items, please contact us within 30 days of delivery.' },
      { title: 'Backorder Notice', subject: 'Backorder Update for Your Order', body: 'We wanted to inform you that one or more items in your order are currently on backorder. We are working with our suppliers to fulfill your order as quickly as possible.\n\nEstimated availability: [DATE]\n\nWe will notify you once the items are available and your order has been shipped. Thank you for your understanding.' },
    ],
  },
  {
    category: 'Account & Verification',
    templates: [
      { title: 'Address Confirmation', subject: 'Please Confirm Your Shipping Address', body: 'We need to verify your shipping address before we can process your order. Could you please confirm the following address is correct?\n\n[ADDRESS]\n\nIf this is correct, please reply to this email confirming. If any changes are needed, please provide the updated address.' },
      { title: 'Account Approved', subject: 'Your Account Has Been Approved', body: 'Congratulations! Your account has been approved and you now have full access to our products and services.\n\nYou can log in to your account at any time to browse products, place orders, and manage your account settings.' },
      { title: 'Document Request', subject: 'Documents Required for Your Account', body: 'To complete your account verification, we need the following documents:\n\n1. [DOCUMENT_1]\n2. [DOCUMENT_2]\n\nPlease submit these documents at your earliest convenience so we can finalize your account setup.' },
      { title: 'Account Info Update', subject: 'Please Update Your Account Information', body: 'We noticed that some information on your account may need updating. Could you please log in and verify the following:\n\n- Contact information\n- Billing address\n- Shipping address\n\nKeeping your information up to date helps us serve you better.' },
    ],
  },
  {
    category: 'Payment & Billing',
    templates: [
      { title: 'Payment Received', subject: 'Payment Received - Thank You', body: 'We have received your payment. Thank you for your prompt payment.\n\nYour order will be processed and shipped according to the estimated timeline. You will receive a shipping confirmation email once your order is on its way.' },
      { title: 'Payment Reminder', subject: 'Payment Reminder for Your Order', body: 'This is a friendly reminder that payment for your recent order is due. Please process the payment at your earliest convenience to avoid any delays in shipping.\n\nIf you have already made the payment, please disregard this message. If you need assistance, please contact us.' },
      { title: 'Invoice Attached', subject: 'Invoice for Your Recent Order', body: 'Please find the invoice for your recent order attached to this email. The payment terms are as specified in your account agreement.\n\nIf you have any questions about the invoice, please don\'t hesitate to contact our accounting department.' },
      { title: 'Refund Processed', subject: 'Your Refund Has Been Processed', body: 'Your refund has been processed and should appear in your account within 5-10 business days, depending on your bank or payment provider.\n\nRefund amount: $[AMOUNT]\n\nIf you don\'t see the refund after 10 business days, please contact us.' },
    ],
  },
  {
    category: 'Product & Support',
    templates: [
      { title: 'Product Inquiry Response', subject: 'RE: Product Inquiry', body: 'Thank you for your inquiry about our products. Here is the information you requested:\n\n[PRODUCT_INFO]\n\nIf you need additional information or would like to place an order, please let us know. We\'re happy to help!' },
      { title: 'Quote Follow-up', subject: 'Following Up on Your Quote Request', body: 'We wanted to follow up on the quote we recently provided. Please let us know if you have any questions or if you\'d like to proceed with the order.\n\nThe quote is valid for 30 days. If you need any modifications, we\'d be happy to update it for you.' },
      { title: 'Return Instructions', subject: 'Return Instructions for Your Order', body: 'We\'re sorry to hear that you need to return an item. Here are the return instructions:\n\n1. Pack the item securely in its original packaging\n2. Include the return form with the reason for return\n3. Ship to: ADA Supply Returns, Warner Robins, GA 31088\n\nOnce we receive the item, we will process your refund within 5-7 business days.' },
      { title: 'Variant Confirmation', subject: 'Please Confirm Product Variant', body: 'We noticed that the product you ordered comes in multiple variants. Could you please confirm which variant you would like?\n\nAvailable options:\n- [OPTION_1]\n- [OPTION_2]\n- [OPTION_3]\n\nPlease reply with your preference so we can process your order promptly.' },
      { title: 'Custom Order Update', subject: 'Update on Your Custom Order', body: 'We wanted to give you an update on your custom order. Our team is currently working on it and we expect it to be ready by [DATE].\n\nWe will send you photos for approval before shipping. If you have any changes or special requests, please let us know as soon as possible.' },
      { title: 'General Follow-up', subject: 'Following Up on Your Recent Interaction', body: 'We wanted to follow up and make sure everything is going well. If you have any questions or need assistance with anything, please don\'t hesitate to reach out.\n\nWe\'re here to help and want to make sure you have the best experience with ADA Supply.' },
    ],
  },
];

export function EmailComposer({ defaultEmail, defaultName, orderId, onClose, compact }: EmailComposerProps) {
  const [to, setTo] = useState(defaultEmail || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowCustomerSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search customers
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleSend = async () => {
    if (!to || !subject || !message) {
      setStatus({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/send-customer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message, orderId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', text: 'Email sent successfully!' });
        setSubject('');
        setMessage('');
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus({ type: 'error', text: data.error || 'Failed to send email' });
      }
    } catch {
      setStatus({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const selectTemplate = (template: { title: string; subject: string; body: string }) => {
    setSubject(template.subject);
    setMessage(template.body);
    setShowTemplates(false);
  };

  const selectCustomer = (customer: Customer) => {
    setTo(customer.email);
    setShowCustomerSearch(false);
    setCustomerSearch('');
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${compact ? '' : 'shadow-lg'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Send Email to Customer</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Templates Button */}
          <div className="relative" ref={templateRef}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Templates
              <ChevronDown className="w-3 h-3" />
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                {QUICK_TEMPLATES.map((category) => (
                  <div key={category.category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 sticky top-0">
                      {category.category}
                    </div>
                    {category.templates.map((template) => (
                      <button
                        key={template.title}
                        onClick={() => selectTemplate(template)}
                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{template.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.subject}</div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* To Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
          <div className="relative" ref={searchRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors whitespace-nowrap"
                title="Search customers"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Find</span>
              </button>
            </div>

            {showCustomerSearch && (
              <div className="absolute right-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {customerSearch.length < 2 ? 'Type at least 2 characters...' : 'No customers found'}
                    </div>
                  ) : (
                    customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name || 'No Name'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here... The email will be sent with the ADA Supply branded template automatically."
            rows={8}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-y"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your message will be wrapped in the ADA Supply branded email template automatically.
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              status.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {status.text}
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !message}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
