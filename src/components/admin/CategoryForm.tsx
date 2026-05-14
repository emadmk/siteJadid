'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { CategoryVariantConfig } from './CategoryVariantConfig';

interface PriceRule {
  attribute: string;
  condition: '>=' | '<=' | '==' | 'in';
  value: string;
  modifier: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  displayOrder?: number | null;
  isActive?: boolean;
  showOnHomepage?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  variantAttributeIds?: string[];
  priceRules?: PriceRule[] | unknown | null;  // Accept JsonValue from Prisma
}

interface CategoryFormProps {
  category?: Category;
  categories: { id: string; name: string; parentId: string | null; slug: string }[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image: category?.image || '',
    parentId: category?.parentId || '',
    displayOrder: category?.displayOrder?.toString() || '0',
    isActive: category?.isActive ?? true,
    showOnHomepage: category?.showOnHomepage ?? false,
    metaTitle: category?.metaTitle || '',
    metaDescription: category?.metaDescription || '',
    metaKeywords: category?.metaKeywords || '',
    variantAttributeIds: category?.variantAttributeIds || [],
    priceRules: (category?.priceRules as PriceRule[]) || [],
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('files', file);  // API expects 'files' not 'file'

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      // API returns { urls: [...], images: [...] }
      const imageUrl = data.images?.[0]?.medium || data.urls?.[0] || '';
      setFormData(prev => ({ ...prev, image: imageUrl }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = category
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';

      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image: formData.image || null,
          parentId: formData.parentId || null,
          displayOrder: parseInt(formData.displayOrder) || 0,
          variantAttributeIds: formData.variantAttributeIds,
          priceRules: formData.priceRules.length > 0 ? formData.priceRules : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save category');
      }

      router.push('/admin/categories');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Basic Information</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              required
            />
          </div>

          {/* Slug */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              URL-friendly identifier (e.g., safety-helmets)
            </p>
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <SearchableCategoryPicker
              categories={categories}
              selectedId={formData.parentId}
              onChange={(id) => setFormData((prev) => ({ ...prev, parentId: id }))}
            />
            <p className="text-xs text-gray-600 mt-1">
              Leave blank to create a root category
            </p>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              min="0"
            />
            <p className="text-xs text-gray-600 mt-1">
              Lower numbers appear first
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          {/* Category Image */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <div className="flex items-start gap-4">
              {formData.image ? (
                <div className="relative">
                  <img
                    src={formData.image}
                    alt="Category"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="category-image"
                />
                <label
                  htmlFor="category-image"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 400x400px, Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active (visible to customers)
              </span>
            </label>
          </div>

          {/* Show on Homepage */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOnHomepage}
                onChange={(e) => setFormData(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Show on Homepage
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Display this category in the homepage "Shop by Category" section
            </p>
          </div>
        </div>
      </div>

      {/* SEO Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">SEO Settings</h2>

        <div className="space-y-6">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              maxLength={60}
            />
            <p className="text-xs text-gray-600 mt-1">
              {formData.metaTitle.length}/60 characters (recommended)
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              maxLength={160}
            />
            <p className="text-xs text-gray-600 mt-1">
              {formData.metaDescription.length}/160 characters (recommended)
            </p>
          </div>

          {/* Meta Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={formData.metaKeywords}
              onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Separate keywords with commas
            </p>
          </div>
        </div>
      </div>

      {/* Variant Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Variant Configuration</h2>
        <CategoryVariantConfig
          selectedAttributeIds={formData.variantAttributeIds}
          priceRules={formData.priceRules}
          onChange={(config) => setFormData(prev => ({
            ...prev,
            variantAttributeIds: config.variantAttributeIds,
            priceRules: config.priceRules,
          }))}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={loading}
          className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Searchable Category Picker
// ============================================================
// Fuzzy-matches user input against each category's full breadcrumb path
// (e.g. "Tools > Hand Tools > Abrasive Blast Gun"). Every space-separated
// token in the search must appear in the breadcrumb, in any order. So
// "blast gun" finds "Abrasive Blast Gun", and "tools blast" also finds it.
interface PickerCategory {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
}

function SearchableCategoryPicker({
  categories,
  selectedId,
  onChange,
}: {
  categories: PickerCategory[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Build breadcrumb path for every category, once.
  const pathMap = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const out = new Map<string, string>();
    for (const c of categories) {
      const parts: string[] = [];
      let cur: PickerCategory | undefined = c;
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

  // Filter by tokenized substring match. Empty query → show top 200 alphabetical.
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const items = categories
      .map((c) => ({ c, path: pathMap.get(c.id) || c.name }))
      .filter(({ path }) => {
        if (tokens.length === 0) return true;
        const lower = path.toLowerCase();
        return tokens.every((t) => lower.includes(t));
      });
    items.sort((a, b) => a.path.localeCompare(b.path));
    return items.slice(0, 200);
  }, [categories, pathMap, query]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedLabel = selectedId
    ? pathMap.get(selectedId) || categories.find((c) => c.id === selectedId)?.name || '(unknown)'
    : '-- Root Category --';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-safety-green-500"
      >
        <span className={selectedId ? 'text-black' : 'text-gray-500'}>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories (e.g. 'blast gun')..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setQuery('');
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-safety-green-50 ${
                !selectedId ? 'bg-safety-green-50 font-medium' : ''
              }`}
            >
              -- Root Category --
            </button>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">No categories match &ldquo;{query}&rdquo;</div>
            ) : (
              filtered.map(({ c, path }) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-safety-green-50 ${
                    selectedId === c.id ? 'bg-safety-green-50 font-medium' : ''
                  }`}
                >
                  <div className="text-black">{c.name}</div>
                  {path !== c.name && <div className="text-xs text-gray-500">{path}</div>}
                </button>
              ))
            )}
            {filtered.length === 200 && (
              <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                Showing first 200 results — refine search to narrow down
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
