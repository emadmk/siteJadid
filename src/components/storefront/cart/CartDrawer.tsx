'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, Tag, Truck, Shield, BadgePercent } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, isLoading } = useCart();
  const { data: session } = useSession();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);

  // Discount tiers from cart API response (no separate fetch needed)
  const discountTiers = cart?.discountTiers || [];
  const discountAccountLabel = cart?.discountAccountLabel || 'Member';

  // Check if user is GSA approved
  const isGSAApproved = session?.user?.accountType === 'GSA' && session?.user?.gsaApprovalStatus === 'APPROVED';

  // Check if cart has any GSA priced items
  const hasGSAItems = cart?.items?.some(item => item.product.gsaPrice !== null) || false;

  // Fetch shipping settings on mount
  useEffect(() => {
    fetch('/api/storefront/settings/shipping')
      .then(res => res.json())
      .then(data => {
        if (data.freeShippingEnabled !== undefined) {
          setFreeShippingEnabled(data.freeShippingEnabled);
        }
        if (data.freeThreshold) {
          setFreeShippingThreshold(data.freeThreshold);
        }
      })
      .catch(() => {});
  }, []);

  if (!isCartOpen) return null;

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems(prev => new Set(prev).add(itemId));
    await updateQuantity(itemId, newQuantity);
    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    await removeFromCart(itemId);
    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });

      if (res.ok) {
        setAppliedCoupon(couponCode);
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: { message: 'Coupon applied successfully!', type: 'success' }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: { message: 'Invalid or expired coupon', type: 'error' }
        }));
      }
    } catch {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Failed to apply coupon', type: 'error' }
      }));
    }
  };

  const subtotal = cart?.subtotal || 0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercentage = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-safety-green-600" />
            <h2 className="text-lg font-bold text-black">
              Your Cart {cart && cart.itemCount > 0 && `(${cart.itemCount})`}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GSA Pricing Banner */}
        {isGSAApproved && hasGSAItems && cart && cart.itemCount > 0 && (
          <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">GSA Pricing Applied!</span>
                  <BadgePercent className="w-4 h-4 text-yellow-300" />
                </div>
                <p className="text-blue-100 text-xs">Exclusive government rates on eligible items</p>
              </div>
            </div>
          </div>
        )}

        {/* Free Shipping Progress - Only show if free shipping is enabled */}
        {freeShippingEnabled && cart && cart.itemCount > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            {remainingForFreeShipping > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Add <span className="font-semibold text-safety-green-600">${remainingForFreeShipping.toFixed(2)}</span> for free shipping
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-safety-green-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-safety-green-600">
                <Truck className="w-4 h-4" />
                <span className="font-medium">You qualify for FREE shipping!</span>
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {!cart || cart.itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 text-center mb-6">
                Looks like you haven't added any safety gear yet.
              </p>
              <button
                onClick={closeCart}
                className="px-6 py-3 bg-safety-green-600 text-white rounded-lg font-medium hover:bg-safety-green-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.items.map((item) => {
                // Use variant data if available
                const images = (item.variant?.images?.length ? item.variant.images : item.product.images) || [];
                const price = item.variant
                  ? (item.variant.salePrice || item.variant.basePrice)
                  : (item.product.salePrice || item.product.basePrice);
                const stockQuantity = item.variant?.stockQuantity ?? item.product.stockQuantity;
                const isUpdating = updatingItems.has(item.id);

                // Check if this item is using GSA pricing
                const hasGSAPrice = isGSAApproved && item.product.gsaPrice !== null;
                const gsaPrice = item.product.gsaPrice;
                const regularPrice = item.product.salePrice || item.product.basePrice;

                return (
                  <div key={item.id} className={`p-4 ${isUpdating ? 'opacity-50' : ''}`}>
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={closeCart}
                        className="flex-shrink-0 relative"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        {/* GSA Badge on Image */}
                        {hasGSAPrice && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={closeCart}
                          className="font-medium text-gray-900 hover:text-safety-green-600 line-clamp-2 text-sm"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant && (
                          <p className="text-xs text-safety-green-600 font-medium mt-0.5">
                            {item.variant.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          SKU: {item.variant?.sku || item.product.sku}
                        </p>
                        {/* GSA Pricing Badge */}
                        {hasGSAPrice && gsaPrice && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              <Shield className="w-3 h-3" />
                              GSA Price
                            </span>
                            {Number(gsaPrice) < Number(regularPrice) && (
                              <span className="text-xs text-green-600 font-medium">
                                Save ${((Number(regularPrice) - Number(gsaPrice)) * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          {(() => {
                            const minOrderQty = item.product.minimumOrderQty || 1;
                            return (
                              <div className="flex items-center border border-gray-200 rounded-lg">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - minOrderQty)}
                                  disabled={item.quantity <= minOrderQty || isUpdating}
                                  className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + minOrderQty)}
                                  disabled={item.quantity + minOrderQty > stockQuantity || isUpdating}
                                  className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })()}

                          {/* Price & Remove */}
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">
                              ${(Number(price) * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Stock Warning */}
                        {stockQuantity < 10 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Only {stockQuantity} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.itemCount > 0 && (
          <div className="border-t border-gray-200 bg-white">
            {/* Discount Savings Banner */}
            {discountTiers.length > 0 && (() => {
              const activeTier = [...discountTiers]
                .reverse()
                .find((t) => subtotal >= t.minimumOrderAmount && t.discountPercentage > 0);
              const nextTier = discountTiers.find(
                (t) => subtotal < t.minimumOrderAmount && t.discountPercentage > 0
              );
              const currentSavings = activeTier ? (subtotal * activeTier.discountPercentage) / 100 : 0;
              const amountToNextTier = nextTier ? nextTier.minimumOrderAmount - subtotal : 0;
              const progressToNext = nextTier ? Math.min((subtotal / nextTier.minimumOrderAmount) * 100, 100) : 100;
              const accountLabel = discountAccountLabel;

              return (
                <div className="mx-4 mt-3 mb-1 rounded-xl overflow-hidden shadow-md">
                  <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-xs">{accountLabel} Savings</h4>
                          <p className="text-emerald-100 text-[10px]">
                            {activeTier ? `Saving ${activeTier.discountPercentage}%!` : 'Unlock volume discounts'}
                          </p>
                        </div>
                      </div>
                      {activeTier && currentSavings > 0 && (
                        <div className="text-right">
                          <div className="text-emerald-100 text-[9px] uppercase tracking-wide">Savings</div>
                          <div className="text-white text-base font-bold">${currentSavings.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {discountTiers.filter(t => t.discountPercentage > 0).map((tier, index, arr) => {
                        const isActive = subtotal >= tier.minimumOrderAmount;
                        const isCurrent = activeTier?.id === tier.id;
                        return (
                          <div key={tier.id} className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                  {isActive ? (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  ) : index + 1}
                                </div>
                                <span className={`text-xs font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                                  {tier.discountPercentage}%
                                  {isCurrent && <span className="ml-1 text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded-full">Active</span>}
                                </span>
                              </div>
                              <p className={`text-[9px] ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                ${tier.minimumOrderAmount.toLocaleString()}+
                              </p>
                            </div>
                            {index < arr.length - 1 && (
                              <div className={`w-4 h-0.5 ${isActive ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {nextTier && amountToNextTier > 0 && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2 mt-2">
                        <span className="text-[11px] font-semibold text-amber-800">
                          Add ${amountToNextTier.toFixed(2)} for {nextTier.discountPercentage}% off
                        </span>
                        <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden mt-1">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressToNext}%` }} />
                        </div>
                      </div>
                    )}
                    {!nextTier && activeTier && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[11px] font-semibold text-emerald-800">Max discount unlocked!</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Coupon Code */}
            <div className="px-6 py-3 border-b border-gray-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-safety-green-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-safety-green-600" />
                    <span className="text-sm font-medium text-safety-green-700">{appliedCoupon}</span>
                  </div>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="text-sm text-safety-green-600 hover:text-safety-green-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Shipping and taxes calculated at checkout</p>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-safety-green-600 text-white rounded-lg font-semibold hover:bg-safety-green-700 transition-colors"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full py-3 text-center border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Full Cart
                </Link>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
