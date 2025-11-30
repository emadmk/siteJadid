'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    basePrice: number;
    salePrice: number | null;
    images: string[];
    stockQuantity: number;
  };
}

export function useWishlist() {
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([]);
      return;
    }

    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  }, [status]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (status !== 'authenticated') {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { reason: 'wishlist' } }));
      return false;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        await fetchWishlist();
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: { message: 'Added to wishlist', type: 'success' }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [status, fetchWishlist]);

  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        await fetchWishlist();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return items.some(item => item.productId === productId);
  }, [items]);

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId);
    }
    return addToWishlist(productId);
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  return {
    items,
    itemCount: items.length,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    refreshWishlist: fetchWishlist,
  };
}
