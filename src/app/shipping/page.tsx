import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Truck, Package, Clock, MapPin, DollarSign, Globe } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Shipping Information</h1>
          <p className="text-safety-green-100">
            Fast, reliable delivery of safety equipment across the nation
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Free Shipping Banner */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">FREE SHIPPING</h2>
            <p className="text-xl text-safety-green-100">On all orders over $99</p>
          </div>

          {/* Shipping Rates */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-safety-green-600" />
                Shipping Rates
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-semibold text-black">Standard Shipping</div>
                    <div className="text-sm text-gray-600">5-7 business days</div>
                  </div>
                  <div className="text-lg font-bold text-black">$15.00</div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-semibold text-black">Express Shipping</div>
                    <div className="text-sm text-gray-600">2-3 business days</div>
                  </div>
                  <div className="text-lg font-bold text-black">$35.00</div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-semibold text-black">Overnight Shipping</div>
                    <div className="text-sm text-gray-600">Next business day</div>
                  </div>
                  <div className="text-lg font-bold text-black">$75.00</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-safety-green-700">Free Shipping</div>
                    <div className="text-sm text-gray-600">Orders over $99</div>
                  </div>
                  <div className="text-lg font-bold text-safety-green-600">FREE</div>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Shipping rates may vary for oversized or heavy items. Additional charges will be calculated at checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Times */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <Clock className="w-6 h-6 text-safety-green-600" />
                Delivery Timeframes
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">Order Processing</h3>
                  <p className="text-gray-600">
                    Orders are processed within 1-2 business days. Orders placed after 2 PM EST will be processed the next business day.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">Transit Times</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span><strong>Standard:</strong> 5-7 business days after processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span><strong>Express:</strong> 2-3 business days after processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span><strong>Overnight:</strong> Next business day after processing (orders before 2 PM EST)</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">Tracking</h3>
                  <p className="text-gray-600">
                    Once your order ships, you'll receive a tracking number via email. You can track your shipment through your account dashboard or by clicking the tracking link in your shipping confirmation email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Coverage */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <Globe className="w-6 h-6 text-safety-green-600" />
                Shipping Coverage
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">Domestic Shipping (USA)</h3>
                  <p className="text-gray-600 mb-3">
                    We ship to all 50 states, including Alaska and Hawaii. Additional shipping charges may apply to Alaska, Hawaii, and US territories.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                      <span>Continental US</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                      <span>Alaska</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                      <span>Hawaii</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                      <span>Puerto Rico</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                      <span>US Virgin Islands</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-safety-green-600" />
                      <span>Guam</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">International Shipping</h3>
                  <p className="text-gray-600">
                    For international shipping inquiries, please contact our sales team at{' '}
                    <a href="mailto:sales@safetypro.com" className="text-safety-green-600 hover:text-safety-green-700">
                      sales@safetypro.com
                    </a>{' '}
                    for a custom quote.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Shipping */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <Package className="w-6 h-6 text-safety-green-600" />
                Special Shipping Services
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">Bulk Orders</h3>
                  <p className="text-gray-600">
                    For bulk orders or palletized shipments, please contact our B2B team for freight shipping options and competitive rates.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">GSA Deliveries</h3>
                  <p className="text-gray-600">
                    Government agencies with GSA contracts may be eligible for specialized shipping options. Contact our GSA team for more information.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">Signature Required</h3>
                  <p className="text-gray-600">
                    For high-value orders, signature confirmation may be required upon delivery for your security.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Shipping FAQs</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">Can I change my shipping address after placing an order?</h3>
                  <p className="text-gray-600">
                    Yes, but only if your order hasn't been shipped yet. Contact customer service immediately at{' '}
                    <a href="tel:1-800-723-3891" className="text-safety-green-600 hover:text-safety-green-700">
                      1-800-SAFETY-1
                    </a>.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">Do you ship to PO boxes?</h3>
                  <p className="text-gray-600">
                    Yes, we ship to PO boxes via USPS for standard shipping. Express and overnight shipping require a physical address.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">What if my package is lost or damaged?</h3>
                  <p className="text-gray-600">
                    All shipments are insured. If your package is lost or arrives damaged, contact us within 48 hours and we'll resolve the issue immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Have shipping questions?</h3>
            <p className="mb-6 text-safety-green-100">
              Our customer service team is here to help
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                  Contact Us
                </Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-safety-green-700">
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
