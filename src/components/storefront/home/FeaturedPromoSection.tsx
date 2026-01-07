'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Star, ShieldCheck, Building2, Award, Users, FileText } from 'lucide-react';

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
  // If we don't have enough products at the end, wrap around
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

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Box: Promotion Products */}
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <h3 className="text-white font-bold text-lg">Promotion Products</h3>
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
          <div className="p-4 relative">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                {/* Navigation Buttons */}
                {products.length > 3 && (
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

                {/* Products Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {visibleProducts.map((product, idx) => (
                    <Link
                      key={`${product.id}-${idx}`}
                      href={`/products/${product.slug}`}
                      className="group bg-white rounded-lg border border-gray-100 p-2 hover:border-safety-green-400 hover:shadow-md transition-all"
                    >
                      <div className="h-28 bg-white rounded-md mb-2 flex items-center justify-center p-2">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={100}
                            height={100}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-2xl text-gray-300">📦</span>
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-safety-green-600 transition-colors">
                        {product.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-1">
                        {product.salePrice ? (
                          <>
                            <span className="text-sm font-bold text-safety-green-600">
                              ${Number(product.salePrice).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ${Number(product.basePrice).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">
                            ${Number(product.basePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Dots Indicator */}
                {products.length > 3 && (
                  <div className="flex justify-center gap-1.5 mt-3">
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
              <div className="text-center py-8 text-gray-500">
                No featured products available
              </div>
            )}
          </div>
        </div>

        {/* Right Box: Business & Government Partners */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Content */}
          <div className="relative p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Trusted by Industry Leaders</h3>
                <p className="text-blue-200 text-sm">Your Partner in Safety Solutions</p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 flex-grow">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">GSA Contract</span>
                </div>
                <p className="text-blue-200 text-xs">Authorized federal supplier with competitive GSA pricing</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold text-sm">TAA Compliant</span>
                </div>
                <p className="text-blue-200 text-xs">Trade Agreements Act compliant products</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-300" />
                  <span className="text-white font-semibold text-sm">Enterprise</span>
                </div>
                <p className="text-blue-200 text-xs">Serving Fortune 500 companies nationwide</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-semibold text-sm">Certified</span>
                </div>
                <p className="text-blue-200 text-xs">ANSI/ISEA certified safety equipment</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-2">
              <Link
                href="/gsa"
                className="flex-1 bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm text-center hover:bg-blue-50 transition-colors"
              >
                GSA Pricing
              </Link>
              <Link
                href="/about"
                className="flex-1 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm text-center hover:bg-white/30 transition-colors"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
