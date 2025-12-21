'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { FilterGroup, getFiltersForCategory, parseFilterParams } from '@/lib/filter-config';

interface ProductFiltersProps {
  categorySlug?: string;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  onClearAll: () => void;
}

export function ProductFilters({
  categorySlug,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: ProductFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  useEffect(() => {
    const groups = categorySlug ? getFiltersForCategory(categorySlug) : [];
    setFilterGroups(groups);

    // Expand all groups by default
    setExpandedGroups(new Set(groups.map(g => g.key)));
  }, [categorySlug]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleOptionToggle = (groupKey: string, value: string, isMultiple: boolean) => {
    const currentValues = selectedFilters[groupKey] || [];

    if (isMultiple) {
      // Multiple selection - toggle the value
      if (currentValues.includes(value)) {
        onFilterChange(groupKey, currentValues.filter(v => v !== value));
      } else {
        onFilterChange(groupKey, [...currentValues, value]);
      }
    } else {
      // Single selection - replace or clear
      if (currentValues.includes(value)) {
        onFilterChange(groupKey, []);
      } else {
        onFilterChange(groupKey, [value]);
      }
    }
  };

  const hasActiveFilters = Object.values(selectedFilters).some(v => v.length > 0);

  if (filterGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with Clear All */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Active Filters</span>
          <button
            onClick={onClearAll}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        </div>
      )}

      {/* Filter Groups */}
      {filterGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const selectedValues = selectedFilters[group.key] || [];
        const hasSelection = selectedValues.length > 0;

        return (
          <div key={group.key} className="border-b border-gray-200 pb-4">
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <span className={`text-sm font-medium ${hasSelection ? 'text-safety-green-600' : 'text-black'}`}>
                {group.label}
                {hasSelection && (
                  <span className="ml-2 text-xs bg-safety-green-100 text-safety-green-700 px-2 py-0.5 rounded-full">
                    {selectedValues.length}
                  </span>
                )}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {group.options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded transition-colors ${
                        isSelected ? 'bg-safety-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type={group.multiple ? 'checkbox' : 'radio'}
                        name={group.key}
                        checked={isSelected}
                        onChange={() => handleOptionToggle(group.key, option.value, group.multiple ?? false)}
                        className="w-4 h-4 text-safety-green-600 border-gray-300 focus:ring-safety-green-500 rounded"
                      />
                      <span className={`text-sm ${isSelected ? 'text-safety-green-700 font-medium' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Active Filter Tags Component
export function ActiveFilterTags({
  selectedFilters,
  filterGroups,
  onRemove,
  onClearAll,
}: {
  selectedFilters: Record<string, string[]>;
  filterGroups: FilterGroup[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}) {
  const hasFilters = Object.values(selectedFilters).some(v => v.length > 0);

  if (!hasFilters) return null;

  const getLabel = (key: string, value: string): string => {
    const group = filterGroups.find(g => g.key === key);
    if (!group) return value;
    const option = group.options.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(selectedFilters).map(([key, values]) =>
        values.map((value) => (
          <span
            key={`${key}-${value}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-safety-green-100 text-safety-green-700 text-sm rounded-full"
          >
            {getLabel(key, value)}
            <button
              onClick={() => onRemove(key, value)}
              className="hover:bg-safety-green-200 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))
      )}
      <button
        onClick={onClearAll}
        className="text-sm text-gray-500 hover:text-red-600 underline"
      >
        Clear all
      </button>
    </div>
  );
}
