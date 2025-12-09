'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Building2,
  Mail,
  Phone,
  User,
  FileText,
  CheckCircle,
  ArrowLeft,
  Loader2,
  DollarSign,
  Calendar,
  Shield,
  Clock
} from 'lucide-react';

export default function NetTermsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    taxId: '',
    yearsInBusiness: '',
    annualRevenue: '',
    requestedTerms: '',
    creditReferences: '',
    bankName: '',
    bankContact: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/net-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit net terms application');
      }
    } catch (error) {
      console.error('Error submitting net terms application:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-safety-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Application Submitted</h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying for net terms. Our credit team will review your application and contact you within 3-5 business days.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/b2b">
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Return to B2B Dashboard
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/b2b" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to B2B
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Net Terms Application</h1>
              <p className="text-gray-600">Apply for flexible payment terms</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Terms Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-6 text-center">
            <div className="w-12 h-12 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-safety-green-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-1">Net 30</h3>
            <p className="text-sm text-gray-600">Pay within 30 days of invoice</p>
          </div>
          <div className="bg-white rounded-lg border p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-1">Net 45</h3>
            <p className="text-sm text-gray-600">Pay within 45 days of invoice</p>
          </div>
          <div className="bg-white rounded-lg border p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-1">Net 60</h3>
            <p className="text-sm text-gray-600">Pay within 60 days of invoice</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div>
                  <h2 className="text-lg font-bold text-black mb-4">Company Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Company Name *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="Your Company Name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Tax ID / EIN *
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="XX-XXXXXXX"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Contact Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Years in Business *
                      </label>
                      <select
                        name="yearsInBusiness"
                        value={formData.yearsInBusiness}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                      >
                        <option value="">Select years</option>
                        <option value="0-1">Less than 1 year</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h2 className="text-lg font-bold text-black mb-4">Financial Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Annual Revenue *
                      </label>
                      <select
                        name="annualRevenue"
                        value={formData.annualRevenue}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                      >
                        <option value="">Select range</option>
                        <option value="under-100k">Under $100,000</option>
                        <option value="100k-500k">$100,000 - $500,000</option>
                        <option value="500k-1m">$500,000 - $1 million</option>
                        <option value="1m-5m">$1 million - $5 million</option>
                        <option value="5m-10m">$5 million - $10 million</option>
                        <option value="10m+">$10 million+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Requested Terms *
                      </label>
                      <select
                        name="requestedTerms"
                        value={formData.requestedTerms}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                      >
                        <option value="">Select terms</option>
                        <option value="net30">Net 30</option>
                        <option value="net45">Net 45</option>
                        <option value="net60">Net 60</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bank Reference */}
                <div>
                  <h2 className="text-lg font-bold text-black mb-4">Bank Reference</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                        placeholder="Bank of America"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Bank Contact / Phone
                      </label>
                      <input
                        type="text"
                        name="bankContact"
                        value={formData.bankContact}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                        placeholder="Contact name or phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Trade References */}
                <div>
                  <h2 className="text-lg font-bold text-black mb-4">Trade References</h2>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Credit References (3 required) *
                    </label>
                    <textarea
                      name="creditReferences"
                      value={formData.creditReferences}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                      placeholder="Please provide 3 trade references with company name, contact name, phone, and email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-safety-green-600 hover:bg-safety-green-700 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-black mb-4">Benefits of Net Terms</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>Improve cash flow management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>Simplify purchasing process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>Consolidated monthly invoicing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>No credit card fees</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Secure Application</h3>
                  <p className="text-sm text-blue-700">
                    Your information is encrypted and will only be used for credit evaluation purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-black mb-2">Questions?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact our credit team for assistance.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>credit@adasupply.com</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  <span>1-800-ADASUPPLY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
