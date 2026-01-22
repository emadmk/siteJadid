'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Star, X, Phone, Mail, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageSize } from '@/lib/image-utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  images: string[];
  brand?: { name: string };
}

export function FeaturedPromoSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    companyName: '',
    address: '',
    telephone: '',
    industry: '',
  });
  const [quoteForm, setQuoteForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    products: '',
    quantity: '',
    timeline: '',
    message: '',
  });

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const res = await fetch('/api/products?featured=true&limit=12');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Auto-rotate products - 1 at a time
  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [products.length]);

  const currentProduct = products[currentIndex];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/storefront/b2b-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', companyName: '', address: '', telephone: '', industry: '' });
        setTimeout(() => {
          setShowContactModal(false);
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: quoteForm.companyName,
          contactName: quoteForm.contactName,
          email: quoteForm.email,
          phone: quoteForm.phone,
          products: quoteForm.products,
          quantity: quoteForm.quantity,
          timeline: quoteForm.timeline,
          message: quoteForm.message,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setQuoteForm({ companyName: '', contactName: '', email: '', phone: '', products: '', quantity: '', timeline: '', message: '' });
        setTimeout(() => {
          setShowQuoteModal(false);
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to submit quote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Box: Promotion Products */}
          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <h3 className="text-white font-bold text-base">Promotion Products</h3>
              </div>
              <Link
                href="/products?featured=true"
                className="text-white/90 hover:text-white text-sm flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Single Product Display */}
            <div className="p-4 relative">
              {isLoading ? (
                <div className="animate-pulse flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                    <div className="h-5 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ) : currentProduct ? (
                <>
                  {/* Navigation Arrows */}
                  {products.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1.5 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1.5 transition-all"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Single Product Card - Horizontal Layout */}
                  <Link
                    href={`/products/${currentProduct.slug}`}
                    className="group flex items-center gap-4 bg-white rounded-lg border border-gray-100 p-3 mx-6 hover:border-safety-green-400 hover:shadow-md transition-all"
                  >
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                      {currentProduct.images?.[0] ? (
                        <img
                          src={getImageSize(currentProduct.images[0], 'medium')}
                          alt={currentProduct.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl text-gray-300">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      {currentProduct.brand && (
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {currentProduct.brand.name}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-safety-green-600 transition-colors leading-snug mt-0.5">
                        {currentProduct.name}
                      </h4>
                      <div className="mt-2 flex items-center gap-2">
                        {currentProduct.salePrice ? (
                          <>
                            <span className="text-lg font-bold text-safety-green-600">
                              ${Number(currentProduct.salePrice).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              ${Number(currentProduct.basePrice).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${Number(currentProduct.basePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Dots Indicator */}
                  {products.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                      {products.slice(0, 8).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            currentIndex === idx ? 'bg-safety-green-600' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                      {products.length > 8 && (
                        <span className="text-xs text-gray-400 ml-1">+{products.length - 8}</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No featured products available
                </div>
              )}
            </div>
          </div>

          {/* Right Box: B2B Promo */}
          <div className="bg-gradient-to-br from-safety-green-700 via-safety-green-600 to-safety-green-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Content - Logo Left, Text Right */}
            <div className="relative p-4 h-full flex items-center gap-4">
              {/* Badge Image - Left Side Big */}
              <div className="flex-shrink-0">
                <Image
                  src="/images/imagesite/badge copy.png"
                  alt="ADA Supply Badge"
                  width={140}
                  height={140}
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Text & Buttons - Right Side */}
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white text-base font-medium mb-3 leading-snug">
                  Purchase on behalf of a company?<br />
                  or need a personalised quote?<br />
                  Let us show you why customers choose us.
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/auth/signup?type=b2b"
                    className="bg-white text-safety-green-700 px-3 py-2 rounded-lg font-semibold text-sm text-center hover:bg-gray-100 transition-colors"
                  >
                    Register B2B
                  </Link>
                  <button
                    onClick={() => setShowQuoteModal(true)}
                    className="bg-yellow-400 text-gray-900 px-3 py-2 rounded-lg font-semibold text-sm text-center hover:bg-yellow-300 transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Request Quote
                  </button>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-white/20 text-white px-3 py-2 rounded-lg font-semibold text-sm text-center hover:bg-white/30 transition-colors border border-white/30"
                  >
                    Contact us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Contact B2B Team</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-safety-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h4>
                  <p className="text-gray-600">We will contact you shortly.</p>
                </div>
              ) : (
                <>
                  {/* Contact Info */}
                  <div className="bg-safety-green-50 border border-safety-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-safety-green-700 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">478-329-8896</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-safety-green-700">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">b2b@adasupply.com</span>
                    </div>
                  </div>

                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.companyName}
                        onChange={(e) => setContactForm({ ...contactForm, companyName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={contactForm.address}
                        onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Enter address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telephone Number *</label>
                      <input
                        type="tel"
                        required
                        value={contactForm.telephone}
                        onChange={(e) => setContactForm({ ...contactForm, telephone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <select
                        value={contactForm.industry}
                        onChange={(e) => setContactForm({ ...contactForm, industry: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      >
                        <option value="">Select industry</option>
                        <option value="Construction">Construction</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Government">Government</option>
                        <option value="Oil & Gas">Oil & Gas</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-white py-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Inquiry'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Request Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Request a Quote</h3>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-safety-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Quote Request Submitted!</h4>
                  <p className="text-gray-600">We will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleQuoteSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={quoteForm.companyName}
                        onChange={(e) => setQuoteForm({ ...quoteForm, companyName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={quoteForm.contactName}
                        onChange={(e) => setQuoteForm({ ...quoteForm, contactName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="email@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={quoteForm.phone}
                        onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Products/Items *</label>
                    <textarea
                      required
                      rows={2}
                      value={quoteForm.products}
                      onChange={(e) => setQuoteForm({ ...quoteForm, products: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      placeholder="List the products you need..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="text"
                        required
                        value={quoteForm.quantity}
                        onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                        placeholder="e.g. 100-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                      <select
                        value={quoteForm.timeline}
                        onChange={(e) => setQuoteForm({ ...quoteForm, timeline: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      >
                        <option value="">Select timeline</option>
                        <option value="ASAP">ASAP</option>
                        <option value="1-2 weeks">1-2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      rows={2}
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                      placeholder="Any special requirements..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-white py-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quote Request'
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
