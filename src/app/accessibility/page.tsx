import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Statement | Safety Equipment Store',
  description: 'Our commitment to web accessibility and inclusive design',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Accessibility Statement</h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
              <p className="text-gray-700 mb-4">
                Safety Equipment Store is committed to ensuring digital accessibility for people with disabilities.
                We are continually improving the user experience for everyone and applying the relevant accessibility standards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Conformance Status</h2>
              <p className="text-gray-700 mb-4">
                We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
                These guidelines explain how to make web content more accessible for people with disabilities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accessibility Features</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Keyboard navigation support</li>
                <li>Screen reader compatibility</li>
                <li>Alternative text for images</li>
                <li>Clear and consistent navigation</li>
                <li>Sufficient color contrast</li>
                <li>Resizable text without loss of functionality</li>
                <li>Form labels and error messages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback</h2>
              <p className="text-gray-700 mb-4">
                We welcome your feedback on the accessibility of Safety Equipment Store. Please let us know if you
                encounter accessibility barriers:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li>Email: accessibility@safetyequipmentstore.com</li>
                <li>Phone: 1-800-SAFETY-1 (1-800-723-3891)</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We try to respond to feedback within 5 business days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technical Specifications</h2>
              <p className="text-gray-700 mb-4">
                Accessibility of our website relies on the following technologies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>HTML5</li>
                <li>WAI-ARIA</li>
                <li>CSS</li>
                <li>JavaScript</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Assessment Approach</h2>
              <p className="text-gray-700">
                We assess the accessibility of our website through self-evaluation and ongoing monitoring.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
