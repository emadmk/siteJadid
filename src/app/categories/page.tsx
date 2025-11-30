import Link from 'next/link';
import { ChevronRight, Grid3X3, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';

interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  displayOrder: number;
  children: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    _count: {
      products: number;
    };
  }[];
  _count: {
    products: number;
  };
}

async function getCategories(): Promise<CategoryWithChildren[]> {
  const categories = await db.category.findMany({
    where: {
      isActive: true,
      parentId: null, // Only top-level categories
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
              products: true,
            },
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  return categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  // Calculate total products including children
  const totalProducts = categories.reduce((acc, cat) => {
    const childProducts = cat.children.reduce((sum, child) => sum + child._count.products, 0);
    return acc + cat._count.products + childProducts;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-black font-medium">All Categories</span>
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Browse Categories</h1>
          <p className="text-gray-600">
            Explore our complete range of {totalProducts.toLocaleString()} professional safety products
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">No Categories Yet</h2>
            <p className="text-gray-600">
              Categories will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const totalCategoryProducts =
                category._count.products +
                category.children.reduce((sum, child) => sum + child._count.products, 0);

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Main Category Header */}
                  <Link
                    href={`/categories/${category.slug}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShieldCheck className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-black group-hover:text-safety-green-600 transition-colors">
                            {category.name}
                          </h2>
                          {category.description && (
                            <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                              {category.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {totalCategoryProducts.toLocaleString()} products
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-safety-green-600 transition-colors" />
                    </div>
                  </Link>

                  {/* Subcategories Grid */}
                  {category.children.length > 0 && (
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/categories/${child.slug}`}
                            className="group"
                          >
                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-safety-green-50 hover:border-safety-green-200 border border-transparent transition-all text-center">
                              <div className="w-12 h-12 bg-white rounded-lg mx-auto mb-3 overflow-hidden shadow-sm">
                                {child.image ? (
                                  <img
                                    src={child.image}
                                    alt={child.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <h3 className="text-sm font-medium text-black group-hover:text-safety-green-600 transition-colors line-clamp-2">
                                {child.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {child._count.products} items
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Shop All Products CTA */}
        <div className="mt-12 bg-gradient-to-r from-safety-green-600 to-safety-green-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Looking for Something Specific?</h2>
          <p className="text-safety-green-100 mb-6">
            Browse our complete catalog or use our advanced search
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-safety-green-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              View All Products
            </Link>
            <Link
              href="/products/advanced-search"
              className="inline-flex items-center justify-center px-6 py-3 bg-safety-green-800 text-white font-semibold rounded-lg hover:bg-safety-green-900 transition-colors"
            >
              Advanced Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'All Categories | AdaSupply',
  description: 'Browse our complete catalog of professional safety equipment and industrial supplies by category.',
};
