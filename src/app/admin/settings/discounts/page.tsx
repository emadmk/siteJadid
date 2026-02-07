'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Users, Shield, User, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

interface DiscountSetting {
  id: string;
  accountType: 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT';
  discountPercentage: number;
  minimumOrderAmount: number;
  isActive: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  warehouseId?: string | null;
}

const accountTypeLabels = {
  PERSONAL: { label: 'Personal Buyers', icon: User, color: 'blue' },
  VOLUME_BUYER: { label: 'Volume Buyers', icon: Users, color: 'purple' },
  GOVERNMENT: { label: 'Government', icon: Shield, color: 'green' },
};

export default function DiscountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DiscountSetting[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/discount-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
      }
    } catch (error) {
      console.error('Error fetching discount settings:', error);
      toast.error('Failed to load discount settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/discount-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        toast.success('Discount settings saved successfully');
        fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (id: string, field: keyof DiscountSetting, value: any) => {
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const initializeDefaultSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/discount-settings/initialize', {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('Default settings created');
        fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create default settings');
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
      toast.error('Error creating default settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-safety-green-600" />
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
        <h1 className="text-3xl font-bold text-black">User Type Discounts</h1>
        <p className="text-gray-600 mt-1">Configure discount percentages for each user type</p>
      </div>

      {settings.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">No Discount Settings</h3>
          <p className="text-gray-600 mb-6">
            Create default discount settings for all user types
          </p>
          <Button
            onClick={initializeDefaultSettings}
            disabled={saving}
            className="bg-safety-green-600 hover:bg-safety-green-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Default Settings
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-black">Global Discount Settings</h2>
              <p className="text-sm text-gray-600">Set default discounts for each user type</p>
            </div>
            <div className="divide-y">
              {(['PERSONAL', 'VOLUME_BUYER', 'GOVERNMENT'] as const).map(accountType => {
                const setting = settings.find(
                  s => s.accountType === accountType && !s.categoryId && !s.brandId && !s.supplierId
                );
                const { label, icon: Icon, color } = accountTypeLabels[accountType];

                if (!setting) return null;

                return (
                  <div key={accountType} className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          color === 'blue'
                            ? 'bg-blue-100'
                            : color === 'purple'
                            ? 'bg-purple-100'
                            : 'bg-safety-green-100'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            color === 'blue'
                              ? 'text-blue-600'
                              : color === 'purple'
                              ? 'text-purple-600'
                              : 'text-safety-green-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black text-lg">{label}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={setting.discountPercentage}
                              onChange={e =>
                                updateSetting(setting.id, 'discountPercentage', parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Min. Order ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={setting.minimumOrderAmount}
                              onChange={e =>
                                updateSetting(setting.id, 'minimumOrderAmount', parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={setting.isActive}
                                onChange={e => updateSetting(setting.id, 'isActive', e.target.checked)}
                                className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                          </div>
                        </div>
                        {accountType === 'GOVERNMENT' && (
                          <p className="text-xs text-gray-500 mt-2">
                            Note: Government users see special government prices instead of discounts on regular prices.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-1">How Discounts Work</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Personal Buyers:</strong> Get the discount percentage on regular prices</li>
              <li>• <strong>Volume Buyers:</strong> Get the discount percentage OR the Volume Buyer price, whichever is lower</li>
              <li>• <strong>Government:</strong> Use the Government price field on products (no percentage discount needed)</li>
            </ul>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-safety-green-600 hover:bg-safety-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
