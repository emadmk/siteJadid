'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, ShoppingCart, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface QuickOrderItem {
  sku: string;
  quantity: number;
  status: 'pending' | 'validating' | 'valid' | 'invalid';
  product?: {
    id: string;
    name: string;
    basePrice: number;
  };
  error?: string;
}

interface QuickOrderPadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickOrderPad({ isOpen, onClose }: QuickOrderPadProps) {
  const { addToCart } = useCart();
  const [items, setItems] = useState<QuickOrderItem[]>([
    { sku: '', quantity: 1, status: 'pending' },
    { sku: '', quantity: 1, status: 'pending' },
    { sku: '', quantity: 1, status: 'pending' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const updateItem = (index: number, field: 'sku' | 'quantity', value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        status: field === 'sku' ? 'pending' : updated[index].status,
      };
      return updated;
    });
  };

  const validateSku = async (index: number) => {
    const item = items[index];
    if (!item.sku.trim()) return;

    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'validating' };
      return updated;
    });

    try {
      const res = await fetch(`/api/products?sku=${encodeURIComponent(item.sku)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          setItems(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: 'valid',
              product: {
                id: product.id,
                name: product.name,
                basePrice: Number(product.basePrice),
              },
            };
            return updated;
          });
        } else {
          setItems(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: 'invalid',
              error: 'SKU not found',
            };
            return updated;
          });
        }
      }
    } catch {
      setItems(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'invalid',
          error: 'Validation failed',
        };
        return updated;
      });
    }
  };

  const addRow = () => {
    setItems(prev => [...prev, { sku: '', quantity: 1, status: 'pending' }]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addAllToCart = async () => {
    const validItems = items.filter(item => item.status === 'valid' && item.product);
    if (validItems.length === 0) return;

    setIsAdding(true);
    try {
      for (const item of validItems) {
        if (item.product) {
          await addToCart(item.product.id, item.quantity);
        }
      }
      // Reset form
      setItems([
        { sku: '', quantity: 1, status: 'pending' },
        { sku: '', quantity: 1, status: 'pending' },
        { sku: '', quantity: 1, status: 'pending' },
      ]);
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  const validCount = items.filter(item => item.status === 'valid').length;
  const totalAmount = items
    .filter(item => item.status === 'valid' && item.product)
    .reduce((sum, item) => sum + (item.product!.basePrice * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
      <div className="container mx-auto px-4 py-4" ref={containerRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">Quick Order Pad</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter SKU"
                  value={item.sku}
                  onChange={(e) => updateItem(index, 'sku', e.target.value)}
                  onBlur={() => validateSku(index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
                {item.status === 'valid' && item.product && (
                  <p className="text-xs text-gray-600 mt-1 truncate">{item.product.name}</p>
                )}
                {item.status === 'invalid' && (
                  <p className="text-xs text-red-600 mt-1">{item.error}</p>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-2 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
              <div className="w-6 h-6 flex items-center justify-center">
                {item.status === 'validating' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {item.status === 'valid' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {item.status === 'invalid' && <AlertCircle className="w-4 h-4 text-red-600" />}
              </div>
              <button
                onClick={() => removeRow(index)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                disabled={items.length <= 1}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={addRow}
              className="flex items-center gap-2 text-sm text-safety-green-600 hover:text-safety-green-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input type="file" accept=".csv" className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-4">
            {validCount > 0 && (
              <span className="text-sm text-gray-600">
                {validCount} item{validCount !== 1 ? 's' : ''} &bull; ${totalAmount.toFixed(2)}
              </span>
            )}
            <button
              onClick={addAllToCart}
              disabled={validCount === 0 || isAdding}
              className="flex items-center gap-2 px-4 py-2 bg-safety-green-600 text-white rounded-lg font-medium hover:bg-safety-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Add All to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
