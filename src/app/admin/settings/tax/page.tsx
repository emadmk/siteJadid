'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, DollarSign, Users, Building2, BadgeCheck, ShoppingBag, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerTypeTax {
  enabled: boolean;
  rate: number;
}

interface TaxSettings {
  enableTax: boolean;
  provider: string;
  taxJarApiKey: string;
  defaultTaxRate: number;
  taxIncludedInPrice: boolean;
  calculateTaxOnShipping: boolean;
  // Per-customer-type tax
  customerTypeTax: {
    B2C: CustomerTypeTax;
    B2B: CustomerTypeTax;
    GSA: CustomerTypeTax;
    PERSONAL: CustomerTypeTax;
    VOLUME_BUYER: CustomerTypeTax;
    GOVERNMENT: CustomerTypeTax;
  };
}

const CUSTOMER_TYPES = [
  { key: 'PERSONAL', label: 'Personal Buyers', icon: Users, description: 'Individual consumer accounts' },
  { key: 'B2C', label: 'B2C Customers', icon: ShoppingBag, description: 'Business to consumer accounts' },
  { key: 'B2B', label: 'B2B Customers', icon: Building2, description: 'Business to business accounts' },
  { key: 'VOLUME_BUYER', label: 'Volume Buyers', icon: Building2, description: 'High-volume purchasing accounts' },
  { key: 'GSA', label: 'GSA Customers', icon: BadgeCheck, description: 'GSA schedule accounts' },
  { key: 'GOVERNMENT', label: 'Government Buyers', icon: Landmark, description: 'Government agency accounts' },
] as const;

export default function TaxSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TaxSettings>({
    enableTax: false,
    provider: 'manual',
    taxJarApiKey: '',
    defaultTaxRate: 0,
    taxIncludedInPrice: false,
    calculateTaxOnShipping: false,
    customerTypeTax: {
      B2C: { enabled: true, rate: 8 },
      B2B: { enabled: true, rate: 8 },
      GSA: { enabled: true, rate: 8 },
      PERSONAL: { enabled: true, rate: 8 },
      VOLUME_BUYER: { enabled: false, rate: 0 },
      GOVERNMENT: { enabled: false, rate: 0 },
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/tax-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({
          ...prev,
          ...data,
          customerTypeTax: data.customerTypeTax || prev.customerTypeTax,
        }));
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
        const data = await res.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateCustomerTypeTax = (type: string, field: 'enabled' | 'rate', value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      customerTypeTax: {
        ...prev.customerTypeTax,
        [type]: {
          ...prev.customerTypeTax[type as keyof typeof prev.customerTypeTax],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/settings" className="flex items-center text-gray-600 hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Tax Settings</h1>
            <p className="text-gray-600 mt-1">Configure tax calculation for your store</p>
          </div>
        </div>
      </div>

      {/* General Tax Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900">General Settings</h2>

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
              min="0"
              max="100"
              value={settings.defaultTaxRate}
              onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-400 mt-1">Fallback rate if per-customer-type rate is not set</p>
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
      </div>

      {/* Per-Customer-Type Tax Settings */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Tax by Customer Type</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure tax rates individually for each customer type. Enable or disable tax and set the rate for each type.
          </p>
        </div>

        <div className="space-y-4">
          {CUSTOMER_TYPES.map(({ key, label, icon: Icon, description }) => {
            const typeTax = settings.customerTypeTax[key as keyof typeof settings.customerTypeTax];
            return (
              <div
                key={key}
                className={`border rounded-lg p-4 transition-colors ${
                  typeTax.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      typeTax.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Tax Rate Input */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 whitespace-nowrap">Rate:</label>
                      <div className="relative w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={typeTax.rate}
                          onChange={(e) => updateCustomerTypeTax(key, 'rate', parseFloat(e.target.value) || 0)}
                          disabled={!typeTax.enabled}
                          className="w-full px-3 py-1.5 pr-7 text-sm border rounded-lg disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={typeTax.enabled}
                        onChange={(e) => updateCustomerTypeTax(key, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>

                {typeTax.enabled && (
                  <div className="mt-2 ml-12 text-xs text-green-700">
                    Tax active at {typeTax.rate}%
                  </div>
                )}
                {!typeTax.enabled && (
                  <div className="mt-2 ml-12 text-xs text-gray-400">
                    Tax exempt (no tax charged)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Changes will apply to all new orders after saving.
          </p>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Tax Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
