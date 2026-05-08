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

    // Calculate total weight and build parcel from actual product dimensions
    let totalWeight = data.weight || 0;
    let parcel: ShippoParcel;
    // For oversized carts we ship as a multi-parcel shipment. parcels is the
    // authoritative array passed to Shippo when it has more than one entry;
    // otherwise we fall back to wrapping `parcel` in a single-element array.
    let parcels: ShippoParcel[] | null = null;

    if (data.cartItems && data.cartItems.length > 0) {
      const productIds = data.cartItems.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, weight: true, length: true, width: true, height: true, qtyPerPack: true }
      });

      // Many imported catalogs (3M, Grainger, etc.) record `Product.weight` as
      // the weight of the packaging unit (carton/case) rather than per
      // individual unit, while still exposing each unit on the product page.
      // Example: a 3M Wetordry sheet that weighs 0.006 lb individually but
      // ships as 300/carton has weight=1.832 in the DB. Without the divisor,
      // a 3,000-sheet order would weigh 5,490 lb instead of the real ~18 lb,
      // producing absurd carrier rates. We treat `qtyPerPack` as the implicit
      // divisor: per-unit shipping weight = weight / qtyPerPack.
      const productMap = new Map(products.map(p => {
        const rawWeight = Number(p.weight) || 1;
        const qtyPerPack = Math.max(1, Number(p.qtyPerPack) || 1);
        return [p.id, {
          weight: rawWeight / qtyPerPack,
          length: Number(p.length) || 0,
          width: Number(p.width) || 0,
          height: Number(p.height) || 0,
        }];
      }));

      // Calculate total weight using the per-unit weight.
      totalWeight = data.cartItems.reduce((sum: number, item: { productId: string; quantity: number }) => {
        const product = productMap.get(item.productId);
        const weight = product?.weight || 1;
        return sum + (weight * Number(item.quantity));
      }, 0);

      // Build parcel(s) from actual product dimensions.
      //
      // Important: we DO NOT multiply each item's box dimensions by its
      // quantity. Stacking 3,000 small units linearly would produce a parcel
      // hundreds of inches tall — Shippo refuses to rate it and falls back to
      // the flat-rate calculator. Real-world high-quantity orders ship as
      // multiple packages or pallets. Approach:
      //   • Sum total weight from per-unit weight × quantity.
      //   • Use one canonical box footprint = the largest single-unit dims.
      //   • If total weight exceeds what fits in one parcel (~70 lb), build
      //     a multi-parcel array (Shippo accepts up to 50 parcels/shipment),
      //     splitting weight evenly across parcels with the same dims.
      //   • If even multi-parcel can't fit (>50 × 70 lb = 3,500 lb), still
      //     send 50 parcels — Shippo's ground services accept up to 150 lb
      //     per parcel, so a higher per-parcel weight still rates.
      const PADDING_FACTOR = 1.15;
      const MAX_PARCEL_DIM_IN = 48;          // common carrier oversize threshold
      const MAX_WEIGHT_PER_PARCEL = 70;      // typical USPS / preferred-zone limit
      const HARD_PARCEL_WEIGHT_CAP = 150;    // most carriers' absolute single-parcel ceiling
      const MAX_PARCELS = 50;                // Shippo per-shipment limit

      const unitBoxes: Array<{ l: number; w: number; h: number }> = [];
      let totalUnits = 0;
      for (const item of data.cartItems) {
        const product = productMap.get(item.productId);
        const qty = Number(item.quantity) || 0;
        totalUnits += qty;
        if (product && product.length > 0 && product.width > 0 && product.height > 0) {
          unitBoxes.push({ l: product.length, w: product.width, h: product.height });
        }
      }

      // Pick a canonical single-unit dimension (largest in each axis, padded)
      let canonicalDim: { length: number; width: number; height: number } | null = null;
      if (unitBoxes.length > 0) {
        const maxLength = Math.max(...unitBoxes.map((b) => b.l));
        const maxWidth = Math.max(...unitBoxes.map((b) => b.w));
        const maxHeight = Math.max(...unitBoxes.map((b) => b.h));
        canonicalDim = {
          length: Math.min(MAX_PARCEL_DIM_IN, Math.ceil(maxLength * PADDING_FACTOR)),
          width: Math.min(MAX_PARCEL_DIM_IN, Math.ceil(maxWidth * PADDING_FACTOR)),
          height: Math.min(MAX_PARCEL_DIM_IN, Math.ceil(maxHeight * PADDING_FACTOR)),
        };
      }

      if (totalWeight <= MAX_WEIGHT_PER_PARCEL && canonicalDim) {
        // Fits comfortably in a single parcel.
        parcel = {
          ...canonicalDim,
          distance_unit: 'in',
          weight: Math.max(totalWeight, 0.5),
          mass_unit: 'lb',
        };
      } else if (totalWeight > MAX_WEIGHT_PER_PARCEL) {
        // Multi-parcel split. Try the standard 70 lb/parcel split first; if
        // that needs more parcels than Shippo allows, raise per-parcel weight
        // up to the carrier hard cap (150 lb). Above that, parcels are still
        // built — most ground services will reject extra-heavy ones, but at
        // least Shippo returns a quote we can fall back from.
        let numParcels = Math.ceil(totalWeight / MAX_WEIGHT_PER_PARCEL);
        if (numParcels > MAX_PARCELS) numParcels = MAX_PARCELS;
        const weightPerParcel = Math.min(HARD_PARCEL_WEIGHT_CAP, totalWeight / numParcels);
        const dim = canonicalDim || estimateParcel(weightPerParcel);
        parcels = Array.from({ length: numParcels }, () => ({
          length: (dim as any).length,
          width: (dim as any).width,
          height: (dim as any).height,
          distance_unit: 'in',
          weight: Math.max(weightPerParcel, 0.5),
          mass_unit: 'lb',
        }));
        parcel = parcels[0]; // keep `parcel` defined for downstream `weight` cap
      } else {
        // No usable dimensions and weight is light → estimate by weight.
        parcel = estimateParcel(totalWeight);
      }
    } else {
      // Ensure minimum weight
      totalWeight = Math.max(totalWeight, 0.5);

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
        parcel = estimateParcel(totalWeight);
      }
    }

    // Ensure minimum weight
    totalWeight = Math.max(totalWeight, 0.5);
    parcel.weight = Math.max(parcel.weight, 0.5);

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

    // Get rates from Shippo. Use the multi-parcel array if we built one,
    // otherwise wrap the single parcel.
    const parcelsToShip = parcels && parcels.length > 0 ? parcels : [parcel];
    if (parcelsToShip.length > 1) {
      console.log(`Shippo multi-parcel shipment: ${parcelsToShip.length} parcels @ ~${parcelsToShip[0].weight}lb each (totalWeight=${totalWeight}lb)`);
    }
    const { rates, error } = await getShippingRates(toAddress, parcelsToShip);

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
