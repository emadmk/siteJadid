/**
 * Shippo Shipping Integration Service
 *
 * Provides unified shipping rate calculation, label creation, and tracking
 * using the Shippo API.
 */

import { prisma } from '@/lib/prisma';

// ============ In-Memory Settings Cache ============
// Cache shipping settings for 5 minutes to avoid repeated DB queries
interface CachedSettings {
  apiKey: string | null;
  testMode: boolean;
  origin: ShippoAddress | null;
  markupType: string | null;
  markupValue: number;
  cachedAt: number;
}

let settingsCache: CachedSettings | null = null;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rates cache: key = zip code, value = { rates, cachedAt }
const ratesCache = new Map<string, { rates: ShippingRate[]; cachedAt: number }>();
const RATES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getCachedSettings(): Promise<CachedSettings> {
  if (settingsCache && (Date.now() - settingsCache.cachedAt) < SETTINGS_CACHE_TTL) {
    return settingsCache;
  }

  // Batch ALL settings + markup into 2 queries instead of 6
  const [allSettings, markupSettings] = await Promise.all([
    prisma.setting.findMany({
      where: {
        key: {
          in: [
            'shipping.shippoApiKey',
            'shipping.shippoTestMode',
            'shipping.originName',
            'shipping.originStreet',
            'shipping.originCity',
            'shipping.originState',
            'shipping.originZip',
            'shipping.originCountry',
            'shipping.originPhone',
          ],
        },
      },
    }),
    prisma.shippingService.findMany({
      select: { markupType: true, markupValue: true },
      take: 1,
    }),
  ]);

  const map: Record<string, string> = {};
  allSettings.forEach((s) => {
    map[s.key] = s.value;
  });

  const hasOrigin =
    map['shipping.originStreet'] &&
    map['shipping.originCity'] &&
    map['shipping.originState'] &&
    map['shipping.originZip'];

  settingsCache = {
    apiKey: map['shipping.shippoApiKey'] || null,
    testMode: map['shipping.shippoTestMode'] === 'true',
    origin: hasOrigin
      ? {
          name: map['shipping.originName'] || 'Warehouse',
          street1: map['shipping.originStreet'],
          city: map['shipping.originCity'],
          state: map['shipping.originState'],
          zip: map['shipping.originZip'],
          country: map['shipping.originCountry'] || 'US',
          phone: map['shipping.originPhone'],
        }
      : null,
    markupType: markupSettings.length > 0 ? (markupSettings[0].markupType as string) : null,
    markupValue: markupSettings.length > 0 ? Number(markupSettings[0].markupValue) : 0,
    cachedAt: Date.now(),
  };

  return settingsCache;
}

// Apply shipping markup using cached settings
function applyShippingMarkupSync(rates: ShippingRate[], markupType: string | null, markupValue: number): ShippingRate[] {
  if (!markupType || !markupValue || markupValue === 0) return rates;

  return rates.map((rate) => ({
    ...rate,
    cost:
      markupType === 'percentage'
        ? Math.round(rate.cost * (1 + markupValue / 100) * 100) / 100
        : Math.round((rate.cost + markupValue) * 100) / 100,
  }));
}

// Shippo API Base URLs
const SHIPPO_API_URL = 'https://api.goshippo.com';

export interface ShippoAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippoParcel {
  length: number;
  width: number;
  height: number;
  distance_unit: 'in' | 'cm';
  weight: number;
  mass_unit: 'lb' | 'kg';
}

export interface ShippoRate {
  object_id: string;
  provider: string;
  provider_image_75: string;
  provider_image_200: string;
  servicelevel: {
    name: string;
    token: string;
    terms?: string;
  };
  amount: string;
  currency: string;
  estimated_days: number;
  arrives_by?: string;
  duration_terms?: string;
  carrier_account: string;
  zone?: string;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  carrierLogo: string;
  serviceName: string;
  serviceCode: string;
  cost: number;
  currency: string;
  estimatedDays: number | null;
  arrivesBy: string | null;
}

export interface ShippoShipment {
  object_id: string;
  status: string;
  rates: ShippoRate[];
}

export interface ShippoTransaction {
  object_id: string;
  status: string;
  tracking_number: string;
  tracking_url_provider: string;
  label_url: string;
  commercial_invoice_url?: string;
  rate: string;
}

// Legacy helpers kept for non-rate functions (label, tracking, etc.)
async function getShippoApiKey(): Promise<string | null> {
  const cached = await getCachedSettings();
  return cached.apiKey;
}

/**
 * Create a Shippo shipment and get rates
 * Uses caching for settings (5min) and rates by ZIP (30min)
 * Includes 8-second timeout for Shippo API
 */
export async function getShippingRates(
  toAddress: ShippoAddress,
  parcels: ShippoParcel[],
  fromAddress?: ShippoAddress
): Promise<{ rates: ShippingRate[]; error?: string; cached?: boolean }> {
  // Load all settings in one batched call (cached for 5 min)
  const settings = await getCachedSettings();

  if (settings.testMode) {
    console.log('Shippo: Running in test mode');
  }

  if (!settings.apiKey) {
    return { rates: [], error: 'Shippo API key not configured' };
  }

  const origin = fromAddress || settings.origin;

  if (!origin) {
    return { rates: [], error: 'Origin address not configured. Please set warehouse address in admin settings.' };
  }

  // Check rates cache by destination ZIP + parcel weight
  const cacheKey = `${toAddress.zip}_${toAddress.state}_${parcels.map(p => p.weight).join('-')}`;
  const cachedRates = ratesCache.get(cacheKey);
  if (cachedRates && (Date.now() - cachedRates.cachedAt) < RATES_CACHE_TTL) {
    return { rates: cachedRates.rates, cached: true };
  }

  try {
    // Create shipment to get rates - with 8 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${SHIPPO_API_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_from: origin,
        address_to: toAddress,
        parcels: parcels,
        async: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Shippo API error:', errorData);
      return {
        rates: [],
        error: errorData.detail || errorData.error || 'Failed to get shipping rates from Shippo',
      };
    }

    const shipment: ShippoShipment = await response.json();

    // Convert Shippo rates to our format
    const rates: ShippingRate[] = shipment.rates
      .filter((rate) => rate.amount)
      .map((rate) => ({
        id: rate.object_id,
        carrier: rate.provider,
        carrierLogo: rate.provider_image_75,
        serviceName: rate.servicelevel.name,
        serviceCode: rate.servicelevel.token,
        cost: parseFloat(rate.amount),
        currency: rate.currency,
        estimatedDays: rate.estimated_days || null,
        arrivesBy: rate.arrives_by || null,
      }))
      .sort((a, b) => a.cost - b.cost);

    // Apply shipping markup using cached settings (no extra DB call)
    const markedUpRates = applyShippingMarkupSync(rates, settings.markupType, settings.markupValue);

    // Cache these rates for 30 minutes
    ratesCache.set(cacheKey, { rates: markedUpRates, cachedAt: Date.now() });

    return { rates: markedUpRates };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Shippo API timeout after 8 seconds');
      return { rates: [], error: 'Shipping rate calculation timed out. Using estimated rates.' };
    }
    console.error('Shippo service error:', error);
    return { rates: [], error: error.message || 'Failed to connect to Shippo' };
  }
}

/**
 * Purchase a shipping label using a rate ID
 */
export async function purchaseLabel(rateId: string): Promise<{
  success: boolean;
  transaction?: ShippoTransaction;
  error?: string;
}> {
  const apiKey = await getShippoApiKey();

  if (!apiKey) {
    return { success: false, error: 'Shippo API key not configured' };
  }

  try {
    const response = await fetch(`${SHIPPO_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: rateId,
        label_file_type: 'PDF',
        async: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Failed to purchase shipping label'
      };
    }

    const transaction: ShippoTransaction = await response.json();

    if (transaction.status !== 'SUCCESS') {
      return {
        success: false,
        error: `Label creation failed: ${transaction.status}`
      };
    }

    return { success: true, transaction };
  } catch (error: any) {
    console.error('Shippo label purchase error:', error);
    return { success: false, error: error.message || 'Failed to purchase label' };
  }
}

/**
 * Get tracking information for a shipment
 */
export async function getTracking(carrier: string, trackingNumber: string): Promise<{
  tracking?: any;
  error?: string;
}> {
  const apiKey = await getShippoApiKey();

  if (!apiKey) {
    return { error: 'Shippo API key not configured' };
  }

  try {
    const response = await fetch(
      `${SHIPPO_API_URL}/tracks/${carrier}/${trackingNumber}`,
      {
        headers: {
          'Authorization': `ShippoToken ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.detail || 'Failed to get tracking info' };
    }

    const tracking = await response.json();
    return { tracking };
  } catch (error: any) {
    console.error('Shippo tracking error:', error);
    return { error: error.message || 'Failed to get tracking' };
  }
}

/**
 * Validate an address using Shippo
 */
export async function validateAddress(address: ShippoAddress): Promise<{
  valid: boolean;
  suggestions?: ShippoAddress[];
  error?: string;
}> {
  const apiKey = await getShippoApiKey();

  if (!apiKey) {
    return { valid: false, error: 'Shippo API key not configured' };
  }

  try {
    const response = await fetch(`${SHIPPO_API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...address,
        validate: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { valid: false, error: errorData.detail || 'Address validation failed' };
    }

    const result = await response.json();
    return {
      valid: result.validation_results?.is_valid || false,
      suggestions: result.validation_results?.suggested_address
        ? [result.validation_results.suggested_address]
        : undefined
    };
  } catch (error: any) {
    console.error('Shippo address validation error:', error);
    return { valid: false, error: error.message || 'Address validation failed' };
  }
}

/**
 * Test Shippo API key connection
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const apiKey = await getShippoApiKey();

  if (!apiKey) {
    return { success: false, error: 'Shippo API key not configured' };
  }

  try {
    const response = await fetch(`${SHIPPO_API_URL}/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Invalid API key' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to connect to Shippo' };
  }
}

/**
 * Calculate package dimensions based on product weights
 * This is a simple estimation - in production you'd have actual package data
 */
export function estimateParcel(totalWeight: number): ShippoParcel {
  // Estimate box size based on weight
  // These are rough estimates - adjust based on your products
  let length = 10;
  let width = 8;
  let height = 6;

  if (totalWeight > 20) {
    length = 24;
    width = 18;
    height = 12;
  } else if (totalWeight > 10) {
    length = 18;
    width = 14;
    height = 10;
  } else if (totalWeight > 5) {
    length = 14;
    width = 10;
    height = 8;
  }

  return {
    length,
    width,
    height,
    distance_unit: 'in',
    weight: Math.max(totalWeight, 0.1), // Minimum 0.1 lb
    mass_unit: 'lb',
  };
}
