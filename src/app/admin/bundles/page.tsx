import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import Image from 'next/image';

async function getBundles() {
  const bundles = await prisma.productBundle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
              basePrice: true,
            },
          },
        },
      },
    },
  });

  return bundles;
}

export default async function BundlesPage() {
  const session = await getServerSession(authOptions);

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'];
  if (!session || !adminRoles.includes(session.user.role)) {
    redirect('/');
  }

  const bundles = await getBundles();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Bundles</h1>
          <p className="text-gray-600 mt-1">Manage product bundles and kits</p>
        </div>
        <Link
          href="/admin/bundles/new"
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
        >
          Create Bundle
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Bundles</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {bundles.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {bundles.reduce((sum, b) => sum + b.items.length, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Avg Savings</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            $
            {bundles.length > 0
              ? (
                  bundles.reduce((sum, b) => sum + Number(b.savings), 0) /
                  bundles.length
                ).toFixed(2)
              : 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No bundles found
          </div>
        ) : (
          bundles.map((bundle) => (
            <div key={bundle.id} className="bg-white rounded-lg shadow overflow-hidden">
              {bundle.image && (
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={bundle.image}
                    alt={bundle.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {bundle.name}
                </h3>
                <p className="text-sm text-gray-500">SKU: {bundle.sku}</p>
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-600">
                    Price: ${Number(bundle.bundlePrice).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Retail Value: ${Number(bundle.retailValue).toFixed(2)}
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Savings: ${Number(bundle.savings).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Contains {bundle.items.length} items
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {bundle.items.map((item) => (
                    <div
                      key={item.id}
                      className="text-sm text-gray-600 flex items-center justify-between"
                    >
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="text-gray-500">
                        ${Number(item.product.basePrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/admin/bundles/${bundle.id}`}
                    className="text-safety-green-600 hover:text-safety-green-900 text-sm font-medium"
                  >
                    Edit Bundle
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
