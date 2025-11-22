'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  stockQuantity: number;
  price: number;
}

interface ProductSupplier {
  id: string;
  supplierSku: string | null;
  costPrice: any;
  minimumOrderQty: number;
  leadTimeDays: number;
  isPrimary: boolean;
  priority: number;
  product: Product;
}

interface ProductSupplierManagerProps {
  supplierId: string;
  products: ProductSupplier[];
}

export default function ProductSupplierManager({
  supplierId,
  products,
}: ProductSupplierManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierSku: '',
    costPrice: '',
    minimumOrderQty: 1,
    leadTimeDays: 7,
    isPrimary: false,
    priority: 0,
  });

  const handleEdit = (ps: ProductSupplier) => {
    setEditingId(ps.id);
    setFormData({
      supplierSku: ps.supplierSku || '',
      costPrice: Number(ps.costPrice).toString(),
      minimumOrderQty: ps.minimumOrderQty,
      leadTimeDays: ps.leadTimeDays,
      isPrimary: ps.isPrimary,
      priority: ps.priority,
    });
  };

  const handleUpdate = async (psId: string) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/product-suppliers/${psId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          costPrice: parseFloat(formData.costPrice),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product supplier');
      }

      setEditingId(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating product supplier:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update product supplier'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (psId: string, productName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${productName}" from this supplier?`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/product-suppliers/${psId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product supplier');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting product supplier:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to delete product supplier'
      );
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No products linked to this supplier yet.</p>
        <p className="text-sm mt-1">
          Add products to this supplier from the product management page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((ps) => (
        <div key={ps.id} className="border rounded-lg p-4 hover:bg-gray-50">
          {editingId === ps.id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {ps.product.images[0] && (
                  <Image
                    src={ps.product.images[0]}
                    alt={ps.product.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {ps.product.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    SKU: {ps.product.sku}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Supplier SKU
                  </label>
                  <input
                    type="text"
                    value={formData.supplierSku}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierSku: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Min Order Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimumOrderQty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumOrderQty: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadTimeDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leadTimeDays: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500 text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) =>
                      setFormData({ ...formData, isPrimary: e.target.checked })
                    }
                    className="h-4 w-4 text-safety-green-600 focus:ring-safety-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Primary Supplier
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(ps.id)}
                  disabled={loading}
                  className="bg-safety-green-600 text-white px-3 py-1.5 rounded-md hover:bg-safety-green-700 text-sm disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  disabled={loading}
                  className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-400 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {ps.product.images[0] && (
                  <Image
                    src={ps.product.images[0]}
                    alt={ps.product.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${ps.product.id}`}
                      className="font-medium text-gray-900 hover:text-safety-green-600"
                    >
                      {ps.product.name}
                    </Link>
                    {ps.isPrimary && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    SKU: {ps.product.sku}
                    {ps.supplierSku && ` | Supplier SKU: ${ps.supplierSku}`}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex gap-4">
                    <span>
                      Cost: ${Number(ps.costPrice).toLocaleString()}
                    </span>
                    <span>Min Qty: {ps.minimumOrderQty}</span>
                    <span>Lead: {ps.leadTimeDays} days</span>
                    {ps.priority > 0 && <span>Priority: {ps.priority}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(ps)}
                  disabled={loading}
                  className="text-safety-green-600 hover:text-safety-green-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ps.id, ps.product.name)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
