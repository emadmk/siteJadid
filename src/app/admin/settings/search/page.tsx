'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    isActive: false,
    appId: '',
    apiKey: '',
    searchApiKey: '',
    indexName: 'products',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/algolia-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching search settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/algolia-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Search settings saved successfully');
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
        <h1 className="text-3xl font-bold">Advanced Search (Algolia)</h1>
        <p className="text-gray-600 mt-1">Configure Algolia for fast product search</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Enable Algolia Search</h3>
            <p className="text-sm text-gray-500">Use Algolia for product search instead of database search</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isActive}
              onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Application ID</label>
          <input
            type="text"
            value={settings.appId}
            onChange={(e) => setSettings({ ...settings, appId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Your Algolia App ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Admin API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Admin API Key (for indexing)"
          />
          <p className="text-xs text-gray-500 mt-1">Used server-side for indexing products</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Search-Only API Key</label>
          <input
            type="text"
            value={settings.searchApiKey}
            onChange={(e) => setSettings({ ...settings, searchApiKey: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Search-only API Key"
          />
          <p className="text-xs text-gray-500 mt-1">Used client-side for searching (safe to expose)</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Index Name</label>
          <input
            type="text"
            value={settings.indexName}
            onChange={(e) => setSettings({ ...settings, indexName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="products"
          />
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
