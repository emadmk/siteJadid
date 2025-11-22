import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FolderTree, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';

async function getCategories() {
  const categories = await db.category.findMany({
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: [
      { parentId: 'asc' },
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  return categories;
}

// Build hierarchical structure
function buildCategoryTree(categories: any[]) {
  const categoryMap = new Map();
  const roots: any[] = [];

  // First pass: create map
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function CategoryRow({ category, level = 0 }: { category: any; level?: number }) {
  const indent = level * 2.5; // rem units

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" style={{ marginLeft: `${indent}rem` }}>
            {level > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <FolderTree className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-black">{category.name}</div>
              <div className="text-xs text-gray-600">/{category.slug}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            category.isActive
              ? 'bg-safety-green-100 text-safety-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {category.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">
          {category._count.products} products
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">
          {category._count.children} subcategories
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">
          {category.displayOrder || '-'}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Link href={`/admin/categories/${category.id}/edit`}>
              <Button size="sm" variant="outline" className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>
            {category._count.products === 0 && category._count.children === 0 && (
              <form action={`/admin/categories/${category.id}/delete`} method="POST">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:border-red-600 hover:text-red-600"
                  type="submit"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </form>
            )}
          </div>
        </td>
      </tr>
      {category.children && category.children.length > 0 && (
        category.children.map((child: any) => (
          <CategoryRow key={child.id} category={child} level={level + 1} />
        ))
      )}
    </>
  );
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const tree = buildCategoryTree(categories);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: any) => c.isActive).length;
  const rootCategories = categories.filter((c: any) => !c.parentId).length;

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Categories</h1>
          <p className="text-gray-600">Manage product categories and hierarchies</p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{totalCategories}</div>
          <div className="text-sm text-gray-600">Total Categories</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">{activeCategories}</div>
          <div className="text-sm text-gray-600">Active Categories</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">{rootCategories}</div>
          <div className="text-sm text-gray-600">Root Categories</div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No categories yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first product category</p>
              <Link href="/admin/categories/new">
                <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Subcategories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tree.map((category) => (
                  <CategoryRow key={category.id} category={category} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
