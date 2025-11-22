import Link from 'next/link';
import { ShieldCheck, FileText, AlertCircle, Scale, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
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
              <FileText className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Agreement to Terms</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and SafetyPro Supply ("Company," "we," "our," or "us") concerning your access to and use of our website and services.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use our services.
            </p>
          </div>

          {/* Definitions */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Definitions</h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>"Services"</strong> refers to our e-commerce platform, products, and customer support.</p>
              <p><strong>"User," "You,"</strong> and <strong>"Your"</strong> refer to the individual or entity using our services.</p>
              <p><strong>"Products"</strong> refer to the safety equipment and related items offered for sale.</p>
              <p><strong>"Account"</strong> refers to your registered user profile on our platform.</p>
            </div>
          </div>

          {/* Account Registration */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Account Registration</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p>To use certain features of our services, you must register for an account. When registering:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-safety-green-600 mt-1">•</span>
                  <span>You must provide accurate, current, and complete information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-safety-green-600 mt-1">•</span>
                  <span>You must be at least 18 years old</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-safety-green-600 mt-1">•</span>
                  <span>You are responsible for maintaining the security of your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-safety-green-600 mt-1">•</span>
                  <span>You must not share your account credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-safety-green-600 mt-1">•</span>
                  <span>You must notify us immediately of any unauthorized access</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Purchases and Payment */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Purchases and Payment</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-black mb-2">Pricing</h3>
                <p className="text-gray-600">
                  All prices are in US Dollars and are subject to change without notice. We reserve the right to modify prices at any time. Pricing errors may be corrected, and orders placed at incorrect prices may be cancelled.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-black mb-2">Payment</h3>
                <p className="text-gray-600">
                  Payment must be received before order fulfillment. We accept major credit cards, PayPal, and ACH transfers for business accounts. By providing payment information, you authorize us to charge the specified amount.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-black mb-2">Order Acceptance</h3>
                <p className="text-gray-600">
                  Your order is an offer to purchase. We reserve the right to accept or decline any order for any reason, including product availability, errors in pricing or product information, or suspected fraud.
                </p>
              </div>
            </div>
          </div>

          {/* Shipping and Delivery */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Shipping and Delivery</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Delivery times are estimates and not guarantees. We are not liable for delays caused by shipping carriers, weather, or other circumstances beyond our control.
              </p>
              <p>
                Risk of loss and title for products pass to you upon delivery to the carrier. You are responsible for inspecting shipments upon receipt and reporting any damage within 48 hours.
              </p>
            </div>
          </div>

          {/* Returns and Refunds */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Returns and Refunds</h2>
            <p className="text-gray-600 mb-3">
              Our return policy allows returns within 30 days of delivery for most products. Please review our{' '}
              <Link href="/returns" className="text-safety-green-600 hover:text-safety-green-700">
                Return Policy
              </Link>{' '}
              for complete details.
            </p>
            <p className="text-gray-600">
              Refunds are processed to the original payment method within 5-7 business days after we receive and inspect the returned item.
            </p>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Product Information and Safety</h2>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                We strive to provide accurate product information and specifications. However, we do not warrant that product descriptions, images, or other content are accurate, complete, or error-free.
              </p>
              <p>
                <strong>Safety Equipment Use:</strong> All safety equipment must be used in accordance with manufacturer instructions and applicable safety regulations. Improper use may result in serious injury or death.
              </p>
              <p>
                You are solely responsible for determining the suitability of products for your intended use and ensuring compliance with all applicable safety standards and regulations.
              </p>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Intellectual Property Rights</h2>
            <p className="text-gray-600 mb-3">
              All content on our website, including text, graphics, logos, images, and software, is the property of SafetyPro Supply or its licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600">
              You may not copy, reproduce, distribute, modify, or create derivative works of our content without express written permission.
            </p>
          </div>

          {/* Prohibited Activities */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-black">Prohibited Activities</h2>
            </div>
            <p className="text-gray-600 mb-3">You may not:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Use our services for any illegal purpose</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Attempt to gain unauthorized access to our systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Interfere with or disrupt our services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Use automated systems to access our website (bots, scrapers)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Transmit viruses or malicious code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Impersonate any person or entity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>Violate any applicable laws or regulations</span>
              </li>
            </ul>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-8 h-8 text-safety-green-600" />
              <h2 className="text-2xl font-bold text-black">Limitation of Liability</h2>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAFETYPRO SUPPLY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
              </p>
              <p>
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SPECIFIC PRODUCT OR SERVICE THAT GAVE RISE TO THE CLAIM.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Some jurisdictions do not allow the limitation of certain warranties or liabilities. In such jurisdictions, our liability is limited to the maximum extent permitted by law.
                </p>
              </div>
            </div>
          </div>

          {/* Indemnification */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Indemnification</h2>
            <p className="text-gray-600">
              You agree to indemnify and hold harmless SafetyPro Supply, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising out of your use of our services or violation of these Terms.
            </p>
          </div>

          {/* Governing Law */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Governing Law and Disputes</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                These Terms are governed by the laws of the State of California, without regard to its conflict of laws principles.
              </p>
              <p>
                Any disputes arising from these Terms or your use of our services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </div>
          </div>

          {/* Changes to Terms */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <div>Email: <a href="mailto:legal@safetypro.com" className="text-safety-green-600 hover:text-safety-green-700">legal@safetypro.com</a></div>
              <div>Phone: <a href="tel:1-800-723-3891" className="text-safety-green-600 hover:text-safety-green-700">1-800-SAFETY-1</a></div>
              <div>Address: 1234 Safety Boulevard, Suite 500, Industrial Park, CA 90210</div>
            </div>
          </div>

          {/* Related Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/privacy">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black mb-2">Privacy Policy</h3>
                <p className="text-sm text-gray-600">Learn how we protect your data</p>
              </div>
            </Link>
            <Link href="/returns">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black mb-2">Return Policy</h3>
                <p className="text-sm text-gray-600">30-day hassle-free returns</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
