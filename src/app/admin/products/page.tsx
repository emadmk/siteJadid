import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Package, Search, Upload, Pencil, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { ProductsTable } from '@/components/admin/ProductsTable';

interface SearchParams {
  status?: string;
  category?: string;
  search?: string;
  brand?: string;
  warehouse?: string;
  supplier?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function getProducts(searchParams: SearchParams) {
  const where: any = {};
  const page = parseInt(searchParams.page || '1');
  const pageSize = parseInt(searchParams.pageSize || '50');
  const skip = (page - 1) * pageSize;

  // Build where clause
  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.category) {
    where.categoryId = searchParams.category;
  }

  if (searchParams.brand) {
    where.brandId = searchParams.brand;
  }

  if (searchParams.warehouse) {
    where.defaultWarehouseId = searchParams.warehouse;
  }

  if (searchParams.supplier) {
    where.defaultSupplierId = searchParams.supplier;
  }

  if (searchParams.search) {
    const search = searchParams.search;
    const searchNumber = parseFloat(search);
    const isNumericSearch = !isNaN(searchNumber);

    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
      { metaKeywords: { contains: search, mode: 'insensitive' } },
      { brand: { name: { contains: search, mode: 'insensitive' } } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
      { defaultSupplier: { name: { contains: search, mode: 'insensitive' } } },
      { defaultWarehouse: { name: { contains: search, mode: 'insensitive' } } },
    ];

    if (isNumericSearch) {
      where.OR.push(
        { basePrice: { equals: searchNumber } },
        { salePrice: { equals: searchNumber } },
      );
    }
  }

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' };
  if (searchParams.sortBy) {
    const sortOrder = searchParams.sortOrder === 'asc' ? 'asc' : 'desc';
    switch (searchParams.sortBy) {
      case 'sku':
        orderBy = { sku: sortOrder };
        break;
      case 'brand':
        orderBy = { brand: { name: sortOrder } };
        break;
      case 'price':
        orderBy = { basePrice: sortOrder };
        break;
      case 'stock':
        orderBy = { stockQuantity: sortOrder };
        break;
      case 'status':
        orderBy = { status: sortOrder };
        break;
      case 'name':
        orderBy = { name: sortOrder };
        break;
    }
  }

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        defaultSupplier: { select: { id: true, name: true } },
        defaultWarehouse: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

async function getCategories() {
  // Get all categories with parent info for hierarchical display
  const allCategories = await db.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      parent: { select: { name: true } },
    },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  });

  // Build hierarchical list for dropdown
  const roots = allCategories.filter(c => !c.parentId);
  const children = allCategories.filter(c => c.parentId);

  const result: { id: string; name: string; level: number }[] = [];

  // Helper function to add category and its children recursively
  const addWithChildren = (category: typeof allCategories[0], level: number) => {
    result.push({ id: category.id, name: category.name, level });
    const categoryChildren = children.filter(c => c.parentId === category.id);
    for (const child of categoryChildren) {
      addWithChildren(child, level + 1);
    }
  };

  // Process all root categories
  for (const root of roots) {
    addWithChildren(root, 0);
  }

  return result;
}

async function getBrands() {
  return await db.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function getWarehouses() {
  return await db.warehouse.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function getSuppliers() {
  return await db.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  searchParams,
}: {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: string;
  searchParams: SearchParams;
}) {
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc';

  // Build URL with new sort params
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== 'sortBy' && key !== 'sortOrder') {
      params.set(key, value);
    }
  });
  params.set('sortBy', sortKey);
  params.set('sortOrder', nextOrder);

  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
      <Link
        href={`/admin/products?${params.toString()}`}
        className="flex items-center gap-1 hover:text-safety-green-600 cursor-pointer"
      >
        {label}
        {isActive ? (
          currentOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        ) : (
          <ChevronsUpDown className="w-4 h-4 opacity-40" />
        )}
      </Link>
    </th>
  );
}

function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  searchParams,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  searchParams: SearchParams;
}) {
  // Build base URL params
  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value);
      }
    });
    params.set('page', newPage.toString());
    return `/admin/products?${params.toString()}`;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Number of page buttons to show

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);

      // Adjust if near start or end
      if (page <= 3) {
        end = Math.min(showPages, totalPages - 1);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - showPages + 1);
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalCount}</span> products
      </div>

      <div className="flex items-center gap-2">
        {/* Previous button */}
        {page > 1 ? (
          <Link href={buildUrl(page - 1)} scroll={true}>
            <Button variant="outline" size="sm" className="border-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" className="border-gray-300 opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => (
            typeof p === 'number' ? (
              <Link key={idx} href={buildUrl(p)} scroll={true}>
                <Button
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className={p === page
                    ? 'bg-safety-green-600 hover:bg-safety-green-700 text-white min-w-[36px]'
                    : 'border-gray-300 min-w-[36px]'
                  }
                >
                  {p}
                </Button>
              </Link>
            ) : (
              <span key={idx} className="px-2 text-gray-400">...</span>
            )
          ))}
        </div>

        {/* Next button */}
        {page < totalPages ? (
          <Link href={buildUrl(page + 1)} scroll={true}>
            <Button variant="outline" size="sm" className="border-gray-300">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" className="border-gray-300 opacity-50" disabled>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Jump to page */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-600">Go to:</span>
          <form action="/admin/products" method="GET" className="flex items-center gap-1">
            {/* Preserve existing params */}
            {Object.entries(searchParams).map(([key, value]) =>
              value && key !== 'page' ? (
                <input key={key} type="hidden" name={key} value={value} />
              ) : null
            )}
            <input
              type="number"
              name="page"
              min="1"
              max={totalPages}
              placeholder={page.toString()}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-safety-green-500"
            />
            <Button type="submit" variant="outline" size="sm" className="border-gray-300">
              Go
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ products, totalCount, page, pageSize, totalPages }, categories, brands, warehouses, suppliers] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
    getBrands(),
    getWarehouses(),
    getSuppliers(),
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
        <div className="flex gap-3">
          <Link href="/admin/products/bulk-edit">
            <Button variant="outline" className="border-gray-300">
              <Pencil className="w-4 h-4 mr-2" />
              Bulk Edit
            </Button>
          </Link>
          <Link href="/admin/products/import">
            <Button variant="outline" className="border-gray-300">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
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
        <form className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-6">
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
              <option value="INACTIVE">Inactive</option>
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
                  {'—'.repeat(cat.level)} {cat.name}
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

          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse
            </label>
            <select
              name="warehouse"
              defaultValue={searchParams.warehouse || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select
              name="supplier"
              defaultValue={searchParams.supplier || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6 flex gap-2">
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
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Product
                    </th>
                    <SortableHeader
                      label="SKU"
                      sortKey="sku"
                      currentSort={searchParams.sortBy}
                      currentOrder={searchParams.sortOrder}
                      searchParams={searchParams}
                    />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Category
                    </th>
                    <SortableHeader
                      label="Brand"
                      sortKey="brand"
                      currentSort={searchParams.sortBy}
                      currentOrder={searchParams.sortOrder}
                      searchParams={searchParams}
                    />
                    <SortableHeader
                      label="Price"
                      sortKey="price"
                      currentSort={searchParams.sortBy}
                      currentOrder={searchParams.sortOrder}
                      searchParams={searchParams}
                    />
                    <SortableHeader
                      label="Stock"
                      sortKey="stock"
                      currentSort={searchParams.sortBy}
                      currentOrder={searchParams.sortOrder}
                      searchParams={searchParams}
                    />
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      currentSort={searchParams.sortBy}
                      currentOrder={searchParams.sortOrder}
                      searchParams={searchParams}
                    />
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <ProductsTable
                  products={products as any}
                  categories={categories}
                  brands={brands}
                />
              </table>

              {/* Pagination */}
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                searchParams={searchParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
