'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }

    router.push(`${pathname}?${params.toString()}`);
    setTimeout(() => setIsSearching(false), 500);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, SKU, or description..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
        />
      </div>
      <Button
        type="submit"
        disabled={isSearching}
        className="gap-2 bg-safety-green-600 hover:bg-safety-green-700"
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
        Search
      </Button>
    </form>
  );
}

export function SearchBar() {
  return (
    <Suspense fallback={
      <form className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, SKU, or description..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" />
        </div>
        <Button className="gap-2 bg-safety-green-600 hover:bg-safety-green-700"><Search className="w-4 h-4" /> Search</Button>
      </form>
    }>
      <SearchBarInner />
    </Suspense>
  );
}
