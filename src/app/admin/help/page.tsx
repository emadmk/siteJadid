'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronDown,
  Search,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  Truck,
  FileText,
} from 'lucide-react';

const faqs = [
  {
    category: 'Orders',
    icon: ShoppingCart,
    questions: [
      {
        q: 'How do I process a new order?',
        a: 'Navigate to Orders > All Orders, find the order and click on it to view details. From there you can update the status, add tracking information, and process the shipment.',
      },
      {
        q: 'How do I issue a refund?',
        a: 'Go to the order details page, click on "Issue Refund" button. You can choose to refund the full amount or a partial amount. The refund will be processed through the original payment method.',
      },
      {
        q: 'How do I handle returns (RMA)?',
        a: 'Navigate to Orders > RMAs to view all return requests. You can approve, reject, or request more information from the customer.',
      },
    ],
  },
  {
    category: 'Products',
    icon: Package,
    questions: [
      {
        q: 'How do I add a new product?',
        a: 'Go to Products > Add Product. Fill in the product details including name, description, price, SKU, and upload images. You can also set inventory levels and assign categories.',
      },
      {
        q: 'How do I manage inventory?',
        a: 'Navigate to Products > Inventory to view and update stock levels. You can set low stock alerts and manage inventory across multiple warehouses.',
      },
      {
        q: 'How do I create product bundles?',
        a: 'Go to Products > Bundles to create product bundles. Select the products you want to include and set a bundle price.',
      },
    ],
  },
  {
    category: 'Customers',
    icon: Users,
    questions: [
      {
        q: 'How do I view customer details?',
        a: 'Navigate to Customers > All Customers and click on a customer to view their profile, order history, and account details.',
      },
      {
        q: 'How do I manage B2B customers?',
        a: 'B2B customers have special pricing and approval workflows. Go to Customers > B2B Customers to manage business accounts.',
      },
      {
        q: 'How do I create customer groups?',
        a: 'Go to Customers > Customer Groups to create groups with special pricing or permissions.',
      },
    ],
  },
  {
    category: 'Analytics',
    icon: BarChart3,
    questions: [
      {
        q: 'How do I view sales reports?',
        a: 'Navigate to Analytics > Sales to view detailed sales reports. You can filter by date range, product, or customer.',
      },
      {
        q: 'How do I export data?',
        a: 'Most data tables have an "Export" button that allows you to download data as CSV or Excel files.',
      },
    ],
  },
  {
    category: 'Settings',
    icon: Settings,
    questions: [
      {
        q: 'How do I configure payment gateways?',
        a: 'Go to Settings > Integrations > Payment to configure Stripe, PayPal, and other payment methods.',
      },
      {
        q: 'How do I set up shipping?',
        a: 'Navigate to Settings > Integrations > Shipping to configure shipping providers and rates.',
      },
      {
        q: 'How do I manage tax settings?',
        a: 'Go to Settings > Integrations > Tax to configure tax rates and exemptions.',
      },
    ],
  },
];

const shortcuts = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['Ctrl', 'S'], description: 'Save current form' },
  { keys: ['Esc'], description: 'Close modal/dialog' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
];

export default function AdminHelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Orders');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Find answers to common questions and learn how to use the admin panel
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            filteredFaqs.map((category) => (
              <div
                key={category.category}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.category ? null : category.category
                  )}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <category.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {category.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({category.questions.length} questions)
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedCategory === category.category ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedCategory === category.category && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {category.questions.map((item, idx) => (
                      <div
                        key={idx}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <button
                          onClick={() => setExpandedQuestion(
                            expandedQuestion === `${category.category}-${idx}`
                              ? null
                              : `${category.category}-${idx}`
                          )}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-300 pr-4">{item.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                              expandedQuestion === `${category.category}-${idx}` ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {expandedQuestion === `${category.category}-${idx}` && (
                          <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 text-sm">
                            {item.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-3">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <kbd
                        key={keyIdx}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                <Book className="w-4 h-4" />
                <span>Documentation</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="#"
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Community Forum</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="mailto:support@example.com"
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-2">Need more help?</h3>
            <p className="text-sm text-green-100 mb-4">
              Our support team is available 24/7 to help you with any questions.
            </p>
            <button className="w-full py-2 bg-white text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
