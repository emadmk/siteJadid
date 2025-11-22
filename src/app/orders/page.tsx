import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, Eye } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: true,
              sku: true,
            },
          },
        },
      },
      shipments: {
        select: {
          trackingNumber: true,
          carrier: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/orders');
  }

  const orders = await getOrders(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-black mb-2">My Orders</h1>
          <p className="text-gray-600">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-black mb-3">No orders yet</h2>
            <p className="text-gray-600 mb-8">Start shopping for safety equipment to place your first order</p>
            <Link href="/products">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
                <Package className="w-5 h-5" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusColors: Record<string, string> = {
                PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
                SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
                DELIVERED: 'bg-safety-green-100 text-safety-green-800 border-safety-green-300',
                CANCELLED: 'bg-red-100 text-red-800 border-red-300',
              };

              const paymentStatusColors: Record<string, string> = {
                PENDING: 'bg-yellow-100 text-yellow-800',
                PAID: 'bg-safety-green-100 text-safety-green-800',
                FAILED: 'bg-red-100 text-red-800',
                REFUNDED: 'bg-gray-100 text-gray-800',
              };

              return (
                <div key={order.id} className={`bg-white rounded-lg border-2 ${statusColors[order.status].split(' ').pop()}`}>
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-black">{order.orderNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        {order.shipments.length > 0 && order.shipments[0].trackingNumber && (
                          <div className="text-sm text-safety-green-600 mt-1">
                            Tracking: {order.shipments[0].trackingNumber} ({order.shipments[0].carrier})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Total</div>
                          <div className="text-3xl font-bold text-black">${order.totalAmount.toFixed(2)}</div>
                        </div>
                        <Link href={`/orders/${order.orderNumber}`}>
                          <Button className="bg-primary hover:bg-primary/90 gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.slice(0, 3).map((item) => {
                        const images = (item.product.images as string[]) || [];
                        return (
                          <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                            <div className="w-20 h-20 bg-white rounded flex-shrink-0">
                              {images[0] ? (
                                <img src={images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-black line-clamp-2 mb-1">
                                {item.product.name}
                              </div>
                              <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                              <div className="text-sm font-bold text-black mt-1">
                                ${item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {order.items.length > 3 && (
                      <div className="mt-3 text-sm text-gray-600">
                        + {order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
                    {order.status === 'DELIVERED' && (
                      <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                        Leave Review
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && order.shipments[0]?.trackingNumber && (
                      <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                        Track Package
                      </Button>
                    )}
                    {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                      <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50">
                        Cancel Order
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                      Download Invoice
                    </Button>
                    <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                      Reorder
                    </Button>
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
