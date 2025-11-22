import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Warehouse,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  Edit,
} from 'lucide-react';
import { db } from '@/lib/db';
import { InventoryAdjustment } from '@/components/admin/InventoryAdjustment';

async function getInventory(searchParams: {
  search?: string;
  status?: string;
  category?: string;
}) {
  const where: any = {};

  if (searchParams.status === 'low_stock') {
    where.stockQuantity = {
      lte: db.$queryRawUnsafe('lowStockThreshold'),
    };
  } else if (searchParams.status === 'out_of_stock') {
    where.stockQuantity = 0;
  } else if (searchParams.status === 'in_stock') {
    where.stockQuantity = {
      gt: 0,
    };
  }

  if (searchParams.category) {
    where.categoryId = searchParams.category;
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { sku: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const products = await db.product.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      stockQuantity: 'asc',
    },
    take: 100,
  });

  return products;
}

async function getCategories() {
  return await db.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

async function getInventoryStats() {
  const [
    totalProducts,
    lowStock,
    outOfStock,
    totalInventoryValue,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({
      where: {
        stockQuantity: {
          lte: 10,
          gt: 0,
        },
      },
    }),
    db.product.count({
      where: {
        stockQuantity: 0,
      },
    }),
    db.product.aggregate({
      _sum: {
        costPrice: true,
      },
      where: {
        costPrice: {
          not: null,
        },
      },
    }),
  ]);

  return {
    totalProducts,
    lowStock,
    outOfStock,
    totalInventoryValue: Number(totalInventoryValue._sum.costPrice || 0),
  };
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; category?: string };
}) {
  const [products, categories, stats] = await Promise.all([
    getInventory(searchParams),
    getCategories(),
    getInventoryStats(),
  ]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Inventory Management</h1>
          <p className="text-gray-600">Monitor and manage product stock levels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {stats.totalProducts}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {stats.lowStock}
          </div>
          <div className="text-sm text-gray-600">Low Stock Items</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            {stats.outOfStock}
          </div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-safety-green-600" />
          </div>
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            ${stats.totalInventoryValue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Inventory Value</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Status
            </label>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              defaultValue={searchParams.category || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/inventory">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No products found</h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.status || searchParams.category
                  ? 'Try adjusting your filters'
                  : 'No products in inventory'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Low Stock Alert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Inventory Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const images = product.images as string[];
                  const isLowStock =
                    product.stockQuantity <= product.lowStockThreshold &&
                    product.stockQuantity > 0;
                  const isOutOfStock = product.stockQuantity === 0;
                  const inventoryValue = product.costPrice
                    ? Number(product.costPrice) * product.stockQuantity
                    : 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
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
                          <div className="min-w-0">
                            <div className="font-medium text-black line-clamp-1">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-800'
                                : isLowStock
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-safety-green-100 text-safety-green-800'
                            }`}
                          >
                            {product.stockQuantity}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                          )}
                          {isOutOfStock && (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {product.lowStockThreshold}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {product.costPrice
                          ? `$${Number(product.costPrice).toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-black">
                        ${inventoryValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <InventoryAdjustment
                            productId={product.id}
                            productName={product.name}
                            currentStock={product.stockQuantity}
                          />
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
