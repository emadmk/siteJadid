import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

async function getUserOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      subtotal: true,
      shippingCost: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      },
      shippingAddress: {
        select: {
          city: true,
          state: true,
        },
      },
    },
  });

  return orders;
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Processing' },
  SHIPPED: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
};

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Payment Pending' },
  PAID: { color: 'bg-green-100 text-green-800', label: 'Paid' },
  FAILED: { color: 'bg-red-100 text-red-800', label: 'Payment Failed' },
  REFUNDED: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/account/orders');
  }

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        <Link href="/products">
          <Button className="bg-safety-green-600 hover:bg-safety-green-700 gap-2">
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">When you place an order, it will appear here</p>
          <Link href="/products">
            <Button className="bg-safety-green-600 hover:bg-safety-green-700">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            const payment = paymentStatusConfig[order.paymentStatus];

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-black">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payment.color}`}>
                        {payment.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 pr-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0] as string}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate max-w-[150px]">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-sm text-gray-600">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      {order.shippingAddress && (
                        <span> • Shipping to {order.shippingAddress.city}, {order.shippingAddress.state}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-black">
                        ${Number(order.total).toFixed(2)}
                      </span>
                      <Link href={`/account/orders/${order.orderNumber}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const metadata = {
  title: 'My Orders | ADA Supply',
  description: 'View and track your order history.',
};
