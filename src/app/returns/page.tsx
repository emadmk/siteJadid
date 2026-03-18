import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | AdaSupply - Professional Safety Equipment',
  description: 'AdaSupply return and refund policy. 30-day hassle-free returns on safety equipment. ANSI certified products with satisfaction guarantee.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Return &amp; Refund Policy</h1>
          <p className="text-sm text-gray-500 mb-6">Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: March 15, 2025</p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <p className="text-blue-700">
              <strong>AdaSupply</strong> stands behind every product we sell. We offer a 30-day return policy on most items to ensure your complete satisfaction with your safety equipment purchase.
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">30-Day Return Policy</h2>
              <p className="text-gray-700 mb-4">
                You may return most items purchased from AdaSupply within 30 days of the delivery date for a full refund or exchange. To be eligible for a return, items must meet the following conditions:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Items must be unused, unworn, and in their original condition</li>
                <li>Items must be in their original packaging with all tags, labels, and accessories included</li>
                <li>A valid proof of purchase (order confirmation email, receipt, or invoice) must accompany the return</li>
                <li>Items must not have been altered, modified, or customized</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Initiate a Return</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <ol className="list-decimal pl-6 text-gray-700 space-y-3">
                  <li>
                    <strong>Contact Us:</strong> Email{' '}
                    <a href="mailto:returns@adasupply.com" className="text-blue-600 underline hover:text-blue-800">returns@adasupply.com</a>{' '}
                    or call <a href="tel:+14783298896" className="text-blue-600 underline hover:text-blue-800">478-329-8896</a>{' '}
                    with your order number and reason for return.
                  </li>
                  <li>
                    <strong>Receive Your RMA:</strong> Our team will issue a Return Merchandise Authorization (RMA) number and provide return instructions within 1 business day.
                  </li>
                  <li>
                    <strong>Package Your Item:</strong> Securely package the item in its original packaging. Write the RMA number clearly on the outside of the package.
                  </li>
                  <li>
                    <strong>Ship the Return:</strong> Use the prepaid return shipping label provided by our team (for eligible returns) or ship to our returns center at the address provided in your RMA email.
                  </li>
                </ol>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                <strong>Returns Address:</strong> AdaSupply Returns Center, 924 South Houston Lake Road, Warner Robins, GA 31088
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
              <p className="text-gray-700 mb-4">
                Once we receive and inspect your returned item, we will process your refund within 5&ndash;10 business days. Refunds will be issued to your original payment method.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Credit Card Refunds:</strong> Please allow an additional 5&ndash;10 business days for the refund to appear on your statement, depending on your card issuer.</li>
                <li><strong>PayPal Refunds:</strong> Refunds are typically reflected in your PayPal account within 3&ndash;5 business days.</li>
                <li><strong>ACH/Net Terms:</strong> For B2B customers on net terms, a credit will be applied to your account within 5 business days.</li>
                <li><strong>Store Credit:</strong> If you prefer, we can issue store credit for the full purchase amount, which can be used on any future order and does not expire.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Exchanges</h2>
              <p className="text-gray-700 mb-4">
                Need a different size, color, or product? We are happy to process exchanges at no additional cost. Simply mention that you would like an exchange when requesting your RMA, and our team will coordinate the swap. If the replacement item has a price difference, we will charge or refund the difference accordingly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Non-Returnable Items</h2>
              <p className="text-gray-700 mb-4">
                For health, safety, and hygiene reasons, the following items cannot be returned once opened or used:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Used personal protective equipment (PPE), including hard hats, respirators, and safety glasses that have been worn</li>
                <li>Opened or used respiratory filters, cartridges, and disposable ear plugs</li>
                <li>Custom-ordered, personalized, or specially configured items</li>
                <li>Items marked as &quot;Final Sale&quot; or &quot;Clearance &ndash; No Returns&quot;</li>
                <li>Hazardous materials or items with broken safety seals</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">GSA &amp; Government Returns</h2>
              <p className="text-gray-700 mb-4">
                Returns for orders placed under GSA Schedule contracts are subject to the terms of the applicable contract. Government customers should reference their contract number when initiating a return. For GSA-specific return inquiries, please contact our government sales team at{' '}
                <a href="mailto:gsa@adasupply.com" className="text-blue-600 underline hover:text-blue-800">gsa@adasupply.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Restocking Fees</h2>
              <p className="text-gray-700 mb-4">
                AdaSupply does not charge restocking fees on standard returns. However, a 15% restocking fee may apply in the following situations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Items returned without original packaging or missing accessories</li>
                <li>Items that show signs of use or wear beyond reasonable inspection</li>
                <li>Bulk orders returned after 15 days of delivery</li>
              </ul>
            </section>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-8">
              <p className="text-green-700 font-semibold">Defective or Damaged Items?</p>
              <p className="text-green-700 mb-2">
                We provide <strong>free prepaid return shipping labels</strong> for all defective, damaged, or incorrectly shipped items. Please contact us within 48 hours of delivery with photos of the damage, and we will arrange an immediate replacement or full refund at no cost to you.
              </p>
              <p className="text-green-700">
                Contact us: <a href="mailto:returns@adasupply.com" className="font-semibold underline">returns@adasupply.com</a> | <a href="tel:+14783298896" className="font-semibold underline">478-329-8896</a>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AdaSupply Contact Information</h3>
              <div className="text-gray-700 space-y-1 text-sm">
                <p><strong>Email:</strong> <a href="mailto:returns@adasupply.com" className="text-blue-600 underline">returns@adasupply.com</a></p>
                <p><strong>General:</strong> <a href="mailto:info@adasupply.com" className="text-blue-600 underline">info@adasupply.com</a></p>
                <p><strong>Phone:</strong> <a href="tel:+14783298896" className="text-blue-600 underline">478-329-8896</a></p>
                <p><strong>Address:</strong> 924 South Houston Lake Road, Warner Robins, Georgia 31088</p>
                <p><strong>Hours:</strong> Monday &ndash; Friday, 8:00 AM &ndash; 5:00 PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
