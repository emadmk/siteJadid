import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ChevronRight, Package, Star, ShoppingCart } from 'lucide-react';

interface BrandPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

async function getBrand(slug: string) {
  return await db.brand.findUnique({
    where: { slug, isActive: true },
  });
}

async function getBrandProducts(brandId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: {
        brandId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        basePrice: true,
        salePrice: true,
        images: true,
        stockQuantity: true,
        category: {
          select: {
            name: true,
            slug: true,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.product.count({
      where: {
        brandId,
        status: 'ACTIVE',
      },
    }),
  ]);

  return {
    products,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const brand = await getBrand(params.slug);

  if (!brand) {
    notFound();
  }

  const page = parseInt(searchParams.page || '1');
  const { products, total, pages, currentPage } = await getBrandProducts(brand.id, page);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/brands" className="text-gray-600 hover:text-safety-green-600">
              Brands
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-black font-medium">{brand.name}</span>
          </div>

          {/* Brand Info */}
          <div className="flex items-center gap-6">
            {brand.logo && (
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                {brand.name}
              </h1>
              {brand.description && (
                <p className="text-gray-600 max-w-2xl">{brand.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {total} {total === 1 ? 'product' : 'products'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
            <p className="text-gray-600">
              There are no products available for this brand yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.basePrice);
                const images = product.images as string[];

                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl overflow-hidden h-full flex flex-col">
                      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
                        {images?.[0] ? (
                          <img
                            src={images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            SALE
                          </div>
                        )}
                        {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                          <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Only {product.stockQuantity} left
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <div className="text-xs text-gray-500 mb-1">{product.sku}</div>
                        {product.category && (
                          <div className="text-xs text-safety-green-600 font-medium mb-1">
                            {product.category.name}
                          </div>
                        )}

                        {product._count.reviews > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-500 ml-1">({product._count.reviews} reviews)</span>
                          </div>
                        )}

                        <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors flex-1">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-auto">
                          <span className="text-lg font-bold text-black">
                            ${Number(product.salePrice || product.basePrice).toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              ${Number(product.basePrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/brands/${params.slug}?page=${currentPage - 1}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Link
                          key={pageNum}
                          href={`/brands/${params.slug}?page=${pageNum}`}
                          className={`px-4 py-2 rounded-lg ${
                            pageNum === currentPage
                              ? 'bg-safety-green-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>

                  {currentPage < pages && (
                    <Link
                      href={`/brands/${params.slug}?page=${currentPage + 1}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const brand = await getBrand(params.slug);

  if (!brand) {
    return {
      title: 'Brand Not Found | AdaSupply',
    };
  }

  return {
    title: `${brand.name} Products | AdaSupply`,
    description: brand.description || `Shop ${brand.name} products at AdaSupply. Professional safety equipment and industrial supplies.`,
  };
}
