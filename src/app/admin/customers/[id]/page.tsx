import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Calendar,
  Shield,
  User,
} from 'lucide-react';
import { db } from '@/lib/db';

async function getCustomer(id: string) {
  const customer = await db.user.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          items: {
            select: {
              quantity: true,
              basePrice: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      addresses: {
        orderBy: {
          isDefault: 'desc',
        },
      },
      _count: {
        select: {
          orders: true,
          addresses: true,
          reviews: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return customer;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomer(params.id);

  const totalSpent = customer.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );

  const totalOrders = customer._count.orders;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
  };

  const roleColors: Record<string, string> = {
    USER: 'bg-gray-100 text-gray-800',
    ADMIN: 'bg-orange-100 text-orange-800',
    SUPER_ADMIN: 'bg-red-100 text-red-800',
  };

  const orderStatusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/customers">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{customer.name}</h1>
            <p className="text-gray-600">Customer Details</p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                accountTypeColors[customer.accountType]
              }`}
            >
              {customer.accountType}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                roleColors[customer.role]
              }`}
            >
              {customer.role}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-black mb-1">{totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-safety-green-600 mb-1">
                ${totalSpent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                ${averageOrderValue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Avg Order Value</div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Recent Orders</h2>
            </div>
            <div className="p-6">
              {customer.orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-safety-green-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-black">
                          Order #{order.orderNumber}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            orderStatusColors[order.status]
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          {order.items.length} item(s) •{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="font-semibold text-safety-green-600">
                          ${Number(order.totalAmount).toFixed(2)}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {totalOrders > 10 && (
                    <Link href={`/admin/orders?search=${customer.email}`}>
                      <Button
                        variant="outline"
                        className="w-full border-gray-300 hover:border-safety-green-600"
                      >
                        View All Orders ({totalOrders})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Addresses</h2>
            </div>
            <div className="p-6">
              {customer.addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No addresses saved</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      {address.isDefault && (
                        <span className="inline-block px-2 py-1 bg-safety-green-100 text-safety-green-800 text-xs font-medium rounded mb-2">
                          Default
                        </span>
                      )}
                      <div className="text-sm space-y-1">
                        <div className="font-medium text-black">{address.fullName}</div>
                        <div className="text-gray-700">{address.addressLine1}</div>
                        {address.addressLine2 && (
                          <div className="text-gray-700">{address.addressLine2}</div>
                        )}
                        <div className="text-gray-700">
                          {address.city}, {address.state} {address.zipCode}
                        </div>
                        <div className="text-gray-700">{address.country}</div>
                        {address.phone && (
                          <div className="text-gray-700">Phone: {address.phone}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-600">Email</div>
                  <div className="text-sm text-black">{customer.email}</div>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-600">Phone</div>
                    <div className="text-sm text-black">{customer.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-600">Customer Since</div>
                  <div className="text-sm text-black">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Account Details</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Customer ID</div>
                <div className="text-sm font-mono text-black break-all">
                  {customer.id}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Account Type</div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    accountTypeColors[customer.accountType]
                  }`}
                >
                  {customer.accountType}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Role</div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    roleColors[customer.role]
                  }`}
                >
                  {customer.role}
                </span>
              </div>
              {customer.emailVerified && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Email Verified</div>
                  <div className="text-sm text-safety-green-600 font-medium">
                    {new Date(customer.emailVerified).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GSA Information */}
          {customer.accountType === 'GSA' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-safety-green-600" />
                GSA Information
              </h2>
              <div className="space-y-3">
                {customer.gsaNumber && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">GSA Number</div>
                    <div className="text-sm font-mono text-black">
                      {customer.gsaNumber}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-600 mb-1">Approval Status</div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.gsaApprovalStatus === 'APPROVED'
                        ? 'bg-safety-green-100 text-safety-green-800'
                        : customer.gsaApprovalStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {customer.gsaApprovalStatus || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Activity Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="text-sm font-semibold text-black">
                  {customer._count.orders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Addresses</span>
                <span className="text-sm font-semibold text-black">
                  {customer._count.addresses}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Reviews</span>
                <span className="text-sm font-semibold text-black">
                  {customer._count.reviews}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
