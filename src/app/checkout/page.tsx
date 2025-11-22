import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CreditCard, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

async function getCheckoutData(userId: string) {
  const [cart, addresses, user] = await Promise.all([
    db.cart.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
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
                weight: true,
              },
            },
          },
        },
      },
    }),
    db.address.findMany({
      where: {
        userId,
      },
      orderBy: {
        isDefault: 'desc',
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
      },
    }),
  ]);

  return { cart, addresses, user };
}

interface CheckoutPageProps {
  searchParams: {
    quote?: string;
  };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/checkout');
  }

  const { cart, addresses, user } = await getCheckoutData(session.user.id);

  if (!cart || cart.items.length === 0) {
    redirect('/cart');
  }

  const isB2BQuote = searchParams.quote === 'true';
  const isB2BAccount = user?.accountType === 'B2B';
  const isGSAAccount = user?.accountType === 'GSA';

  const subtotal = cart.items.reduce((sum: number, item: any) => {
    let price = item.product.salePrice || item.product.basePrice;

    if (isB2BAccount && item.product.wholesalePrice) {
      price = item.product.wholesalePrice;
    } else if (isGSAAccount && item.product.gsaPrice) {
      price = item.product.gsaPrice;
    }

    return sum + price * item.quantity;
  }, 0);

  const totalWeight = cart.items.reduce((sum: number, item: any) => {
    return sum + (item.product.weight || 0) * item.quantity;
  }, 0);

  const estimatedShipping = subtotal >= 99 ? 0 : totalWeight > 20 ? 35 : 15;
  const tax = isB2BAccount || isGSAAccount ? 0 : subtotal * 0.08;
  const total = subtotal + estimatedShipping + tax;

  const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];

  if (isB2BQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-black mb-2">Request B2B Quote</h1>
            <p className="text-gray-600">Get wholesale pricing for your organization</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <ShieldCheck className="w-16 h-16 text-safety-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-2">Quote Request Submitted</h2>
              <p className="text-gray-600">
                Our sales team will review your request and contact you within 24 hours with a customized quote.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-black mb-4">Items in Quote Request</h3>
              <div className="space-y-3">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product.name} (x{item.quantity})
                    </span>
                    <span className="font-medium text-black">
                      ${((item.product.wholesalePrice || item.product.basePrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/products" className="flex-1">
                <Button variant="outline" className="w-full border-black text-black hover:bg-black hover:text-white">
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-safety-green-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-4xl font-bold text-black mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-safety-green-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-bold text-black">Shipping Address</h2>
              </div>

              {defaultAddress ? (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-black mb-1">
                        {defaultAddress.firstName} {defaultAddress.lastName}
                      </div>
                      <div className="text-sm text-gray-700">
                        {defaultAddress.address1}
                        {defaultAddress.address2 && <>, {defaultAddress.address2}</>}
                      </div>
                      <div className="text-sm text-gray-700">
                        {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}
                      </div>
                      <div className="text-sm text-gray-700">{defaultAddress.country}</div>
                      {defaultAddress.phone && (
                        <div className="text-sm text-gray-700 mt-1">{defaultAddress.phone}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 mb-4">No shipping address on file</div>
              )}

              <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {defaultAddress ? 'Change Address' : 'Add Address'}
              </Button>
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-safety-green-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-xl font-bold text-black">Shipping Method</h2>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-4 p-4 border-2 border-safety-green-600 rounded-lg cursor-pointer bg-safety-green-50">
                  <input type="radio" name="shipping" defaultChecked className="w-4 h-4 text-safety-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-black">FedEx Ground</div>
                    <div className="text-sm text-gray-600">5-7 business days</div>
                  </div>
                  <div className="font-bold text-black">
                    {estimatedShipping === 0 ? 'FREE' : `$${estimatedShipping.toFixed(2)}`}
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <input type="radio" name="shipping" className="w-4 h-4 text-safety-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-black">FedEx 2Day</div>
                    <div className="text-sm text-gray-600">2 business days</div>
                  </div>
                  <div className="font-bold text-black">$29.99</div>
                </label>

                <label className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <input type="radio" name="shipping" className="w-4 h-4 text-safety-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-black">FedEx Overnight</div>
                    <div className="text-sm text-gray-600">Next business day</div>
                  </div>
                  <div className="font-bold text-black">$49.99</div>
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-safety-green-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h2 className="text-xl font-bold text-black">Payment Method</h2>
              </div>

              {isB2BAccount ? (
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 border-2 border-safety-green-600 rounded-lg cursor-pointer bg-safety-green-50">
                    <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-safety-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-black">Net 30 Terms</div>
                      <div className="text-sm text-gray-600">Pay within 30 days of invoice</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                    <input type="radio" name="payment" className="w-4 h-4 text-safety-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-black">Credit Card</div>
                      <div className="text-sm text-gray-600">Pay now with card</div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.items.map((item: any) => {
                  let price = item.product.salePrice || item.product.basePrice;
                  if (isB2BAccount && item.product.wholesalePrice) {
                    price = item.product.wholesalePrice;
                  } else if (isGSAAccount && item.product.gsaPrice) {
                    price = item.product.gsaPrice;
                  }

                  const images = (item.product.images as string[]) || [];

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                        {images[0] ? (
                          <img src={images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black line-clamp-2">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-sm font-bold text-black">
                        ${(price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {estimatedShipping === 0 ? (
                      <span className="text-safety-green-600">FREE</span>
                    ) : (
                      `$${estimatedShipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {!isB2BAccount && !isGSAAccount && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                )}
                {(isB2BAccount || isGSAAccount) && (
                  <div className="text-xs text-safety-green-600">Tax-exempt account</div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-black">Total</span>
                  <span className="text-3xl font-bold text-black">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                Place Order
              </Button>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-safety-green-600 flex-shrink-0" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-safety-green-600 flex-shrink-0" />
                  <span>PCI DSS compliant payment processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
