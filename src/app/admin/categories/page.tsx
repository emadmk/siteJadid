import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import CategoriesManager from '@/components/admin/CategoriesManager';

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

      {/* Categories Table with Merge functionality */}
      <CategoriesManager categories={categories as any} tree={tree} />
    </div>
  );
}
