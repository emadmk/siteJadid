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
  unitPrice?: number;
  priceUnit?: string;
  minOrderQty?: number;
}

// Map unit codes to full labels
const unitLabels: Record<string, string> = {
  'ea': 'Each',
  'pk': 'Pack',
  'pr': 'Pair',
  'dz': 'Dozen',
  'DZ': 'Dozen',
  'bx': 'Box',
  'BX': 'Box',
  'cs': 'Case',
  'CS': 'Case',
  'each': 'Each',
  'pack': 'Pack',
  'pair': 'Pair',
  'dozen': 'Dozen',
  'box': 'Box',
  'case': 'Case',
};

// Pluralize unit labels
const pluralizeUnit = (unit: string, qty: number): string => {
  const label = unitLabels[unit] || unit;
  if (qty === 1) return label;
  // Simple pluralization
  if (label.endsWith('x')) return label + 'es'; // Box -> Boxes
  if (label.endsWith('ch')) return label + 'es'; // Each -> Eaches (though we'd say "units")
  if (label === 'Each') return 'Units';
  return label + 's';
};

export function AddToCartButton({
  productId,
  variantId,
  stockQuantity,
  disabled = false,
  showQuantitySelector = true,
  minimumQuantity = 1,
  unitPrice,
  priceUnit = 'ea',
  minOrderQty = 1,
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

  // Calculate total price
  const unitLabel = unitLabels[priceUnit] || priceUnit;
  const totalPrice = unitPrice ? unitPrice * minOrderQty * quantity : 0;
  const totalUnits = minOrderQty * quantity;

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
      {/* Unit Price Display - Top Black */}
      {unitPrice && (
        <div className="text-2xl font-bold text-black">
          ${Number(unitPrice).toFixed(2)} <span className="text-lg font-normal text-gray-600">per {unitLabel}</span>
        </div>
      )}

      {/* Minimum Order Notice */}
      {minOrderQty > 1 && (
        <div className="text-sm text-gray-500">
          Minimum Order: {minOrderQty} {pluralizeUnit(priceUnit, minOrderQty).toLowerCase()}
        </div>
      )}

      {/* Green Price Calculator Box */}
      {unitPrice && (
        <div className="bg-safety-green-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                ${totalPrice.toFixed(2)} <span className="text-sm font-normal opacity-90">per {priceUnit === 'pr' || priceUnit === 'pair' ? 'pair' : priceUnit}</span>
              </div>
              <div className="text-sm opacity-90">
                for <span className="font-semibold">{quantity}</span> Pack of <span className="font-semibold">{minOrderQty}</span> {pluralizeUnit(priceUnit, minOrderQty)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selector */}
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
            {stockQuantity === 0 ? 'Out of Stock' : `Add to Cart (${totalUnits})`}
          </>
        )}
      </Button>
    </div>
  );
}
