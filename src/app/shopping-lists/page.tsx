import { redirect } from 'next/navigation';
import { getServerSession } from 'next/auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, List, ShoppingCart, Trash2 } from 'lucide-react';

async function getShoppingLists(userId: string) {
  const lists = await db.shoppingList.findMany({
    where: {
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
            },
          },
        },
        orderBy: {
          priority: 'desc',
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      isDefault: 'desc',
    },
  });

  return lists;
}

export default async function ShoppingListsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/shopping-lists');
  }

  const lists = await getShoppingLists(session.user.id);

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
              <h1 className="text-3xl font-bold text-black mb-2">Shopping Lists</h1>
              <p className="text-gray-600">Organize your products into custom lists</p>
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Create List
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {lists.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">No Shopping Lists Yet</h2>
            <p className="text-gray-600 mb-6">Create your first list to organize products</p>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {lists.map((list) => {
              const totalValue = list.items.reduce((sum, item) => {
                let price = Number(item.product.salePrice || item.product.basePrice);
                if (user?.accountType === 'B2B' && item.product.wholesalePrice) {
                  price = Number(item.product.wholesalePrice);
                } else if (user?.accountType === 'GSA' && item.product.gsaPrice) {
                  price = Number(item.product.gsaPrice);
                }
                return sum + price * item.quantity;
              }, 0);

              const totalItems = list.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div key={list.id} className="bg-white rounded-lg border overflow-hidden">
                  {/* List Header */}
                  <div className="p-6 border-b bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-black">{list.name}</h3>
                          {list.isDefault && (
                            <span className="px-2 py-0.5 bg-safety-green-100 text-safety-green-800 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                        </div>
                        {list.description && <p className="text-sm text-gray-600">{list.description}</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      <div>
                        <div className="text-2xl font-bold text-black">{list._count.items}</div>
                        <div className="text-xs text-gray-600">Products</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-black">{totalItems}</div>
                        <div className="text-xs text-gray-600">Total Qty</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-black">${totalValue.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">Est. Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {list.items.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No items in this list</div>
                    ) : (
                      list.items.map((item) => {
                        const images = item.product.images as string[];
                        let price = Number(item.product.salePrice || item.product.basePrice);
                        if (user?.accountType === 'B2B' && item.product.wholesalePrice) {
                          price = Number(item.product.wholesalePrice);
                        } else if (user?.accountType === 'GSA' && item.product.gsaPrice) {
                          price = Number(item.product.gsaPrice);
                        }

                        return (
                          <div key={item.id} className="p-4 hover:bg-gray-50">
                            <div className="flex gap-4">
                              <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                                <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                                  {images[0] ? (
                                    <img src={images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ShoppingCart className="w-8 h-8 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                              </Link>

                              <div className="flex-1 min-w-0">
                                <Link href={`/products/${item.product.slug}`}>
                                  <h4 className="font-semibold text-black hover:text-safety-green-700 line-clamp-2 mb-1">
                                    {item.product.name}
                                  </h4>
                                </Link>
                                <div className="text-sm text-gray-600 mb-2">SKU: {item.product.sku}</div>
                                {item.notes && <div className="text-sm text-gray-700 mb-2">Note: {item.notes}</div>}
                                <div className="flex items-center gap-4">
                                  <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                                  <div className="text-sm font-medium text-black">${price.toFixed(2)} each</div>
                                  <div className="text-sm font-bold text-black">${(price * item.quantity).toFixed(2)}</div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button size="sm" className="bg-primary hover:bg-primary/90">
                                  Add to Cart
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {list.items.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                      <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700 gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Add All to Cart (${totalValue.toFixed(2)})
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
