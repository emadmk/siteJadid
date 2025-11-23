import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, Filter, Grid, List, ShoppingCart, Star } from 'lucide-react';

async function getSearchData(searchParams: any) {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    inStock,
    certifications,
    sort,
  } = searchParams;

  // Build where clause
  const where: any = {
    status: 'ACTIVE',
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = {
      slug: category,
    };
  }

  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) where.basePrice.gte = parseFloat(minPrice);
    if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
  }

  if (inStock === 'true') {
    where.stockQuantity = { gt: 0 };
  }

  // Get products
  const products = await db.product.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy:
      sort === 'price_asc'
        ? { basePrice: 'asc' }
        : sort === 'price_desc'
        ? { basePrice: 'desc' }
        : sort === 'name'
        ? { name: 'asc' }
        : { createdAt: 'desc' },
    take: 50,
  });

  // Get categories for filter
  const categories = await db.category.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  // Calculate price range
  const priceStats = await db.product.aggregate({
    where: { status: 'ACTIVE' },
    _min: { basePrice: true },
    _max: { basePrice: true },
  });

  return {
    products,
    categories,
    priceRange: {
      min: Number(priceStats._min.basePrice || 0),
      max: Number(priceStats._max.basePrice || 1000),
    },
  };
}

export default async function AdvancedSearchPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const { products, categories, priceRange } = await getSearchData(searchParams);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black mb-4">Product Search</h1>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                defaultValue={searchParams.q || ''}
              />
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5" />
                <h2 className="font-bold text-black">Filters</h2>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-black mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">({cat._count.products})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6 border-t pt-6">
                <h3 className="font-semibold text-black mb-3">Price Range</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      defaultValue={searchParams.minPrice || ''}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      defaultValue={searchParams.maxPrice || ''}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    ${priceRange.min} - ${priceRange.max}
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6 border-t pt-6">
                <h3 className="font-semibold text-black mb-3">Availability</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>

              {/* Certifications */}
              <div className="mb-6 border-t pt-6">
                <h3 className="font-semibold text-black mb-3">Certifications</h3>
                <div className="space-y-2">
                  {['ANSI Z87.1', 'OSHA', 'CE', 'CSA'].map((cert) => (
                    <label key={cert} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                      />
                      <span className="text-sm text-gray-700">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full" variant="outline">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-700">
                <span className="font-semibold text-black">{products.length}</span> products found
              </div>
              <div className="flex items-center gap-3">
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Sort by: Latest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
                <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                  <button className="p-2 rounded hover:bg-gray-100">
                    <Grid className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-100">
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const images = product.images as string[];
                const avgRating =
                  product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group bg-white rounded-lg border hover:border-safety-green-400 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                      {images[0] ? (
                        <img
                          src={images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {product.category && (
                        <div className="text-xs text-safety-green-600 font-medium mb-1">
                          {product.category.name}
                        </div>
                      )}
                      <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(avgRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({product._count.reviews})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-black">
                          ${Number(product.salePrice || product.basePrice).toFixed(2)}
                        </div>
                        {product.stockQuantity > 0 ? (
                          <span className="text-xs text-safety-green-600 font-medium">In Stock</span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
