import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Database, Mail, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-safety-green-100">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Our Commitment to Privacy</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              SafetyPro Supply ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By using our website, you consent to the data practices described in this policy. If you do not agree with this policy, please do not access or use our services.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Information We Collect</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-black mb-3">Personal Information</h3>
                <p className="text-gray-600 mb-2">
                  We collect information that you provide directly to us when you:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Create an account (name, email address, phone number, password)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Place an order (billing and shipping addresses, payment information)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Contact customer service (inquiry details, correspondence)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Subscribe to newsletters or marketing communications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Leave product reviews or feedback</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-black mb-3">Business Account Information</h3>
                <p className="text-gray-600 mb-2">
                  For B2B and GSA accounts, we may also collect:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Company name and Tax ID/EIN</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Business license and certification documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>GSA contract numbers and agency information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Credit application information</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-black mb-3">Automatically Collected Information</h3>
                <p className="text-gray-600 mb-2">
                  We automatically collect certain information when you visit our website:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Device information (IP address, browser type, operating system)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Usage data (pages viewed, time spent, click patterns)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-safety-green-600 mt-1">•</span>
                    <span>Cookie data (preferences, shopping cart contents, session information)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">How We Use Your Information</h2>
            </div>

            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Process and fulfill your orders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Manage your account and provide customer service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Send order confirmations, shipping updates, and account notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Process payments and prevent fraud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Personalize your shopping experience and product recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Send marketing communications (with your consent)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Improve our website and services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Comply with legal obligations</span>
              </li>
            </ul>
          </div>

          {/* Information Sharing */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">How We Share Your Information</h2>
            </div>

            <p className="text-gray-600 mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-black mb-2">Service Providers</h3>
                <p className="text-gray-600">
                  Third-party companies that help us operate our business (payment processors, shipping carriers, email service providers, analytics providers).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">Business Transfers</h3>
                <p className="text-gray-600">
                  In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">Legal Requirements</h3>
                <p className="text-gray-600">
                  When required by law or to protect our rights, property, or safety, or that of others.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">With Your Consent</h3>
                <p className="text-gray-600">
                  Any other parties when we have your explicit consent.
                </p>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Data Security</h2>
            </div>

            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>SSL/TLS encryption for data transmission</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Secure servers and databases with access controls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Regular security audits and vulnerability assessments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Employee training on data protection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>PCI DSS compliance for payment processing</span>
              </li>
            </ul>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Your Privacy Rights</h2>
            </div>

            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Access, update, or delete your personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Opt-out of marketing communications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Request a copy of your data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Object to certain data processing activities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-safety-green-600 mt-1">•</span>
                <span>Lodge a complaint with a supervisory authority</span>
              </li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@safetypro.com" className="text-safety-green-600 hover:text-safety-green-700">
                privacy@safetypro.com
              </a>
            </p>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Cookies and Tracking</h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings. Note that disabling cookies may affect website functionality.
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Children's Privacy</h2>
            <p className="text-gray-600">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Contact Us</h2>
            </div>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <div>Email: <a href="mailto:privacy@safetypro.com" className="text-safety-green-600 hover:text-safety-green-700">privacy@safetypro.com</a></div>
              <div>Phone: <a href="tel:1-800-723-3891" className="text-safety-green-600 hover:text-safety-green-700">1-800-SAFETY-1</a></div>
              <div>Address: 1234 Safety Boulevard, Suite 500, Industrial Park, CA 90210</div>
            </div>
          </div>

          {/* Related Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/terms">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black mb-2">Terms of Service</h3>
                <p className="text-sm text-gray-600">Read our terms and conditions</p>
              </div>
            </Link>
            <Link href="/compliance">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black mb-2">Compliance</h3>
                <p className="text-sm text-gray-600">Learn about our certifications</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
