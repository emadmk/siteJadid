'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IntegrationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<{
    tax: any;
    shipping: any[];
    payment: any[];
    email: any;
    sentry: any;
    redis: any;
    algolia: any;
  }>({
    tax: null,
    shipping: [],
    payment: [],
    email: null,
    sentry: null,
    redis: null,
    algolia: null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [tax, shipping, payment, email, sentry, redis, algolia] = await Promise.all([
        fetch('/api/admin/tax-settings').then(r => r.json()),
        fetch('/api/admin/shipping-providers').then(r => r.json()),
        fetch('/api/admin/payment-gateways').then(r => r.json()),
        fetch('/api/admin/email-service').then(r => r.json()),
        fetch('/api/admin/sentry-settings').then(r => r.json()),
        fetch('/api/admin/redis-settings').then(r => r.json()),
        fetch('/api/admin/algolia-settings').then(r => r.json()),
      ]);

      setSettings({ tax, shipping, payment, email, sentry, redis, algolia });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Integration Settings</h1>

      <div className="grid gap-6">
        {/* Tax Calculation */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Tax Calculation</h2>
              <p className="text-gray-600">Configure TaxJar or manual tax rates</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/tax')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Configure
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Provider: {settings.tax?.provider || 'Not configured'}
            {settings.tax?.enableTax && <span className="ml-2 text-green-600">● Active</span>}
          </div>
        </div>

        {/* Shipping Providers */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Shipping Providers</h2>
              <p className="text-gray-600">USPS, FedEx, UPS real-time rates</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/shipping')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {settings.shipping.length} provider(s) configured
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Payment Gateways</h2>
              <p className="text-gray-600">Stripe, PayPal integrations</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/payment')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {settings.payment.length} gateway(s) configured
          </div>
        </div>

        {/* Email Service */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Email Service</h2>
              <p className="text-gray-600">Resend, SendGrid, SES</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/email')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Configure
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Provider: {settings.email?.provider || 'Not configured'}
          </div>
        </div>

        {/* Advanced Search */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Advanced Search</h2>
              <p className="text-gray-600">Algolia integration</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/search')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Configure
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {settings.algolia?.isActive ? '● Active' : 'Not configured'}
          </div>
        </div>

        {/* Error Tracking */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Error Tracking</h2>
              <p className="text-gray-600">Sentry integration</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/sentry')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Configure
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {settings.sentry?.isActive ? '● Active' : 'Not configured'}
          </div>
        </div>

        {/* Redis Cache */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Redis Cache</h2>
              <p className="text-gray-600">Caching configuration</p>
            </div>
            <button
              onClick={() => router.push('/admin/settings/cache')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Configure
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {settings.redis?.isActive ? '● Active' : 'Not configured'}
          </div>
        </div>
      </div>
    </div>
  );
}
