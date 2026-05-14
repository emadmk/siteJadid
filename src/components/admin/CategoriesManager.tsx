'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FolderTree, ChevronRight, Merge, Check, X, Loader2, Search } from 'lucide-react';

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'root' | 'children' | 'empty'>('all');

  // Breadcrumb path per category (used in search results and as a tooltip)
  const pathMap = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const out = new Map<string, string>();
    for (const c of categories) {
      const parts: string[] = [];
      let cur: Category | undefined = c;
      const seen = new Set<string>();
      while (cur && !seen.has(cur.id)) {
        parts.unshift(cur.name);
        seen.add(cur.id);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      out.set(c.id, parts.join(' > '));
    }
    return out;
  }, [categories]);

  // Filtered flat list. Returned when ANY filter is active so the user sees a
  // direct, searchable list with breadcrumbs instead of the deep tree.
  const filteredFlat = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return categories
      .map((c) => ({ c, path: pathMap.get(c.id) || c.name }))
      .filter(({ c, path }) => {
        if (filterStatus === 'active' && !c.isActive) return false;
        if (filterStatus === 'inactive' && c.isActive) return false;
        if (filterLevel === 'root' && c.parentId) return false;
        if (filterLevel === 'children' && !c.parentId) return false;
        if (filterLevel === 'empty' && c._count.products > 0) return false;
        if (tokens.length === 0) return true;
        const lower = path.toLowerCase();
        return tokens.every((t) => lower.includes(t));
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [categories, pathMap, searchQuery, filterStatus, filterLevel]);

  const hasActiveFilter =
    searchQuery.trim().length > 0 || filterStatus !== 'all' || filterLevel !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterLevel('all');
  };

  const toggleCategory = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  const setAsTarget = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTargetCategoryId(categoryId);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setIsDeleting(categoryId);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsDeleting(null);
    }
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

  const CategoryRow = ({
    category,
    level = 0,
    breadcrumbPath = null,
  }: {
    category: Category;
    level?: number;
    breadcrumbPath?: string | null;
  }) => {
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
                  onClick={(e) => toggleCategory(e, category.id)}
                  onChange={() => {}} // Controlled by onClick to prevent scroll
                  className="w-4 h-4 rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500 cursor-pointer"
                />
                {isSelected && (
                  <button
                    onClick={(e) => setAsTarget(e, category.id)}
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
                {breadcrumbPath ? (
                  <div className="text-xs text-gray-500" title={breadcrumbPath}>{breadcrumbPath}</div>
                ) : (
                  <div className="text-xs text-gray-600">/{category.slug}</div>
                )}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 hover:border-red-600 hover:text-red-600"
                    onClick={() => handleDelete(category.id)}
                    disabled={isDeleting === category.id}
                  >
                    {isDeleting === category.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Delete
                  </Button>
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

      {/* Search & filter bar */}
      {categories.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories (e.g. 'blast gun')..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
          >
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
          >
            <option value="all">All levels</option>
            <option value="root">Root only</option>
            <option value="children">Children only</option>
            <option value="empty">Empty (0 products)</option>
          </select>

          <div className="text-sm text-gray-600 whitespace-nowrap">
            {hasActiveFilter ? (
              <>
                <span className="font-medium text-black">{filteredFlat.length}</span> of {categories.length}
              </>
            ) : (
              <>
                <span className="font-medium text-black">{categories.length}</span> total
              </>
            )}
          </div>

          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 whitespace-nowrap">
              Clear
            </button>
          )}
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
              {hasActiveFilter ? (
                filteredFlat.length === 0 ? (
                  <tr>
                    <td colSpan={mergeMode ? 7 : 6} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No categories match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredFlat.map(({ c, path }) => (
                    <CategoryRow
                      key={c.id}
                      category={c as Category}
                      breadcrumbPath={path !== c.name ? path : null}
                    />
                  ))
                )
              ) : (
                tree.map((category) => (
                  <CategoryRow key={category.id} category={category} />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
