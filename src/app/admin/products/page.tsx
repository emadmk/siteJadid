import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye, Package, Search } from 'lucide-react';
import { db } from '@/lib/db';

async function getProducts(searchParams: { status?: string; category?: string; search?: string; brand?: string }) {
  const where: any = {};

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.category) {
    where.categoryId = searchParams.category;
  }

  if (searchParams.brand) {
    where.brandId = searchParams.brand;
  }

  if (searchParams.search) {
    const search = searchParams.search;
    // Check if search is a number (for price search)
    const searchNumber = parseFloat(search);
    const isNumericSearch = !isNaN(searchNumber);

    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
      { metaKeywords: { contains: search, mode: 'insensitive' } },
      // Search by brand name
      { brand: { name: { contains: search, mode: 'insensitive' } } },
      // Search by category name
      { category: { name: { contains: search, mode: 'insensitive' } } },
      // Search by supplier name
      { defaultSupplier: { name: { contains: search, mode: 'insensitive' } } },
      // Search by warehouse name
      { defaultWarehouse: { name: { contains: search, mode: 'insensitive' } } },
    ];

    // If it's a numeric search, also search by price
    if (isNumericSearch) {
      where.OR.push(
        { basePrice: { equals: searchNumber } },
        { salePrice: { equals: searchNumber } },
      );
    }
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
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      defaultSupplier: {
        select: {
          id: true,
          name: true,
        },
      },
      defaultWarehouse: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
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

async function getBrands() {
  return await db.brand.findMany({
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; search?: string; brand?: string };
}) {
  const [products, categories, brands] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
    getBrands(),
  ]);

  const stats = {
    total: await db.product.count(),
    active: await db.product.count({ where: { status: 'ACTIVE' } }),
    lowStock: await db.product.count({
      where: { status: 'ACTIVE', stockQuantity: { lte: 10 } },
    }),
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Products</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-orange-600 mb-1">{stats.lowStock}</div>
          <div className="text-sm text-gray-600">Low Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search by name, SKU, brand, description, price..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DISCONTINUED">Discontinued</option>
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

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <select
              name="brand"
              defaultValue={searchParams.brand || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/products">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                {searchParams.search || searchParams.status || searchParams.category
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first product'}
              </p>
              <Link href="/admin/products/new">
                <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
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
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product: any) => {
                  const images = product.images as string[];
                  const statusColors: Record<string, string> = {
                    ACTIVE: 'bg-safety-green-100 text-safety-green-800',
                    DRAFT: 'bg-gray-100 text-gray-800',
                    OUT_OF_STOCK: 'bg-red-100 text-red-800',
                    DISCONTINUED: 'bg-yellow-100 text-yellow-800',
                  };

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
                            <div className="text-xs text-gray-600 line-clamp-1">
                              {product.shortDescription}
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
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {product.brand?.name || '-'}
                      </td>
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
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[product.status]}`}
                        >
                          {product.status.replace('_', ' ')}
                        </span>
                      </td>
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
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
