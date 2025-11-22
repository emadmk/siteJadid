import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

async function getAttributes() {
  const attributes = await prisma.productAttribute.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          values: true,
        },
      },
    },
  });

  return attributes;
}

export default async function ProductAttributesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const attributes = await getAttributes();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Attributes</h1>
          <p className="text-gray-600 mt-1">
            Manage custom product attributes and filters
          </p>
        </div>
        <Link
          href="/admin/product-attributes/new"
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
        >
          Add Attribute
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Attributes</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {attributes.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Filterable</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {attributes.filter((a) => a.isFilterable).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Required</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {attributes.filter((a) => a.isRequired).length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Options
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Products Using
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Filterable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Required
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attributes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No attributes found
                </td>
              </tr>
            ) : (
              attributes.map((attr) => (
                <tr key={attr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {attr.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {attr.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {attr.options && attr.options.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(attr.options as string[]).slice(0, 3).map((opt, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {opt}
                          </span>
                        ))}
                        {(attr.options as string[]).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(attr.options as string[]).length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {attr._count.values}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {attr.isFilterable ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {attr.isRequired ? (
                      <span className="text-orange-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/product-attributes/${attr.id}`}
                      className="text-safety-green-600 hover:text-safety-green-900"
                    >
                      Edit
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
