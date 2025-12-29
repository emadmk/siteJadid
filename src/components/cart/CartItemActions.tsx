'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

interface CartItemActionsProps {
  itemId: string;
  quantity: number;
  minOrderQty: number;
  stockQuantity: number;
}

export function CartItemActions({ itemId, quantity, minOrderQty, stockQuantity }: CartItemActionsProps) {
  const { updateQuantity, removeFromCart, isLoading } = useCart();
  const router = useRouter();
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleIncrement = async () => {
    if (localQuantity + 1 > stockQuantity) return;
    setIsUpdating(true);
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty);
    await updateQuantity(itemId, newQty);
    router.refresh();
    setIsUpdating(false);
  };

  const handleDecrement = async () => {
    if (localQuantity <= minOrderQty) return;
    setIsUpdating(true);
    const newQty = localQuantity - 1;
    setLocalQuantity(newQty);
    await updateQuantity(itemId, newQty);
    router.refresh();
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeFromCart(itemId);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Quantity Controls */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 hover:bg-gray-100"
            disabled={localQuantity <= minOrderQty || isUpdating}
            onClick={handleDecrement}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </Button>
          <span className="w-12 text-center font-medium text-black">
            {localQuantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 hover:bg-gray-100"
            disabled={localQuantity + 1 > stockQuantity || isUpdating}
            onClick={handleIncrement}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
        {minOrderQty > 1 && (
          <span className="text-xs text-gray-500">Min: {minOrderQty}</span>
        )}
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
        onClick={handleRemove}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        {isRemoving ? 'Removing...' : 'Remove'}
      </Button>
    </div>
  );
}
