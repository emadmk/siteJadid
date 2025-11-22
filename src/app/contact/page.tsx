'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    accountType: 'general',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real implementation, you would send this to an API endpoint
    console.log('Contact form submitted:', formData);

    setSubmitStatus('success');
    setIsSubmitting(false);

    // Reset form after successful submission
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        accountType: 'general',
      });
      setSubmitStatus('idle');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-safety-green-100">
            We're here to help with all your safety equipment needs
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-black mb-6">Send us a message</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Message sent successfully!</p>
                    <p className="text-sm text-green-700 mt-1">We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Failed to send message</p>
                    <p className="text-sm text-red-700 mt-1">Please try again or contact us directly.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                      Your Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="accountType" className="block text-sm font-medium text-black mb-2">
                      Inquiry Type *
                    </label>
                    <select
                      id="accountType"
                      name="accountType"
                      required
                      value={formData.accountType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="sales">Sales</option>
                      <option value="support">Customer Support</option>
                      <option value="b2b">B2B Partnership</option>
                      <option value="gsa">GSA Contract</option>
                      <option value="technical">Technical Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-black mb-2">
                    Subject *
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-black mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base font-medium gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">Contact Information</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-black">Phone</div>
                    <a href="tel:1-800-SAFETY-1" className="text-sm text-gray-600 hover:text-safety-green-600">
                      1-800-SAFETY-1
                    </a>
                    <div className="text-sm text-gray-600">(1-800-723-3891)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-black">Email</div>
                    <a href="mailto:info@safetypro.com" className="text-sm text-gray-600 hover:text-safety-green-600">
                      info@safetypro.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-black">Address</div>
                    <div className="text-sm text-gray-600">
                      1234 Safety Boulevard<br />
                      Suite 500<br />
                      Industrial Park, CA 90210
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-black">Business Hours</div>
                    <div className="text-sm text-gray-600">
                      Monday - Friday: 8:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Contacts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">Department Contacts</h3>

              <div className="space-y-3">
                <div className="pb-3 border-b border-gray-200">
                  <div className="font-medium text-black text-sm">Sales Team</div>
                  <a href="mailto:sales@safetypro.com" className="text-sm text-safety-green-600 hover:text-safety-green-700">
                    sales@safetypro.com
                  </a>
                </div>

                <div className="pb-3 border-b border-gray-200">
                  <div className="font-medium text-black text-sm">Customer Support</div>
                  <a href="mailto:support@safetypro.com" className="text-sm text-safety-green-600 hover:text-safety-green-700">
                    support@safetypro.com
                  </a>
                </div>

                <div className="pb-3 border-b border-gray-200">
                  <div className="font-medium text-black text-sm">B2B Partnerships</div>
                  <a href="mailto:b2b@safetypro.com" className="text-sm text-safety-green-600 hover:text-safety-green-700">
                    b2b@safetypro.com
                  </a>
                </div>

                <div>
                  <div className="font-medium text-black text-sm">GSA Contracts</div>
                  <a href="mailto:gsa@safetypro.com" className="text-sm text-safety-green-600 hover:text-safety-green-700">
                    gsa@safetypro.com
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-safety-green-600 to-safety-green-700 rounded-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Need immediate help?</h3>
              <div className="space-y-3">
                <Link href="/faq">
                  <Button variant="outline" className="w-full bg-white text-safety-green-700 hover:bg-gray-100 border-0">
                    View FAQ
                  </Button>
                </Link>
                <Link href="/shipping">
                  <Button variant="outline" className="w-full bg-white text-safety-green-700 hover:bg-gray-100 border-0">
                    Shipping Info
                  </Button>
                </Link>
                <Link href="/returns">
                  <Button variant="outline" className="w-full bg-white text-safety-green-700 hover:bg-gray-100 border-0">
                    Return Policy
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
