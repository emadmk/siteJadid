'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    wholesalePrice: number | null;
    gsaPrice: number | null;
    images: string[];
    stockQuantity: number;
    category?: {
      name: string;
    };
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

  const refreshCart = useCallback(async () => {
    if (status !== 'authenticated') {
      setCart(null);
      return;
    }

    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [status]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    if (status !== 'authenticated') {
      // Trigger auth modal
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { reason: 'cart' } }));
      return false;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        const data = await res.json();
        setCart(data);
        setIsCartOpen(true);
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return true;
      } else {
        const error = await res.json();
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: { message: error.error || 'Failed to add to cart', type: 'error' }
        }));
        return false;
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (res.ok) {
        await refreshCart();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update quantity error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  const removeFromCart = useCallback(async (itemId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await refreshCart();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove from cart error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  const clearCart = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (res.ok) {
        setCart(null);
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Clear cart error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
