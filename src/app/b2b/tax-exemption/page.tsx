'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FileCheck,
  Building2,
  Mail,
  Phone,
  User,
  Upload,
  CheckCircle,
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';

export default function TaxExemptionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    taxId: '',
    exemptionType: '',
    states: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please upload your tax exemption certificate');
      return;
    }

    setIsSubmitting(true);

    try {
      // First, upload the file (if you have a file upload endpoint)
      // For now, we'll skip the file upload and submit the form data
      // TODO: Implement file upload to cloud storage

      const res = await fetch('/api/tax-exemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // certificateUrl will be added after file upload implementation
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit tax exemption request');
      }
    } catch (error) {
      console.error('Error submitting tax exemption:', error);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, JPG, or PNG file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-safety-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Certificate Submitted</h1>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your tax exemption certificate. Our team will verify your documents and update your account within 2-3 business days.
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
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Tax Exemption Certificate</h1>
              <p className="text-gray-600">Submit your certificate for tax-free purchases</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Exemption Type *
                      </label>
                      <select
                        name="exemptionType"
                        value={formData.exemptionType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        <option value="resale">Resale Certificate</option>
                        <option value="nonprofit">Non-Profit Organization</option>
                        <option value="government">Government Entity</option>
                        <option value="manufacturing">Manufacturing Exemption</option>
                        <option value="agricultural">Agricultural Exemption</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* States */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    States Covered by Certificate *
                  </label>
                  <textarea
                    name="states"
                    value={formData.states}
                    onChange={handleChange}
                    required
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                    placeholder="List all states covered by your exemption certificate (e.g., California, Texas, New York)"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <h2 className="text-lg font-bold text-black mb-4">Upload Certificate</h2>

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-safety-green-500 hover:bg-safety-green-50 transition-colors"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Click to upload your tax exemption certificate
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, JPG, or PNG (max 10MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-safety-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="w-full bg-safety-green-600 hover:bg-safety-green-700 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Certificate'
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-black mb-4">Accepted Documents</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>State resale certificates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>501(c)(3) determination letters</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>Government purchase orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>Multi-state exemption forms</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-900 mb-1">Important</h3>
                  <p className="text-sm text-yellow-700">
                    Your certificate must be valid and current. Expired certificates will not be accepted.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-black mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact us if you have questions about tax exemption.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>tax@adasupply.com</span>
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
