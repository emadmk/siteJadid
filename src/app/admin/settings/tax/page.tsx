'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TaxSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enableTax: false,
    provider: 'manual',
    taxJarApiKey: '',
    defaultTaxRate: 0,
    taxIncludedInPrice: false,
    calculateTaxOnShipping: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/tax-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tax-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Tax settings saved successfully');
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
        <h1 className="text-3xl font-bold">Tax Settings</h1>
        <p className="text-gray-600 mt-1">Configure tax calculation for your store</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Enable Tax Calculation</h3>
            <p className="text-sm text-gray-500">Calculate and apply taxes to orders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableTax}
              onChange={(e) => setSettings({ ...settings, enableTax: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tax Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="manual">Manual Tax Rates</option>
            <option value="taxjar">TaxJar (Automatic)</option>
          </select>
        </div>

        {settings.provider === 'taxjar' && (
          <div>
            <label className="block text-sm font-medium mb-2">TaxJar API Key</label>
            <input
              type="password"
              value={settings.taxJarApiKey}
              onChange={(e) => setSettings({ ...settings, taxJarApiKey: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter your TaxJar API key"
            />
          </div>
        )}

        {settings.provider === 'manual' && (
          <div>
            <label className="block text-sm font-medium mb-2">Default Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.defaultTaxRate}
              onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Tax Included in Price</h3>
            <p className="text-sm text-gray-500">Display prices with tax included</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.taxIncludedInPrice}
              onChange={(e) => setSettings({ ...settings, taxIncludedInPrice: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Calculate Tax on Shipping</h3>
            <p className="text-sm text-gray-500">Apply tax to shipping costs</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.calculateTaxOnShipping}
              onChange={(e) => setSettings({ ...settings, calculateTaxOnShipping: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
