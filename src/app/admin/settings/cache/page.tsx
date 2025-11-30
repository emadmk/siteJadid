'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CacheSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [settings, setSettings] = useState({
    isActive: false,
    host: 'localhost',
    port: 6379,
    password: '',
    database: 0,
    keyPrefix: 'ecommerce:',
    ttl: 3600,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/redis-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching cache settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/redis-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Cache settings saved successfully');
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

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data?')) return;

    setClearing(true);
    try {
      const res = await fetch('/api/admin/redis-settings/clear', {
        method: 'POST',
      });
      if (res.ok) {
        alert('Cache cleared successfully');
      } else {
        alert('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache');
    } finally {
      setClearing(false);
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
        <h1 className="text-3xl font-bold">Redis Cache</h1>
        <p className="text-gray-600 mt-1">Configure Redis caching for improved performance</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Enable Redis Cache</h3>
            <p className="text-sm text-gray-500">Use Redis for caching database queries and API responses</p>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Host</label>
            <input
              type="text"
              value={settings.host}
              onChange={(e) => setSettings({ ...settings, host: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Port</label>
            <input
              type="number"
              value={settings.port}
              onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) || 6379 })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="6379"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password (optional)</label>
          <input
            type="password"
            value={settings.password}
            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Leave empty if no password"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Database Number</label>
            <input
              type="number"
              min="0"
              max="15"
              value={settings.database}
              onChange={(e) => setSettings({ ...settings, database: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default TTL (seconds)</label>
            <input
              type="number"
              value={settings.ttl}
              onChange={(e) => setSettings({ ...settings, ttl: parseInt(e.target.value) || 3600 })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="3600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Key Prefix</label>
          <input
            type="text"
            value={settings.keyPrefix}
            onChange={(e) => setSettings({ ...settings, keyPrefix: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="ecommerce:"
          />
          <p className="text-xs text-gray-500 mt-1">Prefix for all cache keys to avoid collisions</p>
        </div>

        <div className="pt-4 border-t flex justify-between">
          <Button onClick={handleClearCache} disabled={clearing} variant="outline" className="text-red-600 border-red-300">
            <Trash2 className="w-4 h-4 mr-2" />
            {clearing ? 'Clearing...' : 'Clear All Cache'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
