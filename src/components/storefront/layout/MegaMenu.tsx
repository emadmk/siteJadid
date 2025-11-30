'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

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

  return (
    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50" ref={menuRef}>
      <div className="container mx-auto px-4">
        <div className="flex min-h-[400px]">
          {/* Categories List */}
          <div className="w-64 border-r border-gray-200 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onMouseEnter={() => setActiveCategory(category)}
                    onClick={() => {
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      activeCategory?.id === category.id
                        ? 'bg-safety-green-50 text-safety-green-700 border-l-4 border-safety-green-600'
                        : 'hover:bg-gray-50 text-gray-700 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
                <Link
                  href="/products"
                  onClick={onClose}
                  className="flex items-center px-4 py-3 text-safety-green-600 hover:text-safety-green-700 font-medium"
                >
                  View All Products
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </nav>
            )}
          </div>

          {/* Subcategories Panel */}
          {activeCategory && (
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">{activeCategory.name}</h3>
                  {activeCategory.description && (
                    <p className="text-gray-600 text-sm max-w-lg">{activeCategory.description}</p>
                  )}
                </div>
                <Link
                  href={`/categories/${activeCategory.slug}`}
                  onClick={onClose}
                  className="text-sm text-safety-green-600 hover:text-safety-green-700 font-medium flex items-center"
                >
                  Shop All {activeCategory.name}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {activeCategory.children && activeCategory.children.length > 0 && (
                <div className="grid grid-cols-3 gap-6">
                  {activeCategory.children.map((child) => (
                    <div key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        onClick={onClose}
                        className="font-semibold text-black hover:text-safety-green-600 transition-colors"
                      >
                        {child.name}
                      </Link>
                      {child.children && child.children.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {child.children.slice(0, 6).map((grandchild) => (
                            <li key={grandchild.id}>
                              <Link
                                href={`/categories/${grandchild.slug}`}
                                onClick={onClose}
                                className="text-sm text-gray-600 hover:text-safety-green-600 transition-colors"
                              >
                                {grandchild.name}
                              </Link>
                            </li>
                          ))}
                          {child.children.length > 6 && (
                            <li>
                              <Link
                                href={`/categories/${child.slug}`}
                                onClick={onClose}
                                className="text-sm text-safety-green-600 hover:text-safety-green-700 font-medium"
                              >
                                View All +{child.children.length - 6} more
                              </Link>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Featured Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-6">
                  <div className="flex-1 bg-gradient-to-r from-safety-green-50 to-safety-green-100 rounded-lg p-4">
                    <h4 className="font-semibold text-safety-green-800 mb-1">Featured in {activeCategory.name}</h4>
                    <p className="text-sm text-safety-green-700 mb-3">Shop our best-selling products</p>
                    <Link
                      href={`/categories/${activeCategory.slug}?featured=true`}
                      onClick={onClose}
                      className="text-sm font-medium text-safety-green-600 hover:text-safety-green-700"
                    >
                      View Featured Products &rarr;
                    </Link>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-1">New Arrivals</h4>
                    <p className="text-sm text-gray-600 mb-3">Check out the latest safety gear</p>
                    <Link
                      href={`/categories/${activeCategory.slug}?sort=newest`}
                      onClick={onClose}
                      className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                      View New Products &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
