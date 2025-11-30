'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ChevronDown,
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

type CheckoutStep = 'shipping' | 'delivery' | 'payment' | 'review';

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

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(userName || '');

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

  const isB2BAccount = accountType === 'B2B';
  const isGSAAccount = accountType === 'GSA';

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    let price = Number(item.product.salePrice || item.product.basePrice);
    if (isB2BAccount && item.product.wholesalePrice) {
      price = Number(item.product.wholesalePrice);
    } else if (isGSAAccount && item.product.gsaPrice) {
      price = Number(item.product.gsaPrice);
    }
    return sum + price * item.quantity;
  }, 0);

  const shippingCost =
    shippingMethod === 'ground'
      ? subtotal >= 99
        ? 0
        : 15
      : shippingMethod === 'express'
      ? 29.99
      : 49.99;

  const discount = appliedCoupon?.discount || 0;
  const tax = isB2BAccount || isGSAAccount ? 0 : (subtotal - discount) * 0.08;
  const total = subtotal - discount + shippingCost + tax;

  // Check approval requirements
  const requiresApproval =
    b2bMembership &&
    b2bMembership.requiresApproval &&
    b2bMembership.approvalThreshold &&
    total > b2bMembership.approvalThreshold;

  const exceedsOrderLimit =
    b2bMembership && b2bMembership.orderLimit && total > b2bMembership.orderLimit;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: 'shipping', label: 'Shipping' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ];

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
      const orderData = {
        shippingAddressId: selectedAddressId,
        billingAddressId: selectedAddressId, // Same as shipping for now
        shippingMethod,
        paymentMethod,
        costCenterId: selectedCostCenterId,
        couponCode: appliedCoupon?.code,
        notes: orderNote,
        cardDetails:
          paymentMethod === 'card'
            ? {
                number: cardNumber.replace(/\s/g, ''),
                expiry: cardExpiry,
                cvc: cardCvc,
                name: cardName,
              }
            : undefined,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cart and redirect to confirmation
        router.push(`/orders/${data.orderNumber}?new=true`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
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
      case 'payment':
        if (paymentMethod === 'card') {
          return cardNumber && cardExpiry && cardCvc && cardName;
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

            <div className="space-y-3">
              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  shippingMethod === 'ground'
                    ? 'border-safety-green-600 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'ground'}
                  onChange={() => setShippingMethod('ground')}
                  className="w-4 h-4 text-safety-green-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-black">FedEx Ground</div>
                  <div className="text-sm text-gray-600">5-7 business days</div>
                </div>
                <div className="font-bold text-black">
                  {subtotal >= 99 ? (
                    <span className="text-safety-green-600">FREE</span>
                  ) : (
                    '$15.00'
                  )}
                </div>
              </label>

              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  shippingMethod === 'express'
                    ? 'border-safety-green-600 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'express'}
                  onChange={() => setShippingMethod('express')}
                  className="w-4 h-4 text-safety-green-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-black">FedEx 2Day</div>
                  <div className="text-sm text-gray-600">2 business days</div>
                </div>
                <div className="font-bold text-black">$29.99</div>
              </label>

              <label
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  shippingMethod === 'overnight'
                    ? 'border-safety-green-600 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'overnight'}
                  onChange={() => setShippingMethod('overnight')}
                  className="w-4 h-4 text-safety-green-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-black">FedEx Overnight</div>
                  <div className="text-sm text-gray-600">Next business day</div>
                </div>
                <div className="font-bold text-black">$49.99</div>
              </label>
            </div>

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

        {/* Step: Payment */}
        {currentStep === 'payment' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setCardNumber(value.replace(/(.{4})/g, '$1 ').trim());
                    }}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (value.length > 2) {
                          setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
                        } else {
                          setCardExpiry(value);
                        }
                      }}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
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
                {shippingMethod === 'ground'
                  ? 'FedEx Ground (5-7 business days)'
                  : shippingMethod === 'express'
                  ? 'FedEx 2Day (2 business days)'
                  : 'FedEx Overnight (Next business day)'}
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
                  : `Credit Card ending in ${cardNumber.slice(-4)}`}
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
              disabled={loading || exceedsOrderLimit}
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
              } else if (isGSAAccount && item.product.gsaPrice) {
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
            {discount > 0 && (
              <div className="flex justify-between text-safety-green-600">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shippingCost === 0 ? (
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
            {(isB2BAccount || isGSAAccount) && (
              <div className="text-xs text-safety-green-600">Tax-exempt account</div>
            )}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-black">Total</span>
              <span className="text-2xl font-bold text-black">${total.toFixed(2)}</span>
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
