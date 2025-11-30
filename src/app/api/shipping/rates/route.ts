import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ShippingRateRequest {
  fromAddress: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  toAddress: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  package: {
    weight: number; // pounds
    length: number; // inches
    width: number;
    height: number;
  };
  value?: number; // For insurance
}

// POST /api/shipping/rates
export async function POST(request: NextRequest) {
  try {
    const data: ShippingRateRequest = await request.json();

    // Validate required fields
    if (!data.fromAddress || !data.toAddress || !data.package) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get active shipping providers
    const providers = await prisma.shippingProviderSettings.findMany({
      where: { isActive: true },
      include: { services: { where: { isActive: true } } },
    });

    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'No shipping providers configured' },
        { status: 404 }
      );
    }

    const allRates: any[] = [];

    // Get rates from each provider
    for (const provider of providers) {
      try {
        let rates: any[] = [];

        switch (provider.provider) {
          case 'USPS':
            rates = await getUSPSRates(provider, data);
            break;
          case 'FEDEX':
            rates = await getFedExRates(provider, data);
            break;
          case 'UPS':
            rates = await getUPSRates(provider, data);
            break;
          default:
            continue;
        }

        // Apply markup
        rates = rates.map((rate) => ({
          ...rate,
          originalCost: rate.cost,
          cost: applyMarkup(rate.cost, provider.services.find(s => s.serviceCode === rate.serviceCode)),
        }));

        allRates.push(...rates);
      } catch (error) {
        console.error(`Error fetching rates from ${provider.provider}:`, error);
        // Continue with other providers
      }
    }

    if (allRates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping rates available' },
        { status: 404 }
      );
    }

    // Sort by cost
    allRates.sort((a, b) => a.cost - b.cost);

    return NextResponse.json({ rates: allRates });
  } catch (error: any) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates', details: error.message },
      { status: 500 }
    );
  }
}

function applyMarkup(cost: number, service: any) {
  if (!service) return cost;

  const markupValue = Number(service.markupValue);
  if (markupValue === 0) return cost;

  if (service.markupType === 'percentage') {
    return cost * (1 + markupValue / 100);
  } else {
    return cost + markupValue;
  }
}

async function getUSPSRates(provider: any, data: ShippingRateRequest) {
  const baseUrl = provider.testMode
    ? 'https://secure.shippingapis.com/ShippingAPI.dll'
    : 'https://secure.shippingapis.com/ShippingAPI.dll';

  const xmlRequest = `
    <RateV4Request USERID="${provider.username}">
      <Revision>2</Revision>
      <Package ID="1">
        <Service>ALL</Service>
        <ZipOrigination>${data.fromAddress.zipCode}</ZipOrigination>
        <ZipDestination>${data.toAddress.zipCode}</ZipDestination>
        <Pounds>${Math.floor(data.package.weight)}</Pounds>
        <Ounces>${Math.round((data.package.weight % 1) * 16)}</Ounces>
        <Container>VARIABLE</Container>
        <Size>REGULAR</Size>
        <Width>${data.package.width}</Width>
        <Length>${data.package.length}</Length>
        <Height>${data.package.height}</Height>
        <Machinable>true</Machinable>
      </Package>
    </RateV4Request>
  `.trim();

  const response = await fetch(`${baseUrl}?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`);
  const xmlText = await response.text();

  // Parse XML response (simplified - would use proper XML parser)
  const rates: any[] = [];

  // Basic parsing - in production, use a proper XML parser
  const serviceRegex = /<Postage[^>]*>[\s\S]*?<MailService>(.*?)<\/MailService>[\s\S]*?<Rate>(.*?)<\/Rate>[\s\S]*?<\/Postage>/g;
  let match;

  while ((match = serviceRegex.exec(xmlText)) !== null) {
    const serviceName = match[1];
    const rate = parseFloat(match[2]);

    rates.push({
      carrier: 'USPS',
      serviceName: serviceName,
      serviceCode: serviceName.replace(/\s+/g, '_').toUpperCase(),
      cost: rate,
      deliveryDays: null,
      deliveryDate: null,
    });
  }

  return rates;
}

async function getFedExRates(provider: any, data: ShippingRateRequest) {
  const baseUrl = provider.testMode
    ? 'https://apis-sandbox.fedex.com'
    : 'https://apis.fedex.com';

  // Get OAuth token first
  const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: provider.apiKey || '',
      client_secret: provider.apiSecret || '',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with FedEx');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get rates
  const rateResponse = await fetch(`${baseUrl}/rate/v1/rates/quotes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-locale': 'en_US',
    },
    body: JSON.stringify({
      accountNumber: {
        value: provider.accountNumber,
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: data.fromAddress.zipCode,
            countryCode: data.fromAddress.country,
            stateOrProvinceCode: data.fromAddress.state,
          },
        },
        recipient: {
          address: {
            postalCode: data.toAddress.zipCode,
            countryCode: data.toAddress.country,
            stateOrProvinceCode: data.toAddress.state,
          },
        },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        rateRequestType: ['LIST', 'ACCOUNT'],
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: data.package.weight,
            },
            dimensions: {
              length: data.package.length,
              width: data.package.width,
              height: data.package.height,
              units: 'IN',
            },
          },
        ],
      },
    }),
  });

  if (!rateResponse.ok) {
    const errorData = await rateResponse.json();
    throw new Error(errorData.errors?.[0]?.message || 'FedEx rate request failed');
  }

  const rateData = await rateResponse.json();
  const rates: any[] = [];

  rateData.output?.rateReplyDetails?.forEach((detail: any) => {
    const ratedShipmentDetails = detail.ratedShipmentDetails?.[0];
    if (ratedShipmentDetails) {
      rates.push({
        carrier: 'FEDEX',
        serviceName: detail.serviceName,
        serviceCode: detail.serviceType,
        cost: ratedShipmentDetails.totalNetCharge,
        deliveryDays: detail.commit?.transitDays,
        deliveryDate: detail.commit?.dateDetail?.dayFormat,
      });
    }
  });

  return rates;
}

async function getUPSRates(provider: any, data: ShippingRateRequest) {
  const baseUrl = provider.testMode
    ? 'https://wwwcie.ups.com/api'
    : 'https://onlinetools.ups.com/api';

  // Get OAuth token
  const tokenResponse = await fetch(`${baseUrl}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${provider.apiKey}:${provider.apiSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with UPS');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get rates
  const rateResponse = await fetch(`${baseUrl}/rating/v1/rate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      RateRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: 'Rating',
          },
        },
        Shipment: {
          Shipper: {
            Address: {
              PostalCode: data.fromAddress.zipCode,
              CountryCode: data.fromAddress.country,
              StateProvinceCode: data.fromAddress.state,
            },
          },
          ShipTo: {
            Address: {
              PostalCode: data.toAddress.zipCode,
              CountryCode: data.toAddress.country,
              StateProvinceCode: data.toAddress.state,
            },
          },
          Package: {
            PackagingType: {
              Code: '02',
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: 'IN',
              },
              Length: data.package.length.toString(),
              Width: data.package.width.toString(),
              Height: data.package.height.toString(),
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'LBS',
              },
              Weight: data.package.weight.toString(),
            },
          },
        },
      },
    }),
  });

  if (!rateResponse.ok) {
    const errorData = await rateResponse.json();
    throw new Error(errorData.response?.errors?.[0]?.message || 'UPS rate request failed');
  }

  const rateData = await rateResponse.json();
  const rates: any[] = [];

  rateData.RateResponse?.RatedShipment?.forEach((shipment: any) => {
    rates.push({
      carrier: 'UPS',
      serviceName: shipment.Service?.Code,
      serviceCode: shipment.Service?.Code,
      cost: parseFloat(shipment.TotalCharges?.MonetaryValue),
      deliveryDays: null,
      deliveryDate: null,
    });
  });

  return rates;
}
