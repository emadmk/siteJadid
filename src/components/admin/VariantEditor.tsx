'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VariantAttribute {
  attributeId: string;
  attributeName: string;
  attributeCode: string;
  options: string[];
}

interface AttributeValue {
  attributeId: string;
  value: string;
}

interface Variant {
  id?: string;
  sku: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  gsaPrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
  attributeValues: {
    attributeId: string;
    value: string;
    attribute?: { name: string };
  }[];
}

interface VariantEditorProps {
  productId: string;
  variantAttributes: VariantAttribute[];
  variant?: Variant;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export function VariantEditor({
  productId,
  variantAttributes,
  variant,
  onSave,
  onClose,
}: VariantEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sku: variant?.sku || '',
    name: variant?.name || '',
    basePrice: variant?.basePrice?.toString() || '',
    salePrice: variant?.salePrice?.toString() || '',
    wholesalePrice: variant?.wholesalePrice?.toString() || '',
    gsaPrice: variant?.gsaPrice?.toString() || '',
    costPrice: variant?.costPrice?.toString() || '',
    stockQuantity: variant?.stockQuantity?.toString() || '0',
    isActive: variant?.isActive ?? true,
    attributeValues: variantAttributes.map(attr => ({
      attributeId: attr.attributeId,
      value: variant?.attributeValues?.find(av => av.attributeId === attr.attributeId)?.value || '',
    })),
  });

  // Auto-generate variant name from attribute values
  const generateName = () => {
    const parts = formData.attributeValues
      .map((av, idx) => {
        if (av.value) {
          return `${variantAttributes[idx]?.attributeName}: ${av.value}`;
        }
        return null;
      })
      .filter(Boolean);
    return parts.join(', ');
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newValues = [...formData.attributeValues];
    newValues[index] = { ...newValues[index], value };
    setFormData(prev => ({
      ...prev,
      attributeValues: newValues,
      name: prev.name || generateNameFromValues(newValues),
    }));
  };

  const generateNameFromValues = (values: AttributeValue[]) => {
    const parts = values
      .map((av, idx) => {
        if (av.value) {
          return `${variantAttributes[idx]?.attributeName}: ${av.value}`;
        }
        return null;
      })
      .filter(Boolean);
    return parts.join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSave({
        variantId: variant?.id,
        sku: formData.sku,
        name: formData.name || generateName(),
        basePrice: parseFloat(formData.basePrice) || 0,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        gsaPrice: formData.gsaPrice ? parseFloat(formData.gsaPrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        isActive: formData.isActive,
        attributeValues: formData.attributeValues.filter(av => av.value),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {variant ? 'Edit Variant' : 'Add Variant'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              required
            />
          </div>

          {/* Attribute Selectors */}
          {variantAttributes.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {variantAttributes.map((attr, idx) => (
                <div key={attr.attributeId}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {attr.attributeName}
                  </label>
                  {attr.options.length > 0 ? (
                    <select
                      value={formData.attributeValues[idx]?.value || ''}
                      onChange={(e) => handleAttributeChange(idx, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="">Select {attr.attributeName}</option>
                      {attr.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.attributeValues[idx]?.value || ''}
                      onChange={(e) => handleAttributeChange(idx, e.target.value)}
                      placeholder={`Enter ${attr.attributeName}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Variant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variant Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={generateName() || 'Auto-generated from attributes'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate from selected attributes
            </p>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                B2B Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSA Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gsaPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, gsaPrice: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active (available for purchase)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
            >
              {loading ? 'Saving...' : variant ? 'Update Variant' : 'Add Variant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
