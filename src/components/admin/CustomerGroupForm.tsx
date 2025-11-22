'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountType, LoyaltyTier } from '@prisma/client';

export default function CustomerGroupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultDiscount: '0',
    accountTypes: [] as AccountType[],
    loyaltyTiers: [] as LoyaltyTier[],
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/customer-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          defaultDiscount: parseFloat(formData.defaultDiscount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer group');
      }

      setFormData({
        name: '',
        description: '',
        defaultDiscount: '0',
        accountTypes: [],
        loyaltyTiers: [],
        isActive: true,
      });

      router.refresh();
    } catch (error) {
      console.error('Error creating customer group:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to create customer group'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeToggle = (type: AccountType) => {
    setFormData((prev) => ({
      ...prev,
      accountTypes: prev.accountTypes.includes(type)
        ? prev.accountTypes.filter((t) => t !== type)
        : [...prev.accountTypes, type],
    }));
  };

  const handleLoyaltyTierToggle = (tier: LoyaltyTier) => {
    setFormData((prev) => ({
      ...prev,
      loyaltyTiers: prev.loyaltyTiers.includes(tier)
        ? prev.loyaltyTiers.filter((t) => t !== tier)
        : [...prev.loyaltyTiers, tier],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Group Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., GSA Customers, Wholesale, VIP"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Discount (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.defaultDiscount}
            onChange={(e) =>
              setFormData({ ...formData, defaultDiscount: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Optional description"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Types
          </label>
          <div className="space-y-2">
            {Object.values(AccountType).map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.accountTypes.includes(type)}
                  onChange={() => handleAccountTypeToggle(type)}
                  className="h-4 w-4 text-safety-green-600 focus:ring-safety-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {type.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loyalty Tiers
          </label>
          <div className="space-y-2">
            {Object.values(LoyaltyTier).map((tier) => (
              <label key={tier} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.loyaltyTiers.includes(tier)}
                  onChange={() => handleLoyaltyTierToggle(tier)}
                  className="h-4 w-4 text-safety-green-600 focus:ring-safety-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{tier}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 text-safety-green-600 focus:ring-safety-green-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Active (customers can immediately benefit from this group)
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Customer Group'}
        </button>
      </div>
    </form>
  );
}
