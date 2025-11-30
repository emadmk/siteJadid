'use client';

import { useState, useEffect, useCallback } from 'react';

interface RecentlyViewedProduct {
  id: string;
  slug: string;
  name: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  viewedAt: number;
}

const STORAGE_KEY = 'adasupply_recently_viewed';
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setProducts(JSON.parse(stored));
        } catch {
          setProducts([]);
        }
      }
    }
  }, []);

  const addProduct = useCallback((product: Omit<RecentlyViewedProduct, 'viewedAt'>) => {
    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [
        { ...product, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Also sync to server if logged in
    fetch('/api/storefront/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {});
  }, []);

  const clearProducts = useCallback(() => {
    setProducts([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    products,
    addProduct,
    clearProducts,
  };
}
