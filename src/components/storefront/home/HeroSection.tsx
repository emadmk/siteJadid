'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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

interface BannerSlide {
  id: string;
  desktopImage: string;
  mobileImage: string;
  link: string;
  slideDuration: number;
}

export function HeroSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

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

    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/storefront/banners');
        if (res.ok) {
          const data = await res.json();
          setBanners(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setBannersLoading(false);
      }
    };

    fetchCategories();
    fetchBanners();
  }, []);

  // Auto-rotate slides based on current banner's duration
  useEffect(() => {
    if (banners.length <= 1) return;
    const duration = (banners[currentSlide]?.slideDuration || 5) * 1000;
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [banners, currentSlide]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const BannerContent = () => {
    if (bannersLoading) {
      return (
        <div className="animate-pulse bg-gray-200 w-full aspect-[16/5] lg:aspect-[16/5] rounded-lg" />
      );
    }

    if (banners.length === 0) {
      return null;
    }

    return (
      <div className="relative w-full overflow-hidden rounded-lg group">
        {/* Slides container */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner) => {
            const Wrapper = banner.link ? Link : 'div';
            const wrapperProps = banner.link ? { href: banner.link } : {};
            return (
              <Wrapper
                key={banner.id}
                {...wrapperProps as any}
                className="w-full flex-shrink-0 relative block"
              >
                {/* Desktop image */}
                <div className="hidden lg:block relative w-full aspect-[16/5]">
                  <Image
                    src={banner.desktopImage}
                    alt=""
                    fill
                    className="object-cover"
                    priority={currentSlide === 0}
                    sizes="100vw"
                  />
                </div>
                {/* Mobile image */}
                <div className="lg:hidden relative w-full aspect-[16/9]">
                  <Image
                    src={banner.mobileImage}
                    alt=""
                    fill
                    className="object-cover"
                    priority={currentSlide === 0}
                    sizes="100vw"
                  />
                </div>
              </Wrapper>
            );
          })}
        </div>

        {/* Navigation arrows - only show if multiple */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md rounded-full p-1.5 lg:p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md rounded-full p-1.5 lg:p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-white">
      {/* Hero Banner Slider */}
      <div className="container mx-auto px-4 py-3">
        <BannerContent />
      </div>

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
