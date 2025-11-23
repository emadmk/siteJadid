import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | SiteJadid',
  description: 'Privacy Policy and data protection information for SiteJadid e-commerce platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                SiteJadid ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. This policy complies with the California Consumer Privacy Act (CCPA), General Data Protection Regulation (GDPR), and California Online Privacy Protection Act (CalOPPA).
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using our website, you consent to the data practices described in this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Account credentials (username and password)</li>
                <li>Payment information (processed securely through our payment processors)</li>
                <li>Order history and preferences</li>
                <li>Company information for B2B accounts</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you access our website, we automatically collect:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and account</li>
                <li>Provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Detect and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Analyze usage patterns and trends</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> Third parties who provide services on our behalf (payment processing, shipping, email delivery)</li>
                <li><strong>Business Partners:</strong> With your consent, for joint marketing initiatives</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Remember your preferences and settings</li>
                <li>Keep you signed in to your account</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Personalize content and advertisements</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 California Residents (CCPA)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                California residents have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Know what personal information is collected</li>
                <li>Know whether personal information is sold or disclosed</li>
                <li>Access your personal information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of the sale of personal information</li>
                <li>Non-discrimination for exercising privacy rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 EU Residents (GDPR)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                EU residents have additional rights including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Right to access and portability</li>
                <li>Right to rectification</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Marketing Communications</h3>
              <p className="text-gray-700 leading-relaxed">
                You can opt-out of marketing emails by clicking the "unsubscribe" link in any marketing email or by updating your communication preferences in your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Encrypted storage of sensitive data</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Order history and transaction records are retained for tax and accounting purposes as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from your jurisdiction. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@sitejadid.com</p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> 1-800-XXX-XXXX</p>
                <p className="text-gray-700 mb-2"><strong>Mail:</strong> Privacy Department</p>
                <p className="text-gray-700 pl-12">SiteJadid Inc.</p>
                <p className="text-gray-700 pl-12">123 Main Street</p>
                <p className="text-gray-700 pl-12">New York, NY 10001</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Do Not Track Signals</h2>
              <p className="text-gray-700 leading-relaxed">
                Some browsers have a "Do Not Track" feature that lets you tell websites you do not want to have your online activities tracked. We currently do not respond to Do Not Track signals.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              This Privacy Policy is effective as of the date stated above and applies to all users of our website and services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
