'use client';

import { X, SlidersHorizontal } from 'lucide-react';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

interface ActiveFiltersBarProps {
  filters: ActiveFilter[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({ filters, onRemove, onClearAll }: ActiveFiltersBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap py-2 px-1">
      <div className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Active:</span>
      </div>

      {filters.map((filter) => (
        <span
          key={`${filter.key}-${filter.value}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-safety-green-50 border border-safety-green-200 text-safety-green-800 text-xs font-medium rounded-full"
        >
          <span className="text-safety-green-500 font-normal">{filter.label}:</span>
          {filter.displayValue}
          <button
            onClick={() => onRemove(filter.key, filter.value)}
            className="ml-0.5 p-0.5 rounded-full hover:bg-safety-green-200 transition-colors"
            aria-label={`Remove ${filter.label}: ${filter.displayValue}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-full hover:bg-red-100 transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
        Clear all
      </button>
    </div>
  );
}
