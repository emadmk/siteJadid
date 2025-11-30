'use client';

import Link from 'next/link';
import { ArrowRight, Eye, X } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

export function RecentlyViewedSection() {
  const { products, clearProducts } = useRecentlyViewed();

  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black">Recently Viewed</h2>
          <button
            onClick={clearProducts}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-40 group"
            >
              <div className="h-32 bg-white rounded-lg overflow-hidden border border-gray-200 group-hover:border-safety-green-300 transition-colors">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Eye className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 group-hover:text-safety-green-600 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm font-semibold text-black mt-1">
                ${Number(product.salePrice || product.basePrice).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
