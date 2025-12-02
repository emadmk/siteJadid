import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  CreditCard,
  ArrowLeft,
  Download,
  RefreshCw
} from 'lucide-react';

async function getOrder(userId: string, orderNumber: string) {
  const order = await db.order.findFirst({
    where: {
      userId,
      orderNumber,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              images: true,
            },
          },
        },
      },
      shippingAddress: true,
      billingAddress: true,
    },
  });

  return order;
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  PENDING: { color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: Clock, label: 'Pending' },
  PROCESSING: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: Package, label: 'Processing' },
  SHIPPED: { color: 'text-purple-800', bgColor: 'bg-purple-100', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'text-red-800', bgColor: 'bg-red-100', icon: XCircle, label: 'Cancelled' },
};

const paymentStatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  PENDING: { color: 'text-yellow-800', bgColor: 'bg-yellow-100', label: 'Payment Pending' },
  PAID: { color: 'text-green-800', bgColor: 'bg-green-100', label: 'Paid' },
  FAILED: { color: 'text-red-800', bgColor: 'bg-red-100', label: 'Payment Failed' },
  REFUNDED: { color: 'text-gray-800', bgColor: 'bg-gray-100', label: 'Refunded' },
};

export default async function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/account/orders');
  }

  const order = await getOrder(session.user.id, params.orderNumber);

  if (!order) {
    notFound();
  }

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const payment = paymentStatusConfig[order.paymentStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/account/orders"
            className="flex items-center text-sm text-gray-600 hover:text-black mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-black">Order {order.orderNumber}</h1>
          <p className="text-gray-600">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-4 h-4" />
            Invoice
          </Button>
          {order.status === 'DELIVERED' && (
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="w-4 h-4" />
              Reorder
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="font-medium">{status.label}</span>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${payment.bgColor} ${payment.color}`}>
          <CreditCard className="w-4 h-4" />
          <span className="font-medium">{payment.label}</span>
        </div>
      </div>

      {/* Order Progress */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-black mb-4">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-safety-green-600 transition-all"
              style={{
                width:
                  order.status === 'PENDING'
                    ? '0%'
                    : order.status === 'PROCESSING'
                    ? '33%'
                    : order.status === 'SHIPPED'
                    ? '66%'
                    : '100%',
              }}
            />

            {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((step, index) => {
              const stepOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
              const currentIndex = stepOrder.indexOf(order.status);
              const isComplete = index <= currentIndex;
              const isCurrent = step === order.status;
              const stepConfig = statusConfig[step];
              const StepIcon = stepConfig.icon;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete
                        ? 'bg-safety-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    } ${isCurrent ? 'ring-4 ring-safety-green-100' : ''}`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isComplete ? 'text-safety-green-600' : 'text-gray-500'
                    }`}
                  >
                    {stepConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-black">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0] as string}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold text-black hover:text-safety-green-600"
                    >
                      {item.name || item.product.name}
                    </Link>
                    {item.variantName && (
                      <p className="text-sm text-safety-green-600 font-medium">{item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-500">SKU: {item.variantSku || item.sku || item.product.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                      <span className="font-bold text-black">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-bold text-black mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-black">${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-black">
                  {Number(order.shippingCost) === 0
                    ? 'Free'
                    : `$${Number(order.shippingCost).toFixed(2)}`}
                </span>
              </div>
              {order.taxAmount && Number(order.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-black">${Number(order.taxAmount).toFixed(2)}</span>
                </div>
              )}
              {order.discount && Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-lg">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <h2 className="font-bold text-black">Shipping Address</h2>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-black">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Billing Address */}
          {order.billingAddress && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <h2 className="font-bold text-black">Billing Address</h2>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-black">
                  {order.billingAddress.firstName} {order.billingAddress.lastName}
                </p>
                <p>{order.billingAddress.address1}</p>
                <p>
                  {order.billingAddress.city}, {order.billingAddress.state}{' '}
                  {order.billingAddress.zipCode}
                </p>
              </div>
            </div>
          )}

          {/* Need Help */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Need help with this order?</p>
            <Link href="/contact">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { orderNumber: string } }) {
  return {
    title: `Order ${params.orderNumber} | AdaSupply`,
    description: 'View your order details and tracking information.',
  };
}
