'use client';

import { useState } from 'react';
import { Edit2, Trash2, Save, X, Package } from 'lucide-react';

interface AttributeValue {
  attributeId: string;
  value: string;
  attribute: {
    id: string;
    name: string;
    code: string;
  };
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  gsaPrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
  attributeValues: AttributeValue[];
}

interface VariantPricingTableProps {
  variants: Variant[];
  onUpdate: (variantId: string, data: Partial<Variant>) => Promise<void>;
  onDelete: (variantId: string) => Promise<void>;
  onEdit: (variant: Variant) => void;
}

export function VariantPricingTable({
  variants,
  onUpdate,
  onDelete,
  onEdit,
}: VariantPricingTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Variant>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setEditData({
      basePrice: variant.basePrice,
      salePrice: variant.salePrice,
      wholesalePrice: variant.wholesalePrice,
      gsaPrice: variant.gsaPrice,
      costPrice: variant.costPrice,
      stockQuantity: variant.stockQuantity,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (variantId: string) => {
    setSaving(true);
    try {
      await onUpdate(variantId, editData);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '-';
    return `$${Number(price).toFixed(2)}`;
  };

  if (variants.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No variants configured for this product.</p>
        <p className="text-sm text-gray-400 mt-1">
          Click "Add Variant" to create product variants.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU / Attributes
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Base Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sale
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              B2B
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              GSA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {variants.map(variant => (
            <tr
              key={variant.id}
              className={editingId === variant.id ? 'bg-yellow-50' : 'hover:bg-gray-50'}
            >
              {/* SKU & Attributes */}
              <td className="px-4 py-3">
                <div className="font-mono text-sm text-gray-900">{variant.sku}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {variant.attributeValues.map(av => (
                    <span
                      key={av.attribute.id}
                      className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600"
                    >
                      {av.attribute.name}: {av.value}
                    </span>
                  ))}
                </div>
              </td>

              {/* Base Price */}
              <td className="px-4 py-3 text-right">
                {editingId === variant.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.basePrice || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                    className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {formatPrice(variant.basePrice)}
                  </span>
                )}
              </td>

              {/* Sale Price */}
              <td className="px-4 py-3 text-right">
                {editingId === variant.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.salePrice || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || null }))}
                    className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className={variant.salePrice ? 'text-red-600' : 'text-gray-400'}>
                    {formatPrice(variant.salePrice)}
                  </span>
                )}
              </td>

              {/* B2B Price */}
              <td className="px-4 py-3 text-right">
                {editingId === variant.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.wholesalePrice || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, wholesalePrice: parseFloat(e.target.value) || null }))}
                    className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className={variant.wholesalePrice ? 'text-blue-600' : 'text-gray-400'}>
                    {formatPrice(variant.wholesalePrice)}
                  </span>
                )}
              </td>

              {/* GSA Price */}
              <td className="px-4 py-3 text-right">
                {editingId === variant.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.gsaPrice || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, gsaPrice: parseFloat(e.target.value) || null }))}
                    className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className={variant.gsaPrice ? 'text-purple-600' : 'text-gray-400'}>
                    {formatPrice(variant.gsaPrice)}
                  </span>
                )}
              </td>

              {/* Cost Price */}
              <td className="px-4 py-3 text-right">
                {editingId === variant.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.costPrice || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || null }))}
                    className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className="text-gray-500">{formatPrice(variant.costPrice)}</span>
                )}
              </td>

              {/* Stock */}
              <td className="px-4 py-3 text-right">
                {editingId === variant.id ? (
                  <input
                    type="number"
                    value={editData.stockQuantity || 0}
                    onChange={(e) => setEditData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                    className="w-20 text-right px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className={variant.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                    {variant.stockQuantity}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    variant.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {variant.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-center">
                {editingId === variant.id ? (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => saveEdit(variant.id)}
                      disabled={saving}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => startEdit(variant)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      title="Quick Edit Prices"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(variant)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="Full Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this variant?')) {
                          onDelete(variant.id);
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
