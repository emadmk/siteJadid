import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';

async function getWishlist(userId: string) {
  let wishlist = await db.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              wholesalePrice: true,
              gsaPrice: true,
              images: true,
              stockQuantity: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!wishlist) {
    wishlist = await db.wishlist.create({
      data: {
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                wholesalePrice: true,
                gsaPrice: true,
                images: true,
                stockQuantity: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                reviews: {
                  select: {
                    rating: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return wishlist;
}

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/wishlist');
  }

  const wishlist = await getWishlist(session.user.id);

  // Get user for pricing
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            {wishlist.items.length > 0 && (
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <ShoppingCart className="w-4 h-4" />
                Add All to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {wishlist.items.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center max-w-2xl mx-auto">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-8">
              Save items you love to your wishlist and come back to them later
            </p>
            <Link href="/products">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <ShoppingBag className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.items.map((item) => {
              const images = item.product.images as string[];
              let price = Number(item.product.salePrice || item.product.basePrice);

              if (user?.accountType === 'B2B' && item.product.wholesalePrice) {
                price = Number(item.product.wholesalePrice);
              } else if (user?.accountType === 'GSA' && item.product.gsaPrice) {
                price = Number(item.product.gsaPrice);
              }

              const hasDiscount = item.product.salePrice && Number(item.product.salePrice) < Number(item.product.basePrice);

              const avgRating =
                item.product.reviews.length > 0
                  ? item.product.reviews.reduce((sum, r) => sum + r.rating, 0) / item.product.reviews.length
                  : 0;

              return (
                <div key={item.id} className="bg-white rounded-lg border overflow-hidden group">
                  <div className="relative">
                    <Link href={`/products/${item.product.slug}`}>
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        {images[0] ? (
                          <img
                            src={images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        SALE
                      </div>
                    )}
                    {item.product.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-white text-black px-4 py-2 rounded font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {item.product.category && (
                      <div className="text-xs text-safety-green-600 font-medium mb-1">
                        {item.product.category.name}
                      </div>
                    )}
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-semibold text-black hover:text-safety-green-700 line-clamp-2 mb-2">
                        {item.product.name}
                      </h3>
                    </Link>

                    <div className="text-sm text-gray-600 mb-2">SKU: {item.product.sku}</div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-xl font-bold text-black">${price.toFixed(2)}</div>
                      {hasDiscount && (
                        <div className="text-sm text-gray-500 line-through">
                          ${Number(item.product.basePrice).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {item.product.stockQuantity > 0 ? (
                      <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Out of Stock
                      </Button>
                    )}

                    <div className="text-xs text-gray-600 mt-2">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
