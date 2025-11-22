import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RotateCcw, Package, Clock, Ban, CheckCircle } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Return Policy</h1>
          <p className="text-safety-green-100">
            30-day hassle-free returns on all products
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Return Policy Banner */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8 text-center">
            <RotateCcw className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">30-Day Return Policy</h2>
            <p className="text-xl text-safety-green-100">Not satisfied? Return it within 30 days for a full refund</p>
          </div>

          {/* Return Process */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <Package className="w-6 h-6 text-safety-green-600" />
                How to Return an Item
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Initiate Return Request</h3>
                    <p className="text-gray-600">
                      Log in to your account and navigate to your order history. Select the order and items you wish to return. Provide a reason for the return to help us improve our products and services.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Receive Return Authorization</h3>
                    <p className="text-gray-600">
                      Once approved, you'll receive a Return Merchandise Authorization (RMA) number and a prepaid return shipping label via email within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Pack and Ship</h3>
                    <p className="text-gray-600">
                      Pack the item securely in its original packaging (if possible). Include all accessories, manuals, and documentation. Attach the prepaid shipping label and drop off at any authorized shipping location.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Receive Refund</h3>
                    <p className="text-gray-600">
                      Once we receive and inspect your return, we'll process your refund within 5-7 business days to your original payment method.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Return Eligibility */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-safety-green-600" />
                Return Eligibility
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-black">Items must meet the following criteria:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <span>Returned within 30 days of delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <span>In original, unused condition with all tags and packaging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <span>Include all accessories, manuals, and documentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <span>Not damaged or modified by customer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <span>Have valid proof of purchase</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <Ban className="w-6 h-6 text-red-600" />
                Non-Returnable Items
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-600">The following items cannot be returned for health and safety reasons:</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Personal protective equipment that has been opened or used (respirators, face shields, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Custom or personalized safety equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Clearance or final sale items (marked as such)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Opened first aid kits or medical supplies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Damaged items due to misuse or negligence</span>
                  </li>
                </ul>
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Defective items can be returned regardless of the above restrictions. Contact customer service for assistance with defective products.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Information */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <Clock className="w-6 h-6 text-safety-green-600" />
                Refund Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">Processing Time</h3>
                  <p className="text-gray-600">
                    Refunds are processed within 5-7 business days after we receive and inspect your returned item(s).
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">Refund Method</h3>
                  <p className="text-gray-600 mb-3">
                    Refunds are issued to the original payment method used for the purchase:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span><strong>Credit/Debit Cards:</strong> 5-10 business days after refund is processed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span><strong>PayPal:</strong> 2-3 business days after refund is processed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span><strong>B2B Accounts:</strong> Credit applied to account within 3 business days</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-2">Shipping Costs</h3>
                  <p className="text-gray-600">
                    Original shipping costs are non-refundable unless the return is due to our error or a defective product. We provide free return shipping labels for all returns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Exchanges */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Exchanges</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                We currently don't offer direct exchanges. If you need a different size, color, or product, please:
              </p>
              <ol className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Return the original item following our return process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Place a new order for the desired item</span>
                </li>
              </ol>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> To avoid stock issues, you may want to place your new order before returning the original item.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Need help with a return?</h3>
            <p className="mb-6 text-safety-green-100">
              Our customer service team is ready to assist you
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                  Contact Support
                </Button>
              </Link>
              <a href="tel:1-800-723-3891">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-safety-green-700">
                  Call 1-800-SAFETY-1
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
