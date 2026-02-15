/**
 * Shippo Shipping Integration Service
 *
 * Provides unified shipping rate calculation, label creation, and tracking
 * using the Shippo API.
 */

import { prisma } from '@/lib/prisma';

// Apply shipping markup from database
async function applyShippingMarkup(rates: ShippingRate[]): Promise<ShippingRate[]> {
  try {
    const markupSettings = await prisma.shippingService.findMany({
      select: { markupType: true, markupValue: true },
      take: 1,
    });

    if (markupSettings.length === 0) return rates;

    const { markupType, markupValue } = markupSettings[0];
    const markup = Number(markupValue);

    if (!markup || markup === 0) return rates;

    return rates.map(rate => ({
      ...rate,
      cost: markupType === 'percentage'
        ? Math.round((rate.cost * (1 + markup / 100)) * 100) / 100
        : Math.round((rate.cost + markup) * 100) / 100,
    }));
  } catch {
    return rates; // If markup lookup fails, return original rates
  }
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

// Helper to get Shippo API key from database settings
async function getShippoApiKey(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'shipping.shippoApiKey' }
  });
  return setting?.value || null;
}

// Helper to check if in test mode
async function isTestMode(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'shipping.shippoTestMode' }
  });
  return setting?.value === 'true';
}

// Helper to get origin/warehouse address from settings
async function getOriginAddress(): Promise<ShippoAddress | null> {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'shipping.originName',
          'shipping.originStreet',
          'shipping.originCity',
          'shipping.originState',
          'shipping.originZip',
          'shipping.originCountry',
          'shipping.originPhone',
        ]
      }
    }
  });

  const settingsMap: Record<string, string> = {};
  settings.forEach(s => {
    const shortKey = s.key.replace('shipping.', '');
    settingsMap[shortKey] = s.value;
  });

  // Check if we have required fields
  if (!settingsMap.originStreet || !settingsMap.originCity || !settingsMap.originState || !settingsMap.originZip) {
    return null;
  }

  return {
    name: settingsMap.originName || 'Warehouse',
    street1: settingsMap.originStreet,
    city: settingsMap.originCity,
    state: settingsMap.originState,
    zip: settingsMap.originZip,
    country: settingsMap.originCountry || 'US',
    phone: settingsMap.originPhone,
  };
}

/**
 * Create a Shippo shipment and get rates
 */
export async function getShippingRates(
  toAddress: ShippoAddress,
  parcels: ShippoParcel[],
  fromAddress?: ShippoAddress
): Promise<{ rates: ShippingRate[]; error?: string }> {
  const apiKey = await getShippoApiKey();
  const testMode = await isTestMode();
  if (testMode) {
    console.log('Shippo: Running in test mode');
  }

  if (!apiKey) {
    return { rates: [], error: 'Shippo API key not configured' };
  }

  // Get origin address from settings if not provided
  const origin = fromAddress || await getOriginAddress();

  if (!origin) {
    return { rates: [], error: 'Origin address not configured. Please set warehouse address in admin settings.' };
  }

  try {
    // Create shipment to get rates
    const response = await fetch(`${SHIPPO_API_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_from: origin,
        address_to: toAddress,
        parcels: parcels,
        async: false, // Wait for rates synchronously
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Shippo API error:', errorData);
      return {
        rates: [],
        error: errorData.detail || errorData.error || 'Failed to get shipping rates from Shippo'
      };
    }

    const shipment: ShippoShipment = await response.json();

    // Convert Shippo rates to our format
    const rates: ShippingRate[] = shipment.rates
      .filter(rate => rate.amount) // Only include rates with prices
      .map(rate => ({
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

    // Fix #5: Apply shipping markup
    const markedUpRates = await applyShippingMarkup(rates);
    return { rates: markedUpRates };
  } catch (error: any) {
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
