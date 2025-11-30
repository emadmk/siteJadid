import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

async function getSuppliers(status?: SupplierStatus) {
  const where = status ? { status } : {};

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          products: true,
          purchaseOrders: true,
        },
      },
    },
  });

  const stats = await prisma.supplier.groupBy({
    by: ['status'],
    _count: true,
  });

  return { suppliers, stats };
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { status?: SupplierStatus };
}) {
  const session = await getServerSession(authOptions);

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'];
  if (!session || !adminRoles.includes(session.user.role)) {
    redirect('/');
  }

  const { suppliers, stats } = await getSuppliers(searchParams.status);

  const statusCounts = {
    ACTIVE: stats.find((s) => s.status === 'ACTIVE')?._count || 0,
    INACTIVE: stats.find((s) => s.status === 'INACTIVE')?._count || 0,
    SUSPENDED: stats.find((s) => s.status === 'SUSPENDED')?._count || 0,
    PENDING_APPROVAL:
      stats.find((s) => s.status === 'PENDING_APPROVAL')?._count || 0,
  };

  const totalSuppliers = stats.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Supplier Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage suppliers and track performance
          </p>
        </div>
        <Link
          href="/admin/suppliers/new"
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
        >
          Add New Supplier
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Link
          href="/admin/suppliers"
          className={`bg-white p-4 rounded-lg shadow ${
            !searchParams.status ? 'ring-2 ring-safety-green-600' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600">
            Total Suppliers
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {totalSuppliers}
          </div>
        </Link>

        <Link
          href="/admin/suppliers?status=ACTIVE"
          className={`bg-white p-4 rounded-lg shadow ${
            searchParams.status === 'ACTIVE'
              ? 'ring-2 ring-safety-green-600'
              : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {statusCounts.ACTIVE}
          </div>
        </Link>

        <Link
          href="/admin/suppliers?status=PENDING_APPROVAL"
          className={`bg-white p-4 rounded-lg shadow ${
            searchParams.status === 'PENDING_APPROVAL'
              ? 'ring-2 ring-safety-green-600'
              : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {statusCounts.PENDING_APPROVAL}
          </div>
        </Link>

        <Link
          href="/admin/suppliers?status=SUSPENDED"
          className={`bg-white p-4 rounded-lg shadow ${
            searchParams.status === 'SUSPENDED'
              ? 'ring-2 ring-safety-green-600'
              : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600">Suspended</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">
            {statusCounts.SUSPENDED}
          </div>
        </Link>

        <Link
          href="/admin/suppliers?status=INACTIVE"
          className={`bg-white p-4 rounded-lg shadow ${
            searchParams.status === 'INACTIVE'
              ? 'ring-2 ring-safety-green-600'
              : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600">Inactive</div>
          <div className="text-2xl font-bold text-gray-600 mt-2">
            {statusCounts.INACTIVE}
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Purchases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium">No suppliers found</p>
                    <p className="text-sm mt-1">
                      Get started by adding your first supplier
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {supplier.code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {supplier.email || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {supplier.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {supplier.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">
                            {Number(supplier.rating).toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not rated</span>
                      )}
                      {supplier.onTimeDeliveryRate && (
                        <div className="text-xs text-gray-500">
                          On-time: {Number(supplier.onTimeDeliveryRate).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {supplier._count.products} products
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${Number(supplier.totalPurchases).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/admin/suppliers/${supplier.id}`}
                      className="text-safety-green-600 hover:text-safety-green-900 mr-4"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
