'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, ShoppingCart, Star, Eye, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { getImageSize } from '@/lib/image-utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  images: string[];
  isFeatured: boolean;
  stockQuantity: number;
  category?: {
    name: string;
    slug: string;
  };
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?featured=true&limit=8');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(productId);
    await addToCart(productId, 1);
    setAddingToCart(null);
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Featured Products</h2>
            <p className="text-gray-600">Our most popular safety equipment</p>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden md:flex items-center gap-2 text-safety-green-600 hover:text-safety-green-700 font-medium"
          >
            View All Featured
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const price = product.salePrice || product.basePrice;
            const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
            const discountPercent = hasDiscount
              ? Math.round((1 - product.salePrice! / product.basePrice) * 100)
              : 0;
            const inWishlist = isInWishlist(product.id);

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-safety-green-200 hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-white overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageSize(product.images[0], 'medium')}
                      alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <Eye className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {hasDiscount && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                        -{discountPercent}%
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="px-2 py-1 bg-safety-green-600 text-white text-xs font-bold rounded">
                        FEATURED
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleWishlist(product.id, e)}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        inWishlist
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Add to Cart Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      disabled={addingToCart === product.id || product.stockQuantity === 0}
                      className="w-full py-2 bg-white text-black rounded-lg font-medium hover:bg-safety-green-600 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {addingToCart === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                      {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {product.category && (
                    <p className="text-xs text-safety-green-600 font-medium mb-1">
                      {product.category.name}
                    </p>
                  )}
                  <h3 className="font-semibold text-gray-900 group-hover:text-safety-green-600 transition-colors line-clamp-2 mb-2 text-sm">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-black">
                      ${Number(price).toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-gray-400 line-through">
                        ${Number(product.basePrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.stockQuantity > 0 && product.stockQuantity < 10 && (
                    <p className="text-xs text-orange-600 mt-2">
                      Only {product.stockQuantity} left
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-2 px-6 py-3 bg-safety-green-600 text-white rounded-lg font-medium hover:bg-safety-green-700 transition-colors"
          >
            View All Featured
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
