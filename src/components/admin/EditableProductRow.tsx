'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Package, Check, X, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  stockQuantity: number;
  status: string;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  level: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Props {
  product: Product;
  categories: Category[];
  brands: Brand[];
}

type EditingField = 'name' | 'category' | 'brand' | 'status' | null;

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-safety-green-100 text-safety-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  OUT_OF_STOCK: 'bg-red-100 text-red-800',
  DISCONTINUED: 'bg-yellow-100 text-yellow-800',
};

const statusOptions = ['ACTIVE', 'INACTIVE', 'DRAFT', 'OUT_OF_STOCK', 'DISCONTINUED'];

export function EditableProductRow({ product: initialProduct, categories, brands }: Props) {
  const [product, setProduct] = useState(initialProduct);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editingField === 'name' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if ((editingField === 'category' || editingField === 'brand' || editingField === 'status') && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editingField]);

  const handleDoubleClick = (field: EditingField) => {
    if (saving) return;
    setError(null);
    setEditingField(field);

    switch (field) {
      case 'name':
        setEditValue(product.name);
        break;
      case 'category':
        setEditValue(product.category?.id || '');
        break;
      case 'brand':
        setEditValue(product.brand?.id || '');
        break;
      case 'status':
        setEditValue(product.status);
        break;
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setError(null);
  };

  const saveEdit = async (valueOverride?: string) => {
    if (!editingField || saving) return;

    // Use override value if provided (for select onChange), otherwise use state
    const valueToSave = valueOverride !== undefined ? valueOverride : editValue;

    // Check if value actually changed
    let hasChanged = false;
    switch (editingField) {
      case 'name':
        hasChanged = valueToSave !== product.name;
        break;
      case 'category':
        hasChanged = valueToSave !== (product.category?.id || '');
        break;
      case 'brand':
        hasChanged = valueToSave !== (product.brand?.id || '');
        break;
      case 'status':
        hasChanged = valueToSave !== product.status;
        break;
    }

    if (!hasChanged) {
      cancelEdit();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData: Record<string, any> = {};

      switch (editingField) {
        case 'name':
          if (!valueToSave.trim()) {
            setError('Name is required');
            setSaving(false);
            return;
          }
          updateData.name = valueToSave.trim();
          break;
        case 'category':
          updateData.categoryId = valueToSave || null;
          break;
        case 'brand':
          updateData.brandId = valueToSave || null;
          break;
        case 'status':
          updateData.status = valueToSave;
          break;
      }

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      const updatedProduct = await response.json();

      // Update local state
      setProduct(prev => ({
        ...prev,
        name: updatedProduct.name,
        status: updatedProduct.status,
        category: updatedProduct.category,
        brand: updatedProduct.brand,
      }));

      setEditingField(null);
      setEditValue('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const images = product.images as string[];

  return (
    <tr className="hover:bg-gray-50">
      {/* Product Name - Editable */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
            {images && images.length > 0 ? (
              <img
                src={images[0]}
                alt={product.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {editingField === 'name' ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={saveEdit}
                  className="w-full px-2 py-1 text-sm border border-safety-green-500 rounded focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  disabled={saving}
                />
                {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>
            ) : (
              <div
                className="font-medium text-black line-clamp-1 cursor-pointer hover:text-safety-green-600 group"
                onDoubleClick={() => handleDoubleClick('name')}
                title="Double-click to edit"
              >
                {product.name}
                <span className="ml-1 opacity-0 group-hover:opacity-50 text-xs">(dbl-click)</span>
              </div>
            )}
            {error && editingField === 'name' && (
              <div className="text-xs text-red-600 mt-1">{error}</div>
            )}
            <div className="text-xs text-gray-600 line-clamp-1">
              {product.shortDescription}
            </div>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="px-6 py-4 text-sm font-mono text-gray-700">
        {product.sku}
      </td>

      {/* Category - Editable */}
      <td className="px-6 py-4 text-sm text-gray-700">
        {editingField === 'category' ? (
          <div className="flex items-center gap-1">
            <select
              ref={selectRef}
              value={editValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValue(newValue);
                // Auto-save on selection change - pass value directly
                saveEdit(newValue);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-safety-green-500 rounded focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              disabled={saving}
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'—'.repeat(cat.level)} {cat.name}
                </option>
              ))}
            </select>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
        ) : (
          <span
            className="cursor-pointer hover:text-safety-green-600"
            onDoubleClick={() => handleDoubleClick('category')}
            title="Double-click to edit"
          >
            {product.category?.name || '-'}
          </span>
        )}
        {error && editingField === 'category' && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </td>

      {/* Brand - Editable */}
      <td className="px-6 py-4 text-sm text-gray-700">
        {editingField === 'brand' ? (
          <div className="flex items-center gap-1">
            <select
              ref={selectRef}
              value={editValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValue(newValue);
                saveEdit(newValue);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-safety-green-500 rounded focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              disabled={saving}
            >
              <option value="">No Brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
        ) : (
          <span
            className="cursor-pointer hover:text-safety-green-600"
            onDoubleClick={() => handleDoubleClick('brand')}
            title="Double-click to edit"
          >
            {product.brand?.name || '-'}
          </span>
        )}
        {error && editingField === 'brand' && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </td>

      {/* Price */}
      <td className="px-6 py-4">
        <div className="text-sm">
          {product.salePrice ? (
            <div>
              <div className="font-semibold text-safety-green-600">
                ${Number(product.salePrice).toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 line-through">
                ${Number(product.basePrice).toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="font-semibold text-black">
              ${Number(product.basePrice).toFixed(2)}
            </div>
          )}
        </div>
      </td>

      {/* Stock */}
      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.stockQuantity === 0
              ? 'bg-red-100 text-red-800'
              : product.stockQuantity <= 10
              ? 'bg-orange-100 text-orange-800'
              : 'bg-safety-green-100 text-safety-green-800'
          }`}
        >
          {product.stockQuantity}
        </span>
      </td>

      {/* Status - Editable */}
      <td className="px-6 py-4">
        {editingField === 'status' ? (
          <div className="flex items-center gap-1">
            <select
              ref={selectRef}
              value={editValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValue(newValue);
                saveEdit(newValue);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-safety-green-500 rounded focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              disabled={saving}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
        ) : (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${statusColors[product.status] || 'bg-gray-100 text-gray-800'}`}
            onDoubleClick={() => handleDoubleClick('status')}
            title="Double-click to edit"
          >
            {product.status.replace('_', ' ')}
          </span>
        )}
        {error && editingField === 'status' && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/products/${product.slug}`} target="_blank">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
