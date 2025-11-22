import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import Image from 'next/image';

async function getWishlists() {
  const wishlists = await prisma.wishlist.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountType: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
              price: true,
              stockQuantity: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return wishlists;
}

export default async function WishlistsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const wishlists = await getWishlists();

  const totalCustomers = wishlists.length;
  const totalItems = wishlists.reduce((sum, w) => sum + w._count.items, 0);
  const avgItemsPerWishlist = totalCustomers > 0 ? totalItems / totalCustomers : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Wishlists</h1>
          <p className="text-gray-600 mt-1">
            View and manage customer wishlists
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Customers with Wishlists
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {totalCustomers}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {totalItems}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Avg Items per Wishlist
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {avgItemsPerWishlist.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {wishlists.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No wishlists found
          </div>
        ) : (
          wishlists.map((wishlist) => (
            <div
              key={wishlist.id}
              className="border-b last:border-b-0 p-6 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {wishlist.user.name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500">{wishlist.user.email}</p>
                  <div className="mt-1">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {wishlist.user.accountType}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {wishlist._count.items} items
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(wishlist.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {wishlist.items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {wishlist.items.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      {item.product.images[0] && (
                        <div className="relative h-32 bg-gray-100 rounded-md mb-2">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                      )}
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        SKU: {item.product.sku}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">
                          ${Number(item.product.price).toFixed(2)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.product.stockQuantity > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.product.stockQuantity > 0
                            ? 'In Stock'
                            : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
