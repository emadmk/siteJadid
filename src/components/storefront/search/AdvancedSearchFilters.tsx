'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface AdvancedSearchFiltersProps {
  categories: Category[];
  priceRange: {
    min: number;
    max: number;
  };
}

export function AdvancedSearchFilters({ categories, priceRange }: AdvancedSearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get('category');
    return cat ? cat.split(',') : [];
  });
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>(() => {
    const certs = searchParams.get('certifications');
    return certs ? certs.split(',') : [];
  });
  const [isApplying, setIsApplying] = useState(false);

  const certifications = ['ANSI Z87.1', 'OSHA', 'CE', 'CSA', 'NFPA', 'UL Listed'];

  const applyFilters = () => {
    setIsApplying(true);
    const params = new URLSearchParams(searchParams.toString());

    // Category filter
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','));
    } else {
      params.delete('category');
    }

    // Price filters
    if (minPrice) {
      params.set('minPrice', minPrice);
    } else {
      params.delete('minPrice');
    }

    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    } else {
      params.delete('maxPrice');
    }

    // In stock filter
    if (inStockOnly) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }

    // Certifications
    if (selectedCertifications.length > 0) {
      params.set('certifications', selectedCertifications.join(','));
    } else {
      params.delete('certifications');
    }

    router.push(`${pathname}?${params.toString()}`);
    setTimeout(() => setIsApplying(false), 500);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSelectedCertifications([]);

    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);

    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice ||
    maxPrice ||
    inStockOnly ||
    selectedCertifications.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-safety-green-600" />
          <h2 className="font-bold text-black">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-semibold text-black mb-3">Categories</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
              />
              <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
              <span className="text-xs text-gray-500">({cat._count.products})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-black mb-3">Price Range</h3>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
            />
          </div>
          <span className="text-gray-400 self-center">-</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Range: ${priceRange.min.toFixed(0)} - ${priceRange.max.toFixed(0)}
        </div>
      </div>

      {/* Availability */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-black mb-3">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
          />
          <span className="text-sm text-gray-700">In Stock Only</span>
        </label>
      </div>

      {/* Certifications */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-black mb-3">Certifications</h3>
        <div className="space-y-2">
          {certifications.map((cert) => (
            <label
              key={cert}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedCertifications.includes(cert)}
                onChange={() => toggleCertification(cert)}
                className="rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
              />
              <span className="text-sm text-gray-700">{cert}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <Button
        onClick={applyFilters}
        disabled={isApplying}
        className="w-full bg-safety-green-600 hover:bg-safety-green-700"
      >
        {isApplying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Applying...
          </>
        ) : (
          'Apply Filters'
        )}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full mt-2 border-gray-300"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
