import Link from 'next/link';
import { db } from '@/lib/db';
import { Search, Package, Star } from 'lucide-react';
import { AdvancedSearchFilters } from '@/components/storefront/search/AdvancedSearchFilters';
import { SearchBar } from '@/components/storefront/search/SearchBar';
import { SortSelect } from '@/components/storefront/search/SortSelect';

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
    // Support multiple categories (comma-separated)
    const categoryList = category.split(',');
    if (categoryList.length === 1) {
      where.category = { slug: categoryList[0] };
    } else {
      where.category = { slug: { in: categoryList } };
    }
  }

  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) where.basePrice.gte = parseFloat(minPrice);
    if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
  }

  if (inStock === 'true') {
    where.stockQuantity = { gt: 0 };
  }

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' };
  switch (sort) {
    case 'price_asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price_desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'name':
      orderBy = { name: 'asc' };
      break;
    case 'rating':
      orderBy = { createdAt: 'desc' };
      break;
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
        where: { status: 'APPROVED' },
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          reviews: {
            where: { status: 'APPROVED' },
          },
        },
      },
    },
    orderBy,
    take: 60,
  });

  // Calculate average ratings and sort by rating if needed
  let processedProducts = products.map((product) => {
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;
    return { ...product, avgRating };
  });

  if (sort === 'rating') {
    processedProducts = processedProducts.sort((a, b) => b.avgRating - a.avgRating);
  }

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
          products: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Calculate price range
  const priceStats = await db.product.aggregate({
    where: { status: 'ACTIVE' },
    _min: { basePrice: true },
    _max: { basePrice: true },
  });

  return {
    products: processedProducts,
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
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black mb-4">Advanced Product Search</h1>
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <AdvancedSearchFilters categories={categories} priceRange={priceRange} />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-gray-700">
                <span className="font-semibold text-black">{products.length}</span> products found
                {searchParams.q && (
                  <span className="ml-2 text-gray-500">
                    for &quot;{searchParams.q}&quot;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <SortSelect />
              </div>
            </div>

            {/* Products */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const images = product.images as string[];
                  const price = product.salePrice
                    ? Number(product.salePrice)
                    : Number(product.basePrice);
                  const originalPrice = product.salePrice
                    ? Number(product.basePrice)
                    : null;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 hover:shadow-lg transition-all overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {images[0] ? (
                          <img
                            src={images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        {product.salePrice && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            SALE
                          </div>
                        )}
                        {product.stockQuantity <= 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {product.category && (
                          <div className="text-xs text-safety-green-600 font-medium mb-1">
                            {product.category.name}
                          </div>
                        )}
                        <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.avgRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-600 ml-1">
                            ({product._count.reviews})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-black">
                              ${price.toFixed(2)}
                            </span>
                            {originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ${originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {product.stockQuantity > 0 ? (
                            <span className="text-xs text-safety-green-600 font-medium">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 font-medium">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to find what you&apos;re looking for
                </p>
                <Link
                  href="/products"
                  className="text-safety-green-600 hover:text-safety-green-700 font-medium"
                >
                  Browse all products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Advanced Search | ADA Supplies',
  description: 'Search and filter through our complete catalog of safety equipment.',
};
