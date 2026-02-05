'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';
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

  // Auto-rotate products - show 3 at a time
  useEffect(() => {
    if (products.length <= 3) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 3));
    }, 5000);
    return () => clearInterval(timer);
  }, [products.length]);

  // Get current 3 products to display
  const startIdx = currentIndex * 3;
  const currentProducts = products.slice(startIdx, startIdx + 3);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(products.length / 3)) % Math.ceil(products.length / 3));
  };

  const totalPages = Math.ceil(products.length / 3);

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex gap-4">
        {/* Left Box: Promotion Products - 80% width */}
        <div className="flex-1 lg:w-4/5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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

          {/* Products Display - 3 items */}
          <div className="p-3 relative">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-100 rounded-lg mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : currentProducts.length > 0 ? (
              <>
                {/* Navigation Arrows */}
                {products.length > 3 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1 transition-all"
                    >
                      <ChevronLeft className="w-3 h-3 text-gray-700" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-1 transition-all"
                    >
                      <ChevronRight className="w-3 h-3 text-gray-700" />
                    </button>
                  </>
                )}

                {/* 3 Product Cards Grid - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mx-5">
                  {currentProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group bg-white rounded-lg border border-gray-100 p-2 hover:border-safety-green-400 hover:shadow-md transition-all"
                    >
                      {/* Product Image - Smaller */}
                      <div className="h-24 bg-white rounded-lg overflow-hidden mb-2">
                        {product.images?.[0] ? (
                          <img
                            src={getImageSize(product.images[0], 'medium')}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl text-gray-300">📦</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info - Compact */}
                      <div>
                        {product.brand && (
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                            {product.brand.name}
                          </span>
                        )}
                        <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-safety-green-600 transition-colors leading-tight mt-0.5">
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
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Dots Indicator */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          currentIndex === idx ? 'bg-safety-green-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No featured products available
              </div>
            )}
          </div>
        </div>

        {/* Right Box: 25 Years Badge - 20% width */}
        <div className="hidden lg:flex w-1/5 bg-gradient-to-br from-safety-green-700 via-safety-green-600 to-safety-green-800 rounded-xl overflow-hidden shadow-sm flex-col items-center justify-center relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Badge Image & Text */}
          <div className="relative p-3 flex flex-col items-center justify-center text-center">
            <Image
              src="/images/imagesite/badge copy.png"
              alt="Celebrating 25 Years"
              width={120}
              height={120}
              className="object-contain drop-shadow-lg"
              unoptimized
            />
            <p className="text-white/90 text-xs font-medium mt-2 italic leading-tight">
              Serving the government<br />for over 25 years
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
