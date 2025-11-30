import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Safety Equipment Store',
  description: 'Information about how we use cookies on our website',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Cookie Policy</h1>

          <p className="text-sm text-gray-500 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit our website.
                They help us provide you with a better experience by remembering your preferences and understanding how
                you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Cookies</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies are necessary for the website to function properly. They enable core functionality such as:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Security and authentication</li>
                  <li>Shopping cart functionality</li>
                  <li>Session management</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies help us understand how visitors use our website:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Page visit statistics</li>
                  <li>User navigation patterns</li>
                  <li>Error tracking</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Functionality Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies remember your preferences:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Language preferences</li>
                  <li>Recently viewed products</li>
                  <li>Display preferences</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Marketing Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies track your activity to provide relevant advertising:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Targeted advertising</li>
                  <li>Conversion tracking</li>
                  <li>Social media integration</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                We use services from trusted third parties that may also set cookies. These include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Google Analytics - for website analytics</li>
                <li>Payment processors - for secure transactions</li>
                <li>Social media platforms - for sharing functionality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
              <p className="text-gray-700 mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Browser settings - Most browsers allow you to refuse or accept cookies</li>
                <li>Cookie preference tool - Use our cookie management tool to customize your preferences</li>
                <li>Third-party tools - Use opt-out tools provided by third-party services</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                <p className="text-yellow-700">
                  Note: Blocking essential cookies may prevent you from using certain features of our website.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time. Please review this page periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about our use of cookies:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li>Email: privacy@safetyequipmentstore.com</li>
                <li>Phone: 1-800-SAFETY-1 (1-800-723-3891)</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
