import { notFound } from 'next/navigation';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { db } from '@/lib/db';

async function getCategory(id: string) {
  return await db.category.findUnique({
    where: { id },
  });
}

async function getAllCategories(excludeId?: string) {
  return await db.category.findMany({
    where: excludeId ? {
      id: { not: excludeId },
    } : undefined,
    select: {
      id: true,
      name: true,
      parentId: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const [category, categories] = await Promise.all([
    getCategory(params.id),
    getAllCategories(params.id),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Edit Category</h1>
        <p className="text-gray-600">Update category details</p>
      </div>

      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
