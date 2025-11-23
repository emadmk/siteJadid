import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Safety Equipment Store',
  description: 'Our return and refund policy for safety equipment purchases',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Return & Refund Policy</h1>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <p className="text-blue-700">
              We stand behind our products. 30-day return policy on most items.
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">30-Day Return Policy</h2>
              <p className="text-gray-700 mb-4">
                Return most items within 30 days of delivery. Items must be:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Unused and in original condition</li>
                <li>In original packaging with all tags</li>
                <li>Accompanied by proof of purchase</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Return</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <ol className="list-decimal pl-6 text-gray-700 space-y-3">
                  <li>Contact us at returns@safetyequipmentstore.com or call 1-800-SAFETY-1</li>
                  <li>Receive your RMA (Return Merchandise Authorization) number</li>
                  <li>Package item with RMA number on outside</li>
                  <li>Ship to our returns center using provided label</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
              <p className="text-gray-700 mb-4">
                Refunds processed within 5-10 business days after we receive your return.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Non-Returnable Items</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Used personal protective equipment</li>
                <li>Custom or personalized items</li>
                <li>Opened sealed safety filters or cartridges</li>
                <li>Final sale items</li>
              </ul>
            </section>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-8">
              <p className="text-green-700 font-semibold">Defective Items?</p>
              <p className="text-green-700">
                We provide prepaid return labels for defective or damaged items. Contact us within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
