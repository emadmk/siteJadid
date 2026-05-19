import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveCollectionProducts } from '@/lib/services/collection-resolver';
import { formatPrice } from '@/lib/utils';
import { Package, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await resolveCollectionProducts(params.slug, { page: 1, limit: 1 });
  if (!result) return { title: 'Collection not found' };
  const c = result.collection;
  return {
    title: c.metaTitle || `${c.name} | ADA Supply`,
    description: c.metaDescription || c.description || `Browse ${c.name} products on ADA Supply.`,
    openGraph: {
      title: c.metaTitle || c.name,
      description: c.metaDescription || c.description || '',
      images: c.image ? [c.image] : [],
    },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const sort = (searchParams.sort as any) || 'featured';
  const result = await resolveCollectionProducts(params.slug, { page, limit: 24, sort });
  if (!result) notFound();

  const { collection, products, total, totalPages } = result;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="relative bg-gradient-to-r from-safety-green-700 to-emerald-600 text-white">
        {collection.image && (
          <div
            className="absolute inset-0 opacity-25 bg-cover bg-center"
            style={{ backgroundImage: `url(${collection.image})` }}
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-sm text-emerald-100 mb-2 flex items-center gap-2">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Collections</span>
            <span>/</span>
            <span>{collection.name}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">{collection.name}</h1>
          {collection.description && (
            <p className="text-emerald-50 max-w-3xl text-base md:text-lg">
              {collection.description}
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Package className="w-4 h-4" />
            <span>{total} {total === 1 ? 'product' : 'products'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sort bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * 24 + 1}–{Math.min(page * 24, total)} of {total}
          </p>
          <form className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              name="sort"
              defaultValue={sort}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
            <button type="submit" className="text-sm px-3 py-1.5 bg-safety-green-600 text-white rounded-lg hover:bg-safety-green-700">
              Apply
            </button>
          </form>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products in this collection yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const img = p.images?.[0];
                const showSale = p.salePrice && Number(p.salePrice) < Number(p.basePrice);
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-safety-green-500 hover:shadow-md transition-all"
                  >
                    <div className="aspect-square bg-gray-50 relative">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      {p.isFeatured && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Featured
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-500 mb-1">{p.brand?.name || ''}</div>
                      <h3 className="text-sm font-medium text-black line-clamp-2 mb-2 min-h-[2.5rem]">
                        {p.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        {showSale ? (
                          <>
                            <span className="text-lg font-bold text-red-600">${formatPrice(Number(p.salePrice))}</span>
                            <span className="text-xs text-gray-400 line-through">${formatPrice(Number(p.basePrice))}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-black">${formatPrice(Number(p.basePrice))}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/collections/${params.slug}?page=${page - 1}&sort=${sort}`}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/collections/${params.slug}?page=${page + 1}&sort=${sort}`}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
