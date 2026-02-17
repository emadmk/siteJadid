export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import {
  getShippingRates,
  estimateParcel,
  ShippoAddress,
  ShippoParcel,
  ShippingRate
} from '@/lib/services/shippo';
import { prisma } from '@/lib/prisma';

interface ShippingRateRequest {
  // Destination address
  toAddress: {
    name?: string;
    street1?: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    phone?: string;
  };
  // Package info - can provide weight/dimensions
  weight?: number; // Total weight in lbs
  length?: number;
  width?: number;
  height?: number;
  // Or cart items to calculate weight from
  cartItems?: Array<{
    productId: string;
    quantity: number;
  }>;
}

// POST /api/shipping/rates - Get shipping rates from Shippo
export async function POST(request: NextRequest) {
  try {
    const data: ShippingRateRequest = await request.json();

    // Validate required fields
    if (!data.toAddress) {
      return NextResponse.json(
        { error: 'Destination address is required' },
        { status: 400 }
      );
    }

    if (!data.toAddress.zipCode || !data.toAddress.city || !data.toAddress.state) {
      return NextResponse.json(
        { error: 'City, state, and ZIP code are required' },
        { status: 400 }
      );
    }

    // Calculate total weight
    let totalWeight = data.weight || 0;

    // If cart items provided, calculate weight from products
    if (data.cartItems && data.cartItems.length > 0) {
      const productIds = data.cartItems.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, weight: true }
      });

      const weightMap = new Map<string, number>(products.map(p => [p.id, Number(p.weight) || 0.5]));

      totalWeight = data.cartItems.reduce((sum: number, item: { productId: string; quantity: number }) => {
        const weight: number = weightMap.get(item.productId) || 0.5;
        return sum + (weight * Number(item.quantity));
      }, 0);
    }

    // Ensure minimum weight
    totalWeight = Math.max(totalWeight, 0.5);

    // Build parcel info
    let parcel: ShippoParcel;

    if (data.length && data.width && data.height) {
      parcel = {
        length: data.length,
        width: data.width,
        height: data.height,
        distance_unit: 'in',
        weight: totalWeight,
        mass_unit: 'lb',
      };
    } else {
      // Estimate parcel size based on weight
      parcel = estimateParcel(totalWeight);
    }

    // Build destination address for Shippo
    const toAddress: ShippoAddress = {
      name: data.toAddress.name || 'Customer',
      street1: data.toAddress.street1 || '', // Street address is optional for rate estimation
      street2: data.toAddress.street2,
      city: data.toAddress.city,
      state: data.toAddress.state,
      zip: data.toAddress.zipCode,
      country: data.toAddress.country || 'US',
      phone: data.toAddress.phone,
    };

    // Fix #15: Warn if street address is missing (rates will be estimated)
    if (!data.toAddress.street1) {
      console.warn('Shipping rates requested without street address - results may be estimated');
    }

    // Get rates from Shippo
    const { rates, error } = await getShippingRates(toAddress, [parcel]);

    if (error) {
      // If Shippo fails, return fallback rates
      console.warn('Shippo rate error, using fallback:', error);

      // Return fallback flat rates
      const fallbackRates: ShippingRate[] = await getFallbackRates(totalWeight);

      return NextResponse.json({
        rates: fallbackRates,
        warning: 'Using estimated rates. ' + error,
        fallback: true
      });
    }

    if (rates.length === 0) {
      // No rates from Shippo, return fallback
      const fallbackRates: ShippingRate[] = await getFallbackRates(totalWeight);

      return NextResponse.json({
        rates: fallbackRates,
        warning: 'No carrier rates available. Using estimated rates.',
        fallback: true
      });
    }

    return NextResponse.json({ rates, fallback: false });
  } catch (error: any) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates', details: error.message },
      { status: 500 }
    );
  }
}

async function getFallbackRates(totalWeight: number): Promise<ShippingRate[]> {
  // Try to get rates from DB settings
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['shipping.standardRate', 'shipping.expressRate', 'shipping.overnightRate'] },
      },
    });
    const settingsMap: Record<string, number> = {};
    settings.forEach(s => {
      settingsMap[s.key] = Number(s.value) || 0;
    });

    const groundCost = settingsMap['shipping.standardRate'] || (totalWeight > 20 ? 35 : totalWeight > 10 ? 25 : 15);
    const expressCost = settingsMap['shipping.expressRate'] || 29.99;
    const overnightCost = settingsMap['shipping.overnightRate'] || 49.99;

    return [
      {
        id: 'fallback_ground',
        carrier: 'Standard Shipping',
        carrierLogo: '',
        serviceName: 'Ground',
        serviceCode: 'GROUND',
        cost: groundCost,
        currency: 'USD',
        estimatedDays: 7,
        arrivesBy: null,
      },
      {
        id: 'fallback_express',
        carrier: 'Express Shipping',
        carrierLogo: '',
        serviceName: '2-Day Express',
        serviceCode: 'EXPRESS',
        cost: expressCost,
        currency: 'USD',
        estimatedDays: 3,
        arrivesBy: null,
      },
      {
        id: 'fallback_overnight',
        carrier: 'Priority Shipping',
        carrierLogo: '',
        serviceName: 'Overnight',
        serviceCode: 'OVERNIGHT',
        cost: overnightCost,
        currency: 'USD',
        estimatedDays: 1,
        arrivesBy: null,
      },
    ];
  } catch {
    // Hardcoded fallback if DB read fails
    const groundCost = totalWeight > 20 ? 35 : totalWeight > 10 ? 25 : 15;
    return [
      { id: 'fallback_ground', carrier: 'Standard Shipping', carrierLogo: '', serviceName: 'Ground', serviceCode: 'GROUND', cost: groundCost, currency: 'USD', estimatedDays: 7, arrivesBy: null },
      { id: 'fallback_express', carrier: 'Express Shipping', carrierLogo: '', serviceName: '2-Day Express', serviceCode: 'EXPRESS', cost: 29.99, currency: 'USD', estimatedDays: 3, arrivesBy: null },
      { id: 'fallback_overnight', carrier: 'Priority Shipping', carrierLogo: '', serviceName: 'Overnight', serviceCode: 'OVERNIGHT', cost: 49.99, currency: 'USD', estimatedDays: 1, arrivesBy: null },
    ];
  }
}
