import { Metadata } from 'next';
import { Package, Truck, Clock, MapPin, DollarSign, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Information | Safety Equipment Store',
  description: 'Detailed shipping information, delivery times, and tracking for your safety equipment orders',
};

export default function ShippingInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Shipping Information</h1>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <p className="text-blue-700 font-semibold">Free Standard Shipping on all orders over $99!</p>
          </div>

          {/* Shipping Methods */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Shipping Methods & Rates</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Standard Shipping</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>5-7 business days</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>$9.99 (Free over $99)</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    Perfect for non-urgent orders. Most cost-effective option.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 ring-2 ring-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Expedited Shipping</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Popular</span>
                </div>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>2-3 business days</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>$19.99</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    Fast delivery when you need it sooner.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Overnight Shipping</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Next business day</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>$39.99</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    Emergency orders processed same day if placed before 2 PM EST.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Processing Time */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Processing Time</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Standard Orders:</strong> Processed within 1-2 business days
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Bulk Orders:</strong> May require 2-3 business days for processing
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Custom Orders:</strong> Processing time varies, typically 5-10 business days
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Cut-off Time:</strong> Orders placed before 2 PM EST ship same day (standard processing)
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Shipping Coverage */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Shipping Coverage</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Domestic Shipping</h3>
                <p className="text-gray-700 mb-3">We ship to all 50 US states including:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Continental United States</li>
                  <li>Alaska & Hawaii</li>
                  <li>US Territories (Puerto Rico, Guam, Virgin Islands)</li>
                  <li>APO/FPO Military Addresses</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">International Shipping</h3>
                <p className="text-gray-700 mb-3">
                  Currently not available. For international inquiries, please contact our sales team
                  at international@safetyequipmentstore.com
                </p>
              </div>
            </div>
          </section>

          {/* Order Tracking */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Once your order ships, you will receive:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Shipping confirmation email with tracking number</li>
                <li>Estimated delivery date</li>
                <li>Carrier information (USPS, FedEx, UPS, etc.)</li>
                <li>Real-time tracking updates</li>
              </ul>
              <p className="text-gray-700">
                Track your order anytime at our <a href="/track-order" className="text-blue-600 hover:underline font-medium">Order Tracking Page</a> or
                through your account dashboard.
              </p>
            </div>
          </section>

          {/* Special Shipping */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Shipping Circumstances</h2>

            <div className="space-y-4">
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Hazardous Materials</h3>
                <p className="text-gray-700">
                  Some items (aerosols, batteries, chemicals) require special handling and may have shipping
                  restrictions or additional fees. These will be clearly marked on the product page.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Oversized Items</h3>
                <p className="text-gray-700">
                  Large or heavy items (over 150 lbs) may require freight shipping. Our team will contact you
                  with shipping options and quotes before processing.
                </p>
              </div>

              <div className="border-l-4 border-green-500 bg-green-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">B2B & GSA Orders</h3>
                <p className="text-gray-700">
                  Business and government customers may have access to special shipping rates and options.
                  Contact your account manager for details.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About Shipping?</h2>
            <p className="mb-6">Our customer service team is here to help!</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="tel:1-800-723-3891" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Call 1-800-SAFETY-1
              </a>
              <a href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
                Contact Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
