'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gateways, setGateways] = useState({
    stripe: {
      enabled: false,
      publicKey: '',
      secretKey: '',
      webhookSecret: '',
    },
    paypal: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      sandbox: true,
    },
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/admin/payment-gateways');
      if (res.ok) {
        const data = await res.json();
        if (data.stripe || data.paypal) {
          setGateways(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateways),
      });
      if (res.ok) {
        alert('Payment settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/settings/integrations" className="flex items-center text-gray-600 hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Integrations
        </Link>
        <h1 className="text-3xl font-bold">Payment Gateways</h1>
        <p className="text-gray-600 mt-1">Configure payment processing for your store</p>
      </div>

      {/* Stripe */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Stripe</h2>
              <p className="text-sm text-gray-500">Accept credit card payments</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={gateways.stripe.enabled}
              onChange={(e) => setGateways({ ...gateways, stripe: { ...gateways.stripe, enabled: e.target.checked } })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {gateways.stripe.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Publishable Key</label>
              <input
                type="text"
                value={gateways.stripe.publicKey}
                onChange={(e) => setGateways({ ...gateways, stripe: { ...gateways.stripe, publicKey: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="pk_live_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secret Key</label>
              <input
                type="password"
                value={gateways.stripe.secretKey}
                onChange={(e) => setGateways({ ...gateways, stripe: { ...gateways.stripe, secretKey: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="sk_live_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Webhook Secret</label>
              <input
                type="password"
                value={gateways.stripe.webhookSecret}
                onChange={(e) => setGateways({ ...gateways, stripe: { ...gateways.stripe, webhookSecret: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="whsec_..."
              />
            </div>
          </div>
        )}
      </div>

      {/* PayPal */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold mr-3">P</div>
            <div>
              <h2 className="text-xl font-semibold">PayPal</h2>
              <p className="text-sm text-gray-500">Accept PayPal payments</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={gateways.paypal.enabled}
              onChange={(e) => setGateways({ ...gateways, paypal: { ...gateways.paypal, enabled: e.target.checked } })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {gateways.paypal.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <input
                type="text"
                value={gateways.paypal.clientId}
                onChange={(e) => setGateways({ ...gateways, paypal: { ...gateways.paypal, clientId: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="PayPal Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client Secret</label>
              <input
                type="password"
                value={gateways.paypal.clientSecret}
                onChange={(e) => setGateways({ ...gateways, paypal: { ...gateways.paypal, clientSecret: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="PayPal Client Secret"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="paypal-sandbox"
                checked={gateways.paypal.sandbox}
                onChange={(e) => setGateways({ ...gateways, paypal: { ...gateways.paypal, sandbox: e.target.checked } })}
                className="mr-2"
              />
              <label htmlFor="paypal-sandbox" className="text-sm">Sandbox Mode (for testing)</label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
