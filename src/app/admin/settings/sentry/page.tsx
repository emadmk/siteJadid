'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SentrySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    isActive: false,
    dsn: '',
    environment: 'production',
    tracesSampleRate: 0.1,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/sentry-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching sentry settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sentry-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Sentry settings saved successfully');
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
        <h1 className="text-3xl font-bold">Error Tracking (Sentry)</h1>
        <p className="text-gray-600 mt-1">Configure Sentry for error monitoring and performance tracking</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Enable Sentry</h3>
            <p className="text-sm text-gray-500">Track errors and performance issues</p>
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
          <label className="block text-sm font-medium mb-2">Sentry DSN</label>
          <input
            type="text"
            value={settings.dsn}
            onChange={(e) => setSettings({ ...settings, dsn: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://xxx@xxx.ingest.sentry.io/xxx"
          />
          <p className="text-xs text-gray-500 mt-1">Found in your Sentry project settings</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Environment</label>
          <select
            value={settings.environment}
            onChange={(e) => setSettings({ ...settings, environment: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Traces Sample Rate</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={settings.tracesSampleRate}
            onChange={(e) => setSettings({ ...settings, tracesSampleRate: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Percentage of transactions to capture (0-1). Use 0.1 for 10%.</p>
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
