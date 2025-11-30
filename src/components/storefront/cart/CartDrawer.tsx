'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, Tag, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, isLoading } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

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
  const freeShippingThreshold = 99;
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

        {/* Free Shipping Progress */}
        {cart && cart.itemCount > 0 && (
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
                const images = item.product.images || [];
                const price = item.product.salePrice || item.product.basePrice;
                const isUpdating = updatingItems.has(item.id);

                return (
                  <div key={item.id} className={`p-4 ${isUpdating ? 'opacity-50' : ''}`}>
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={closeCart}
                        className="flex-shrink-0"
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
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.product.sku}</p>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating}
                              className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity || isUpdating}
                              className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

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
                        {item.product.stockQuantity < 10 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Only {item.product.stockQuantity} left in stock
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
