'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Trash2,
  ShoppingCart,
  Upload,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/lib/toast';

interface OrderLine {
  id: string;
  sku: string;
  quantity: number;
  loading: boolean;
  found: boolean | null;
  type: 'product' | 'variant' | null;
  productId: string | null;
  variantId: string | null;
  productName: string | null;
  variantName: string | null;
  price: number | null;
  stock: number | null;
  image: string | null;
}

const createEmptyLine = (): OrderLine => ({
  id: Math.random().toString(36).substring(7),
  sku: '',
  quantity: 1,
  loading: false,
  found: null,
  type: null,
  productId: null,
  variantId: null,
  productName: null,
  variantName: null,
  price: null,
  stock: null,
  image: null,
});

export default function QuickOrderPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [lines, setLines] = useState<OrderLine[]>(() =>
    Array(10).fill(null).map(createEmptyLine)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Lookup SKU
  const lookupSku = useCallback(async (lineId: string, sku: string) => {
    if (!sku.trim()) {
      setLines(prev =>
        prev.map(line =>
          line.id === lineId
            ? {
                ...line,
                loading: false,
                found: null,
                type: null,
                productId: null,
                variantId: null,
                productName: null,
                variantName: null,
                price: null,
                stock: null,
                image: null,
              }
            : line
        )
      );
      return;
    }

    setLines(prev =>
      prev.map(line => (line.id === lineId ? { ...line, loading: true } : line))
    );

    try {
      const response = await fetch(`/api/products/lookup?sku=${encodeURIComponent(sku)}`);
      const data = await response.json();

      setLines(prev =>
        prev.map(line => {
          if (line.id !== lineId) return line;

          if (data.found) {
            const product = data.product;
            const variant = data.variant;
            const price = variant ? variant.salePrice || variant.basePrice : product.salePrice || product.basePrice;
            const stock = variant ? variant.stockQuantity : product.stockQuantity;
            const image = variant?.images?.[0] || product?.images?.[0] || null;

            return {
              ...line,
              loading: false,
              found: true,
              type: data.type,
              productId: product.id,
              variantId: variant?.id || null,
              productName: product.name,
              variantName: variant?.name || null,
              price,
              stock,
              image,
            };
          } else {
            return {
              ...line,
              loading: false,
              found: false,
              type: null,
              productId: null,
              variantId: null,
              productName: null,
              variantName: null,
              price: null,
              stock: null,
              image: null,
            };
          }
        })
      );
    } catch (error) {
      console.error('SKU lookup error:', error);
      setLines(prev =>
        prev.map(line =>
          line.id === lineId ? { ...line, loading: false, found: false } : line
        )
      );
    }
  }, []);

  // Handle SKU input change with debounce
  const handleSkuChange = useCallback(
    (lineId: string, sku: string) => {
      setLines(prev =>
        prev.map(line => (line.id === lineId ? { ...line, sku } : line))
      );

      // Clear existing timer
      const existingTimer = debounceTimers.current.get(lineId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        lookupSku(lineId, sku);
      }, 500);

      debounceTimers.current.set(lineId, timer);
    },
    [lookupSku]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback((lineId: string, quantity: number) => {
    setLines(prev =>
      prev.map(line =>
        line.id === lineId ? { ...line, quantity: Math.max(1, quantity) } : line
      )
    );
  }, []);

  // Add row
  const addRow = useCallback(() => {
    setLines(prev => [...prev, createEmptyLine()]);
  }, []);

  // Remove row
  const removeRow = useCallback((lineId: string) => {
    setLines(prev => {
      const filtered = prev.filter(line => line.id !== lineId);
      return filtered.length === 0 ? [createEmptyLine()] : filtered;
    });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setLines(Array(10).fill(null).map(createEmptyLine));
  }, []);

  // Get valid lines (lines with found products)
  const validLines = lines.filter(line => line.found && line.productId);

  // Calculate total
  const estimatedTotal = validLines.reduce((sum, line) => {
    return sum + (line.price || 0) * line.quantity;
  }, 0);

  // Add all to cart
  const handleAddToCart = async () => {
    if (validLines.length === 0) {
      toast.error('No valid products to add');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const line of validLines) {
        if (line.productId) {
          await addToCart(line.productId, line.quantity, line.variantId || undefined);
        }
      }

      toast.success(`Added ${validLines.length} item(s) to cart`);

      // Clear the lines that were added
      setLines(prev =>
        prev.map(line =>
          line.found && line.productId
            ? createEmptyLine()
            : line
        )
      );
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add items to cart');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CSV import
  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim());

    const newLines: OrderLine[] = [];

    for (const row of rows) {
      const [sku, qtyStr] = row.split(',').map(s => s.trim());
      if (sku && !sku.toLowerCase().startsWith('sku')) {
        newLines.push({
          ...createEmptyLine(),
          sku,
          quantity: parseInt(qtyStr) || 1,
        });
      }
    }

    if (newLines.length > 0) {
      setLines(newLines);

      // Lookup all SKUs
      for (const line of newLines) {
        if (line.sku) {
          lookupSku(line.id, line.sku);
        }
      }

      toast.success(`Imported ${newLines.length} row(s)`);
    }

    // Reset input
    e.target.value = '';
  }, [lookupSku]);

  // Download CSV template
  const downloadTemplate = useCallback(() => {
    const csv = 'SKU,Quantity\nEXAMPLE-SKU-001,10\nEXAMPLE-SKU-002,5\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quick-order-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addRow();
        } else if (e.key === 's') {
          e.preventDefault();
          if (validLines.length > 0) {
            handleAddToCart();
          }
        } else if (e.key === 'k') {
          e.preventDefault();
          clearAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addRow, clearAll, validLines.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black mb-2">Quick Order Pad</h1>
          <p className="text-gray-600">
            Enter SKUs and quantities to quickly add products to your cart
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Entry Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Enter Products</h2>
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvImport}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                          Import CSV
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={addRow}
                    >
                      <Plus className="w-4 h-4" />
                      Add Row
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[180px]">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lines.map((line, index) => (
                      <tr
                        key={line.id}
                        className={`hover:bg-gray-50 ${
                          line.found === false ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={line.sku}
                              onChange={(e) =>
                                handleSkuChange(line.id, e.target.value)
                              }
                              placeholder="Enter SKU"
                              className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-safety-green-500 focus:border-transparent ${
                                line.found === false
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                            />
                            {line.loading && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                            )}
                            {line.found === true && (
                              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            )}
                            {line.found === false && line.sku && (
                              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {line.found ? (
                            <div className="flex items-center gap-2">
                              {line.image ? (
                                <img
                                  src={line.image}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                  {line.productName}
                                </div>
                                {line.variantName && (
                                  <div className="text-xs text-gray-500">
                                    {line.variantName}
                                  </div>
                                )}
                                {line.stock !== null && line.stock <= 5 && (
                                  <div className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {line.stock === 0
                                      ? 'Out of stock'
                                      : `Only ${line.stock} left`}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : line.found === false && line.sku ? (
                            <span className="text-sm text-red-600">
                              SKU not found
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {line.price !== null ? (
                            <span className="text-sm font-medium text-gray-900">
                              ${line.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                line.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                            max={line.stock || 999}
                            className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {line.price !== null ? (
                            <span className="text-sm font-bold text-black">
                              ${(line.price * line.quantity).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeRow(line.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={clearAll}>
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={downloadTemplate}
                    >
                      <Download className="w-4 h-4" />
                      Export Template
                    </Button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-sm text-gray-600">
                        {validLines.length} item(s)
                      </div>
                      <div className="text-2xl font-bold text-black">
                        ${estimatedTotal.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="bg-safety-green-600 hover:bg-safety-green-700 gap-2"
                      onClick={handleAddToCart}
                      disabled={isSubmitting || validLines.length === 0}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions & Tips */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <h3 className="text-lg font-bold text-black mb-4">How to Use</h3>

              <div className="space-y-4">
                <div>
                  <div className="font-medium text-black mb-2">Manual Entry</div>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Enter product SKU in the SKU column</li>
                    <li>Product details will auto-populate</li>
                    <li>Enter desired quantity</li>
                    <li>Click "Add to Cart" when ready</li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">Variant SKUs</div>
                  <p className="text-sm text-gray-700 mb-2">
                    You can enter variant SKUs directly (e.g., K-1006980-7 for
                    size 7). The system will automatically detect the variant.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">CSV Import</div>
                  <p className="text-sm text-gray-700 mb-2">
                    Upload a CSV file with two columns: SKU and Quantity
                  </p>
                  <div className="bg-gray-50 border rounded p-3 font-mono text-xs mb-2">
                    SKU,Quantity
                    <br />
                    K-1006980-7,10
                    <br />
                    K-1006980-8,25
                    <br />
                    PRODUCT-001,5
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-3 h-3" />
                    Download Template
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">Tips</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Use Tab key to quickly move between fields</li>
                    <li>• SKUs are case-insensitive</li>
                    <li>• Invalid SKUs will be highlighted in red</li>
                    <li>• Stock availability is checked in real-time</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">
                    Keyboard Shortcuts
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Add row:</span>
                      <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                        Ctrl+Enter
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Submit:</span>
                      <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                        Ctrl+S
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear:</span>
                      <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                        Ctrl+K
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
