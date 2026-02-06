'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  _count?: {
    products: number;
  };
}

const MIN_BRANDS_DISPLAY = 10;

export function BrandsSection() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands?limit=20');
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Repeat brands if less than MIN_BRANDS_DISPLAY
  const displayBrands = (): Brand[] => {
    if (brands.length === 0) return [];
    if (brands.length >= MIN_BRANDS_DISPLAY) return brands.slice(0, MIN_BRANDS_DISPLAY);

    const repeated: Brand[] = [];
    let index = 0;
    while (repeated.length < MIN_BRANDS_DISPLAY) {
      repeated.push({ ...brands[index % brands.length], id: `${brands[index % brands.length].id}-${repeated.length}` });
      index++;
    }
    return repeated;
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  const brandsToShow = displayBrands();

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
              Trusted Brands
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Premium safety equipment from industry leaders
            </p>
          </div>
          <Link
            href="/brands"
            className="hidden md:flex items-center gap-1 text-safety-green-600 hover:text-safety-green-700 font-medium text-sm"
          >
            View All Brands
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Brands Grid - Single row on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {brandsToShow.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-safety-green-300 hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[80px]"
            >
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={100}
                  height={40}
                  className="max-h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-110"
                  quality={100}
                  unoptimized
                />
              ) : (
                <span className="text-sm font-bold text-gray-700 group-hover:text-safety-green-600 group-hover:scale-110 transition-all duration-200 text-center">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-6 text-center md:hidden">
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-safety-green-600 font-medium text-sm"
          >
            View All Brands
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
