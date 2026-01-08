'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Star, X, Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    companyName: '',
    address: '',
    telephone: '',
    industry: '',
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

  // Auto-rotate products
  useEffect(() => {
    if (products.length <= 3) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, products.length - 2));
    }, 4000);
    return () => clearInterval(timer);
  }, [products.length]);

  const visibleProducts = products.slice(currentIndex, currentIndex + 3);
  if (visibleProducts.length < 3 && products.length >= 3) {
    const remaining = 3 - visibleProducts.length;
    visibleProducts.push(...products.slice(0, remaining));
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, products.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, products.length - 2)) % Math.max(1, products.length - 2));
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

            {/* Products Carousel */}
            <div className="p-3 relative">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-100 rounded-lg mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  {products.length > 3 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1 transition-all"
                      >
                        <ChevronLeft className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1 transition-all"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-700" />
                      </button>
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {visibleProducts.map((product, idx) => (
                      <Link
                        key={`${product.id}-${idx}`}
                        href={`/products/${product.slug}`}
                        className="group bg-white rounded-lg border border-gray-100 p-1.5 hover:border-safety-green-400 hover:shadow-md transition-all"
                      >
                        <div className="h-20 bg-white rounded-md mb-1.5 flex items-center justify-center p-1">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-xl text-gray-300">📦</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-[10px] font-medium text-gray-800 line-clamp-2 group-hover:text-safety-green-600 transition-colors leading-tight">
                          {product.name}
                        </h4>
                        <div className="mt-0.5">
                          {product.salePrice ? (
                            <span className="text-xs font-bold text-safety-green-600">
                              ${Number(product.salePrice).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-900">
                              ${Number(product.basePrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {products.length > 3 && (
                    <div className="flex justify-center gap-1 mt-2">
                      {Array.from({ length: Math.max(1, products.length - 2) }).slice(0, 6).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            currentIndex === idx ? 'bg-safety-green-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
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

            {/* Content */}
            <div className="relative p-4 h-full flex flex-col items-center justify-center text-center">
              {/* Badge Image */}
              <div className="mb-3">
                <Image
                  src="/images/imagesite/badge copy.png"
                  alt="ADA Supply Badge"
                  width={80}
                  height={80}
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Text */}
              <p className="text-white text-base font-medium mb-4 max-w-xs leading-snug">
                Purchase on behalf of a company? Let us show you why customers choose us.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full max-w-xs">
                <Link
                  href="/auth/register?type=b2b"
                  className="flex-1 bg-white text-safety-green-700 px-3 py-2 rounded-lg font-semibold text-sm text-center hover:bg-gray-100 transition-colors"
                >
                  Register Now B2B
                </Link>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex-1 bg-white/20 text-white px-3 py-2 rounded-lg font-semibold text-sm text-center hover:bg-white/30 transition-colors border border-white/30"
                >
                  Contact us Now
                </button>
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
    </>
  );
}
