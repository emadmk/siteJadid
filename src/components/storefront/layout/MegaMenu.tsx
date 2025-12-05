'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Loader2, Package, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  children?: Category[];
  _count?: {
    products: number;
  };
}

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_VISIBLE_CATEGORIES = 12;

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories?tree=true');
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  if (!isOpen) return null;

  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hasMoreCategories = categories.length > MAX_VISIBLE_CATEGORIES;

  return (
    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-2xl z-50" ref={menuRef}>
      <div className="container mx-auto px-4">
        <div className="flex max-h-[480px]">
          {/* Categories List - Left Sidebar with Scroll */}
          <div className="w-56 border-r border-gray-200 py-3 flex-shrink-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <nav className="space-y-0.5 px-2">
                {visibleCategories.map((category) => (
                  <button
                    key={category.id}
                    onMouseEnter={() => setActiveCategory(category)}
                    onClick={() => {
                      onClose();
                      window.location.href = `/categories/${category.slug}`;
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      activeCategory?.id === category.id
                        ? 'bg-safety-green-50 text-safety-green-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {/* Category Image - No background */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={36}
                          height={36}
                          className="w-full h-full object-contain"
                          quality={100}
                          unoptimized
                        />
                      ) : (
                        <Package className={`w-5 h-5 ${activeCategory?.id === category.id ? 'text-safety-green-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <span className="font-medium text-sm flex-1 truncate">{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${activeCategory?.id === category.id ? 'text-safety-green-600' : 'text-gray-400'}`} />
                    )}
                  </button>
                ))}

                {/* View All Categories Link */}
                {hasMoreCategories && (
                  <Link
                    href="/categories"
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-safety-green-600 hover:bg-safety-green-50 transition-colors mt-2 border-t border-gray-100 pt-3"
                  >
                    <span className="font-medium text-sm">View All {categories.length} Categories</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Subcategories Panel - Right Content */}
          {activeCategory && (
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  {activeCategory.image && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
                      <Image
                        src={activeCategory.image}
                        alt={activeCategory.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                        quality={100}
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{activeCategory.name}</h3>
                    {activeCategory.description && (
                      <p className="text-sm text-gray-500 line-clamp-1">{activeCategory.description}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/categories/${activeCategory.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-1 px-4 py-2 bg-safety-green-600 text-white text-sm font-medium rounded-lg hover:bg-safety-green-700 transition-colors"
                >
                  Shop All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Subcategories Grid - No backgrounds */}
              {activeCategory.children && activeCategory.children.length > 0 ? (
                <div className="grid grid-cols-4 xl:grid-cols-5 gap-3">
                  {activeCategory.children.slice(0, 10).map((child) => (
                    <Link
                      key={child.id}
                      href={`/categories/${child.slug}`}
                      onClick={onClose}
                      className="group"
                    >
                      <div className="rounded-xl p-3 transition-all duration-200 border border-gray-100 hover:border-safety-green-300 hover:shadow-md">
                        {/* Image - No background */}
                        <div className="aspect-square rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                          {child.image ? (
                            <Image
                              src={child.image}
                              alt={child.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              quality={100}
                              unoptimized
                            />
                          ) : (
                            <Package className="w-10 h-10 text-gray-300" />
                          )}
                        </div>
                        {/* Name */}
                        <h4 className="text-xs font-medium text-gray-800 text-center group-hover:text-safety-green-600 transition-colors line-clamp-2">
                          {child.name}
                        </h4>
                        {child._count && child._count.products > 0 && (
                          <p className="text-xs text-gray-400 text-center mt-0.5">
                            {child._count.products} items
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}

                  {/* View More Card */}
                  {activeCategory.children.length > 10 && (
                    <Link
                      href={`/categories/${activeCategory.slug}`}
                      onClick={onClose}
                      className="group"
                    >
                      <div className="border border-safety-green-200 hover:border-safety-green-400 rounded-xl p-3 transition-all duration-200 h-full flex flex-col items-center justify-center hover:shadow-md">
                        <div className="w-12 h-12 bg-safety-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-safety-green-200 transition-colors">
                          <ArrowRight className="w-6 h-6 text-safety-green-600" />
                        </div>
                        <span className="text-sm font-medium text-safety-green-700 text-center">
                          +{activeCategory.children.length - 10} More
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No subcategories</p>
                  <Link
                    href={`/categories/${activeCategory.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 mt-3 text-safety-green-600 font-medium text-sm hover:text-safety-green-700"
                  >
                    Browse Products
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Quick Links Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4">
                <Link
                  href="/products"
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-safety-green-600 font-medium"
                >
                  All Products
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/categories"
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-safety-green-600 font-medium"
                >
                  All Categories
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/brands"
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-safety-green-600 font-medium"
                >
                  Shop by Brand
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
