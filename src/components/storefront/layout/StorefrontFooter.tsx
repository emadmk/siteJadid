'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  CreditCard,
  Shield,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';

const footerLinks = {
  shop: {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/products' },
      { label: 'New Arrivals', href: '/products?sort=newest' },
      { label: 'Best Sellers', href: '/products?featured=true' },
      { label: 'Sale Items', href: '/products?sale=true' },
      { label: 'Categories', href: '/categories' },
      { label: 'Brands', href: '/brands' },
    ],
  },
  account: {
    title: 'My Account',
    links: [
      { label: 'Sign In', href: '/auth/signin' },
      { label: 'Register', href: '/auth/signup' },
      { label: 'My Orders', href: '/account/orders' },
      { label: 'Wishlist', href: '/account/wishlist' },
      { label: 'Address Book', href: '/account/addresses' },
      { label: 'Track Order', href: '/track-order' },
    ],
  },
  business: {
    title: 'Business',
    links: [
      { label: 'B2B Portal', href: '/b2b' },
      { label: 'GSA Advantage', href: '/gsa' },
      { label: 'Bulk Orders', href: '/b2b/bulk-orders' },
      { label: 'Request Quote', href: '/b2b/request-quote' },
      { label: 'Net Terms', href: '/b2b/net-terms' },
      { label: 'Tax Exemption', href: '/b2b/tax-exemption' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Shipping Info', href: '/shipping' },
      { label: 'Returns & Refunds', href: '/returns' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Product Care', href: '/product-care' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
      { label: 'Affiliates', href: '/affiliates' },
      { label: 'Partners', href: '/partners' },
    ],
  },
};

const trustBadges = [
  { icon: Truck, label: 'Standard Shipping', sublabel: 'Fast & Reliable' },
  { icon: Clock, label: 'Same Day Ship', sublabel: 'Before 2PM EST' },
  { icon: Shield, label: 'Secure Checkout', sublabel: '256-bit SSL' },
  { icon: CreditCard, label: 'Easy Returns', sublabel: '30-Day Policy' },
];

export function StorefrontFooter() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setEmail('');
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: { message: 'Successfully subscribed!', type: 'success' }
        }));
      }
    } catch {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Subscription failed. Please try again.', type: 'error' }
      }));
    } finally {
      setIsSubscribing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Trust Badges */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-safety-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-6 h-6 text-safety-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{badge.label}</p>
                  <p className="text-sm text-gray-400">{badge.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Subscribe to our newsletter for exclusive deals, safety tips, and new product announcements.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="px-6 py-3 bg-safety-green-600 text-white rounded-lg font-medium hover:bg-safety-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Subscribe</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-safety-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">Ada</span>
                <span className="text-xl font-bold text-safety-green-400">Supply</span>
              </div>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              Your trusted source for professional safety equipment. ANSI certified products for industrial,
              construction, and workplace safety needs. GSA Schedule Contract Holder.
            </p>
            <div className="space-y-3">
              <a href="tel:478-329-8896" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Phone className="w-5 h-5 text-safety-green-400" />
                478-329-8896
              </a>
              <a href="mailto:info@adasupply.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5 text-safety-green-400" />
                info@adasupply.com
              </a>
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 text-safety-green-400 flex-shrink-0 mt-0.5" />
                <span>Warner Robins, GA<br />United States</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">GSA Contract: GS-21F-0086U</p>
              <p className="text-xs text-gray-500">CAGE Code: 1J2Y1</p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:grid lg:col-span-4 lg:grid-cols-4 gap-8">
            {Object.entries(footerLinks).slice(0, 4).map(([key, section]) => (
              <div key={key}>
                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-safety-green-400 transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordion Links */}
          <div className="lg:hidden col-span-1 space-y-2">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="border-b border-gray-800">
                <button
                  onClick={() => toggleSection(key)}
                  className="flex items-center justify-between w-full py-3 text-left"
                >
                  <span className="font-semibold text-white">{section.title}</span>
                  {expandedSection === key ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSection === key && (
                  <ul className="pb-4 space-y-2">
                    {section.links.map((link, index) => (
                      <li key={index}>
                        <Link
                          href={link.href}
                          className="text-gray-400 hover:text-safety-green-400 transition-colors text-sm"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-gray-400 text-center md:text-left">
              &copy; {new Date().getFullYear()} ADA Supplies. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="text-gray-400 hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap items-center justify-center gap-4">
            <span className="text-sm text-gray-500">We Accept:</span>
            <div className="flex items-center gap-2">
              {['Visa', 'Mastercard', 'Amex', 'Discover', 'PayPal'].map((method) => (
                <div key={method} className="px-3 py-1.5 bg-gray-800 rounded text-xs text-gray-400 font-medium">
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
