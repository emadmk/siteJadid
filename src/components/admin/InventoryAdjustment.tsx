'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw, X } from 'lucide-react';

interface InventoryAdjustmentProps {
  productId: string;
  productName: string;
  currentStock: number;
}

export function InventoryAdjustment({
  productId,
  productName,
  currentStock,
}: InventoryAdjustmentProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdjustment = async () => {
    if (!quantity || Number(quantity) < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    let newStock = currentStock;
    const qty = Number(quantity);

    if (adjustmentType === 'add') {
      newStock = currentStock + qty;
    } else if (adjustmentType === 'remove') {
      newStock = Math.max(0, currentStock - qty);
    } else {
      newStock = qty;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/products/${productId}/inventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockQuantity: newStock,
          adjustmentType,
          adjustmentQuantity: qty,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update inventory');
      }

      router.refresh();
      setIsOpen(false);
      setQuantity('');
      setNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
      >
        <Package className="w-4 h-4 mr-1" />
        Adjust
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">Adjust Inventory</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              setError('');
              setQuantity('');
              setNotes('');
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-black mb-1">{productName}</div>
          <div className="text-sm text-gray-600">
            Current Stock: <span className="font-semibold">{currentStock}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded text-sm bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* Adjustment Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjustment Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setAdjustmentType('add')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                adjustmentType === 'add'
                  ? 'bg-safety-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Add
            </button>
            <button
              onClick={() => setAdjustmentType('remove')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                adjustmentType === 'remove'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Remove
            </button>
            <button
              onClick={() => setAdjustmentType('set')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                adjustmentType === 'set'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Set To
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
          />
          {quantity && (
            <div className="mt-2 text-sm text-gray-600">
              New stock will be:{' '}
              <span className="font-semibold text-black">
                {adjustmentType === 'add'
                  ? currentStock + Number(quantity)
                  : adjustmentType === 'remove'
                  ? Math.max(0, currentStock - Number(quantity))
                  : Number(quantity)}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add notes about this adjustment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleAdjustment}
            disabled={loading || !quantity}
            className="flex-1 bg-safety-green-600 hover:bg-safety-green-700 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Inventory'
            )}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              setError('');
              setQuantity('');
              setNotes('');
            }}
            variant="outline"
            className="border-gray-300"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
