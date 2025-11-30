import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function AttributesPage() {
  const attributes = await db.productAttribute.findMany({
    include: { _count: { select: { values: true } } },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Product Attributes</h1>
        <Button><Plus className="w-4 h-4 mr-2" />Add Attribute</Button>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Products Using</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr: any) => (
              <tr key={attr.id}>
                <td className="px-6 py-4">{attr.name}</td>
                <td className="px-6 py-4">{attr.type}</td>
                <td className="px-6 py-4">{attr._count.values}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
