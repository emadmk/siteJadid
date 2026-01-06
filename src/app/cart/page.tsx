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

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/cart');
  }

  const [cart, shippingSettings] = await Promise.all([
    getCart(session.user.id),
    getShippingSettings(),
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

  const subtotal = cart.items.reduce((sum: number, item: any) => {
    const price = Number(item.product.salePrice || item.product.basePrice);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {cart.items.map((item: any, index: number) => {
                const price = Number(item.product.salePrice || item.product.basePrice);
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
