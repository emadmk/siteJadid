import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Package, Shield } from 'lucide-react';
import { db } from '@/lib/db';

// PPE category slugs we want to display
const PPE_CATEGORY_SLUGS = [
  'footwear',
  'high-visibility-clothing',
  'head-protection',
  'eye-protection',
  'ear-protection',
  'respiratory-protection',
  'hand-arm-protection',
  'ergonomics',
  'fire-retardant',
  'electrical-safety-gear',
  'contamination-control',
  'heat-stress',
  'cold-stress',
  'traffic-safety',
];

// Alternative names to search for (in case slugs are different)
const PPE_CATEGORY_NAMES = [
  'footwear',
  'high visibility clothing',
  'high-vis',
  'hi-vis',
  'head protection',
  'eye protection',
  'ear protection',
  'respiratory protection',
  'hand & arm protection',
  'hand and arm protection',
  'ergonomics',
  'fire retardant',
  'fr clothing',
  'electrical safety',
  'contamination control',
  'heat stress',
  'cold stress',
  'traffic safety',
];

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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

// Helper function to calculate total products including all nested children
function getTotalProducts(category: CategoryWithCount): number {
  let total = category._count.products;
  if (category.children) {
    for (const child of category.children) {
      total += child._count.products;
    }
  }
  return total;
}

async function getPPECategories(): Promise<CategoryWithCount[]> {
  // Fetch categories that match our PPE list
  const categories = await db.category.findMany({
    where: {
      isActive: true,
      OR: [
        { slug: { in: PPE_CATEGORY_SLUGS } },
        {
          name: {
            in: PPE_CATEGORY_NAMES,
            mode: 'insensitive',
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      displayOrder: true,
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
  });

  return categories as CategoryWithCount[];
}

export default async function PPEPage() {
  const categories = await getPPECategories();

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
            <span className="text-gray-900 font-medium">Personal Protective Equipment</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-safety-green-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-safety-green-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Personal Protective Equipment
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Stay safe with quality PPE gear. Explore {totalProducts.toLocaleString()}+ professional safety products across {categories.length} categories
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Categories Found</h2>
            <p className="text-gray-500">PPE categories will appear here once they are configured.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Main Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
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
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gray-900 rounded-2xl p-8 lg:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              Need Help Choosing the Right PPE?
            </h2>
            <p className="text-gray-400 mb-8">
              Our safety experts can help you find the right protective equipment for your needs
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
  title: 'Personal Protective Equipment (PPE) | AdaSupply',
  description: 'Browse our complete catalog of personal protective equipment including footwear, high-visibility clothing, head protection, eye protection, and more.',
};
