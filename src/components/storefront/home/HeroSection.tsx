'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  _count?: {
    products: number;
  };
}

// Hero banners for the top slider
const heroBanners = [
  {
    id: 1,
    title: 'For Everyday Essentials',
    subtitle: 'Shop daily must-haves — digitally!',
    image: '/images/imagesite/gsa.jpg',
    link: '/products',
    bgColor: 'from-gray-800 to-gray-900',
  },
  {
    id: 2,
    title: 'Industrial Safety Gear',
    subtitle: 'Professional equipment for every job',
    image: '/images/imagesite/gsa.jpg',
    link: '/categories/ppe',
    bgColor: 'from-safety-green-700 to-safety-green-900',
  },
  {
    id: 3,
    title: 'GSA Contract Holder',
    subtitle: 'Federal buyers welcome',
    image: '/images/imagesite/gsa.jpg',
    link: '/gsa',
    bgColor: 'from-blue-700 to-blue-900',
  },
];

export function HeroSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories?homepage=true&limit=18');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-white">
      {/* Hero Banners */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {heroBanners.map((banner, index) => (
              <Link
                key={banner.id}
                href={banner.link}
                className={`relative overflow-hidden rounded-lg h-48 lg:h-56 group ${
                  index === 0 ? 'lg:col-span-1' : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor}`} />
                {banner.image && (
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                    quality={100}
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                    {banner.title}
                  </h3>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    {banner.subtitle}
                    <ChevronRight className="w-4 h-4" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Shop by Category */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            The One Item You Need + 1.5 Million More
          </h2>
          <Link
            href="/categories"
            className="hidden md:flex items-center gap-1 text-safety-green-600 hover:text-safety-green-700 font-medium text-sm"
          >
            View All Product Categories
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 lg:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group bg-white border border-gray-200 rounded-lg p-3 lg:p-4 hover:border-safety-green-400 hover:shadow-lg transition-all duration-200"
              >
                {/* Category Image */}
                <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={150}
                      height={150}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      quality={100}
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-3xl text-gray-400">📦</span>
                    </div>
                  )}
                </div>
                {/* Category Name */}
                <h3 className="text-xs lg:text-sm font-medium text-gray-800 text-center group-hover:text-safety-green-600 transition-colors line-clamp-2">
                  {category.name}
                </h3>
                {category._count && category._count.products > 0 && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {category._count.products.toLocaleString()} items
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-6 text-center md:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-safety-green-600 font-medium"
          >
            View All Product Categories
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
