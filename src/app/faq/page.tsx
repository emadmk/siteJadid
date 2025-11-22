'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronDown, ChevronUp, Package, CreditCard, Truck, RotateCcw, Users, FileText } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Orders
  {
    category: 'Orders',
    question: 'How do I place an order?',
    answer: 'Browse our product catalog, add items to your cart, and proceed to checkout. You\'ll need to create an account or sign in to complete your purchase. Follow the checkout steps to enter shipping information and payment details.',
  },
  {
    category: 'Orders',
    question: 'Can I modify or cancel my order?',
    answer: 'You can modify or cancel your order within 1 hour of placing it by contacting customer service. After that, your order will be in processing and cannot be modified. However, you can always use our return policy after receiving your items.',
  },
  {
    category: 'Orders',
    question: 'Do you accept bulk orders?',
    answer: 'Yes! We specialize in bulk orders for businesses and organizations. Contact our B2B sales team for volume discounts and custom quotes. Business accounts receive special wholesale pricing and flexible payment terms.',
  },

  // Shipping
  {
    category: 'Shipping',
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 5-7 business days, express shipping takes 2-3 business days, and overnight shipping delivers the next business day. Free shipping is available on all orders over $99.',
  },
  {
    category: 'Shipping',
    question: 'Do you ship internationally?',
    answer: 'Currently, we ship within the United States including Alaska, Hawaii, and US territories. For international shipping inquiries, please contact our sales team for a custom quote.',
  },
  {
    category: 'Shipping',
    question: 'How can I track my order?',
    answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history. Click on any order to see its current status and tracking information.',
  },

  // Returns
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy on most items. Items must be in original, unused condition with all tags and packaging. Some items like opened PPE cannot be returned for health and safety reasons. Return shipping is free with our prepaid labels.',
  },
  {
    category: 'Returns',
    question: 'How do I start a return?',
    answer: 'Log into your account, go to order history, select the order you want to return, and click "Request Return". You\'ll receive a Return Authorization number and prepaid shipping label via email within 24 hours.',
  },
  {
    category: 'Returns',
    question: 'When will I receive my refund?',
    answer: 'Refunds are processed within 5-7 business days after we receive and inspect your return. The refund will be issued to your original payment method. Allow an additional 5-10 business days for the refund to appear in your account.',
  },

  // Payment
  {
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and ACH transfers for business accounts. B2B customers may also qualify for Net 30 payment terms.',
  },
  {
    category: 'Payment',
    question: 'Is my payment information secure?',
    answer: 'Yes, absolutely. We use industry-standard SSL encryption to protect your payment information. We never store complete credit card numbers on our servers. All transactions are processed through secure, PCI-compliant payment gateways.',
  },
  {
    category: 'Payment',
    question: 'Do you offer payment plans?',
    answer: 'For large orders, we offer flexible payment options for qualified business accounts. Contact our B2B sales team to discuss payment plans, Net 30 terms, or other financing options.',
  },

  // Account
  {
    category: 'Account',
    question: 'How do I create an account?',
    answer: 'Click "Sign Up" in the top right corner and fill out the registration form. You can choose between a personal account (B2C), business account (B2B), or government account (GSA). Business and government accounts require approval for special pricing.',
  },
  {
    category: 'Account',
    question: 'What are the benefits of a B2B account?',
    answer: 'B2B accounts receive wholesale pricing on all products, Net 30 payment terms, dedicated account manager, priority support, and access to bulk order discounts. Approval is required and typically takes 24-48 hours.',
  },
  {
    category: 'Account',
    question: 'How does the loyalty program work?',
    answer: 'Earn 1 point for every dollar spent. Redeem points for discounts on future purchases. Tier up from Bronze to Silver, Gold, and Platinum for additional benefits like free shipping, early access to sales, and exclusive products.',
  },

  // Products
  {
    category: 'Products',
    question: 'Are your products ANSI certified?',
    answer: 'Yes, all our safety equipment meets or exceeds ANSI standards and other relevant safety certifications. Product specifications and certifications are listed on each product page.',
  },
  {
    category: 'Products',
    question: 'Do you offer product customization?',
    answer: 'Yes, we offer customization services for bulk orders including company logos, custom colors, and specialized configurations. Contact our sales team for customization options and pricing.',
  },
  {
    category: 'Products',
    question: 'What if a product is out of stock?',
    answer: 'Out of stock items show an estimated restock date on the product page. You can sign up for email notifications when the item is back in stock. For urgent needs, contact our customer service team for alternative solutions.',
  },
];

const categories = ['All', 'Orders', 'Shipping', 'Returns', 'Payment', 'Account', 'Products'];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = activeCategory === 'All'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  const categoryIcons: Record<string, any> = {
    'Orders': Package,
    'Shipping': Truck,
    'Returns': RotateCcw,
    'Payment': CreditCard,
    'Account': Users,
    'Products': ShieldCheck,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-safety-green-100">
            Find answers to common questions about our products and services
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setOpenIndex(null);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-safety-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-safety-green-600 hover:text-safety-green-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => {
              const Icon = categoryIcons[faq.category];
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {Icon && <Icon className="w-5 h-5 text-safety-green-600 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="font-semibold text-black text-lg">{faq.question}</div>
                        <div className="text-xs text-gray-500 mt-1">{faq.category}</div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {openIndex === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 leading-relaxed pl-8">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still Have Questions */}
          <div className="mt-12 bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
            <p className="mb-6 text-safety-green-100">
              Can't find the answer you're looking for? Our customer service team is here to help.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                  Contact Support
                </Button>
              </Link>
              <a href="tel:1-800-723-3891">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-safety-green-700">
                  Call 1-800-SAFETY-1
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/shipping">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <Truck className="w-8 h-8 text-safety-green-600 mb-3" />
                <h4 className="font-semibold text-black mb-2">Shipping Information</h4>
                <p className="text-sm text-gray-600">Learn about our shipping options and delivery times</p>
              </div>
            </Link>

            <Link href="/returns">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <RotateCcw className="w-8 h-8 text-safety-green-600 mb-3" />
                <h4 className="font-semibold text-black mb-2">Return Policy</h4>
                <p className="text-sm text-gray-600">30-day hassle-free returns on all products</p>
              </div>
            </Link>

            <Link href="/compliance">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <ShieldCheck className="w-8 h-8 text-safety-green-600 mb-3" />
                <h4 className="font-semibold text-black mb-2">Compliance</h4>
                <p className="text-sm text-gray-600">ANSI, OSHA, and other safety certifications</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
