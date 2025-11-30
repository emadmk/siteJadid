import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import SupplierEditForm from '@/components/admin/SupplierEditForm';
import ProductSupplierManager from '@/components/admin/ProductSupplierManager';

async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
              stockQuantity: true,
              basePrice: true,
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { priority: 'desc' }],
      },
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          poNumber: true,
          status: true,
          total: true,
          createdAt: true,
          expectedDelivery: true,
        },
      },
      _count: {
        select: {
          products: true,
          purchaseOrders: true,
        },
      },
    },
  });

  if (!supplier) return null;

  // Convert Decimal fields to numbers for component compatibility
  return {
    ...supplier,
    rating: supplier.rating ? Number(supplier.rating) : null,
    onTimeDeliveryRate: supplier.onTimeDeliveryRate ? Number(supplier.onTimeDeliveryRate) : null,
    qualityRating: supplier.qualityRating ? Number(supplier.qualityRating) : null,
    totalPurchases: Number(supplier.totalPurchases),
  };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const supplier = await getSupplier(params.id);

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Not Found</h1>
        <Link
          href="/admin/suppliers"
          className="text-safety-green-600 hover:text-safety-green-900 mt-4 inline-block"
        >
          Back to Suppliers
        </Link>
      </div>
    );
  }

  const totalRevenue = supplier.purchaseOrders.reduce(
    (sum, po) => sum + Number(po.total),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
          <p className="text-gray-600 mt-1">Code: {supplier.code}</p>
        </div>
        <Link
          href="/admin/suppliers"
          className="text-safety-green-600 hover:text-safety-green-900"
        >
          ← Back to Suppliers
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Status</div>
          <div className="mt-2">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                supplier.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : supplier.status === 'PENDING_APPROVAL'
                  ? 'bg-yellow-100 text-yellow-800'
                  : supplier.status === 'SUSPENDED'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {supplier.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Products Supplied
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {supplier._count.products}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Purchase Orders
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {supplier._count.purchaseOrders}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">
            Total Purchases
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            ${Number(supplier.totalPurchases).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Supplier Information
            </h2>
            <SupplierEditForm supplier={supplier} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Products ({supplier.products.length})
            </h2>
            <ProductSupplierManager
              supplierId={supplier.id}
              products={supplier.products}
            />
          </div>

          {supplier.purchaseOrders.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Purchase Orders
                </h2>
                <Link
                  href={`/admin/purchase-orders?supplier=${supplier.id}`}
                  className="text-sm text-safety-green-600 hover:text-safety-green-900"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {supplier.purchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        PO #{po.poNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        ${Number(po.total).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            po.status === 'RECEIVED'
                              ? 'bg-green-100 text-green-800'
                              : po.status === 'ACKNOWLEDGED'
                              ? 'bg-blue-100 text-blue-800'
                              : po.status === 'PARTIALLY_RECEIVED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Overall Rating
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {supplier.rating ? (
                    <>
                      <span className="text-yellow-500 text-xl">★</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {Number(supplier.rating).toFixed(1)}
                      </span>
                      <span className="text-gray-500">/ 5.0</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Not rated yet</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">
                  On-Time Delivery Rate
                </div>
                <div className="mt-1">
                  {supplier.onTimeDeliveryRate ? (
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Number(supplier.onTimeDeliveryRate)}%`,
                          }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {Number(supplier.onTimeDeliveryRate).toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">
                  Quality Rating
                </div>
                <div className="mt-1">
                  {supplier.qualityRating ? (
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(Number(supplier.qualityRating) / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {Number(supplier.qualityRating).toFixed(1)} / 5.0
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-gray-600">Email</div>
                <div className="text-gray-900">
                  {supplier.email || 'Not provided'}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Phone</div>
                <div className="text-gray-900">
                  {supplier.phone || 'Not provided'}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Website</div>
                <div className="text-gray-900">
                  {supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-safety-green-600 hover:text-safety-green-900"
                    >
                      {supplier.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
            </div>
          </div>

          {supplier.address && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Address
              </h2>
              <div className="text-sm text-gray-900">
                <div>{supplier.address}</div>
                {supplier.city && (
                  <div>
                    {supplier.city}
                    {supplier.state && `, ${supplier.state}`}{' '}
                    {supplier.zipCode}
                  </div>
                )}
                {supplier.country && <div>{supplier.country}</div>}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment Terms
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Terms</span>
                <span className="font-medium text-gray-900">
                  Net {supplier.paymentTerms} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency</span>
                <span className="font-medium text-gray-900">
                  {supplier.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
