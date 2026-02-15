'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  CreditCard,
  Truck,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Check,
  Plus,
  Building2,
  FileText,
  Wallet,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    wholesalePrice: number | null;
    gsaPrice: number | null;
    images: string[];
    weight: number | null;
  };
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface CostCenter {
  id: string;
  name: string;
  code: string;
  budgetAmount: number;
  currentSpent: number;
}

interface CheckoutFormProps {
  cartItems: CartItem[];
  addresses: Address[];
  userEmail: string;
  userName: string | null;
  accountType: string;
  b2bMembership: {
    requiresApproval: boolean;
    approvalThreshold: number | null;
    orderLimit: number | null;
    costCenter: { id: string; name: string } | null;
    companyName: string;
  } | null;
  costCenters: CostCenter[];
}

type CheckoutStep = 'shipping' | 'delivery' | 'government' | 'payment' | 'review';

// Stripe Payment Element component for card input
function StripePaymentElement({
  onReady,
  onError,
  onStripeReady,
}: {
  onReady: () => void;
  onError: (error: string) => void;
  onStripeReady: (stripe: any, elements: any) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (stripe && elements) {
      onStripeReady(stripe, elements);
    }
  }, [stripe, elements, onStripeReady]);

  return (
    <PaymentElement
      onReady={onReady}
      onChange={(event) => {
        if (event.complete) {
          onError('');
        }
      }}
      options={{
        layout: 'tabs',
        paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
      }}
    />
  );
}

export function CheckoutForm({
  cartItems,
  addresses,
  userEmail,
  userName,
  accountType,
  b2bMembership,
  costCenters,
}: CheckoutFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string | null>(
    b2bMembership?.costCenter?.id || null
  );
  const [shippingMethod, setShippingMethod] = useState('ground');
  const [paymentMethod, setPaymentMethod] = useState(accountType === 'B2B' ? 'net30' : 'card');
  const [orderNote, setOrderNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Government Buyer state
  const [isGovBuyer, setIsGovBuyer] = useState(false);
  const [govBuyerInfo, setGovBuyerInfo] = useState({
    agencyName: '',
    contactName: '',
    contactEmail: '',
    contractNumber: '',
  });

  // Shipping rates from Shippo
  interface ShippingRateOption {
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

  const [shippingRates, setShippingRates] = useState<ShippingRateOption[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Free shipping settings
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingEnabled: false,
    freeThreshold: 100,
  });

  // Stripe state
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [stripeElements, setStripeElements] = useState<any>(null);
  const [saveCard, setSaveCard] = useState(false);

  // Callback for when Stripe elements are ready
  const handleStripeReady = useCallback((stripe: any, elements: any) => {
    setStripeInstance(stripe);
    setStripeElements(elements);
  }, []);

  // New address form
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    isDefault: false,
  });

  const isB2BAccount = accountType === 'B2B' || accountType === 'VOLUME_BUYER';
  const isGSAAccount = accountType === 'GSA' || accountType === 'GOVERNMENT';

  // Calculate subtotal using regular prices
  const regularSubtotal = cartItems.reduce((sum, item) => {
    let price = Number(item.product.salePrice || item.product.basePrice);
    if (isB2BAccount && item.product.wholesalePrice) {
      price = Number(item.product.wholesalePrice);
    } else if (isGSAAccount && item.product.gsaPrice) {
      price = Number(item.product.gsaPrice);
    }
    return sum + price * item.quantity;
  }, 0);

  // Calculate subtotal using government prices (for isGovBuyer option)
  const governmentSubtotal = cartItems.reduce((sum, item) => {
    // Use government price if available, otherwise fall back to regular price
    const price = item.product.gsaPrice
      ? Number(item.product.gsaPrice)
      : Number(item.product.salePrice || item.product.basePrice);
    return sum + price * item.quantity;
  }, 0);

  // Use government pricing if isGovBuyer is checked and not already a GSA account
  const subtotal = isGovBuyer && !isGSAAccount ? governmentSubtotal : regularSubtotal;

  // Calculate government discount (the difference between regular and government prices)
  const govPriceSavings = isGovBuyer && !isGSAAccount ? regularSubtotal - governmentSubtotal : 0;

  // Fetch shipping settings
  useEffect(() => {
    fetch('/api/storefront/settings/shipping')
      .then((res) => res.json())
      .then((data) => {
        setShippingSettings({
          freeShippingEnabled: data.freeShippingEnabled ?? false,
          freeThreshold: data.freeThreshold ?? 100,
        });
      })
      .catch(() => {
        // Keep defaults on error
      });
  }, []);

  // Fetch shipping rates when address is selected
  const fetchShippingRates = async (address: Address) => {
    setLoadingRates(true);
    setRatesError(null);

    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: {
            name: `${address.firstName} ${address.lastName}`,
            street1: address.address1,
            street2: address.address2,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country || 'US',
            phone: address.phone,
          },
          cartItems: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.rates) {
        setShippingRates(data.rates);
        // Auto-select cheapest rate
        if (data.rates.length > 0) {
          setSelectedRateId(data.rates[0].id);
          setShippingMethod(data.rates[0].serviceCode);
        }
      } else {
        setRatesError(data.error || 'Failed to fetch shipping rates');
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
      setRatesError('Failed to fetch shipping rates');
    } finally {
      setLoadingRates(false);
    }
  };

  // Fetch rates when address changes
  useEffect(() => {
    const address = addresses.find(a => a.id === selectedAddressId);
    if (address) {
      fetchShippingRates(address);
    }
  }, [selectedAddressId]);

  // Get shipping cost from selected rate or fallback
  const selectedRate = shippingRates.find(r => r.id === selectedRateId);
  const baseShippingCost = selectedRate?.cost ?? 15;
  const shippingCost =
    shippingSettings.freeShippingEnabled && subtotal >= shippingSettings.freeThreshold
      ? 0
      : baseShippingCost;

  const couponDiscount = appliedCoupon?.discount || 0;
  // Government pricing is now applied through the subtotal calculation, not as a discount
  const discount = couponDiscount;
  const tax = isB2BAccount || isGSAAccount || isGovBuyer ? 0 : (subtotal - discount) * 0.08;
  const total = subtotal - discount + shippingCost + tax;

  // Initialize Stripe and create payment intent when entering payment step
  useEffect(() => {
    async function initStripe() {
      // Only for card payments
      if (paymentMethod !== 'card') return;
      if (currentStep !== 'payment' && currentStep !== 'review') return;
      if (clientSecret) return; // Already initialized
      if (total <= 0) return; // Wait for total to be calculated

      try {
        // Get Stripe config
        const configResponse = await fetch('/api/payments/checkout');
        if (!configResponse.ok) {
          throw new Error('Failed to load payment configuration');
        }
        const config = await configResponse.json();

        if (!config.publishableKey) {
          throw new Error('Payment system not configured');
        }

        // Initialize Stripe
        const stripe = loadStripe(config.publishableKey);
        setStripePromise(stripe);

        // Create payment intent
        const intentResponse = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            currency: 'usd',
            saveCard: saveCard,
            metadata: {
              userEmail,
            },
          }),
        });

        if (!intentResponse.ok) {
          const data = await intentResponse.json();
          throw new Error(data.error || 'Failed to initialize payment');
        }

        const intentData = await intentResponse.json();
        setClientSecret(intentData.clientSecret);
        setPaymentIntentId(intentData.paymentIntentId);
      } catch (err: any) {
        console.error('Stripe init error:', err);
        setStripeError(err.message || 'Failed to initialize payment');
      }
    }

    initStripe();
  }, [currentStep, paymentMethod, total, userEmail, clientSecret, saveCard]);

  // Check approval requirements
  const requiresApproval =
    b2bMembership &&
    b2bMembership.requiresApproval &&
    b2bMembership.approvalThreshold &&
    total > b2bMembership.approvalThreshold;

  const exceedsOrderLimit =
    b2bMembership && b2bMembership.orderLimit && total > b2bMembership.orderLimit;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Build steps dynamically - skip Government step if user is already a Government account
  const allSteps: { key: CheckoutStep; label: string }[] = [
    { key: 'shipping', label: 'Shipping' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'government', label: 'Government' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ];

  // Filter out the government step if user is already a Government account
  const steps = isGSAAccount
    ? allSteps.filter(step => step.key !== 'government')
    : allSteps;

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          subtotal,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon({
          code: couponCode,
          discount: data.discount,
        });
        setError(null);
      } else {
        setError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setError('Failed to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSaveAddress = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const savedAddress = await response.json();
        setSelectedAddressId(savedAddress.id);
        setShowAddressForm(false);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save address');
      }
    } catch (err) {
      setError('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      setCurrentStep('shipping');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For card payments, we need to confirm with Stripe first
      if (paymentMethod === 'card' && clientSecret) {
        // Check Stripe instance and elements
        if (!stripeInstance || !stripeElements) {
          throw new Error('Payment system not ready. Please wait for the payment form to load.');
        }

        // Create order first to get orderId
        const orderData = {
          shippingAddressId: selectedAddressId,
          billingAddressId: selectedAddressId,
          shippingMethod,
          shippingRateId: selectedRateId,
          shippingCost: shippingCost,
          shippingCarrier: selectedRate?.carrier,
          shippingServiceName: selectedRate?.serviceName,
          paymentMethod,
          paymentIntentId, // Include payment intent ID
          costCenterId: selectedCostCenterId,
          couponCode: appliedCoupon?.code,
          notes: orderNote,
        };

        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        const orderResult = await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(orderResult.error || 'Failed to create order');
        }

        // Update payment intent with order ID
        if (paymentIntentId) {
          await fetch('/api/payments/checkout', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId,
              orderId: orderResult.id,
              metadata: {
                orderNumber: orderResult.orderNumber,
              },
            }),
          });
        }

        // Confirm the payment with Stripe using redirect
        const { error: stripeErr } = await stripeInstance.confirmPayment({
          elements: stripeElements,
          confirmParams: {
            return_url: `${window.location.origin}/orders/${orderResult.orderNumber}?new=true`,
            receipt_email: userEmail,
          },
        });

        // If we get here, there was an error (otherwise we'd be redirected)
        if (stripeErr) {
          // Payment failed - but order is created. Mark it as failed
          await fetch(`/api/orders/${orderResult.orderNumber}/payment-failed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: stripeErr.message }),
          });
          throw new Error(stripeErr.message || 'Payment failed');
        }
      } else {
        // For non-card payments (net30, etc.), just create the order
        const orderData = {
          shippingAddressId: selectedAddressId,
          billingAddressId: selectedAddressId,
          shippingMethod,
          shippingRateId: selectedRateId,
          shippingCost: shippingCost,
          shippingCarrier: selectedRate?.carrier,
          shippingServiceName: selectedRate?.serviceName,
          paymentMethod,
          costCenterId: selectedCostCenterId,
          couponCode: appliedCoupon?.code,
          notes: orderNote,
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (response.ok) {
          router.push(`/orders/${data.orderNumber}?new=true`);
        } else {
          throw new Error(data.error || 'Failed to place order');
        }
      }
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'shipping':
        return selectedAddressId || showAddressForm;
      case 'delivery':
        return !!shippingMethod;
      case 'government':
        // Government step is optional, can always proceed
        // If gov buyer is selected, validate required fields
        if (isGovBuyer) {
          return govBuyerInfo.agencyName.trim() !== '' && govBuyerInfo.contactEmail.trim() !== '';
        }
        return true;
      case 'payment':
        if (paymentMethod === 'card') {
          return isPaymentReady && !!clientSecret;
        }
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1].key);
    }
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(steps[idx - 1].key);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Steps */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                  disabled={index > currentStepIndex}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      index < currentStepIndex
                        ? 'bg-safety-green-600 text-white'
                        : index === currentStepIndex
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span
                    className={`hidden sm:inline text-sm font-medium ${
                      index === currentStepIndex ? 'text-black' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-safety-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        )}

        {/* Step: Shipping */}
        {currentStep === 'shipping' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-safety-green-600" />
              <h2 className="text-xl font-bold text-black">Shipping Address</h2>
            </div>

            {addresses.length > 0 && !showAddressForm && (
              <div className="space-y-3 mb-6">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? 'border-safety-green-600 bg-safety-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 w-4 h-4 text-safety-green-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">
                        {address.firstName} {address.lastName}
                        {address.isDefault && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {address.address1}
                        {address.address2 && `, ${address.address2}`}
                        <br />
                        {address.city}, {address.state} {address.zipCode}
                        <br />
                        {address.country}
                      </div>
                      {address.phone && (
                        <div className="text-sm text-gray-600 mt-1">{address.phone}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {showAddressForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">First Name</label>
                    <input
                      type="text"
                      value={newAddress.firstName}
                      onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Last Name</label>
                    <input
                      type="text"
                      value={newAddress.lastName}
                      onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={newAddress.address1}
                    onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAddress.address2}
                    onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">State</label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveAddress} disabled={loading} className="bg-safety-green-600 hover:bg-safety-green-700">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Address
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddressForm(true)}
                className="border-gray-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            )}
          </div>
        )}

        {/* Step: Delivery */}
        {currentStep === 'delivery' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="w-6 h-6 text-safety-green-600" />
              <h2 className="text-xl font-bold text-black">Delivery Method</h2>
            </div>

            {/* Loading state */}
            {loadingRates && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-safety-green-600 animate-spin mr-3" />
                <span className="text-gray-600">Calculating shipping rates...</span>
              </div>
            )}

            {/* Error state */}
            {ratesError && !loadingRates && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{ratesError}</span>
                </div>
              </div>
            )}

            {/* Shipping rates */}
            {!loadingRates && shippingRates.length > 0 && (
              <div className="space-y-3">
                {shippingRates.map((rate) => {
                  const isFreeEligible = shippingSettings.freeShippingEnabled &&
                    subtotal >= shippingSettings.freeThreshold &&
                    rate.id === shippingRates[0]?.id; // Only first (cheapest) rate can be free

                  return (
                    <label
                      key={rate.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedRateId === rate.id
                          ? 'border-safety-green-600 bg-safety-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedRateId === rate.id}
                        onChange={() => {
                          setSelectedRateId(rate.id);
                          setShippingMethod(rate.serviceCode);
                        }}
                        className="w-4 h-4 text-safety-green-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {rate.carrierLogo && (
                            <img
                              src={rate.carrierLogo}
                              alt={rate.carrier}
                              className="h-5 w-auto"
                            />
                          )}
                          <span className="font-medium text-black">
                            {rate.carrier} {rate.serviceName}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {rate.estimatedDays
                            ? `${rate.estimatedDays} business day${rate.estimatedDays > 1 ? 's' : ''}`
                            : rate.arrivesBy
                            ? `Arrives by ${rate.arrivesBy}`
                            : 'Estimated delivery time varies'}
                        </div>
                      </div>
                      <div className="font-bold text-black">
                        {isFreeEligible ? (
                          <span className="text-safety-green-600">FREE</span>
                        ) : (
                          `$${rate.cost.toFixed(2)}`
                        )}
                      </div>
                    </label>
                  );
                })}

                {/* Free shipping notice */}
                {shippingSettings.freeShippingEnabled && subtotal < shippingSettings.freeThreshold && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    Add ${(shippingSettings.freeThreshold - subtotal).toFixed(2)} more for free shipping!
                  </div>
                )}
              </div>
            )}

            {/* No rates available */}
            {!loadingRates && shippingRates.length === 0 && !ratesError && (
              <div className="text-center py-8 text-gray-600">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Please select a shipping address to see available shipping options.</p>
              </div>
            )}

            {/* Cost Center Selection for B2B */}
            {b2bMembership && costCenters.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-black">Cost Center</h3>
                </div>
                <div className="space-y-3">
                  {costCenters.map((cc) => {
                    const remaining = cc.budgetAmount - cc.currentSpent;
                    const canAfford = remaining >= total;

                    return (
                      <label
                        key={cc.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg ${
                          canAfford
                            ? 'cursor-pointer hover:border-blue-300'
                            : 'cursor-not-allowed bg-red-50 border-red-200'
                        } ${
                          selectedCostCenterId === cc.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="costCenter"
                          checked={selectedCostCenterId === cc.id}
                          onChange={() => setSelectedCostCenterId(cc.id)}
                          disabled={!canAfford}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-black">{cc.name}</div>
                          <div className="text-sm text-gray-600">
                            Code: {cc.code} • Remaining: ${remaining.toLocaleString()}
                          </div>
                        </div>
                        {!canAfford && (
                          <span className="text-xs text-red-600 font-medium">Insufficient budget</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Government Buyer */}
        {currentStep === 'government' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-black">Government Buyer</h2>
            </div>

            {/* Government Buyer Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    Are you a Government Buyer?
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Federal, State, and Local government agencies qualify for special pricing.
                    Get <span className="font-bold text-blue-900">20% off</span> your entire order!
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGovBuyer}
                      onChange={(e) => setIsGovBuyer(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-2 border-blue-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-blue-900">
                      Yes, I am purchasing for a government agency
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Government Buyer Form */}
            {isGovBuyer && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
                <h4 className="font-semibold text-black flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  Agency Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agency Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={govBuyerInfo.agencyName}
                      onChange={(e) => setGovBuyerInfo({ ...govBuyerInfo, agencyName: e.target.value })}
                      placeholder="e.g., Department of Defense"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={govBuyerInfo.contactName}
                      onChange={(e) => setGovBuyerInfo({ ...govBuyerInfo, contactName: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Government Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={govBuyerInfo.contactEmail}
                      onChange={(e) => setGovBuyerInfo({ ...govBuyerInfo, contactEmail: e.target.value })}
                      placeholder="name@agency.gov"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract/PO Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={govBuyerInfo.contractNumber}
                      onChange={(e) => setGovBuyerInfo({ ...govBuyerInfo, contractNumber: e.target.value })}
                      placeholder="Contract or PO number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Government Pricing Preview */}
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Government Pricing Applied</span>
                    </div>
                    {govPriceSavings > 0 ? (
                      <span className="text-lg font-bold text-green-700">
                        Saving ${govPriceSavings.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Tax exempt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Prices adjusted to government contract rates. Tax exempt status applied.
                  </p>
                </div>
              </div>
            )}

            {/* Skip option */}
            {!isGovBuyer && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Not a government buyer? No problem! Click &quot;Continue&quot; to proceed to payment.
              </div>
            )}
          </div>
        )}

        {/* Step: Payment - keep mounted on review step so Stripe Elements stays in DOM */}
        {(currentStep === 'payment' || (currentStep === 'review' && paymentMethod === 'card')) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ display: currentStep === 'payment' ? undefined : 'none' }}>
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-6 h-6 text-safety-green-600" />
              <h2 className="text-xl font-bold text-black">Payment Method</h2>
            </div>

            {isB2BAccount && (
              <div className="space-y-3 mb-6">
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'net30'
                      ? 'border-safety-green-600 bg-safety-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'net30'}
                    onChange={() => setPaymentMethod('net30')}
                    className="w-4 h-4 text-safety-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-black">Net 30 Terms</div>
                    <div className="text-sm text-gray-600">Pay within 30 days of invoice</div>
                  </div>
                  <FileText className="w-5 h-5 text-gray-400" />
                </label>

                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-safety-green-600 bg-safety-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="w-4 h-4 text-safety-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-black">Credit Card</div>
                    <div className="text-sm text-gray-600">Pay now with card</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </label>
              </div>
            )}

            {(paymentMethod === 'card' || !isB2BAccount) && (
              <div className="space-y-4">
                {stripeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="text-sm text-red-800">{stripeError}</div>
                  </div>
                )}

                {!clientSecret && !stripeError && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-safety-green-600 animate-spin mr-3" />
                    <span className="text-gray-600">Initializing secure payment...</span>
                  </div>
                )}

                {stripePromise && clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#16a34a',
                          colorBackground: '#ffffff',
                          colorText: '#1f2937',
                          colorDanger: '#dc2626',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          spacingUnit: '4px',
                          borderRadius: '8px',
                        },
                      },
                    }}
                  >
                    <StripePaymentElement
                      onReady={() => setIsPaymentReady(true)}
                      onError={(err) => setStripeError(err)}
                      onStripeReady={handleStripeReady}
                    />
                  </Elements>
                )}

                {/* Save card option */}
                {clientSecret && (
                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="w-4 h-4 text-safety-green-600 rounded border-gray-300 focus:ring-safety-green-500"
                    />
                    <span className="text-sm text-gray-700">Save card for future purchases</span>
                  </label>
                )}

                {/* Security badges */}
                <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-200 mt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock className="w-4 h-4 text-safety-green-600" />
                    <span>PCI DSS Compliant</span>
                  </div>
                </div>

                {/* Test mode indicator */}
                {clientSecret?.includes('_test_') && (
                  <div className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg py-2 mt-2">
                    Test Mode - Use card 4242 4242 4242 4242
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            {/* Approval Warning */}
            {requiresApproval && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-900">Approval Required</div>
                  <div className="text-sm text-yellow-800">
                    This order exceeds the approval threshold and will be sent for manager approval.
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">Shipping Address</h3>
                <button
                  onClick={() => setCurrentStep('shipping')}
                  className="text-sm text-safety-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              {selectedAddress && (
                <div className="text-sm text-gray-700">
                  {selectedAddress.firstName} {selectedAddress.lastName}
                  <br />
                  {selectedAddress.address1}
                  {selectedAddress.address2 && <>, {selectedAddress.address2}</>}
                  <br />
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                </div>
              )}
            </div>

            {/* Delivery Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">Delivery Method</h3>
                <button
                  onClick={() => setCurrentStep('delivery')}
                  className="text-sm text-safety-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-700">
                {selectedRate ? (
                  <div className="flex items-center gap-2">
                    {selectedRate.carrierLogo && (
                      <img src={selectedRate.carrierLogo} alt={selectedRate.carrier} className="h-4" />
                    )}
                    <span>
                      {selectedRate.carrier} {selectedRate.serviceName}
                      {selectedRate.estimatedDays && ` (${selectedRate.estimatedDays} business days)`}
                    </span>
                  </div>
                ) : (
                  'Please select a delivery method'
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">Payment Method</h3>
                <button
                  onClick={() => setCurrentStep('payment')}
                  className="text-sm text-safety-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-700">
                {paymentMethod === 'net30'
                  ? 'Net 30 Terms'
                  : 'Credit Card (Secure payment via Stripe)'}
              </div>
            </div>

            {/* Order Note */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-black mb-4">Order Notes (Optional)</h3>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add any special instructions for your order..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStepIndex > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <Link href="/cart">
              <Button variant="outline">Back to Cart</Button>
            </Link>
          )}

          {currentStep === 'review' ? (
            <Button
              onClick={handlePlaceOrder}
              disabled={loading || !!exceedsOrderLimit}
              className="bg-safety-green-600 hover:bg-safety-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : requiresApproval ? (
                'Submit for Approval'
              ) : (
                'Place Order'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-safety-green-600 hover:bg-safety-green-700"
            >
              Continue
            </Button>
          )}
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
          <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>

          {/* Items */}
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {cartItems.map((item) => {
              let price = Number(item.product.salePrice || item.product.basePrice);
              if (isB2BAccount && item.product.wholesalePrice) {
                price = Number(item.product.wholesalePrice);
              } else if ((isGSAAccount || (isGovBuyer && !isGSAAccount)) && item.product.gsaPrice) {
                price = Number(item.product.gsaPrice);
              }

              return (
                <div key={item.id} className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black line-clamp-1">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-black">
                    ${(price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coupon */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode}
                className="border-gray-300"
              >
                {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
            {appliedCoupon && (
              <div className="mt-2 text-sm text-safety-green-600 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {appliedCoupon.code} applied: -${appliedCoupon.discount.toFixed(2)}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-safety-green-600">
                <span>Coupon Discount</span>
                <span>-${couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {isGovBuyer && govPriceSavings > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Government Pricing</span>
                <span>Saving ${govPriceSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {currentStep === 'shipping' && !selectedRate ? (
                  <span className="text-gray-500 text-sm">Calculated in next step</span>
                ) : shippingCost === 0 ? (
                  <span className="text-safety-green-600">FREE</span>
                ) : (
                  `$${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
            )}
            {(isB2BAccount || isGSAAccount || isGovBuyer) && (
              <div className="text-xs text-safety-green-600">Tax-exempt account</div>
            )}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-black">Total</span>
              {currentStep === 'shipping' && !selectedRate ? (
                <div className="text-right">
                  <span className="text-xl font-bold text-black">${(subtotal - discount + tax).toFixed(2)}</span>
                  <div className="text-xs text-gray-500">+ shipping</div>
                </div>
              ) : (
                <span className="text-2xl font-bold text-black">${total.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-safety-green-600" />
              <span>256-bit SSL encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-safety-green-600" />
              <span>PCI DSS compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
