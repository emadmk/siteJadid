import { db } from '@/lib/db';
import Link from 'next/link';
import { Plus, Edit2 } from 'lucide-react';

export default async function AttributesPage() {
  const attributes = await db.productAttribute.findMany({
    include: { _count: { select: { values: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Attributes</h1>
          <p className="text-gray-600 mt-1">Manage custom product attributes and filters</p>
        </div>
        <Link
          href="/admin/attributes/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Attribute
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Attributes</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{attributes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Filterable</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {attributes.filter((a: any) => a.isFilterable).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Required</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {attributes.filter((a: any) => a.isRequired).length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filterable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attributes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No attributes found. Create your first attribute to get started.
                </td>
              </tr>
            ) : (
              attributes.map((attr: any) => (
                <tr key={attr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{attr.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {attr.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {attr.options && (attr.options as string[]).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(attr.options as string[]).slice(0, 3).map((opt: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            {opt}
                          </span>
                        ))}
                        {(attr.options as string[]).length > 3 && (
                          <span className="text-xs text-gray-500">+{(attr.options as string[]).length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{attr._count.values}</td>
                  <td className="px-6 py-4">
                    {attr.isFilterable ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/attributes/${attr.id}`}
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-900"
                    >
                      <Edit2 className="w-4 h-4" />
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
