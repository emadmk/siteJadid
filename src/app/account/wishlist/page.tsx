'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/contexts/CartContext';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Loader2,
  Star,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  images: string[];
  stockQuantity: number;
  category: {
    name: string;
    slug: string;
  } | null;
}

export default function WishlistPage() {
  const { items, removeFromWishlist, isLoading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWishlistProducts() {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: items }),
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!wishlistLoading) {
      fetchWishlistProducts();
    }
  }, [items, wishlistLoading]);

  const handleAddToCart = async (product: WishlistProduct) => {
    setAddingToCart(product.id);
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    try {
      await removeFromWishlist(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  if (loading || wishlistLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-safety-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">My Wishlist</h1>
          <p className="text-gray-600">{products.length} items saved</p>
        </div>
      </div>

      {/* Wishlist Items */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">Save items you love for later</p>
          <Link href="/products">
            <Button className="bg-safety-green-600 hover:bg-safety-green-700">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const price = product.salePrice || product.basePrice;
            const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:border-gray-300 transition-colors"
              >
                {/* Product Image */}
                <Link href={`/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold">Out of Stock</span>
                      </div>
                    )}
                    {hasDiscount && !isOutOfStock && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        SALE
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  {product.category && (
                    <Link
                      href={`/categories/${product.category.slug}`}
                      className="text-xs text-safety-green-600 hover:underline"
                    >
                      {product.category.name}
                    </Link>
                  )}
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-black hover:text-safety-green-600 line-clamp-2 mt-1">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-black">
                      ${price.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock || addingToCart === product.id}
                      className="flex-1 bg-safety-green-600 hover:bg-safety-green-700 gap-2"
                    >
                      {addingToCart === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(product.id)}
                      disabled={removing === product.id}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {removing === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
