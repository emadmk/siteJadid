'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Shield,
  User,
  Plus,
  Trash2,
  FolderTree,
  Building2,
  Truck,
  Warehouse,
  Layers,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

type TabType = 'global' | 'category' | 'brand' | 'supplier' | 'warehouse';

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
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
}

interface SelectOption {
  id: string;
  name: string;
}

const accountTypeLabels = {
  PERSONAL: { label: 'Personal Buyers', icon: User, color: 'blue' },
  VOLUME_BUYER: { label: 'Volume Buyers', icon: Users, color: 'purple' },
  GOVERNMENT: { label: 'Government', icon: Shield, color: 'green' },
};

const tabs: { key: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'global', label: 'Global', icon: Layers },
  { key: 'category', label: 'Categories', icon: FolderTree },
  { key: 'brand', label: 'Brands', icon: Building2 },
  { key: 'supplier', label: 'Suppliers', icon: Truck },
  { key: 'warehouse', label: 'Warehouses', icon: Warehouse },
];

export default function DiscountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [settings, setSettings] = useState<DiscountSetting[]>([]);

  // Options for dropdowns
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);

  // New discount form
  const [newDiscount, setNewDiscount] = useState({
    accountType: 'PERSONAL' as 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT',
    discountPercentage: 0,
    minimumOrderAmount: 0,
    targetId: '',
  });

  useEffect(() => {
    fetchSettings();
    fetchOptions();
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

  const fetchOptions = async () => {
    try {
      const [catRes, brandRes, supplierRes, warehouseRes] = await Promise.all([
        fetch('/api/admin/categories?simple=true'),
        fetch('/api/admin/brands'),
        fetch('/api/admin/suppliers'),
        fetch('/api/admin/warehouses'),
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || data || []);
      }
      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrands(data.brands || data || []);
      }
      if (supplierRes.ok) {
        const data = await supplierRes.json();
        setSuppliers(data.suppliers || data || []);
      }
      if (warehouseRes.ok) {
        const data = await warehouseRes.json();
        setWarehouses(data.warehouses || data || []);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
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

  const deleteSetting = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/discount-settings/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Discount deleted');
        setSettings(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error('Failed to delete discount');
      }
    } catch (error) {
      toast.error('Error deleting discount');
    }
  };

  const addNewDiscount = async () => {
    if (!newDiscount.targetId && activeTab !== 'global') {
      toast.error(`Please select a ${activeTab}`);
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        accountType: newDiscount.accountType,
        discountPercentage: newDiscount.discountPercentage,
        minimumOrderAmount: newDiscount.minimumOrderAmount,
        isActive: true,
      };

      if (activeTab === 'category') body.categoryId = newDiscount.targetId;
      if (activeTab === 'brand') body.brandId = newDiscount.targetId;
      if (activeTab === 'supplier') body.supplierId = newDiscount.targetId;
      if (activeTab === 'warehouse') body.warehouseId = newDiscount.targetId;

      const res = await fetch('/api/admin/discount-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Discount added');
        fetchSettings();
        setNewDiscount({
          accountType: 'PERSONAL',
          discountPercentage: 0,
          minimumOrderAmount: 0,
          targetId: '',
        });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add discount');
      }
    } catch (error) {
      toast.error('Error adding discount');
    } finally {
      setSaving(false);
    }
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

  // Filter settings based on active tab
  const getFilteredSettings = () => {
    switch (activeTab) {
      case 'global':
        return settings.filter(
          s => !s.categoryId && !s.brandId && !s.supplierId && !s.warehouseId
        );
      case 'category':
        return settings.filter(s => s.categoryId);
      case 'brand':
        return settings.filter(s => s.brandId);
      case 'supplier':
        return settings.filter(s => s.supplierId);
      case 'warehouse':
        return settings.filter(s => s.warehouseId);
      default:
        return [];
    }
  };

  const filteredSettings = getFilteredSettings();

  const getTargetOptions = (): SelectOption[] => {
    switch (activeTab) {
      case 'category':
        return categories;
      case 'brand':
        return brands;
      case 'supplier':
        return suppliers;
      case 'warehouse':
        return warehouses;
      default:
        return [];
    }
  };

  const getTargetName = (setting: DiscountSetting): string => {
    if (setting.category) return setting.category.name;
    if (setting.brand) return setting.brand.name;
    if (setting.supplier) return setting.supplier.name;
    if (setting.warehouse) return setting.warehouse.name;
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-safety-green-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin/marketing" className="flex items-center text-gray-600 hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketing
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Percent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">User Type Discounts</h1>
            <p className="text-gray-600 mt-1">Configure discount percentages for each user type and scope</p>
          </div>
        </div>
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
          {/* Tabs */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="flex border-b">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-safety-green-50 text-safety-green-700 border-b-2 border-safety-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Tab Content */}
              {activeTab === 'global' ? (
                // Global Settings
                <div className="divide-y">
                  {(['PERSONAL', 'VOLUME_BUYER', 'GOVERNMENT'] as const).map(accountType => {
                    const setting = filteredSettings.find(s => s.accountType === accountType);
                    const { label, icon: Icon, color } = accountTypeLabels[accountType];

                    if (!setting) return null;

                    return (
                      <div key={accountType} className="py-6 first:pt-0 last:pb-0">
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
              ) : (
                // Category/Brand/Supplier/Warehouse Settings
                <div className="space-y-6">
                  {/* Add New */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-black mb-4">Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Discount</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                        <select
                          value={newDiscount.accountType}
                          onChange={e => setNewDiscount(prev => ({ ...prev, accountType: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                        >
                          <option value="PERSONAL">Personal</option>
                          <option value="VOLUME_BUYER">Volume Buyer</option>
                          <option value="GOVERNMENT">Government</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </label>
                        <select
                          value={newDiscount.targetId}
                          onChange={e => setNewDiscount(prev => ({ ...prev, targetId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                        >
                          <option value="">Select...</option>
                          {getTargetOptions().map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={newDiscount.discountPercentage}
                          onChange={e => setNewDiscount(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newDiscount.minimumOrderAmount}
                          onChange={e => setNewDiscount(prev => ({ ...prev, minimumOrderAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={addNewDiscount}
                          disabled={saving}
                          className="w-full bg-safety-green-600 hover:bg-safety-green-700"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Existing discounts */}
                  {filteredSettings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No {activeTab} discounts configured yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">
                              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">User Type</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Discount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Min. Order</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSettings.map(setting => {
                            const { label, icon: Icon, color } = accountTypeLabels[setting.accountType];
                            return (
                              <tr key={setting.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{getTargetName(setting)}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${
                                      color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-safety-green-600'
                                    }`} />
                                    <span>{label}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={setting.discountPercentage}
                                    onChange={e => updateSetting(setting.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-safety-green-500"
                                  />
                                  <span className="ml-1">%</span>
                                </td>
                                <td className="py-3 px-4">
                                  $<input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={setting.minimumOrderAmount}
                                    onChange={e => updateSetting(setting.id, 'minimumOrderAmount', parseFloat(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-safety-green-500 ml-1"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={setting.isActive}
                                      onChange={e => updateSetting(setting.id, 'isActive', e.target.checked)}
                                      className="w-4 h-4 text-safety-green-600 rounded focus:ring-safety-green-500"
                                    />
                                    <span className={`text-sm ${setting.isActive ? 'text-safety-green-600' : 'text-gray-400'}`}>
                                      {setting.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </label>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => deleteSetting(setting.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-1">How Discounts Work</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Global Discounts:</strong> Apply to all products for the selected user type</li>
              <li>• <strong>Category/Brand/Supplier/Warehouse:</strong> Override global discounts for specific products</li>
              <li>• <strong>Priority:</strong> More specific discounts (category/brand) take precedence over global</li>
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
