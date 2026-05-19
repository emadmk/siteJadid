'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Layers, Trash2, Pencil, ExternalLink, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Collection {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  _count?: { products: number };
}

export default function CollectionsListPage() {
  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collections', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.collections || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete the "${name}" collection? Products themselves are not deleted.`)) return;
    const res = await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
    if (res.ok) await refresh();
    else alert('Failed to delete');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black flex items-center gap-2">
            <Layers className="w-7 h-7 text-safety-green-600" /> Marketing Collections
          </h1>
          <p className="text-gray-600 mt-1">
            Curated landing pages for campaigns. Each collection has a public URL like{' '}
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/collections/&lt;slug&gt;</code>{' '}
            you can link to from ads.
          </p>
        </div>
        <Link href="/admin/marketing/collections/new">
          <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Collection
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            No collections yet. Create your first one (e.g. &ldquo;Rain Gear&rdquo;).
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-right px-4 py-3">Products</th>
                <th className="text-center px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-black">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <a
                      href={`/collections/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-safety-green-700"
                    >
                      /collections/{c.slug}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{c._count?.products ?? 0} pin/exclude</td>
                  <td className="px-4 py-3 text-center">
                    {c.isActive ? (
                      <Eye className="w-4 h-4 text-safety-green-600 inline" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400 inline" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/marketing/collections/${c.id}`} className="inline-block p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => remove(c.id, c.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
