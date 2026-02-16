import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';
import { CartItemActions } from '@/components/cart/CartItemActions';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getCart(userId: string) {
  const cart = await db.cart.findFirst({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              wholesalePrice: true,
              gsaPrice: true,
              images: true,
              stockQuantity: true,
              minimumOrderQty: true,
              weight: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return cart;
}

async function getShippingSettings() {
  const settings = await db.setting.findMany({
    where: { category: 'shipping' },
  });

  const defaults = {
    freeShippingEnabled: false,
    freeThreshold: 100,
    standardRate: 9.99,
  };

  for (const setting of settings) {
    const key = setting.key.replace('shipping.', '');
    if (key === 'freeShippingEnabled') {
      defaults.freeShippingEnabled = setting.value === 'true';
    } else if (key === 'freeThreshold') {
      defaults.freeThreshold = parseFloat(setting.value) || 100;
    } else if (key === 'standardRate') {
      defaults.standardRate = parseFloat(setting.value) || 9.99;
    }
  }

  return defaults;
}

// Map account type to normalized type for discount lookup
function normalizeAccountType(accountType: string): 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT' {
  switch (accountType) {
    case 'B2B':
    case 'VOLUME_BUYER':
      return 'VOLUME_BUYER';
    case 'GSA':
    case 'GOVERNMENT':
      return 'GOVERNMENT';
    default:
      return 'PERSONAL';
  }
}

async function getDiscountTiers(accountType: string) {
  const normalizedType = normalizeAccountType(accountType);

  const discounts = await db.userTypeDiscountSettings.findMany({
    where: {
      accountType: normalizedType,
      isActive: true,
      categoryId: null,
      brandId: null,
      supplierId: null,
      warehouseId: null,
    },
    orderBy: { minimumOrderAmount: 'asc' },
    select: {
      id: true,
      discountPercentage: true,
      minimumOrderAmount: true,
    },
  });

  return discounts.map((d) => ({
    id: d.id,
    discountPercentage: Number(d.discountPercentage),
    minimumOrderAmount: Number(d.minimumOrderAmount),
  }));
}

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/cart');
  }

  const accountType = (session.user as any).accountType || 'B2C';

  const [cart, shippingSettings, discountTiers] = await Promise.all([
    getCart(session.user.id),
    getShippingSettings(),
    getDiscountTiers(accountType),
  ]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-black mb-3">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Add some safety equipment to your cart to get started
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <ShieldCheck className="w-5 h-5" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Use the stored price from cart item (includes discounts applied when added)
  const subtotal = cart.items.reduce((sum: number, item: any) => {
    // Use the stored price if available, otherwise fallback to product prices
    const price = item.price ? Number(item.price) : Number(item.product.salePrice || item.product.basePrice);
    return sum + price * item.quantity;
  }, 0);

  const totalWeight = cart.items.reduce((sum: number, item: any) => {
    return sum + (item.product.weight || 0) * item.quantity;
  }, 0);

  // Calculate shipping based on settings
  const qualifiesForFreeShipping = shippingSettings.freeShippingEnabled && subtotal >= shippingSettings.freeThreshold;
  const estimatedShipping = qualifiesForFreeShipping ? 0 : (totalWeight > 20 ? 35 : shippingSettings.standardRate);
  const tax = subtotal * 0.08;
  const total = subtotal + estimatedShipping + tax;

  // For free shipping progress bar
  const freeShippingThreshold = shippingSettings.freeThreshold;
  const showFreeShippingProgress = shippingSettings.freeShippingEnabled && subtotal < freeShippingThreshold;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-black mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Discount Savings Banner */}
        {discountTiers.length > 0 && (() => {
          // Find current active tier (highest tier where subtotal >= minimumOrderAmount)
          const activeTier = [...discountTiers]
            .reverse()
            .find((t) => subtotal >= t.minimumOrderAmount && t.discountPercentage > 0);

          // Find next tier to unlock
          const nextTier = discountTiers.find(
            (t) => subtotal < t.minimumOrderAmount && t.discountPercentage > 0
          );

          // Calculate current savings
          const currentSavings = activeTier
            ? (subtotal * activeTier.discountPercentage) / 100
            : 0;

          // Calculate potential savings at next tier
          const nextTierSavings = nextTier
            ? (subtotal * nextTier.discountPercentage) / 100
            : 0;

          const amountToNextTier = nextTier
            ? nextTier.minimumOrderAmount - subtotal
            : 0;

          const progressToNext = nextTier
            ? Math.min((subtotal / nextTier.minimumOrderAmount) * 100, 100)
            : 100;

          const accountLabel =
            normalizeAccountType(accountType) === 'VOLUME_BUYER'
              ? 'Volume Buyer'
              : normalizeAccountType(accountType) === 'GOVERNMENT'
              ? 'Government'
              : 'Member';

          return (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {accountLabel} Exclusive Savings
                      </h3>
                      <p className="text-emerald-100 text-sm">
                        {activeTier
                          ? `You're saving ${activeTier.discountPercentage}% on your order!`
                          : 'Unlock volume discounts on your order'}
                      </p>
                    </div>
                  </div>
                  {activeTier && currentSavings > 0 && (
                    <div className="text-right">
                      <div className="text-emerald-100 text-xs uppercase tracking-wide font-medium">Your Savings</div>
                      <div className="text-white text-2xl font-bold">
                        ${currentSavings.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tiers display */}
              <div className="bg-white px-6 py-5">
                {/* Tier steps */}
                <div className="flex items-center gap-3 mb-4">
                  {discountTiers.filter(t => t.discountPercentage > 0).map((tier, index, arr) => {
                    const isActive = subtotal >= tier.minimumOrderAmount;
                    const isCurrent = activeTier?.id === tier.id;

                    return (
                      <div key={tier.id} className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {isActive ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div>
                              <span className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                                {tier.discountPercentage}% Off
                              </span>
                              {isCurrent && (
                                <span className="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`text-xs ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {tier.minimumOrderAmount > 0
                              ? `Orders $${tier.minimumOrderAmount.toLocaleString()}+`
                              : 'All orders'}
                          </p>
                        </div>
                        {index < arr.length - 1 && (
                          <div className={`w-8 h-0.5 ${isActive ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Next tier progress */}
                {nextTier && amountToNextTier > 0 && (
                  <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-semibold text-amber-800">
                          Add ${amountToNextTier.toFixed(2)} more to unlock {nextTier.discountPercentage}% discount!
                        </span>
                      </div>
                      <span className="text-sm font-bold text-amber-700">
                        Save ${nextTierSavings.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] text-amber-600 font-medium">${subtotal.toFixed(0)}</span>
                      <span className="text-[11px] text-amber-600 font-medium">${nextTier.minimumOrderAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* All tiers unlocked */}
                {!nextTier && activeTier && (
                  <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-emerald-800">Maximum discount unlocked!</span>
                      <p className="text-xs text-emerald-600">
                        You're getting the best {activeTier.discountPercentage}% discount on your entire order.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {cart.items.map((item: any, index: number) => {
                // Use stored discounted price if available
                const price = item.price ? Number(item.price) : Number(item.product.salePrice || item.product.basePrice);
                const originalPrice = Number(item.product.salePrice || item.product.basePrice);
                const hasDiscount = item.price && Number(item.price) < originalPrice;
                const images = (item.product.images as string[]) || [];
                const minOrderQty = item.product.minimumOrderQty || 1;

                return (
                  <div
                    key={item.id}
                    className={`p-6 ${index !== cart.items.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShieldCheck className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="text-lg font-semibold text-black hover:text-safety-green-700 transition-colors mb-1">
                            {item.product.name}
                          </h3>
                        </Link>
                        <div className="text-sm text-gray-600 mb-2">
                          SKU: {item.product.sku}
                        </div>
                        {item.product.category && (
                          <div className="text-sm text-safety-green-600 mb-3">
                            {item.product.category.name}
                          </div>
                        )}

                        <CartItemActions
                          itemId={item.id}
                          quantity={item.quantity}
                          minOrderQty={minOrderQty}
                          stockQuantity={item.product.stockQuantity}
                        />

                        {/* Stock Warning */}
                        {item.quantity > item.product.stockQuantity && (
                          <div className="mt-3 text-sm text-red-600">
                            Only {item.product.stockQuantity} available in stock
                          </div>
                        )}
                        {item.product.stockQuantity < 10 && item.quantity <= item.product.stockQuantity && (
                          <div className="mt-3 text-sm text-orange-600">
                            Only {item.product.stockQuantity} left in stock
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold text-black">
                          ${(price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${price.toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link href="/products">
                <Button variant="outline" className="gap-2 border-black text-black hover:bg-black hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>

              {/* Discount Savings - Compact Sidebar Version */}
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
                const accountLabel = normalizeAccountType(accountType) === 'VOLUME_BUYER' ? 'Volume Buyer' : normalizeAccountType(accountType) === 'GOVERNMENT' ? 'Government' : 'Member';

                return (
                  <div className="mb-6 rounded-xl overflow-hidden shadow-md border border-gray-100">
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">{accountLabel} Savings</h4>
                            <p className="text-emerald-100 text-[10px]">
                              {activeTier ? `Saving ${activeTier.discountPercentage}%!` : 'Unlock volume discounts'}
                            </p>
                          </div>
                        </div>
                        {activeTier && currentSavings > 0 && (
                          <div className="text-right">
                            <div className="text-emerald-100 text-[9px] uppercase tracking-wide">Savings</div>
                            <div className="text-white text-lg font-bold">${currentSavings.toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
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
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-amber-800">
                              Add ${amountToNextTier.toFixed(2)} for {nextTier.discountPercentage}% off
                            </span>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
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

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Estimated Shipping</span>
                  <span className="font-medium">
                    {estimatedShipping === 0 ? (
                      <span className="text-safety-green-600">FREE</span>
                    ) : (
                      `$${estimatedShipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Estimated Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>

                {showFreeShippingProgress && (
                  <div className="bg-safety-green-50 border border-safety-green-200 rounded-md p-3 text-sm">
                    <div className="text-safety-green-800 font-medium mb-1">
                      Add ${(freeShippingThreshold - subtotal).toFixed(2)} more for FREE shipping!
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-safety-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-black">Total</span>
                  <span className="text-3xl font-bold text-black">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2 text-lg">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <Link href="/checkout?quote=true">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full mt-3 border-black text-black hover:bg-black hover:text-white"
                >
                  Request B2B Quote
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                  <span>ANSI certified safety equipment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                  <span>30-day return policy</span>
                </div>
              </div>

              {/* Accepted Payment Methods */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">We accept</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="px-2 py-1 border border-gray-300 rounded">Visa</div>
                  <div className="px-2 py-1 border border-gray-300 rounded">Mastercard</div>
                  <div className="px-2 py-1 border border-gray-300 rounded">Amex</div>
                  <div className="px-2 py-1 border border-gray-300 rounded">Discover</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
