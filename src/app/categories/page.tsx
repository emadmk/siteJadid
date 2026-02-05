import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package } from 'lucide-react';
import { db } from '@/lib/db';

interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count: {
    products: number;
  };
  children: {
    id: string;
    _count: {
      products: number;
    };
  }[];
}

interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  children: ChildCategory[];
  _count: {
    products: number;
  };
}

// Helper function to calculate total products including all nested children
function getTotalProducts(category: CategoryWithChildren | ChildCategory): number {
  let total = category._count.products;
  if ('children' in category && category.children) {
    for (const child of category.children) {
      total += getTotalProducts(child as ChildCategory);
    }
  }
  return total;
}

async function getCategories(): Promise<CategoryWithChildren[]> {
  const categories = await db.category.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      displayOrder: true,
      children: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          _count: {
            select: {
              products: {
                where: {
                  status: 'ACTIVE',
                  stockQuantity: { gt: 0 },
                },
              },
            },
          },
          // Include grandchildren for counting
          children: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              _count: {
                select: {
                  products: {
                    where: {
                      status: 'ACTIVE',
                      stockQuantity: { gt: 0 },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      },
      _count: {
        select: {
          products: {
            where: {
              status: 'ACTIVE',
              stockQuantity: { gt: 0 },
            },
          },
        },
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  return categories as CategoryWithChildren[];
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  const totalProducts = categories.reduce((acc, cat) => {
    return acc + getTotalProducts(cat);
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">All Categories</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Shop by Category
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Explore {totalProducts.toLocaleString()}+ professional safety products across {categories.length} categories
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h2>
            <p className="text-gray-500">Categories will appear here once they are added.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Main Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categories.map((category) => {
                const totalCategoryProducts = getTotalProducts(category);

                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group"
                  >
                    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-safety-green-400 hover:shadow-lg transition-all duration-200">
                      {/* Image */}
                      <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={150}
                            height={150}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            quality={100}
                            unoptimized
                          />
                        ) : (
                          <Package className="w-16 h-16 text-gray-200" />
                        )}
                      </div>
                      {/* Name */}
                      <h2 className="text-sm font-semibold text-gray-900 text-center group-hover:text-safety-green-600 transition-colors line-clamp-2">
                        {category.name}
                      </h2>
                      {/* Count */}
                      <p className="text-xs text-gray-500 text-center mt-1">
                        {totalCategoryProducts.toLocaleString()} items
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Categories with Subcategories */}
            {categories.filter(cat => cat.children.length > 0).map((category) => (
              <div key={`section-${category.id}`} className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-contain"
                          quality={100}
                          unoptimized
                        />
                      ) : (
                        <Package className="w-7 h-7 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-sm text-gray-500">
                        {category.children.length} subcategories
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="hidden sm:flex items-center gap-1 text-safety-green-600 hover:text-safety-green-700 font-medium text-sm"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Subcategories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {category.children.slice(0, 12).map((child) => (
                    <Link
                      key={child.id}
                      href={`/categories/${child.slug}`}
                      className="group"
                    >
                      <div className="bg-white rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-safety-green-300">
                        <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                          {child.image ? (
                            <Image
                              src={child.image}
                              alt={child.name}
                              width={100}
                              height={100}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              quality={100}
                              unoptimized
                            />
                          ) : (
                            <Package className="w-10 h-10 text-gray-200" />
                          )}
                        </div>
                        <h3 className="text-xs font-medium text-gray-800 text-center group-hover:text-safety-green-600 transition-colors line-clamp-2">
                          {child.name}
                        </h3>
                        <p className="text-xs text-gray-400 text-center mt-0.5">
                          {getTotalProducts(child)} items
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View All on Mobile */}
                <div className="mt-4 text-center sm:hidden">
                  <Link
                    href={`/categories/${category.slug}`}
                    className="inline-flex items-center gap-1 text-safety-green-600 font-medium text-sm"
                  >
                    View All {category.name}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gray-900 rounded-2xl p-8 lg:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-gray-400 mb-8">
              Use our advanced search or contact our team for assistance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-safety-green-600 text-white font-semibold rounded-lg hover:bg-safety-green-700 transition-colors"
              >
                Browse All Products
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'All Categories | ADA Supplies',
  description: 'Browse our complete catalog of professional safety equipment and industrial supplies by category.',
};
