/**
 * Stripe Payment Integration Service
 *
 * Provides unified payment processing, refunds, customer management,
 * and subscription handling using the Stripe API.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  testMode: boolean;
}

export interface CreatePaymentIntentParams {
  amount: number; // In dollars
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  orderId?: string;
  description?: string;
  receiptEmail?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  captureMethod?: 'automatic' | 'manual';
  statementDescriptor?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number; // Partial refund in dollars, full refund if not specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface CustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface CustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

export interface PaymentMethodResult {
  success: boolean;
  paymentMethods?: Array<{
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
  }>;
  error?: string;
}

export interface ReceiptData {
  paymentIntentId: string;
  receiptUrl?: string;
  chargeId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: {
    type: string;
    brand?: string;
    last4?: string;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    address?: string;
  };
  created: Date;
}

// ============================================
// CONFIGURATION HELPERS
// ============================================

/**
 * Get Stripe configuration from database settings
 */
export async function getStripeConfig(): Promise<StripeConfig | null> {
  try {
    // First check PaymentGatewaySettings table
    const gatewaySettings = await prisma.paymentGatewaySettings.findFirst({
      where: {
        provider: 'STRIPE',
        isActive: true,
      },
    });

    if (gatewaySettings?.secretKey && gatewaySettings?.publishableKey) {
      return {
        secretKey: gatewaySettings.secretKey,
        publishableKey: gatewaySettings.publishableKey,
        webhookSecret: gatewaySettings.webhookSecret || '',
        testMode: gatewaySettings.testMode,
      };
    }

    // Fallback to Settings table
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'payment.stripeSecretKey',
            'payment.stripePublishableKey',
            'payment.stripeWebhookSecret',
            'payment.stripeTestMode',
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      const shortKey = s.key.replace('payment.stripe', '').toLowerCase();
      settingsMap[shortKey] = s.value;
    });

    if (!settingsMap.secretkey || !settingsMap.publishablekey) {
      return null;
    }

    return {
      secretKey: settingsMap.secretkey,
      publishableKey: settingsMap.publishablekey,
      webhookSecret: settingsMap.webhooksecret || '',
      testMode: settingsMap.testmode === 'true',
    };
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return null;
  }
}

/**
 * Get initialized Stripe client
 */
async function getStripeClient(): Promise<Stripe | null> {
  const config = await getStripeConfig();
  if (!config) {
    return null;
  }

  return new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

// ============================================
// PAYMENT INTENTS
// ============================================

/**
 * Create a PaymentIntent for checkout
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...params.metadata,
        ...(params.orderId && { orderId: params.orderId }),
      },
    };

    // Optional parameters
    if (params.customerId) {
      paymentIntentParams.customer = params.customerId;
    }
    if (params.description) {
      paymentIntentParams.description = params.description;
    }
    if (params.receiptEmail) {
      paymentIntentParams.receipt_email = params.receiptEmail;
    }
    if (params.setupFutureUsage) {
      paymentIntentParams.setup_future_usage = params.setupFutureUsage;
    }
    if (params.captureMethod) {
      paymentIntentParams.capture_method = params.captureMethod;
    }
    if (params.statementDescriptor) {
      paymentIntentParams.statement_descriptor = params.statementDescriptor.slice(0, 22);
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  } catch (error: any) {
    console.error('Stripe createPaymentIntent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment intent',
    };
  }
}

/**
 * Retrieve a PaymentIntent status
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntentResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'payment_method'],
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  } catch (error: any) {
    console.error('Stripe getPaymentIntent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment intent',
    };
  }
}

/**
 * Update a PaymentIntent (before confirmation)
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  params: {
    amount?: number;
    metadata?: Record<string, string>;
    description?: string;
    receiptEmail?: string;
  }
): Promise<PaymentIntentResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const updateParams: Stripe.PaymentIntentUpdateParams = {};

    if (params.amount !== undefined) {
      updateParams.amount = Math.round(params.amount * 100);
    }
    if (params.metadata) {
      updateParams.metadata = params.metadata;
    }
    if (params.description) {
      updateParams.description = params.description;
    }
    if (params.receiptEmail) {
      updateParams.receipt_email = params.receiptEmail;
    }

    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      updateParams
    );

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  } catch (error: any) {
    console.error('Stripe updatePaymentIntent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment intent',
    };
  }
}

/**
 * Cancel a PaymentIntent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  cancellationReason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned'
): Promise<PaymentIntentResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: cancellationReason,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error: any) {
    console.error('Stripe cancelPaymentIntent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel payment intent',
    };
  }
}

/**
 * Capture a PaymentIntent (for manual capture mode)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<PaymentIntentResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const captureParams: Stripe.PaymentIntentCaptureParams = {};
    if (amountToCapture !== undefined) {
      captureParams.amount_to_capture = Math.round(amountToCapture * 100);
    }

    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
      captureParams
    );

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  } catch (error: any) {
    console.error('Stripe capturePaymentIntent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture payment',
    };
  }
}

// ============================================
// REFUNDS
// ============================================

/**
 * Create a refund for a payment
 */
export async function createRefund(params: RefundParams): Promise<RefundResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: params.paymentIntentId,
    };

    if (params.amount !== undefined) {
      refundParams.amount = Math.round(params.amount * 100);
    }
    if (params.reason) {
      refundParams.reason = params.reason;
    }
    if (params.metadata) {
      refundParams.metadata = params.metadata;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refundId: refund.id,
      status: refund.status || undefined,
      amount: refund.amount / 100,
    };
  } catch (error: any) {
    console.error('Stripe createRefund error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create refund',
    };
  }
}

/**
 * Get refund status
 */
export async function getRefund(refundId: string): Promise<RefundResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const refund = await stripe.refunds.retrieve(refundId);

    return {
      success: true,
      refundId: refund.id,
      status: refund.status || undefined,
      amount: refund.amount / 100,
    };
  } catch (error: any) {
    console.error('Stripe getRefund error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve refund',
    };
  }
}

// ============================================
// CUSTOMERS
// ============================================

/**
 * Create a Stripe customer
 */
export async function createCustomer(params: CustomerParams): Promise<CustomerResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const customerParams: Stripe.CustomerCreateParams = {
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    };

    if (params.address) {
      customerParams.address = params.address;
    }

    const customer = await stripe.customers.create(customerParams);

    return {
      success: true,
      customerId: customer.id,
    };
  } catch (error: any) {
    console.error('Stripe createCustomer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create customer',
    };
  }
}

/**
 * Get or create a customer by email
 */
export async function getOrCreateCustomer(
  email: string,
  additionalParams?: Omit<CustomerParams, 'email'>
): Promise<CustomerResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return {
        success: true,
        customerId: customers.data[0].id,
      };
    }

    // Create new customer
    return await createCustomer({ email, ...additionalParams });
  } catch (error: any) {
    console.error('Stripe getOrCreateCustomer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get or create customer',
    };
  }
}

/**
 * Get saved payment methods for a customer
 */
export async function getCustomerPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<PaymentMethodResult> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: type,
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : undefined,
      })),
    };
  } catch (error: any) {
    console.error('Stripe getCustomerPaymentMethods error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment methods',
    };
  }
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  } catch (error: any) {
    console.error('Stripe detachPaymentMethod error:', error);
    return {
      success: false,
      error: error.message || 'Failed to detach payment method',
    };
  }
}

// ============================================
// RECEIPTS & CHARGES
// ============================================

/**
 * Get receipt/charge data for a payment
 */
export async function getReceiptData(paymentIntentId: string): Promise<{
  success: boolean;
  receipt?: ReceiptData;
  error?: string;
}> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'payment_method'],
    });

    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod | null;

    const receipt: ReceiptData = {
      paymentIntentId: paymentIntent.id,
      receiptUrl: charge?.receipt_url || undefined,
      chargeId: charge?.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      created: new Date(paymentIntent.created * 1000),
    };

    if (paymentMethod?.card) {
      receipt.paymentMethod = {
        type: 'card',
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
      };
    }

    if (charge?.billing_details) {
      receipt.billingDetails = {
        name: charge.billing_details.name || undefined,
        email: charge.billing_details.email || undefined,
        address: charge.billing_details.address
          ? [
              charge.billing_details.address.line1,
              charge.billing_details.address.line2,
              charge.billing_details.address.city,
              charge.billing_details.address.state,
              charge.billing_details.address.postal_code,
            ]
              .filter(Boolean)
              .join(', ')
          : undefined,
      };
    }

    return { success: true, receipt };
  } catch (error: any) {
    console.error('Stripe getReceiptData error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get receipt data',
    };
  }
}

// ============================================
// WEBHOOKS
// ============================================

/**
 * Construct and verify a webhook event
 */
export async function constructWebhookEvent(
  payload: string,
  signature: string
): Promise<{
  success: boolean;
  event?: Stripe.Event;
  error?: string;
}> {
  const config = await getStripeConfig();

  if (!config) {
    return { success: false, error: 'Stripe is not configured' };
  }

  if (!config.webhookSecret) {
    return { success: false, error: 'Webhook secret is not configured' };
  }

  const stripe = new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.webhookSecret
    );

    return { success: true, event };
  } catch (error: any) {
    console.error('Stripe webhook verification error:', error);
    return {
      success: false,
      error: error.message || 'Webhook signature verification failed',
    };
  }
}

// ============================================
// SETUP INTENTS (For saving cards)
// ============================================

/**
 * Create a SetupIntent for saving a card
 */
export async function createSetupIntent(
  customerId: string,
  metadata?: Record<string, string>
): Promise<{
  success: boolean;
  setupIntentId?: string;
  clientSecret?: string;
  error?: string;
}> {
  const stripe = await getStripeClient();

  if (!stripe) {
    return { success: false, error: 'Stripe is not configured' };
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: metadata,
    });

    return {
      success: true,
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret || undefined,
    };
  } catch (error: any) {
    console.error('Stripe createSetupIntent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create setup intent',
    };
  }
}

// ============================================
// TESTING & VALIDATION
// ============================================

/**
 * Test Stripe API connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
  testMode?: boolean;
}> {
  const config = await getStripeConfig();

  if (!config) {
    return { success: false, error: 'Stripe is not configured' };
  }

  const stripe = new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  try {
    // Try to retrieve account info
    const account = await stripe.accounts.retrieve();

    return {
      success: true,
      testMode: config.testMode || config.secretKey.startsWith('sk_test_'),
    };
  } catch (error: any) {
    console.error('Stripe testConnection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Stripe',
    };
  }
}

/**
 * Get public configuration (safe for frontend)
 */
export async function getPublicConfig(): Promise<{
  publishableKey: string | null;
  testMode: boolean;
}> {
  const config = await getStripeConfig();

  if (!config) {
    return { publishableKey: null, testMode: false };
  }

  return {
    publishableKey: config.publishableKey,
    testMode: config.testMode || config.secretKey.startsWith('sk_test_'),
  };
}

// ============================================
// PAYMENT TRANSACTION LOGGING
// ============================================

/**
 * Log a payment transaction to database
 */
export async function logPaymentTransaction(params: {
  paymentIntentId: string;
  orderId?: string;
  userId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  last4?: string;
  cardBrand?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.paymentTransaction.upsert({
      where: { transactionId: params.paymentIntentId },
      create: {
        gatewayProvider: 'stripe',
        transactionId: params.paymentIntentId,
        orderId: params.orderId,
        userId: params.userId,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        status: params.status,
        paymentMethod: params.paymentMethod || 'card',
        last4: params.last4,
        cardBrand: params.cardBrand,
        customerEmail: params.customerEmail,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
      update: {
        status: params.status,
        paymentMethod: params.paymentMethod || 'card',
        last4: params.last4,
        cardBrand: params.cardBrand,
        ...(params.status === 'captured' && { capturedAt: new Date() }),
        ...(params.status === 'failed' && { failedAt: new Date() }),
        ...(params.status === 'refunded' && { refundedAt: new Date() }),
      },
    });
  } catch (error) {
    console.error('Error logging payment transaction:', error);
  }
}
