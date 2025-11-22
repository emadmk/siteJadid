'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, CheckCircle } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  stockQuantity: number;
  disabled?: boolean;
}

export function AddToCartButton({ productId, stockQuantity, disabled = false }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!session) {
      // Redirect to signin if not logged in
      router.push(`/auth/signin?callbackUrl=${window.location.pathname}`);
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to cart');
      }

      // Show success state
      setJustAdded(true);

      // Trigger cart update by dispatching custom event
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Reset after 2 seconds
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Add to cart error:', error);
      alert(error instanceof Error ? error.message : 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const isDisabled = disabled || stockQuantity === 0 || isAdding;

  if (justAdded) {
    return (
      <Button
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-lg"
        disabled
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Added to Cart!
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full bg-primary hover:bg-primary/90 text-lg"
      onClick={handleAddToCart}
      disabled={isDisabled}
    >
      {isAdding ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5 mr-2" />
          {stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </>
      )}
    </Button>
  );
}
