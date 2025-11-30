'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'resend',
    resend: {
      apiKey: '',
    },
    sendgrid: {
      apiKey: '',
    },
    ses: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
    },
    fromEmail: '',
    fromName: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/email-service');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/email-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Email settings saved successfully');
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
        <h1 className="text-3xl font-bold">Email Service</h1>
        <p className="text-gray-600 mt-1">Configure email delivery for transactional emails</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Email</label>
            <input
              type="email"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="noreply@yourstore.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">From Name</label>
            <input
              type="text"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Your Store Name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="resend">Resend</option>
            <option value="sendgrid">SendGrid</option>
            <option value="ses">Amazon SES</option>
          </select>
        </div>

        {settings.provider === 'resend' && (
          <div>
            <label className="block text-sm font-medium mb-2">Resend API Key</label>
            <input
              type="password"
              value={settings.resend.apiKey}
              onChange={(e) => setSettings({ ...settings, resend: { apiKey: e.target.value } })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="re_..."
            />
          </div>
        )}

        {settings.provider === 'sendgrid' && (
          <div>
            <label className="block text-sm font-medium mb-2">SendGrid API Key</label>
            <input
              type="password"
              value={settings.sendgrid.apiKey}
              onChange={(e) => setSettings({ ...settings, sendgrid: { apiKey: e.target.value } })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="SG...."
            />
          </div>
        )}

        {settings.provider === 'ses' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">AWS Access Key ID</label>
              <input
                type="text"
                value={settings.ses.accessKeyId}
                onChange={(e) => setSettings({ ...settings, ses: { ...settings.ses, accessKeyId: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="AKIA..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">AWS Secret Access Key</label>
              <input
                type="password"
                value={settings.ses.secretAccessKey}
                onChange={(e) => setSettings({ ...settings, ses: { ...settings.ses, secretAccessKey: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Secret key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">AWS Region</label>
              <select
                value={settings.ses.region}
                onChange={(e) => setSettings({ ...settings, ses: { ...settings.ses, region: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">EU (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>
          </div>
        )}

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
