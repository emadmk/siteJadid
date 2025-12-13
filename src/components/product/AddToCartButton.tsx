'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle, Loader2, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  stockQuantity: number;
  disabled?: boolean;
  showQuantitySelector?: boolean;
  minimumQuantity?: number;
}

export function AddToCartButton({
  productId,
  variantId,
  stockQuantity,
  disabled = false,
  showQuantitySelector = true,
  minimumQuantity = 1,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(minimumQuantity);

  // Update quantity when minimumQuantity changes
  useEffect(() => {
    if (quantity < minimumQuantity) {
      setQuantity(minimumQuantity);
    }
  }, [minimumQuantity, quantity]);

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      await addToCart(productId, quantity, variantId);
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > minimumQuantity) {
      setQuantity(quantity - 1);
    }
  };

  const isDisabled = disabled || stockQuantity === 0 || isAdding;

  if (justAdded) {
    return (
      <Button
        size="lg"
        className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-lg"
        disabled
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Added to Cart!
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {showQuantitySelector && stockQuantity > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-black">Quantity:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= minimumQuantity}
              className="p-2 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={minimumQuantity}
              max={stockQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || minimumQuantity;
                setQuantity(Math.min(Math.max(minimumQuantity, val), stockQuantity));
              }}
              className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
            />
            <button
              onClick={incrementQuantity}
              disabled={quantity >= stockQuantity}
              className="p-2 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {stockQuantity < 20 && (
            <span className="text-sm text-orange-600">
              {stockQuantity} available
            </span>
          )}
        </div>
      )}

      <Button
        size="lg"
        className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-lg"
        onClick={handleAddToCart}
        disabled={isDisabled}
      >
        {isAdding ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            {stockQuantity === 0 ? 'Out of Stock' : `Add to Cart${quantity > 1 ? ` (${quantity})` : ''}`}
          </>
        )}
      </Button>
    </div>
  );
}
