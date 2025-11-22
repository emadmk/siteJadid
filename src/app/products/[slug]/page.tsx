import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Truck, ArrowLeft, Star, Package, Award, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { AddToCartButton } from '@/components/product/AddToCartButton';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: {
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  return product;
}

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  const products = await db.product.findMany({
    where: {
      categoryId,
      status: 'ACTIVE',
      stockQuantity: {
        gt: 0,
      },
      id: {
        not: currentProductId,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      salePrice: true,
      images: true,
    },
    take: 4,
  });

  return products;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product || product.status !== 'ACTIVE') {
    notFound();
  }

  const relatedProducts = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id)
    : [];

  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / product.reviews.length
    : 0;

  const images = (product.images as string[]) || [];
  const dimensions = product.dimensions ? JSON.parse(product.dimensions as string) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-600 hover:text-safety-green-600">Products</Link>
            <span className="text-gray-400">/</span>
            {product.category && (
              <>
                <Link href={`/products?category=${product.category.slug}`} className="text-gray-600 hover:text-safety-green-600">
                  {product.category.name}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-black font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-safety-green-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
              <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
                {images[0] ? (
                  <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-32 h-32 text-gray-300" />
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(1, 5).map((image, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square">
                    <img src={image} alt={`${product.name} ${index + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.isFeatured && (
              <div className="inline-flex items-center gap-2 bg-safety-green-100 text-safety-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                <Award className="w-4 h-4" />
                Featured Product
              </div>
            )}

            <h1 className="text-4xl font-bold text-black mb-2">{product.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-sm text-gray-600">SKU: {product.sku}</div>
              {product.reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-4xl font-bold text-black">
                  ${Number(product.salePrice || product.basePrice).toFixed(2)}
                </span>
                {product.salePrice && product.salePrice < product.basePrice && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">
                      ${Number(product.basePrice).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                      Save ${(Number(product.basePrice) - Number(product.salePrice)).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* B2B Pricing */}
              {product.wholesalePrice && (
                <div className="text-sm text-gray-600">
                  B2B Wholesale: ${Number(product.wholesalePrice).toFixed(2)}
                </div>
              )}
              {product.gsaPrice && (
                <div className="text-sm text-gray-600">
                  GSA Contract Price: ${Number(product.gsaPrice).toFixed(2)}
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stockQuantity > 0 ? (
                <div className="flex items-center gap-2 text-safety-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    {product.stockQuantity > 20
                      ? 'In Stock'
                      : `Only ${product.stockQuantity} left in stock`}
                  </span>
                </div>
              ) : (
                <div className="text-red-600 font-medium">Out of Stock</div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-black mb-2">Description</h2>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black mb-3">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                {product.weight && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Weight</div>
                    <div className="font-medium text-black">{Number(product.weight)} lbs</div>
                  </div>
                )}
                {dimensions && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Dimensions</div>
                    <div className="font-medium text-black">
                      {dimensions.length}" × {dimensions.width}" × {dimensions.height}"
                    </div>
                  </div>
                )}
                {product.category && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Category</div>
                    <div className="font-medium text-black">{product.category.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <AddToCartButton
                productId={product.id}
                stockQuantity={product.stockQuantity}
              />
              <Button
                size="lg"
                variant="outline"
                className="w-full border-black text-black hover:bg-black hover:text-white text-lg"
              >
                Request B2B Quote
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-black">ANSI Certified</div>
                    <div className="text-xs text-gray-600">Meets safety standards</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-black">Free Shipping</div>
                    <div className="text-xs text-gray-600">On orders over $99</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Customer Reviews</h2>
            <div className="space-y-6">
              {product.reviews.map((review: any) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-black">
                        {review.user.name || 'Anonymous'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-700">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-black mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: any) => (
                <Link key={relatedProduct.id} href={`/products/${relatedProduct.slug}`}>
                  <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer overflow-hidden">
                    <div className="w-full h-48 bg-gray-100 overflow-hidden">
                      {((relatedProduct.images as string[])?.[0]) ? (
                        <img
                          src={(relatedProduct.images as string[])[0]}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShieldCheck className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-black">
                          ${Number(relatedProduct.salePrice || relatedProduct.basePrice).toFixed(2)}
                        </span>
                        {relatedProduct.salePrice && relatedProduct.salePrice < relatedProduct.basePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${Number(relatedProduct.basePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
