'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Building2, Users, ShieldCheck, Award, ArrowRight } from 'lucide-react';
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

// Hero banners for Style 1 & 2
const heroBanners = [
  {
    id: 1,
    title: 'Personal Protective Equipment',
    subtitle: 'Head to Toe Safety Products',
    image: '/images/imagesite/ppenewphoto.jpg',
    link: '/ppe',
    bgColor: 'from-safety-green-700 to-safety-green-900',
    imageClass: 'object-cover object-top',
  },
  {
    id: 2,
    title: 'Safety, Industrial Products & Tools',
    subtitle: 'Professional equipment for every job',
    image: '/images/imagesite/cones.jpg',
    link: '/industrial',
    bgColor: 'from-orange-600 to-orange-800',
    imageClass: 'object-cover',
  },
  {
    id: 3,
    title: 'GSA Contract Holder',
    subtitle: 'Federal buyers welcome',
    image: '/images/imagesite/gsa.jpg',
    link: '/gsa',
    bgColor: 'from-blue-700 to-blue-900',
    imageClass: 'object-cover scale-125',
  },
];

// Hero banners for Style 3 - B2B focused
const style3Banners = [
  {
    id: 1,
    title: 'B2B Buyers',
    subtitle: 'Partner with us for exclusive business offers',
    description: 'Business owners get special pricing, dedicated support, and flexible payment terms.',
    image: '/images/imagesite/ppenewphoto.jpg',
    link: '/register',
    bgColor: 'from-blue-700 to-blue-900',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Volume Buyers',
    subtitle: 'Bulk orders, bigger savings',
    description: 'Order in large quantities and unlock special volume discounts on all products.',
    image: '/images/imagesite/cones.jpg',
    link: '/register',
    bgColor: 'from-purple-700 to-purple-900',
    icon: Users,
  },
  {
    id: 3,
    title: 'GSA Buyers',
    subtitle: 'Federal & Government pricing',
    description: 'US Government agencies and contractors get exclusive GSA Schedule pricing.',
    image: '/images/imagesite/gsa.jpg',
    link: '/register',
    bgColor: 'from-safety-green-700 to-safety-green-900',
    icon: ShieldCheck,
  },
];

interface HeroSectionProps {
  homeStyle?: 1 | 2 | 3;
}

export function HeroSection({ homeStyle = 1 }: HeroSectionProps) {
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
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const bannersToUse = homeStyle === 3 ? style3Banners : heroBanners;

  return (
    <section className="bg-white">
      {/* Hero Banners - Style 1 & 2: Original, Style 3: B2B focused */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile: Single Banner Slider */}
          <div className="lg:hidden relative">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {bannersToUse.map((banner) => (
                  <Link
                    key={banner.id}
                    href={banner.link}
                    className="relative overflow-hidden rounded-lg h-36 w-full flex-shrink-0 group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor}`} />
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className={`object-cover opacity-40 group-hover:opacity-50 transition-opacity`}
                    />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <h3 className="text-white font-bold text-lg leading-tight">
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
            {/* Mobile dots */}
            <div className="flex justify-center gap-2 mt-2">
              {bannersToUse.map((_, idx) => (
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

          {/* Desktop: Style 3 - B2B Focused Cards */}
          {homeStyle === 3 && (
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              {style3Banners.map((banner) => {
                const IconComponent = banner.icon;
                return (
                  <Link
                    key={banner.id}
                    href={banner.link}
                    className="relative overflow-hidden rounded-xl h-56 group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor}`} />
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                    <div className="absolute inset-0 p-6 flex flex-col">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
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
                      <div className="flex items-center gap-2 text-white font-medium text-sm mt-3 group-hover:gap-3 transition-all">
                        Register Now <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop: Style 1 & 2 - Original 3 Banners */}
          {homeStyle !== 3 && (
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              {heroBanners.map((banner) => (
                <Link
                  key={banner.id}
                  href={banner.link}
                  className="relative overflow-hidden rounded-lg h-24 group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor}`} />
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className={`${banner.imageClass} opacity-40 group-hover:opacity-50 transition-opacity`}
                  />
                  <div className="absolute inset-0 p-4 flex flex-col justify-center">
                    <h3 className="text-white font-bold text-lg leading-tight">
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
          )}
        </div>
      </div>

      {/* Featured Products & B2B Section - Style 1 & 2 only */}
      {(homeStyle === 1 || homeStyle === 2) && (
        <FeaturedPromoSection homeStyle={homeStyle} />
      )}

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
                {/* Temporarily hidden - item count
                {category._count && category._count.products > 0 && (
                  <p className="text-xs text-gray-500 text-center mt-0.5">
                    {category._count.products.toLocaleString()} items
                  </p>
                )}
                */}
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
