'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, HardHat, Glasses, Hand, Footprints, Shirt, Ear, Wind } from 'lucide-react';

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

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'head-protection': HardHat,
  'eye-protection': Glasses,
  'hand-protection': Hand,
  'foot-protection': Footprints,
  'body-protection': Shirt,
  'hearing-protection': Ear,
  'respiratory-protection': Wind,
};

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories?limit=8&featured=true');
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

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Shop by Category</h2>
            <p className="text-gray-600">Find the right safety gear for your needs</p>
          </div>
          <Link
            href="/categories"
            className="hidden md:flex items-center gap-2 text-safety-green-600 hover:text-safety-green-700 font-medium"
          >
            View All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.slug] || Package;

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-safety-green-200"
              >
                <div className="w-14 h-14 bg-safety-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-safety-green-600 transition-colors">
                  <IconComponent className="w-7 h-7 text-safety-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-black group-hover:text-safety-green-600 transition-colors mb-1">
                  {category.name}
                </h3>
                {category._count && (
                  <p className="text-sm text-gray-500">
                    {category._count.products} products
                  </p>
                )}
                {category.image && (
                  <div className="mt-4 h-24 rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-safety-green-600 text-white rounded-lg font-medium hover:bg-safety-green-700 transition-colors"
          >
            View All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
