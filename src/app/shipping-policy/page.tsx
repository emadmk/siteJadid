import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | Safety Equipment Store',
  description: 'Information about our shipping methods, costs, and delivery times',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Shipping Policy</h1>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <p className="text-blue-700 font-semibold">Fast and reliable shipping across the nation!</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Methods</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Standard Shipping</td>
                      <td className="px-6 py-4 text-sm text-gray-700">5-7 business days</td>
                      <td className="px-6 py-4 text-sm text-gray-700">$9.99</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Expedited Shipping</td>
                      <td className="px-6 py-4 text-sm text-gray-700">2-3 business days</td>
                      <td className="px-6 py-4 text-sm text-gray-700">$19.99</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Overnight Shipping</td>
                      <td className="px-6 py-4 text-sm text-gray-700">1 business day</td>
                      <td className="px-6 py-4 text-sm text-gray-700">$39.99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Processing Time</h2>
              <p className="text-gray-700 mb-4">
                Orders are typically processed within 1-2 business days. You will receive a tracking number once your
                order ships.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Restrictions</h2>
              <p className="text-gray-700 mb-4">
                We currently ship to all 50 US states. Some items may have shipping restrictions due to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Hazardous materials regulations</li>
                <li>State-specific safety regulations</li>
                <li>Size and weight limitations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Shipping</h2>
              <p className="text-gray-700">
                Currently, we only ship within the United States. International shipping may be available in the future.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Tracking</h2>
              <p className="text-gray-700">
                Track your order at any time using your tracking number on our <a href="/track-order" className="text-blue-600 hover:underline">Order Tracking Page</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
