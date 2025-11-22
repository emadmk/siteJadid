import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getOrder(id: string) {
  return await db.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          accountType: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              sku: true,
            },
          },
        },
      },
      billingAddress: true,
      shippingAddress: true,
      statusHistory: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      shipments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    ON_HOLD: 'bg-orange-100 text-orange-800',
  };

  const paymentStatusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AUTHORIZED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-safety-green-100 text-safety-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="p-8">
      {/* Back Button */}
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-safety-green-600 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Order #{order.orderNumber}</h1>
          <p className="text-gray-600">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusColors[order.status]}`}>
            {order.status.replace('_', ' ')}
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${paymentStatusColors[order.paymentStatus]}`}>
            {order.paymentStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-safety-green-600" />
              <h2 className="text-xl font-bold text-black">Order Items</h2>
            </div>

            <div className="space-y-4">
              {order.items.map((item: any) => {
                const images = item.product.images as string[];
                return (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-white rounded flex-shrink-0 border border-gray-200">
                      {images && images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.slug}`} className="font-medium text-black hover:text-safety-green-600 line-clamp-1">
                        {item.name}
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">SKU: {item.sku}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                      </div>
                      {Number(item.discount) > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          Discount: -${Number(item.discount).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-black">
                        ${Number(item.total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-black">${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-${Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium text-black">${Number(order.shipping).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-black">${Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-black">Total:</span>
                  <span className="text-safety-green-600">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          {order.trackingNumber && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Truck className="w-5 h-5 text-safety-green-600" />
                <h2 className="text-xl font-bold text-black">Shipping Information</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Tracking Number</div>
                  <div className="font-medium text-black">{order.trackingNumber}</div>
                </div>
                {order.shippingCarrier && (
                  <div>
                    <div className="text-sm text-gray-600">Carrier</div>
                    <div className="font-medium text-black">{order.shippingCarrier}</div>
                  </div>
                )}
                {order.shippingMethod && (
                  <div>
                    <div className="text-sm text-gray-600">Shipping Method</div>
                    <div className="font-medium text-black">{order.shippingMethod}</div>
                  </div>
                )}
                {order.shippedAt && (
                  <div>
                    <div className="text-sm text-gray-600">Shipped At</div>
                    <div className="font-medium text-black">
                      {new Date(order.shippedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order History */}
          {order.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-black mb-6">Order History</h2>
              <div className="space-y-4">
                {order.statusHistory.map((history: any) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="w-2 h-2 bg-safety-green-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[history.status]}`}>
                          {history.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(history.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {history.notes && (
                        <div className="text-sm text-gray-700 mt-1">{history.notes}</div>
                      )}
                      {history.changedBy && (
                        <div className="text-xs text-gray-500 mt-1">by {history.changedBy}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Update Status</h2>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-safety-green-600" />
              <h2 className="text-lg font-bold text-black">Customer</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-black">{order.user.name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{order.user.email}</div>
                {order.user.phone && (
                  <div className="text-sm text-gray-600">{order.user.phone}</div>
                )}
              </div>
              <div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {order.accountType}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-safety-green-600" />
              <h2 className="text-lg font-bold text-black">Payment</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Payment Method</div>
                <div className="font-medium text-black">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment Status</div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                  {order.paymentStatus.replace('_', ' ')}
                </span>
              </div>
              {order.paidAt && (
                <div>
                  <div className="text-sm text-gray-600">Paid At</div>
                  <div className="text-sm text-black">
                    {new Date(order.paidAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-safety-green-600" />
              <h2 className="text-lg font-bold text-black">Shipping Address</h2>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="font-medium text-black">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </div>
              {order.shippingAddress.company && (
                <div>{order.shippingAddress.company}</div>
              )}
              <div>{order.shippingAddress.address1}</div>
              {order.shippingAddress.address2 && (
                <div>{order.shippingAddress.address2}</div>
              )}
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </div>
              <div>{order.shippingAddress.country}</div>
              <div className="pt-2">{order.shippingAddress.phone}</div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Billing Address</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="font-medium text-black">
                {order.billingAddress.firstName} {order.billingAddress.lastName}
              </div>
              {order.billingAddress.company && (
                <div>{order.billingAddress.company}</div>
              )}
              <div>{order.billingAddress.address1}</div>
              {order.billingAddress.address2 && (
                <div>{order.billingAddress.address2}</div>
              )}
              <div>
                {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
              </div>
              <div>{order.billingAddress.country}</div>
              <div className="pt-2">{order.billingAddress.phone}</div>
            </div>
          </div>

          {/* Additional Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4">Notes</h2>
              {order.customerNotes && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Customer Notes</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {order.customerNotes}
                  </div>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Admin Notes</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {order.adminNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
