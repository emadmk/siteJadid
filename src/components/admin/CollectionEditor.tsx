'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Loader2,
  Search,
  Pin,
  PinOff,
  Star,
  Ban,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Filter,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionFormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  displayOrder: number;
  filterCategoryIds: string[];
  filterBrandIds: string[];
  filterSupplierIds: string[];
  filterMinPrice: string;
  filterMaxPrice: string;
  filterTaaOnly: boolean;
  filterKeywords: string;
}

interface CollectionProduct {
  productId: string;
  isPinned: boolean;
  isExcluded: boolean;
  isFeatured: boolean;
  sortOrder: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    basePrice: any;
    images: string[];
    status: string;
  };
}

interface PreviewProduct {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  images: string[];
  isFeatured?: boolean;
}

const EMPTY: CollectionFormState = {
  name: '',
  slug: '',
  description: '',
  image: '',
  metaTitle: '',
  metaDescription: '',
  isActive: true,
  displayOrder: 0,
  filterCategoryIds: [],
  filterBrandIds: [],
  filterSupplierIds: [],
  filterMinPrice: '',
  filterMaxPrice: '',
  filterTaaOnly: false,
  filterKeywords: '',
};

export function CollectionEditor({ collectionId }: { collectionId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CollectionFormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!collectionId);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);

  const [items, setItems] = useState<CollectionProduct[]>([]);
  const [preview, setPreview] = useState<PreviewProduct[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Product picker
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerResults, setPickerResults] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const set = (patch: Partial<CollectionFormState>) => setForm((f) => ({ ...f, ...patch }));

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial load
  useEffect(() => {
    (async () => {
      const [cats, brs, sups] = await Promise.all([
        fetch('/api/admin/categories?limit=500').then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/brands?limit=500').then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/suppliers?limit=500').then((r) => r.json()).catch(() => ({})),
      ]);
      setCategories(cats.categories || cats.data || []);
      setBrands(brs.brands || brs.data || []);
      setSuppliers(sups.suppliers || sups.data || []);

      if (collectionId) {
        const res = await fetch(`/api/admin/collections/${collectionId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.collection) {
          const c = data.collection;
          setForm({
            id: c.id,
            name: c.name || '',
            slug: c.slug || '',
            description: c.description || '',
            image: c.image || '',
            metaTitle: c.metaTitle || '',
            metaDescription: c.metaDescription || '',
            isActive: c.isActive,
            displayOrder: c.displayOrder || 0,
            filterCategoryIds: c.filterCategoryIds || [],
            filterBrandIds: c.filterBrandIds || [],
            filterSupplierIds: c.filterSupplierIds || [],
            filterMinPrice: c.filterMinPrice != null ? String(c.filterMinPrice) : '',
            filterMaxPrice: c.filterMaxPrice != null ? String(c.filterMaxPrice) : '',
            filterTaaOnly: !!c.filterTaaOnly,
            filterKeywords: c.filterKeywords || '',
          });
          setItems(c.products || []);
        }
        setLoaded(true);
      }
    })();
  }, [collectionId]);

  const refreshPreview = useCallback(async () => {
    if (!collectionId) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/preview?limit=24`, { cache: 'no-store' });
      const data = await res.json();
      setPreview(data.products || []);
      setPreviewTotal(data.total || 0);
    } finally {
      setLoadingPreview(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (collectionId && loaded) refreshPreview();
  }, [collectionId, loaded, refreshPreview]);

  // Product picker (debounced)
  useEffect(() => {
    if (!pickerSearch.trim()) {
      setPickerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setPickerLoading(true);
      try {
        const res = await fetch(`/api/admin/products/bulk?search=${encodeURIComponent(pickerSearch)}&limit=20`);
        const data = await res.json();
        setPickerResults(data.products || []);
      } finally {
        setPickerLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pickerSearch]);

  const save = async () => {
    if (!form.name.trim()) { showToast('error', 'Name is required'); return; }
    setSaving(true);
    try {
      const isNew = !form.id;
      const url = isNew ? '/api/admin/collections' : `/api/admin/collections/${form.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const body = {
        ...form,
        filterMinPrice: form.filterMinPrice || null,
        filterMaxPrice: form.filterMaxPrice || null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      showToast('success', isNew ? 'Collection created' : 'Saved');
      if (isNew && data.collection?.id) {
        router.push(`/admin/marketing/collections/${data.collection.id}`);
      } else {
        refreshPreview();
      }
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const setItemFlags = async (productId: string, patch: Partial<CollectionProduct>) => {
    if (!collectionId) return;
    const existing = items.find((i) => i.productId === productId);
    const merged = {
      isPinned: existing?.isPinned ?? false,
      isExcluded: existing?.isExcluded ?? false,
      isFeatured: existing?.isFeatured ?? false,
      sortOrder: existing?.sortOrder ?? 0,
      ...patch,
    };
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...merged }),
      });
      if (!res.ok) throw new Error();
      // Refetch collection items to get product details for new pins
      const detRes = await fetch(`/api/admin/collections/${collectionId}`, { cache: 'no-store' });
      const det = await detRes.json();
      setItems(det.collection?.products || []);
      refreshPreview();
    } catch {
      showToast('error', 'Failed to update product');
    }
  };

  const removeItem = async (productId: string) => {
    if (!collectionId) return;
    try {
      await fetch(`/api/admin/collections/${collectionId}/products?productId=${productId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      refreshPreview();
    } catch {
      showToast('error', 'Failed to remove');
    }
  };

  if (!loaded) {
    return (
      <div className="p-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const pinned = items.filter((i) => i.isPinned);
  const excluded = items.filter((i) => i.isExcluded);
  const featured = items.filter((i) => i.isFeatured);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/marketing/collections">
            <Button variant="outline" size="sm" className="border-gray-300">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-black">
            {form.id ? 'Edit Collection' : 'New Collection'}
          </h1>
          {form.id && (
            <a
              href={`/collections/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-safety-green-700 hover:underline inline-flex items-center gap-1"
            >
              View live page <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <Button onClick={save} disabled={saving} className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save
        </Button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          toast.type === 'success' ? 'bg-safety-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic */}
          <Card title="Basic" icon={<SettingsIcon className="w-5 h-5" />}>
            <Field label="Name *">
              <input className="ce-input" value={form.name} onChange={(e) => set({ name: e.target.value, slug: form.id ? form.slug : '' })} placeholder="e.g. Rain Gear" />
            </Field>
            <Field label="Slug" hint="URL: /collections/<slug>">
              <input className="ce-input" value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="rain-gear" />
            </Field>
            <Field label="Description" hint="Shown at the top of the landing page">
              <textarea rows={3} className="ce-input" value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <Field label="Header banner image URL">
              <input className="ce-input" value={form.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Display order"><input type="number" className="ce-input" value={form.displayOrder} onChange={(e) => set({ displayOrder: parseInt(e.target.value, 10) || 0 })} /></Field>
              <Field label="">
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                  <span className="text-sm">Collection is active (public)</span>
                </label>
              </Field>
            </div>
          </Card>

          {/* Auto filter */}
          <Card title="Auto-include rules" icon={<Filter className="w-5 h-5" />} hint="Products matching ALL of these are included automatically.">
            <Field label="Categories">
              <MultiSelect items={categories} selected={form.filterCategoryIds} onChange={(ids) => set({ filterCategoryIds: ids })} placeholder="Add category…" />
            </Field>
            <Field label="Brands">
              <MultiSelect items={brands} selected={form.filterBrandIds} onChange={(ids) => set({ filterBrandIds: ids })} placeholder="Add brand…" />
            </Field>
            <Field label="Suppliers">
              <MultiSelect items={suppliers} selected={form.filterSupplierIds} onChange={(ids) => set({ filterSupplierIds: ids })} placeholder="Add supplier…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min price ($)"><input type="number" step="0.01" className="ce-input" value={form.filterMinPrice} onChange={(e) => set({ filterMinPrice: e.target.value })} /></Field>
              <Field label="Max price ($)"><input type="number" step="0.01" className="ce-input" value={form.filterMaxPrice} onChange={(e) => set({ filterMaxPrice: e.target.value })} /></Field>
            </div>
            <Field label="Keyword phrases" hint="Comma-separated. Each phrase is matched against product name + description. e.g. rain, waterproof, raincoat">
              <input className="ce-input" value={form.filterKeywords} onChange={(e) => set({ filterKeywords: e.target.value })} placeholder="rain, waterproof" />
            </Field>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.filterTaaOnly} onChange={(e) => set({ filterTaaOnly: e.target.checked })} />
              <span className="text-sm">TAA-approved only</span>
            </label>
          </Card>

          {/* SEO */}
          <Card title="SEO" icon={<ImageIcon className="w-5 h-5" />}>
            <Field label="Meta title"><input className="ce-input" value={form.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} maxLength={60} /></Field>
            <Field label="Meta description"><textarea rows={2} className="ce-input" value={form.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} maxLength={160} /></Field>
          </Card>

          {/* Manual products */}
          {form.id && (
            <Card title="Manual products (pin / exclude / feature)" icon={<Pin className="w-5 h-5" />}
              hint="Pinned products are always included. Excluded products are always hidden. Featured products bubble to the top.">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="ce-input pl-9"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search products by name or SKU…"
                  />
                </div>
              </div>

              {pickerResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto mb-4">
                  {pickerResults.map((p: any) => {
                    const existing = items.find((i) => i.productId === p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-black truncate">{p.name}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku} · ${Number(p.basePrice).toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            title={existing?.isPinned ? 'Unpin' : 'Pin to collection'}
                            onClick={() => setItemFlags(p.id, { isPinned: !existing?.isPinned })}
                            className={`p-2 rounded ${existing?.isPinned ? 'bg-safety-green-100 text-safety-green-700' : 'hover:bg-gray-100 text-gray-500'}`}
                          >
                            {existing?.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                          </button>
                          <button
                            title={existing?.isFeatured ? 'Unfeature' : 'Feature (top of page)'}
                            onClick={() => setItemFlags(p.id, { isFeatured: !existing?.isFeatured })}
                            className={`p-2 rounded ${existing?.isFeatured ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-gray-500'}`}
                          >
                            <Star className={`w-4 h-4 ${existing?.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            title={existing?.isExcluded ? 'Un-exclude' : 'Exclude from collection'}
                            onClick={() => setItemFlags(p.id, { isExcluded: !existing?.isExcluded })}
                            className={`p-2 rounded ${existing?.isExcluded ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100 text-gray-500'}`}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {pickerLoading && <div className="px-3 py-2 text-xs text-gray-400">Loading…</div>}
                </div>
              )}

              <ManualList title="Pinned" items={pinned} onRemove={removeItem} badgeColor="green" />
              <ManualList title="Featured (top of page)" items={featured} onRemove={removeItem} badgeColor="amber" />
              <ManualList title="Excluded" items={excluded} onRemove={removeItem} badgeColor="red" />
            </Card>
          )}
        </div>

        {/* Right: live preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card title="Live preview" icon={<Eye className="w-5 h-5" />}
              hint={form.id ? `${previewTotal} products will appear on the public page.` : 'Save the collection to enable preview.'}>
              {!form.id ? (
                <div className="text-sm text-gray-500 text-center py-6">Save first to preview.</div>
              ) : loadingPreview ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : preview.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No products yet. Add a filter rule or pin products.</div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {preview.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded hover:bg-gray-50">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-black truncate flex items-center gap-1">
                          {p.isFeatured && <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />}
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-500">${Number(p.basePrice).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ce-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: white;
        }
        .ce-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }
      `}</style>
    </div>
  );
}

function Card({ title, icon, hint, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-safety-green-600">{icon}</span>}
        <h2 className="font-semibold text-black">{title}</h2>
      </div>
      {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function MultiSelect({ items, selected, onChange, placeholder }: any) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = items.filter((i: any) => !selected.includes(i.id) && (i.name || '').toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-lg min-h-[42px] bg-white">
        {selected.map((id: string) => {
          const item = items.find((i: any) => i.id === id);
          return (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-safety-green-50 text-safety-green-800 rounded text-xs">
              {item?.name || id.slice(0, 8)}
              <button onClick={() => onChange(selected.filter((x: string) => x !== id))}><X className="w-3 h-3" /></button>
            </span>
          );
        })}
        <input
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.slice(0, 50).map((i: any) => (
            <button
              key={i.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange([...selected, i.id]); setSearch(''); }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {i.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ManualList({ title, items, onRemove, badgeColor }: { title: string; items: CollectionProduct[]; onRemove: (id: string) => void; badgeColor: 'green' | 'amber' | 'red' }) {
  if (items.length === 0) return null;
  const colors = {
    green: 'bg-safety-green-50 border-safety-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  } as const;
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-600 uppercase mb-2">{title} ({items.length})</div>
      <div className={`border rounded-lg ${colors[badgeColor]} divide-y divide-white/50`}>
        {items.map((it) => (
          <div key={it.productId} className="flex items-center justify-between px-3 py-2">
            <div className="text-sm text-black truncate">
              {it.product?.name || it.productId}
              {it.product?.sku && <span className="text-xs text-gray-500 ml-2">SKU: {it.product.sku}</span>}
            </div>
            <button onClick={() => onRemove(it.productId)} className="p-1 text-gray-500 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
