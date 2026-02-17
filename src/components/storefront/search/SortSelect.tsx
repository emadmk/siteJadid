'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

function SortSelectInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={searchParams.get('sort') || ''}
      onChange={(e) => handleSort(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
    >
      <option value="">Sort by: Latest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="name">Name: A-Z</option>
      <option value="rating">Highest Rated</option>
    </select>
  );
}

export function SortSelect() {
  return (
    <Suspense fallback={
      <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="">Sort by: Latest</option>
      </select>
    }>
      <SortSelectInner />
    </Suspense>
  );
}
