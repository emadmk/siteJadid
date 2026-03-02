'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Building2, Users, User, ArrowRight } from 'lucide-react';
import { FeaturedPromoSection } from './FeaturedPromoSection';

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

// Hero banners - 3 Buyer Types
const buyerBanners = [
  {
    id: 1,
    title: 'Government Buyer',
    subtitle: 'Federal & Government pricing',
    description: 'US Government agencies and contractors get exclusive GOV Schedule pricing.',
    image: '/images/imagesite/gsa.jpg',
    link: '/register',
    bgColor: 'from-safety-green-700 to-safety-green-900',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Volume Buyers',
    subtitle: 'Bulk orders, bigger savings',
    description: 'Order in large quantities and unlock special volume discounts on all products.',
    image: '/images/imagesite/ppenewphoto.jpg',
    link: '/register',
    bgColor: 'from-purple-700 to-purple-900',
    icon: Users,
  },
  {
    id: 3,
    title: 'Personal Buyer',
    subtitle: 'Individual protection solutions',
    description: 'Quality PPE and safety equipment for individual professionals and contractors.',
    image: '/uploads/ppe-rhn2syjhuk4f553vlfqcysr0quy8cnjai2hlg26xxc.jpg',
    link: '/register',
    bgColor: 'from-blue-700 to-blue-900',
    icon: User,
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

  // Auto-rotate banners for mobile
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % buyerBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-white">
      {/* Hero Banners - 3 Buyer Types */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile: Single Banner Slider */}
          <div className="lg:hidden relative">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {buyerBanners.map((banner) => {
                  const IconComponent = banner.icon;
                  return (
                    <Link
                      key={banner.id}
                      href={banner.link}
                      className="relative overflow-hidden rounded-lg h-44 w-full flex-shrink-0 group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor}`} />
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover opacity-30 scale-[1.3] group-hover:scale-[1.4] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 p-4 flex flex-col">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-3">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">
                          {banner.title}
                        </h3>
                        <p className="text-white/90 text-sm font-medium mb-1">
                          {banner.subtitle}
                        </p>
                        <p className="text-white/70 text-xs flex-1">
                          {banner.description}
                        </p>
                        <div className="flex items-center gap-2 text-white font-medium text-sm mt-2">
                          Register Now <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Mobile dots */}
            <div className="flex justify-center gap-2 mt-2">
              {buyerBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentBanner ? 'bg-safety-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop: 3 Buyer Type Cards */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-4">
            {buyerBanners.map((banner) => {
              const IconComponent = banner.icon;
              return (
                <Link
                  key={banner.id}
                  href={banner.link}
                  className="relative overflow-hidden rounded-xl h-56 group hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor}`} />
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover opacity-20 scale-[1.3] group-hover:scale-[1.4] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 p-6 flex flex-col">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-1">
                      {banner.title}
                    </h3>
                    <p className="text-white/90 text-sm font-medium mb-2">
                      {banner.subtitle}
                    </p>
                    <p className="text-white/70 text-sm flex-1">
                      {banner.description}
                    </p>
                    <div className="flex items-center gap-2 text-white font-medium text-sm mt-3">
                      Register Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Products & Badge Section */}
      <FeaturedPromoSection />

      {/* Categories Section */}
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900">
            The One Item You Need Plus Much Much More!
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group"
              >
                {/* Category Image */}
                <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={120}
                      height={120}
                      className="object-contain w-full h-full p-2 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center">
                      <span className="text-3xl text-gray-300">📦</span>
                    </div>
                  )}
                </div>
                {/* Category Name */}
                <h3 className="text-xs lg:text-sm font-medium text-gray-800 text-center group-hover:text-safety-green-600 transition-colors line-clamp-2">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-6 md:hidden text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-safety-green-600 font-medium text-sm"
          >
            View All Product Categories
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
