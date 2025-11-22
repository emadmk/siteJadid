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
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          images: true,
          price: true,
        },
      },
      items: {
        include: {
          bundledProduct: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
              price: true,
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

  if (!session || session.user.role !== 'ADMIN') {
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
          <div className="text-sm font-medium text-gray-600">Avg Discount</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {bundles.length > 0
              ? (
                  bundles.reduce((sum, b) => sum + Number(b.discount), 0) /
                  bundles.length
                ).toFixed(1)
              : 0}
            %
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
              {bundle.product.images[0] && (
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={bundle.product.images[0]}
                    alt={bundle.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {bundle.product.name}
                </h3>
                <p className="text-sm text-gray-500">SKU: {bundle.product.sku}</p>
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-600">
                    Bundle Discount: {Number(bundle.discount)}%
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
                        {item.bundledProduct.name} x{item.quantity}
                      </span>
                      {Number(item.discount) > 0 && (
                        <span className="text-green-600">
                          -{Number(item.discount)}%
                        </span>
                      )}
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
