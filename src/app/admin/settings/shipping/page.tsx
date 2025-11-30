'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShippingProvider {
  id?: string;
  name: string;
  carrier: string;
  apiKey: string;
  isActive: boolean;
}

export default function ShippingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<ShippingProvider[]>([]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/shipping-providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProvider = () => {
    setProviders([...providers, { name: '', carrier: 'USPS', apiKey: '', isActive: true }]);
  };

  const removeProvider = (index: number) => {
    setProviders(providers.filter((_, i) => i !== index));
  };

  const updateProvider = (index: number, field: keyof ShippingProvider, value: any) => {
    const updated = [...providers];
    updated[index] = { ...updated[index], [field]: value };
    setProviders(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shipping-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers }),
      });
      if (res.ok) {
        alert('Shipping providers saved successfully');
        fetchProviders();
      } else {
        alert('Failed to save providers');
      }
    } catch (error) {
      console.error('Error saving providers:', error);
      alert('Error saving providers');
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
        <h1 className="text-3xl font-bold">Shipping Providers</h1>
        <p className="text-gray-600 mt-1">Configure shipping carriers for real-time rates</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {providers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No shipping providers configured. Add one to get started.
          </div>
        ) : (
          providers.map((provider, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Provider #{index + 1}</h3>
                <button onClick={() => removeProvider(index)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    value={provider.name}
                    onChange={(e) => updateProvider(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Standard Shipping"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Carrier</label>
                  <select
                    value={provider.carrier}
                    onChange={(e) => updateProvider(index, 'carrier', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="USPS">USPS</option>
                    <option value="FEDEX">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="DHL">DHL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={provider.apiKey}
                  onChange={(e) => updateProvider(index, 'apiKey', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter carrier API key"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`active-${index}`}
                  checked={provider.isActive}
                  onChange={(e) => updateProvider(index, 'isActive', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor={`active-${index}`} className="text-sm">Active</label>
              </div>
            </div>
          ))
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button onClick={addProvider} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>
    </div>
  );
}
