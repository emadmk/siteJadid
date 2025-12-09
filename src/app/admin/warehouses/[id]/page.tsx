'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  MapPin,
  Loader2,
  Search,
  Edit,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  stockQuantity: number;
  costPrice: number | null;
  basePrice: number;
  brand?: {
    name: string;
    logo: string | null;
  } | null;
  category?: {
    name: string;
  } | null;
}

interface WarehouseStock {
  id: string;
  quantity: number;
  available: number;
  reserved: number;
  product: Product;
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isActive: boolean;
  isPrimary: boolean;
  stock: WarehouseStock[];
  products: Product[];
}

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWarehouse();
  }, [params.id]);

  const fetchWarehouse = async () => {
    try {
      const response = await fetch(`/api/admin/warehouses/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/admin/warehouses');
          return;
        }
        throw new Error('Failed to fetch warehouse');
      }
      const data = await response.json();
      setWarehouse(data);
    } catch (error) {
      console.error('Error fetching warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-safety-green-600 animate-spin" />
          <p className="text-gray-600">Loading warehouse...</p>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">Warehouse Not Found</h1>
          <p className="text-gray-600 mb-6">The warehouse you're looking for doesn't exist.</p>
          <Link href="/admin/warehouses">
            <Button className="bg-safety-green-600 hover:bg-safety-green-700">
              Back to Warehouses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Combine products from stock records and defaultWarehouseId
  const stockProductIds = new Set(warehouse.stock.map(s => s.product.id));
  const productsFromStock = warehouse.stock.map(s => ({
    ...s.product,
    warehouseStock: s.quantity,
    warehouseAvailable: s.available,
    warehouseReserved: s.reserved,
    source: 'stock' as const,
  }));
  const productsFromDefault = warehouse.products
    .filter(p => !stockProductIds.has(p.id))
    .map(p => ({
      ...p,
      warehouseStock: p.stockQuantity,
      warehouseAvailable: p.stockQuantity,
      warehouseReserved: 0,
      source: 'default' as const,
    }));

  const allProducts = [...productsFromStock, ...productsFromDefault];

  // Filter products based on search
  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnits = allProducts.reduce((sum, p) => sum + p.warehouseStock, 0);
  const totalValue = allProducts.reduce((sum, p) => {
    const cost = p.costPrice || p.basePrice || 0;
    return sum + p.warehouseStock * Number(cost);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/warehouses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Warehouses
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-black">{warehouse.name}</h1>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  warehouse.isActive
                    ? 'bg-safety-green-100 text-safety-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </span>
              {warehouse.isPrimary && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Primary
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              {warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.zipCode}
            </div>
          </div>

          <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Warehouse
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Products</div>
          <div className="text-3xl font-bold text-black">{allProducts.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Units</div>
          <div className="text-3xl font-bold text-black">{totalUnits.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-3xl font-bold text-black">${totalValue.toFixed(0).toLocaleString()}</div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Products in Warehouse</h2>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">SKU</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Category</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Stock</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Available</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Reserved</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Value</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => {
                const cost = product.costPrice || product.basePrice || 0;
                const value = product.warehouseStock * Number(cost);

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : product.brand?.logo ? (
                            <img
                              src={product.brand.logo}
                              alt={product.brand.name}
                              className="w-full h-full object-contain p-1 opacity-70"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-black">{product.name}</div>
                          {product.brand && (
                            <div className="text-xs text-gray-500">{product.brand.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{product.sku}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{product.category?.name || '-'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-medium ${product.warehouseStock <= 10 ? 'text-orange-600' : 'text-black'}`}>
                        {product.warehouseStock}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-600">{product.warehouseAvailable}</td>
                    <td className="py-4 px-6 text-center text-gray-600">{product.warehouseReserved}</td>
                    <td className="py-4 px-6 text-right text-sm text-gray-600">${value.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    {searchQuery ? 'No products found matching your search' : 'No products in this warehouse'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
