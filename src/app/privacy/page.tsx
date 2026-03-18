import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AdaSupply - Professional Safety Equipment',
  description: 'AdaSupply Privacy Policy. Learn how we collect, use, and protect your personal information. CCPA, GDPR, and CalOPPA compliant.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-2">AdaSupply &mdash; Your Trusted Source for Professional Safety Equipment</p>
          <p className="text-sm text-gray-500 mb-10">
            Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: March 15, 2025
          </p>

          <div className="prose prose-lg max-w-none">

            {/* ───────── 1. INTRODUCTION ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                AdaSupply (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website{' '}
                <strong>www.adasupply.com</strong> and related services. We are a GSA Schedule Contract Holder providing ANSI-certified professional safety equipment for industrial, construction, and workplace safety needs.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, place orders, create an account, or otherwise interact with our services. This policy is designed to comply with:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>California Consumer Privacy Act (CCPA/CPRA)</strong> &mdash; California Civil Code &sect;1798.100 et seq.</li>
                <li><strong>California Online Privacy Protection Act (CalOPPA)</strong> &mdash; California Business &amp; Professions Code &sect;22575-22579</li>
                <li><strong>General Data Protection Regulation (GDPR)</strong> &mdash; EU Regulation 2016/679</li>
                <li><strong>Virginia Consumer Data Protection Act (VCDPA)</strong></li>
                <li><strong>Colorado Privacy Act (CPA)</strong></li>
                <li><strong>CAN-SPAM Act</strong> &mdash; 15 U.S.C. &sect;7701 et seq.</li>
                <li><strong>Children&apos;s Online Privacy Protection Act (COPPA)</strong> &mdash; 15 U.S.C. &sect;&sect;6501-6506</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our website and services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our practices, please discontinue use of our services immediately.
              </p>
            </section>

            {/* ───────── 2. INFORMATION WE COLLECT ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Personal Information You Provide</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information you voluntarily provide when you register for an account, place an order, subscribe to our newsletter, request a quote, contact customer service, or otherwise interact with us:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Identity Data:</strong> First name, last name, job title, company name</li>
                <li><strong>Contact Data:</strong> Email address, phone number, billing address, shipping address</li>
                <li><strong>Account Data:</strong> Username, password (stored in hashed form), account preferences</li>
                <li><strong>Financial Data:</strong> Payment card details, billing information (processed and stored exclusively by our PCI DSS-compliant payment processors)</li>
                <li><strong>Transaction Data:</strong> Order history, purchase amounts, product preferences, shipping details</li>
                <li><strong>Communication Data:</strong> Messages, emails, feedback, reviews, and support inquiries you send to us</li>
                <li><strong>Government/Business Data:</strong> For GSA and government orders &mdash; DUNS number, CAGE code, contract numbers, tax exemption certificates</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you access our website, we automatically collect certain technical and usage data:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Device Data:</strong> IP address, browser type and version, operating system, device type, screen resolution, and unique device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns, search queries, referring URLs, and navigation paths</li>
                <li><strong>Location Data:</strong> Approximate geographic location derived from IP address</li>
                <li><strong>Log Data:</strong> Server logs including access times, error logs, and HTTP request data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Information from Third Parties</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may receive information about you from third-party sources, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Payment processors (transaction confirmations and fraud prevention data)</li>
                <li>Shipping carriers (delivery status and tracking information)</li>
                <li>Analytics providers (aggregated website usage data)</li>
                <li>Business verification services (for B2B and government accounts)</li>
                <li>Marketing partners (with appropriate consent and data processing agreements)</li>
              </ul>
            </section>

            {/* ───────── 3. HOW WE USE YOUR INFORMATION ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We process your personal information for the following purposes, each supported by a lawful basis:
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Purpose</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr>
                      <td className="border border-gray-200 px-4 py-3">Processing and fulfilling orders, including shipping and returns</td>
                      <td className="border border-gray-200 px-4 py-3">Contract performance</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">Managing your account and providing customer support</td>
                      <td className="border border-gray-200 px-4 py-3">Contract performance</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3">Processing payments and preventing fraud</td>
                      <td className="border border-gray-200 px-4 py-3">Contract performance / Legitimate interest</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">Sending transactional emails (order confirmations, shipping updates)</td>
                      <td className="border border-gray-200 px-4 py-3">Contract performance</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3">Sending promotional communications and product recommendations</td>
                      <td className="border border-gray-200 px-4 py-3">Consent / Legitimate interest</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">Improving our website, products, and services</td>
                      <td className="border border-gray-200 px-4 py-3">Legitimate interest</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3">Analyzing usage patterns and conducting market research</td>
                      <td className="border border-gray-200 px-4 py-3">Legitimate interest</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">Ensuring website security and preventing abuse</td>
                      <td className="border border-gray-200 px-4 py-3">Legitimate interest</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3">Complying with legal obligations (tax, regulatory, and government contract requirements)</td>
                      <td className="border border-gray-200 px-4 py-3">Legal obligation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ───────── 4. INFORMATION SHARING AND DISCLOSURE ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>We do not sell, rent, or trade your personal information to third parties for their own marketing purposes.</strong> We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-3 text-gray-700">
                <li>
                  <strong>Payment Processors:</strong> We share payment data with PCI DSS-compliant payment processors (e.g., Stripe, PayPal) solely to process your transactions. We never store your full credit card number on our servers.
                </li>
                <li>
                  <strong>Shipping and Logistics Partners:</strong> We share shipping addresses and contact information with carriers (e.g., UPS, FedEx, USPS) to deliver your orders.
                </li>
                <li>
                  <strong>Service Providers:</strong> We engage trusted third-party companies to perform services on our behalf, including cloud hosting, email delivery, analytics, and customer support tools. These providers are contractually obligated to protect your data and use it only for the services they provide to us.
                </li>
                <li>
                  <strong>Government Agencies:</strong> For GSA Schedule orders, we may share necessary transaction data with relevant government agencies as required under federal procurement regulations.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> We may disclose information when required by law, subpoena, court order, or government regulation, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
                </li>
                <li>
                  <strong>Business Transfers:</strong> If AdaSupply is involved in a merger, acquisition, or sale of assets, your personal information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our website of any change in ownership.
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may share your information with third parties when you explicitly authorize us to do so.
                </li>
              </ul>
            </section>

            {/* ───────── 5. COOKIES AND TRACKING TECHNOLOGIES ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your browsing experience and collect usage data. Below is a summary of the types of cookies we use:
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Cookie Type</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Purpose</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">Strictly Necessary</td>
                      <td className="border border-gray-200 px-4 py-3">Essential for website operation, shopping cart functionality, user authentication, and security</td>
                      <td className="border border-gray-200 px-4 py-3">Session / 30 days</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Functional</td>
                      <td className="border border-gray-200 px-4 py-3">Remember your preferences, language settings, and recently viewed products</td>
                      <td className="border border-gray-200 px-4 py-3">Up to 1 year</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">Analytics</td>
                      <td className="border border-gray-200 px-4 py-3">Help us understand how visitors use our website through aggregated, anonymized data (e.g., Google Analytics)</td>
                      <td className="border border-gray-200 px-4 py-3">Up to 2 years</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Marketing</td>
                      <td className="border border-gray-200 px-4 py-3">Deliver relevant advertisements and measure campaign effectiveness (only with your consent)</td>
                      <td className="border border-gray-200 px-4 py-3">Up to 2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Managing Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. Please note that disabling strictly necessary cookies may prevent you from using certain features such as the shopping cart and checkout process.
              </p>
              <p className="text-gray-700 leading-relaxed">
                For more information about our cookie practices, please visit our{' '}
                <a href="/cookies" className="text-blue-600 underline hover:text-blue-800">Cookie Policy</a>.
              </p>
            </section>

            {/* ───────── 6. YOUR PRIVACY RIGHTS ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Privacy Rights</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 Rights for All Users</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Regardless of your location, you have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate or incomplete personal information</li>
                <li>Opt out of marketing communications at any time</li>
                <li>Request deletion of your account and associated data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 California Residents (CCPA/CPRA)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under the California Consumer Privacy Act (as amended by the California Privacy Rights Act), California residents have the following additional rights:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected about you</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions</li>
                <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Right to Opt-Out of Sale/Sharing:</strong> We do not sell or share your personal information for cross-context behavioral advertising</li>
                <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> Direct us to limit the use of your sensitive personal information</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your privacy rights</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@adasupply.com" className="text-blue-600 underline hover:text-blue-800">privacy@adasupply.com</a>{' '}
                or call <a href="tel:+14783298896" className="text-blue-600 underline hover:text-blue-800">478-329-8896</a>.
                We will verify your identity and respond within 45 days as required by law.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>CCPA Annual Disclosure:</strong> In the preceding 12 months, we have collected the categories of personal information described in Section 2. We have not sold personal information to third parties. We have disclosed personal information to service providers for the business purposes described in Section 4.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Virginia Residents (VCDPA)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Virginia residents have the right to access, correct, delete, and obtain a portable copy of their personal data, as well as the right to opt out of targeted advertising, sale of personal data, and profiling. You may appeal a decision regarding your request by contacting us.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.4 Colorado Residents (CPA)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Colorado residents have similar rights to access, correct, delete, and port their personal data, and to opt out of targeted advertising, sale of personal data, and certain profiling activities.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.5 EU/EEA Residents (GDPR)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are located in the European Union or European Economic Area, you have additional rights under the GDPR:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Right to Access:</strong> Obtain confirmation of whether we process your data and receive a copy</li>
                <li><strong>Right to Rectification:</strong> Correct any inaccurate or incomplete personal data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interest or for direct marketing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time, without affecting prior processing</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection supervisory authority</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.6 Marketing Communications</h3>
              <p className="text-gray-700 leading-relaxed">
                You can opt out of marketing emails at any time by clicking the &quot;unsubscribe&quot; link in any promotional email, updating your communication preferences in your account settings, or contacting us directly. Please note that even after opting out of marketing emails, you will still receive transactional communications related to your orders and account.
              </p>
            </section>

            {/* ───────── 7. DATA SECURITY ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We take the security of your personal information seriously and implement industry-standard technical and organizational measures to protect it:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Encryption in Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (HTTPS)</li>
                <li><strong>Encryption at Rest:</strong> Sensitive data stored in our databases is encrypted using AES-256 encryption</li>
                <li><strong>PCI DSS Compliance:</strong> All payment processing is handled by PCI DSS Level 1 certified payment processors. We never store full credit card numbers on our systems.</li>
                <li><strong>Access Controls:</strong> Strict role-based access controls and multi-factor authentication for all administrative access</li>
                <li><strong>Regular Audits:</strong> Periodic security assessments, vulnerability scans, and penetration testing</li>
                <li><strong>Incident Response:</strong> Documented incident response procedures to quickly identify, contain, and remediate security incidents</li>
                <li><strong>Employee Training:</strong> All employees with access to personal data receive regular privacy and security training</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                While we strive to protect your personal information using commercially reasonable measures, no electronic storage or transmission method is 100% secure. If you have reason to believe your interaction with us is no longer secure, please contact us immediately.
              </p>
            </section>

            {/* ───────── 8. DATA RETENTION ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable law:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Account Data:</strong> Retained for the duration of your account and up to 30 days after account deletion</li>
                <li><strong>Transaction Records:</strong> Retained for 7 years as required by IRS and state tax regulations</li>
                <li><strong>Government Contract Records:</strong> Retained as required by Federal Acquisition Regulation (FAR) record retention requirements</li>
                <li><strong>Marketing Data:</strong> Retained until you unsubscribe or request deletion</li>
                <li><strong>Analytics Data:</strong> Retained in anonymized/aggregated form for up to 26 months</li>
                <li><strong>Communication Records:</strong> Customer support interactions retained for up to 3 years</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                When personal data is no longer needed, we securely delete or anonymize it in accordance with our data retention schedule.
              </p>
            </section>

            {/* ───────── 9. THIRD-PARTY SERVICES ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our website may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the following categories of third-party services:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li><strong>Payment Processing:</strong> Secure payment gateways for credit card and electronic payment processing</li>
                <li><strong>Shipping &amp; Logistics:</strong> Major carriers for order fulfillment and delivery tracking</li>
                <li><strong>Analytics:</strong> Website analytics tools to understand user behavior and improve our services</li>
                <li><strong>Cloud Infrastructure:</strong> Secure cloud hosting providers for data storage and processing</li>
                <li><strong>Email Services:</strong> Transactional and marketing email delivery platforms</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                All third-party service providers are contractually obligated to protect your data and are prohibited from using it for any purpose other than providing the contracted services.
              </p>
            </section>

            {/* ───────── 10. CHILDREN'S PRIVACY ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our website and services are intended for use by individuals who are at least 18 years of age, or the legal age of majority in their jurisdiction. We do not knowingly collect, use, or disclose personal information from children under 13 years of age in compliance with the Children&apos;s Online Privacy Protection Act (COPPA).
              </p>
              <p className="text-gray-700 leading-relaxed">
                If we learn that we have inadvertently collected personal information from a child under 13, we will take steps to delete that information as promptly as possible. If you believe a child under 13 has provided us with personal information, please contact us immediately at{' '}
                <a href="mailto:privacy@adasupply.com" className="text-blue-600 underline hover:text-blue-800">privacy@adasupply.com</a>.
              </p>
            </section>

            {/* ───────── 11. INTERNATIONAL DATA TRANSFERS ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                AdaSupply is based in the United States, and your personal information is processed and stored on servers located within the United States. If you access our services from outside the United States, please be aware that your information will be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country.
              </p>
              <p className="text-gray-700 leading-relaxed">
                For transfers of personal data from the EU/EEA, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission, or other lawful transfer mechanisms, to ensure adequate protection of your data.
              </p>
            </section>

            {/* ───────── 12. DO NOT TRACK SIGNALS ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Do Not Track Signals</h2>
              <p className="text-gray-700 leading-relaxed">
                Some web browsers transmit &quot;Do Not Track&quot; (DNT) signals. As there is currently no industry standard for recognizing or honoring DNT signals, our website does not currently respond to DNT signals. However, you can manage your tracking preferences through your browser&apos;s cookie settings and through the opt-out mechanisms described in this policy.
              </p>
            </section>

            {/* ───────── 13. SMS/TEXT MESSAGE POLICY ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. SMS/Text Message Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you opt in to receive SMS or text message notifications from us (e.g., order updates, shipping alerts), the following terms apply:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>Message frequency varies based on your order activity</li>
                <li>Message and data rates may apply depending on your mobile carrier</li>
                <li>You can opt out at any time by replying &quot;STOP&quot; to any message</li>
                <li>Reply &quot;HELP&quot; for assistance</li>
                <li>We will not share your mobile number with third parties for marketing purposes</li>
              </ul>
            </section>

            {/* ───────── 14. CHANGES TO THIS PRIVACY POLICY ───────── */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                <li>We will update the &quot;Last Updated&quot; date at the top of this page</li>
                <li>For significant changes, we will provide a prominent notice on our website</li>
                <li>For changes that materially affect how we process your data, we will notify you by email (if you have an account with us)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We encourage you to review this Privacy Policy periodically. Your continued use of our services after the posting of changes constitutes your acceptance of those changes.
              </p>
            </section>

            {/* ───────── 15. CONTACT US ───────── */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through any of the following methods:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                <p className="text-gray-800 font-semibold text-lg">AdaSupply &mdash; Privacy Department</p>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <p className="text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:privacy@adasupply.com" className="text-blue-600 underline hover:text-blue-800">privacy@adasupply.com</a>
                  </p>
                  <p className="text-gray-700">
                    <strong>General Inquiries:</strong>{' '}
                    <a href="mailto:info@adasupply.com" className="text-blue-600 underline hover:text-blue-800">info@adasupply.com</a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Phone:</strong>{' '}
                    <a href="tel:+14783298896" className="text-blue-600 underline hover:text-blue-800">478-329-8896</a>
                  </p>
                  <p className="text-gray-700">
                    <strong>Mailing Address:</strong>
                  </p>
                  <p className="text-gray-700 pl-6">AdaSupply</p>
                  <p className="text-gray-700 pl-6">Attn: Privacy Department</p>
                  <p className="text-gray-700 pl-6">924 South Houston Lake Road</p>
                  <p className="text-gray-700 pl-6">Warner Robins, Georgia 31088</p>
                  <p className="text-gray-700 pl-6">United States of America</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                We will acknowledge your request within 5 business days and provide a substantive response within 30&ndash;45 days, depending on the nature and complexity of your request, as required by applicable law.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              &copy; {new Date().getFullYear()} AdaSupply. All rights reserved. This Privacy Policy is effective as of the date stated above and applies to all visitors and users of{' '}
              <a href="https://www.adasupply.com" className="text-blue-600 underline hover:text-blue-800">www.adasupply.com</a>{' '}
              and related services. GSA Schedule Contract Holder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
