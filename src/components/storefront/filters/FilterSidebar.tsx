'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSection {
  key: string;
  label: string;
  type: 'single' | 'multiple' | 'checkbox';
  options: FilterOption[];
  defaultExpanded?: boolean;
}

export interface FilterSidebarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  showSearch?: boolean;

  // Filters
  sections: FilterSection[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, value: string, isMultiple?: boolean) => void;

  // TAA Filter
  showTaaFilter?: boolean;
  taaChecked?: boolean;
  onTaaChange?: (checked: boolean) => void;

  // Price Range
  showPriceRange?: boolean;
  priceRange?: { min: string; max: string };
  onPriceChange?: (range: { min: string; max: string }) => void;

  // Actions
  onApply: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  showSearch = true,
  sections,
  activeFilters,
  onFilterChange,
  showTaaFilter = true,
  taaChecked = false,
  onTaaChange,
  showPriceRange = true,
  priceRange = { min: '', max: '' },
  onPriceChange,
  onApply,
  onClear,
  hasActiveFilters,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((section, index) => {
      initial[section.key] = section.defaultExpanded ?? index < 3;
    });
    return initial;
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isSelected = (sectionKey: string, value: string) => {
    return activeFilters[sectionKey]?.includes(value) ?? false;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Search */}
        {showSearch && onSearchChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Filter Sections */}
        {sections.map((section) => (
          <div key={section.key} className="border-t border-gray-100 pt-4">
            <button
              onClick={() => toggleSection(section.key)}
              className="flex items-center justify-between w-full text-left group"
            >
              <span className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                {section.label}
              </span>
              <div className="flex items-center gap-2">
                {activeFilters[section.key]?.length > 0 && (
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {activeFilters[section.key].length}
                  </span>
                )}
                {expandedSections[section.key] ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedSections[section.key] && (
              <div className="mt-3 space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {section.type === 'single' ? (
                  // Single select - buttons
                  <>
                    <button
                      onClick={() => onFilterChange(section.key, '')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        !activeFilters[section.key]?.length
                          ? 'bg-green-50 text-green-700 font-medium border border-green-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All {section.label}
                    </button>
                    {section.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onFilterChange(section.key, option.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          isSelected(section.key, option.value)
                            ? 'bg-green-50 text-green-700 font-medium border border-green-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-xs text-gray-400">{option.count}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  // Multiple select - checkboxes
                  section.options.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(section.key, option.value)}
                        onChange={() => onFilterChange(section.key, option.value, true)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-offset-0"
                      />
                      <span className="flex-1 text-sm text-gray-700">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-gray-400">{option.count}</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {/* Price Range */}
        {showPriceRange && onPriceChange && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
                  placeholder="Min"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
                  placeholder="Max"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAA/BAA Filter */}
        {showTaaFilter && onTaaChange && (
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 cursor-pointer hover:shadow-sm transition-shadow">
              <input
                type="checkbox"
                checked={taaChecked}
                onChange={(e) => onTaaChange(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-blue-900 text-sm">TAA/BAA Approved</div>
                <div className="text-xs text-blue-600">Government compliant</div>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <Button
          onClick={onApply}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

// Export for use in mobile
export function MobileFilterSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl animate-slide-in-left">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
