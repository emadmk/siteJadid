export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Default settings structure
const DEFAULT_SETTINGS = {
  // Store settings
  'store.name': { value: 'SafetyPro Store', type: 'string', category: 'store' },
  'store.description': { value: 'Professional safety equipment and supplies', type: 'string', category: 'store' },
  'store.email': { value: 'info@safetypro.com', type: 'string', category: 'store' },
  'store.phone': { value: '+1 (555) 123-4567', type: 'string', category: 'store' },
  'store.address': { value: '', type: 'string', category: 'store' },
  'store.logo': { value: '', type: 'string', category: 'store' },

  // Email settings
  'email.orderConfirmation': { value: 'true', type: 'boolean', category: 'email' },
  'email.shippingUpdates': { value: 'true', type: 'boolean', category: 'email' },
  'email.lowStockAlerts': { value: 'true', type: 'boolean', category: 'email' },
  'email.marketingEmails': { value: 'false', type: 'boolean', category: 'email' },

  // Shipping settings
  'shipping.freeShippingEnabled': { value: 'false', type: 'boolean', category: 'shipping' },
  'shipping.freeThreshold': { value: '100', type: 'number', category: 'shipping' },
  'shipping.standardRate': { value: '9.99', type: 'number', category: 'shipping' },
  'shipping.expressRate': { value: '24.99', type: 'number', category: 'shipping' },
  'shipping.international': { value: 'true', type: 'boolean', category: 'shipping' },
  // Shippo Integration
  'shipping.shippoApiKey': { value: '', type: 'string', category: 'shipping' },
  'shipping.shippoTestMode': { value: 'true', type: 'boolean', category: 'shipping' },
  // Origin Address (Warehouse)
  'shipping.originName': { value: '', type: 'string', category: 'shipping' },
  'shipping.originStreet': { value: '', type: 'string', category: 'shipping' },
  'shipping.originCity': { value: '', type: 'string', category: 'shipping' },
  'shipping.originState': { value: '', type: 'string', category: 'shipping' },
  'shipping.originZip': { value: '', type: 'string', category: 'shipping' },
  'shipping.originCountry': { value: 'US', type: 'string', category: 'shipping' },
  'shipping.originPhone': { value: '', type: 'string', category: 'shipping' },
  // Shipping Rate Markup
  'shipping.markupFixedAmount': { value: '0', type: 'number', category: 'shipping' },
  'shipping.markupPercentage': { value: '0', type: 'number', category: 'shipping' },

  // Tax settings (basic)
  'tax.defaultRate': { value: '8.5', type: 'number', category: 'tax' },
  'tax.applyToShipping': { value: 'true', type: 'boolean', category: 'tax' },
  'tax.gsaExempt': { value: 'true', type: 'boolean', category: 'tax' },

  // Payment settings
  'payment.stripe': { value: 'true', type: 'boolean', category: 'payment' },
  'payment.stripePublishableKey': { value: '', type: 'string', category: 'payment' },
  'payment.stripeSecretKey': { value: '', type: 'string', category: 'payment' },
  'payment.stripeWebhookSecret': { value: '', type: 'string', category: 'payment' },
  'payment.paypal': { value: 'false', type: 'boolean', category: 'payment' },
  'payment.paypalClientId': { value: '', type: 'string', category: 'payment' },
  'payment.paypalClientSecret': { value: '', type: 'string', category: 'payment' },
  'payment.gsaSmartpay': { value: 'true', type: 'boolean', category: 'payment' },

  // Security settings
  'security.twoFactorAuth': { value: 'true', type: 'boolean', category: 'security' },
  'security.sessionTimeout': { value: '15', type: 'number', category: 'security' },
  'security.passwordExpiry': { value: '0', type: 'number', category: 'security' },
};

// GET /api/admin/settings - Get all settings or by category
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Fetch settings from database
    const dbSettings = await prisma.setting.findMany({
      where: category ? { category } : undefined,
    });

    // Create a map of existing settings
    const settingsMap: Record<string, any> = {};

    // First, add all defaults
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      if (!category || config.category === category) {
        settingsMap[key] = {
          key,
          value: config.value,
          type: config.type,
          category: config.category,
        };
      }
    }

    // Then override with database values
    for (const setting of dbSettings) {
      settingsMap[setting.key] = {
        key: setting.key,
        value: setting.value,
        type: setting.type,
        category: setting.category,
      };
    }

    // Convert to array and organize by category
    const settings = Object.values(settingsMap);

    // Group by category for easier frontend use
    const grouped: Record<string, Record<string, any>> = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      // Parse value based on type
      let parsedValue = setting.value;
      if (setting.type === 'boolean') {
        parsedValue = setting.value === 'true';
      } else if (setting.type === 'number') {
        parsedValue = parseFloat(setting.value);
      } else if (setting.type === 'json') {
        try {
          parsedValue = JSON.parse(setting.value);
        } catch {
          parsedValue = setting.value;
        }
      }
      const keyParts = setting.key.split('.');
      const shortKey = keyParts[keyParts.length - 1];
      grouped[setting.category][shortKey] = parsedValue;
    }

    // Mask sensitive values
    const sensitiveKeys = ['stripeSecretKey', 'stripeWebhookSecret', 'paypalClientSecret', 'shippoApiKey'];
    for (const category of Object.keys(grouped)) {
      for (const key of Object.keys(grouped[category])) {
        if (sensitiveKeys.includes(key) && typeof grouped[category][key] === 'string' && grouped[category][key]) {
          const val = grouped[category][key] as string;
          grouped[category][key] = val.length > 4 ? '****' + val.slice(-4) : '****';
        }
      }
    }

    return NextResponse.json({ settings: grouped, raw: settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Update settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { category, settings } = data;

    if (!category || !settings) {
      return NextResponse.json(
        { error: 'Category and settings are required' },
        { status: 400 }
      );
    }

    // Sensitive keys that are masked in GET responses — skip saving if value is still masked
    const sensitiveKeys = ['stripeSecretKey', 'stripeWebhookSecret', 'paypalClientSecret', 'shippoApiKey'];

    // Update each setting
    const updates: Promise<any>[] = [];
    for (const [key, value] of Object.entries(settings)) {
      const fullKey = `${category}.${key}`;
      const defaultConfig = DEFAULT_SETTINGS[fullKey as keyof typeof DEFAULT_SETTINGS];
      const type = defaultConfig?.type || 'string';

      // Convert value to string for storage
      let stringValue = String(value);
      if (type === 'json' && typeof value === 'object') {
        stringValue = JSON.stringify(value);
      }

      // Skip saving masked sensitive values (e.g. "****abcd") to avoid overwriting real keys
      if (sensitiveKeys.includes(key) && stringValue.startsWith('****')) {
        continue;
      }

      updates.push(
        prisma.setting.upsert({
          where: { key: fullKey },
          update: {
            value: stringValue,
            type,
            category,
          },
          create: {
            key: fullKey,
            value: stringValue,
            type,
            category,
          },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `${category} settings updated successfully`
    });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update a single setting
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { key, value, type = 'string', category = 'general' } = data;

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    // Convert value to string for storage
    let stringValue = String(value);
    if (type === 'json' && typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: stringValue, type, category },
      create: { key, value: stringValue, type, category },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting', details: error.message },
      { status: 500 }
    );
  }
}
