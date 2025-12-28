'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle, Loader2, Minus, Plus, Package } from 'lucide-react';
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
  if (qty === 1) return label.toLowerCase();
  // Simple pluralization
  if (label.endsWith('x')) return (label + 'es').toLowerCase(); // Box -> Boxes
  if (label === 'Each') return 'units';
  return (label + 's').toLowerCase();
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

  // Calculate total units and price
  const unitLabel = unitLabels[priceUnit] || priceUnit;
  const totalUnits = minOrderQty * quantity;
  const totalPrice = unitPrice ? unitPrice * totalUnits : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      await addToCart(productId, totalUnits, variantId);
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
        className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-lg h-14"
        disabled
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Added to Cart!
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector - Clean Design */}
      {showQuantitySelector && stockQuantity > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Quantity</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= minimumQuantity}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                className="w-14 h-10 text-center bg-transparent font-semibold focus:outline-none"
              />
              <button
                onClick={incrementQuantity}
                disabled={quantity >= stockQuantity}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {stockQuantity < 20 && (
              <span className="text-sm text-orange-600 font-medium">
                {stockQuantity} left
              </span>
            )}
          </div>
        </div>
      )}

      {/* Order Summary - Clean Card */}
      {unitPrice && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">Order Summary</span>
            {minOrderQty > 1 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Min. {minOrderQty} {pluralizeUnit(priceUnit, minOrderQty)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-700">
              <Package className="w-4 h-4" />
              <span>{totalUnits} {pluralizeUnit(priceUnit, totalUnits)}</span>
            </div>
            <span className="text-gray-500">
              {totalUnits} × ${Number(unitPrice).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-safety-green-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-lg h-14 font-semibold"
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
            {stockQuantity === 0 ? 'Out of Stock' : `Add to Cart`}
          </>
        )}
      </Button>
    </div>
  );
}
