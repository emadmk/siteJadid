import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ChevronRight, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Brands | ADA Supply',
  description: 'Browse all brands available at ADA Supply. Professional safety equipment and industrial supplies from top manufacturers.',
};

// Disable caching - always fetch fresh data
export const revalidate = 0;

async function getBrands() {
  return await db.brand.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      _count: {
        select: {
          products: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });
}

export default async function BrandsPage() {
  const brands = await getBrands();

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
            <span className="text-black font-medium">Brands</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
            Our Brands
          </h1>
          <p className="text-gray-600">
            Browse products from {brands.length} trusted brands
          </p>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="container mx-auto px-4 py-8">
        {brands.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-black mb-2">No brands found</h3>
            <p className="text-gray-600">
              Brands will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.slug}`}>
                <div className="bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-lg p-6 h-full flex flex-col items-center text-center group">
                  {brand.logo ? (
                    <div className="w-24 h-24 mb-4 flex items-center justify-center">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  <h3 className="font-semibold text-black mb-2 group-hover:text-safety-green-700 transition-colors">
                    {brand.name}
                  </h3>

                  {brand.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {brand.description}
                    </p>
                  )}

                  <div className="mt-auto">
                    <span className="text-sm text-safety-green-600 font-medium">
                      {brand._count.products} {brand._count.products === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
