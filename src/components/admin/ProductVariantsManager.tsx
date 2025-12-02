'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VariantEditor } from './VariantEditor';
import { VariantPricingTable } from './VariantPricingTable';

interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  type: string;
  options: string[];
  isVariant: boolean;
}

interface VariantAttribute {
  attributeId: string;
  attributeName: string;
  attributeCode: string;
  options: string[];
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
  attributeValues: {
    attributeId: string;
    value: string;
    attribute: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

interface ProductVariantsManagerProps {
  productId: string;
  categoryId?: string;
}

export function ProductVariantsManager({ productId, categoryId }: ProductVariantsManagerProps) {
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | undefined>();
  const [error, setError] = useState('');

  // Fetch category's variant attributes and product's variants
  useEffect(() => {
    fetchData();
  }, [productId, categoryId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch variants
      const variantsRes = await fetch(`/api/admin/products/${productId}/variants`);
      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        setVariants(variantsData);
      }

      // Fetch category to get variant attribute IDs
      if (categoryId) {
        const [categoryRes, attributesRes] = await Promise.all([
          fetch(`/api/admin/categories/${categoryId}`),
          fetch('/api/admin/product-attributes'),
        ]);

        if (categoryRes.ok && attributesRes.ok) {
          const category = await categoryRes.json();
          const allAttributes = await attributesRes.json();

          // Map variant attribute IDs to full attribute objects
          const variantAttrIds = category.variantAttributeIds || [];
          const mappedAttributes: VariantAttribute[] = variantAttrIds
            .map((id: string) => {
              const attr = allAttributes.find((a: ProductAttribute) => a.id === id);
              if (attr) {
                return {
                  attributeId: attr.id,
                  attributeName: attr.name,
                  attributeCode: attr.code,
                  options: attr.options || [],
                };
              }
              return null;
            })
            .filter(Boolean);

          setVariantAttributes(mappedAttributes);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load variant data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVariant = async (data: any) => {
    const url = `/api/admin/products/${productId}/variants`;
    const method = data.variantId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to save variant');
    }

    await fetchData();
  };

  const handleUpdateVariant = async (variantId: string, data: Partial<Variant>) => {
    const response = await fetch(`/api/admin/products/${productId}/variants`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, ...data }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to update variant');
    }

    await fetchData();
  };

  const handleDeleteVariant = async (variantId: string) => {
    const response = await fetch(
      `/api/admin/products/${productId}/variants?variantId=${variantId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete variant');
    }

    await fetchData();
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingVariant(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-500">Loading variants...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-500">
            Manage different variations of this product (sizes, colors, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-gray-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingVariant(undefined);
              setShowEditor(true);
            }}
            className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* No Category Warning */}
      {!categoryId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">No category selected</p>
            <p className="text-sm text-yellow-700">
              Assign this product to a category to configure variant attributes.
              You can still create variants manually.
            </p>
          </div>
        </div>
      )}

      {/* Variant Attributes Info */}
      {variantAttributes.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Variant Attributes:</strong>{' '}
            {variantAttributes.map(a => a.attributeName).join(', ')}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            These attributes are configured in the category settings.
          </p>
        </div>
      )}

      {/* Variants Table */}
      <VariantPricingTable
        variants={variants}
        onUpdate={handleUpdateVariant}
        onDelete={handleDeleteVariant}
        onEdit={handleEditVariant}
      />

      {/* Variant Editor Modal */}
      {showEditor && (
        <VariantEditor
          productId={productId}
          variantAttributes={variantAttributes}
          variant={editingVariant}
          onSave={handleSaveVariant}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
