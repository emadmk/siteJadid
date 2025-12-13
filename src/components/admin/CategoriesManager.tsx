'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FolderTree, ChevronRight, Merge, Check, X, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number | null;
  parentId: string | null;
  _count: {
    products: number;
    children: number;
  };
  children?: Category[];
}

interface CategoriesManagerProps {
  categories: Category[];
  tree: Category[];
}

export default function CategoriesManager({ categories, tree }: CategoriesManagerProps) {
  const router = useRouter();
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
      if (targetCategoryId === categoryId) {
        setTargetCategoryId(null);
      }
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const setAsTarget = (categoryId: string) => {
    setTargetCategoryId(categoryId);
  };

  const cancelMerge = () => {
    setMergeMode(false);
    setSelectedCategories(new Set());
    setTargetCategoryId(null);
    setError(null);
  };

  const performMerge = async () => {
    if (!targetCategoryId || selectedCategories.size < 2) {
      setError('Please select at least 2 categories and set a target');
      return;
    }

    const sourceCategoryIds = Array.from(selectedCategories).filter(id => id !== targetCategoryId);

    if (sourceCategoryIds.length === 0) {
      setError('Please select categories to merge into the target');
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/categories/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCategoryId,
          sourceCategoryIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge categories');
      }

      // Success - refresh page
      cancelMerge();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsMerging(false);
    }
  };

  const CategoryRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const indent = level * 2.5;
    const isSelected = selectedCategories.has(category.id);
    const isTarget = targetCategoryId === category.id;

    return (
      <>
        <tr className={`hover:bg-gray-50 border-b border-gray-200 ${isSelected ? 'bg-blue-50' : ''} ${isTarget ? 'bg-green-50' : ''}`}>
          {mergeMode && (
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(category.id)}
                  className="w-4 h-4 rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                />
                {isSelected && (
                  <button
                    onClick={() => setAsTarget(category.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      isTarget
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 hover:bg-green-100 text-gray-700'
                    }`}
                    title="Set as target (keep this category)"
                  >
                    {isTarget ? '✓ Target' : 'Set Target'}
                  </button>
                )}
              </div>
            </td>
          )}
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
            {!mergeMode && (
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
            )}
          </td>
        </tr>
        {category.children && category.children.length > 0 && (
          category.children.map((child) => (
            <CategoryRow key={child.id} category={child} level={level + 1} />
          ))
        )}
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Merge Mode Bar */}
      {mergeMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-medium text-blue-900">Merge Mode</h3>
              <p className="text-sm text-blue-700">
                Select categories to merge, then choose one as the target (products will move there).
              </p>
              {selectedCategories.size > 0 && (
                <p className="text-sm text-blue-800 mt-1">
                  Selected: {selectedCategories.size} categories
                  {targetCategoryId && (
                    <span className="ml-2 text-green-700">
                      • Target: {categories.find(c => c.id === targetCategoryId)?.name}
                    </span>
                  )}
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={cancelMerge}
                variant="outline"
                className="border-gray-300"
                disabled={isMerging}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={performMerge}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isMerging || selectedCategories.size < 2 || !targetCategoryId}
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Merge Categories
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      {!mergeMode && categories.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <Button
            onClick={() => setMergeMode(true)}
            variant="outline"
            className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
          >
            <Merge className="w-4 h-4 mr-2" />
            Merge Categories
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No categories yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first product category</p>
            <Link href="/admin/categories/new">
              <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
                Add Category
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {mergeMode && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-32">
                    Select
                  </th>
                )}
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
  );
}
