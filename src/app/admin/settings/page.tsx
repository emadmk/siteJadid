'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Mail,
  CreditCard,
  Truck,
  Shield,
  Globe,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Settings {
  store: {
    name: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
  };
  email: {
    orderConfirmation: boolean;
    shippingUpdates: boolean;
    lowStockAlerts: boolean;
    marketingEmails: boolean;
  };
  shipping: {
    freeThreshold: number;
    standardRate: number;
    expressRate: number;
    international: boolean;
  };
  tax: {
    defaultRate: number;
    applyToShipping: boolean;
    gsaExempt: boolean;
  };
  payment: {
    stripe: boolean;
    paypal: boolean;
    gsaSmartpay: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
}

const defaultSettings: Settings = {
  store: {
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
  },
  email: {
    orderConfirmation: true,
    shippingUpdates: true,
    lowStockAlerts: true,
    marketingEmails: false,
  },
  shipping: {
    freeThreshold: 100,
    standardRate: 9.99,
    expressRate: 24.99,
    international: true,
  },
  tax: {
    defaultRate: 8.5,
    applyToShipping: true,
    gsaExempt: true,
  },
  payment: {
    stripe: true,
    paypal: false,
    gsaSmartpay: true,
  },
  security: {
    twoFactorAuth: true,
    sessionTimeout: 15,
    passwordExpiry: 0,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; category?: string } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({
            store: { ...prev.store, ...data.settings.store },
            email: { ...prev.email, ...data.settings.email },
            shipping: { ...prev.shipping, ...data.settings.shipping },
            tax: { ...prev.tax, ...data.settings.tax },
            payment: { ...prev.payment, ...data.settings.payment },
            security: { ...prev.security, ...data.settings.security },
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (category: keyof Settings) => {
    setSaving(category);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          settings: settings[category],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!', category });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings', category });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving', category });
    } finally {
      setSaving(null);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    category: K,
    key: keyof Settings[K],
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your store settings and configurations</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <SettingsCard
          icon={<Store className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          title="Store Information"
          subtitle="Basic store details"
          saving={saving === 'store'}
          message={message?.category === 'store' ? message : null}
          onSave={() => saveSettings('store')}
        >
          <div className="space-y-4">
            <Input
              label="Store Name"
              value={settings.store.name}
              onChange={(v) => updateSetting('store', 'name', v)}
            />
            <Textarea
              label="Store Description"
              value={settings.store.description}
              onChange={(v) => updateSetting('store', 'description', v)}
              rows={3}
            />
            <Input
              label="Contact Email"
              type="email"
              value={settings.store.email}
              onChange={(v) => updateSetting('store', 'email', v)}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={settings.store.phone}
              onChange={(v) => updateSetting('store', 'phone', v)}
            />
          </div>
        </SettingsCard>

        {/* Email Settings */}
        <SettingsCard
          icon={<Mail className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          title="Email Notifications"
          subtitle="Configure email settings"
          saving={saving === 'email'}
          message={message?.category === 'email' ? message : null}
          onSave={() => saveSettings('email')}
        >
          <div className="space-y-4">
            <Toggle
              label="Order Confirmations"
              description="Send email when orders are placed"
              checked={settings.email.orderConfirmation}
              onChange={(v) => updateSetting('email', 'orderConfirmation', v)}
            />
            <Toggle
              label="Shipping Updates"
              description="Notify customers of shipping status"
              checked={settings.email.shippingUpdates}
              onChange={(v) => updateSetting('email', 'shippingUpdates', v)}
            />
            <Toggle
              label="Low Stock Alerts"
              description="Alert admins when inventory is low"
              checked={settings.email.lowStockAlerts}
              onChange={(v) => updateSetting('email', 'lowStockAlerts', v)}
            />
            <Toggle
              label="Marketing Emails"
              description="Send promotional content to customers"
              checked={settings.email.marketingEmails}
              onChange={(v) => updateSetting('email', 'marketingEmails', v)}
            />
          </div>
        </SettingsCard>

        {/* Payment Settings */}
        <SettingsCard
          icon={<CreditCard className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          title="Payment Methods"
          subtitle="Manage payment options"
          saving={saving === 'payment'}
          message={message?.category === 'payment' ? message : null}
          onSave={() => saveSettings('payment')}
        >
          <div className="space-y-4">
            <PaymentMethod
              icon={<CreditCard className="w-6 h-6 text-gray-600" />}
              name="Credit/Debit Cards"
              description="Stripe Integration"
              active={settings.payment.stripe}
              onChange={(v) => updateSetting('payment', 'stripe', v)}
            />
            <PaymentMethod
              icon={<CreditCard className="w-6 h-6 text-gray-600" />}
              name="PayPal"
              description="PayPal Integration"
              active={settings.payment.paypal}
              onChange={(v) => updateSetting('payment', 'paypal', v)}
            />
            <PaymentMethod
              icon={<Shield className="w-6 h-6 text-gray-600" />}
              name="GSA SmartPay"
              description="Government Procurement"
              active={settings.payment.gsaSmartpay}
              onChange={(v) => updateSetting('payment', 'gsaSmartpay', v)}
            />
          </div>
        </SettingsCard>

        {/* Shipping Settings */}
        <SettingsCard
          icon={<Truck className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          title="Shipping Options"
          subtitle="Configure shipping methods"
          saving={saving === 'shipping'}
          message={message?.category === 'shipping' ? message : null}
          onSave={() => saveSettings('shipping')}
        >
          <div className="space-y-4">
            <Input
              label="Free Shipping Threshold"
              type="number"
              prefix="$"
              value={settings.shipping.freeThreshold}
              onChange={(v) => updateSetting('shipping', 'freeThreshold', parseFloat(v) || 0)}
            />
            <Input
              label="Standard Shipping Rate"
              type="number"
              prefix="$"
              step="0.01"
              value={settings.shipping.standardRate}
              onChange={(v) => updateSetting('shipping', 'standardRate', parseFloat(v) || 0)}
            />
            <Input
              label="Express Shipping Rate"
              type="number"
              prefix="$"
              step="0.01"
              value={settings.shipping.expressRate}
              onChange={(v) => updateSetting('shipping', 'expressRate', parseFloat(v) || 0)}
            />
            <Toggle
              label="International Shipping"
              description="Enable international shipping"
              checked={settings.shipping.international}
              onChange={(v) => updateSetting('shipping', 'international', v)}
            />
          </div>
        </SettingsCard>

        {/* Tax Settings */}
        <SettingsCard
          icon={<Globe className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          title="Tax Settings"
          subtitle="Configure tax rates"
          saving={saving === 'tax'}
          message={message?.category === 'tax' ? message : null}
          onSave={() => saveSettings('tax')}
        >
          <div className="space-y-4">
            <Input
              label="Default Tax Rate (%)"
              type="number"
              step="0.1"
              value={settings.tax.defaultRate}
              onChange={(v) => updateSetting('tax', 'defaultRate', parseFloat(v) || 0)}
            />
            <Toggle
              label="Apply Tax to Shipping"
              description="Include shipping in tax calculations"
              checked={settings.tax.applyToShipping}
              onChange={(v) => updateSetting('tax', 'applyToShipping', v)}
            />
            <Toggle
              label="GSA Tax Exempt"
              description="GSA orders are tax-exempt"
              checked={settings.tax.gsaExempt}
              onChange={(v) => updateSetting('tax', 'gsaExempt', v)}
            />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                For state-specific tax rates, configure them in the tax management section.
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Security Settings */}
        <SettingsCard
          icon={<Shield className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          title="Security"
          subtitle="Security and privacy settings"
          saving={saving === 'security'}
          message={message?.category === 'security' ? message : null}
          onSave={() => saveSettings('security')}
        >
          <div className="space-y-4">
            <Toggle
              label="Two-Factor Authentication"
              description="Require 2FA for admin accounts"
              checked={settings.security.twoFactorAuth}
              onChange={(v) => updateSetting('security', 'twoFactorAuth', v)}
            />
            <Select
              label="Session Timeout"
              description="Auto-logout after inactivity"
              value={String(settings.security.sessionTimeout)}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
              ]}
              onChange={(v) => updateSetting('security', 'sessionTimeout', parseInt(v))}
            />
            <Select
              label="Password Expiry"
              description="Force password reset"
              value={String(settings.security.passwordExpiry)}
              options={[
                { value: '0', label: 'Never' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
                { value: '180', label: '180 days' },
              ]}
              onChange={(v) => updateSetting('security', 'passwordExpiry', parseInt(v))}
            />
          </div>
        </SettingsCard>
      </div>
    </motion.div>
  );
}

// Reusable Components
function SettingsCard({
  icon,
  iconBg,
  title,
  subtitle,
  children,
  saving,
  message,
  onSave,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  saving: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onSave: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="mt-4 w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save {title}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  type = 'text',
  value,
  onChange,
  prefix,
  step,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  prefix?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          className={`w-full ${prefix ? 'pl-8' : 'px-3'} pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white`}
        />
      </div>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-none"
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function Select({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentMethod({
  icon,
  name,
  description,
  active,
  onChange,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  active: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!active)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          active
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {active ? 'Active' : 'Inactive'}
      </button>
    </div>
  );
}
