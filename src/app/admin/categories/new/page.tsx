import { CategoryForm } from '@/components/admin/CategoryForm';
import { db } from '@/lib/db';

async function getAllCategories() {
  return await db.category.findMany({
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

export default async function NewCategoryPage() {
  const categories = await getAllCategories();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Add New Category</h1>
        <p className="text-gray-600">Create a new product category</p>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}
