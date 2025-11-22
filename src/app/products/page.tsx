import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, SlidersHorizontal, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface ProductsPageProps {
  searchParams: {
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    featured?: string;
  };
}

async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'ACTIVE',
    stockQuantity: {
      gt: 0,
    },
  };

  if (searchParams.category) {
    where.category = {
      slug: searchParams.category,
    };
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { sku: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.basePrice = {};
    if (searchParams.minPrice) {
      where.basePrice.gte = parseFloat(searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      where.basePrice.lte = parseFloat(searchParams.maxPrice);
    }
  }

  if (searchParams.featured === 'true') {
    where.isFeatured = true;
  }

  let orderBy: any = { createdAt: 'desc' };

  switch (searchParams.sort) {
    case 'price-asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price-desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'name-asc':
      orderBy = { name: 'asc' };
      break;
    case 'name-desc':
      orderBy = { name: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        salePrice: true,
        images: true,
        isFeatured: true,
        stockQuantity: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

async function getCategories() {
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
    orderBy: {
      name: 'asc',
    },
  });

  return categories;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [{ products, total, pages, currentPage }, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
  ]);

  const activeCategory = categories.find((c: any) => c.slug === searchParams.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            {activeCategory ? activeCategory.name : 'All Safety Equipment'}
          </h1>
          <p className="text-gray-600">
            {total} {total === 1 ? 'product' : 'products'} available
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-black">Filters</h2>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">Search</label>
                <form action="/products" method="get">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchParams.search}
                    placeholder="Search products..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {searchParams.category && (
                    <input type="hidden" name="category" value={searchParams.category} />
                  )}
                  <Button type="submit" className="w-full mt-2 bg-primary hover:bg-primary/90">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </form>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Categories</h3>
                <div className="space-y-2">
                  <Link
                    href="/products"
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      !searchParams.category
                        ? 'bg-safety-green-100 text-safety-green-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Categories
                  </Link>
                  {categories.map((category: any) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      className={`block px-3 py-2 rounded-md transition-colors ${
                        searchParams.category === category.slug
                          ? 'bg-safety-green-100 text-safety-green-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">{category._count.products}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Price Range</h3>
                <form action="/products" method="get" className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                    <input
                      type="number"
                      name="minPrice"
                      defaultValue={searchParams.minPrice}
                      placeholder="$0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                    <input
                      type="number"
                      name="maxPrice"
                      defaultValue={searchParams.maxPrice}
                      placeholder="$1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {searchParams.category && (
                    <input type="hidden" name="category" value={searchParams.category} />
                  )}
                  {searchParams.search && (
                    <input type="hidden" name="search" value={searchParams.search} />
                  )}
                  <Button type="submit" variant="outline" className="w-full border-black text-black hover:bg-black hover:text-white">
                    Apply Filter
                  </Button>
                </form>
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Quick Filters</h3>
                <div className="space-y-2">
                  <Link
                    href="/products?featured=true"
                    className="block px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Featured Products
                  </Link>
                  <Link
                    href="/products?sort=price-asc"
                    className="block px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Lowest Price
                  </Link>
                  <Link
                    href="/products?sort=price-desc"
                    className="block px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Highest Price
                  </Link>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchParams.category || searchParams.search || searchParams.minPrice || searchParams.maxPrice || searchParams.featured) && (
                <Link href="/products">
                  <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-50">
                    Clear All Filters
                  </Button>
                </Link>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {products.length === 0 ? 0 : (currentPage - 1) * 20 + 1}-
                  {Math.min(currentPage * 20, total)} of {total} products
                </div>
                <form action="/products" method="get" className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    name="sort"
                    defaultValue={searchParams.sort || 'newest'}
                    onChange={(e) => e.currentTarget.form?.submit()}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="newest">Newest</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                  </select>
                  {searchParams.category && (
                    <input type="hidden" name="category" value={searchParams.category} />
                  )}
                  {searchParams.search && (
                    <input type="hidden" name="search" value={searchParams.search} />
                  )}
                </form>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search term
                </p>
                <Link href="/products">
                  <Button className="bg-primary hover:bg-primary/90">
                    Clear Filters
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      sku={product.sku}
                      name={product.name}
                      slug={product.slug}
                      price={product.salePrice || product.basePrice}
                      originalPrice={product.salePrice ? product.basePrice : undefined}
                      image={(product.images as string[])?.[0]}
                      category={product.category?.name}
                      isFeatured={product.isFeatured}
                      stockQuantity={product.stockQuantity}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2">
                      {currentPage > 1 && (
                        <Link
                          href={`/products?${new URLSearchParams({
                            ...searchParams,
                            page: (currentPage - 1).toString(),
                          }).toString()}`}
                        >
                          <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                            Previous
                          </Button>
                        </Link>
                      )}

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                          let pageNum;
                          if (pages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pages - 2) {
                            pageNum = pages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Link
                              key={pageNum}
                              href={`/products?${new URLSearchParams({
                                ...searchParams,
                                page: pageNum.toString(),
                              }).toString()}`}
                            >
                              <Button
                                variant={pageNum === currentPage ? 'default' : 'outline'}
                                className={
                                  pageNum === currentPage
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'border-gray-300 text-black hover:bg-gray-100'
                                }
                              >
                                {pageNum}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>

                      {currentPage < pages && (
                        <Link
                          href={`/products?${new URLSearchParams({
                            ...searchParams,
                            page: (currentPage + 1).toString(),
                          }).toString()}`}
                        >
                          <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                            Next
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  sku,
  name,
  slug,
  price,
  originalPrice,
  image,
  category,
  isFeatured,
  stockQuantity,
}: {
  sku: string;
  name: string;
  slug: string;
  price: any;
  originalPrice?: any;
  image?: string;
  category?: string;
  isFeatured: boolean;
  stockQuantity: number;
}) {
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <Link href={`/products/${slug}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer overflow-hidden h-full flex flex-col">
        <div className="w-full h-56 bg-gray-100 overflow-hidden relative">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShieldCheck className="w-16 h-16 text-gray-300" />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}
          {isFeatured && (
            <div className="absolute top-2 left-2 bg-safety-green-600 text-white text-xs font-bold px-2 py-1 rounded">
              FEATURED
            </div>
          )}
          {stockQuantity < 10 && stockQuantity > 0 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              Only {stockQuantity} left
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="text-xs text-gray-500 mb-1">{sku}</div>
          {category && (
            <div className="text-xs text-safety-green-600 font-medium mb-1">{category}</div>
          )}
          <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors flex-1">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-lg font-bold text-black">${price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="mt-3">
            <Button className="w-full bg-primary hover:bg-primary/90 text-sm">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
