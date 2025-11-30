import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TaxCalculationRequest {
  toAddress: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  fromAddress?: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  amount: number;
  shipping: number;
  lineItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    taxCode?: string;
  }>;
}

// POST /api/tax/calculate
export async function POST(request: NextRequest) {
  try {
    const data: TaxCalculationRequest = await request.json();

    // Validate required fields
    if (!data.toAddress || !data.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: toAddress and amount' },
        { status: 400 }
      );
    }

    // Get tax settings
    const settings = await prisma.taxSettings.findFirst();

    if (!settings || !settings.enableTax) {
      return NextResponse.json({
        rate: 0,
        amount: 0,
        taxable: data.amount,
        shipping: data.shipping || 0,
        breakdown: {
          stateTax: 0,
          countyTax: 0,
          cityTax: 0,
          specialTax: 0,
        },
      });
    }

    // If using TaxJar
    if (settings.provider === 'taxjar' && settings.apiKey) {
      try {
        const taxJarResponse = await calculateWithTaxJar(
          settings.apiKey,
          data,
          settings.testMode
        );
        return NextResponse.json(taxJarResponse);
      } catch (error: any) {
        console.error('TaxJar calculation failed:', error);
        // Fall back to manual calculation
      }
    }

    // Manual calculation
    const manualTax = await calculateManualTax(data, settings);
    return NextResponse.json(manualTax);
  } catch (error: any) {
    console.error('Error calculating tax:', error);
    return NextResponse.json(
      { error: 'Failed to calculate tax', details: error.message },
      { status: 500 }
    );
  }
}

async function calculateWithTaxJar(
  apiKey: string,
  data: TaxCalculationRequest,
  testMode: boolean
) {
  const baseUrl = testMode
    ? 'https://api.sandbox.taxjar.com/v2'
    : 'https://api.taxjar.com/v2';

  const response = await fetch(`${baseUrl}/taxes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_country: data.fromAddress?.country || 'US',
      from_zip: data.fromAddress?.zipCode,
      from_state: data.fromAddress?.state,
      from_city: data.fromAddress?.city,
      to_country: data.toAddress.country,
      to_zip: data.toAddress.zipCode,
      to_state: data.toAddress.state,
      to_city: data.toAddress.city,
      amount: data.amount,
      shipping: data.shipping || 0,
      line_items: data.lineItems?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        product_tax_code: item.taxCode,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'TaxJar API error');
  }

  const result = await response.json();
  const tax = result.tax;

  return {
    rate: tax.rate,
    amount: tax.amount_to_collect,
    taxable: tax.taxable_amount,
    shipping: tax.shipping,
    breakdown: {
      stateTax: tax.breakdown?.state_tax_rate || 0,
      countyTax: tax.breakdown?.county_tax_rate || 0,
      cityTax: tax.breakdown?.city_tax_rate || 0,
      specialTax: tax.breakdown?.special_tax_rate || 0,
    },
    hasNexus: tax.has_nexus,
    freightTaxable: tax.freight_taxable,
  };
}

async function calculateManualTax(
  data: TaxCalculationRequest,
  settings: any
) {
  // Check for nexus in destination state
  const hasNexus = settings.enableNexus
    ? settings.nexusStates.includes(data.toAddress.state)
    : true;

  if (!hasNexus) {
    return {
      rate: 0,
      amount: 0,
      taxable: data.amount,
      shipping: data.shipping || 0,
      breakdown: {
        stateTax: 0,
        countyTax: 0,
        cityTax: 0,
        specialTax: 0,
      },
    };
  }

  // Get state tax nexus settings
  const nexus = await prisma.taxNexus.findUnique({
    where: { state: data.toAddress.state },
  });

  const taxRate = nexus?.stateTaxRate || settings.defaultTaxRate;
  const taxableAmount = data.amount + (settings.taxShipping ? (data.shipping || 0) : 0);
  const taxAmount = taxableAmount * Number(taxRate);

  return {
    rate: Number(taxRate),
    amount: Number(taxAmount.toFixed(2)),
    taxable: taxableAmount,
    shipping: data.shipping || 0,
    breakdown: {
      stateTax: Number(taxRate),
      countyTax: 0,
      cityTax: 0,
      specialTax: 0,
    },
  };
}
