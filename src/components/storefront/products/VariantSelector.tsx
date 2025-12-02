'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface AttributeValue {
  attributeId: string;
  value: string;
  attribute: {
    id: string;
    name: string;
    code: string;
  };
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  gsaPrice?: number | null;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
  attributeValues: AttributeValue[];
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantSelect: (variant: Variant | null) => void;
  selectedVariantId?: string;
}

export function VariantSelector({
  variants,
  onVariantSelect,
  selectedVariantId,
}: VariantSelectorProps) {
  // Check if variants have attributeValues
  const hasAttributeValues = variants.some(v => v.attributeValues && v.attributeValues.length > 0);

  if (variants.length === 0) {
    return null;
  }

  // If variants don't have attributeValues, use simple selection
  if (!hasAttributeValues) {
    return (
      <SimpleVariantSelector
        variants={variants}
        onVariantSelect={onVariantSelect}
        selectedVariantId={selectedVariantId}
      />
    );
  }

  // Use attribute-based selection
  return (
    <AttributeVariantSelector
      variants={variants}
      onVariantSelect={onVariantSelect}
      selectedVariantId={selectedVariantId}
    />
  );
}

// Simple variant selector - shows variants as buttons or dropdown
function SimpleVariantSelector({
  variants,
  onVariantSelect,
  selectedVariantId,
}: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedVariantId || null);

  useEffect(() => {
    if (selectedId) {
      const variant = variants.find(v => v.id === selectedId);
      onVariantSelect(variant || null);
    } else {
      onVariantSelect(null);
    }
  }, [selectedId, variants]);

  // Initialize with first variant if only one
  useEffect(() => {
    if (variants.length === 1 && !selectedId) {
      setSelectedId(variants[0].id);
    }
  }, [variants]);

  // Parse variant name to extract size/attribute info
  const parseVariantName = (name: string): string => {
    // If name contains "Size:" or similar, extract just the value
    if (name.includes(':')) {
      return name.split(':').pop()?.trim() || name;
    }
    return name;
  };

  // Detect if these are size variants (common pattern)
  const isNumericSizes = variants.every(v => {
    const parsed = parseVariantName(v.name);
    return !isNaN(parseFloat(parsed));
  });

  // Sort by numeric value if sizes
  const sortedVariants = [...variants].sort((a, b) => {
    if (isNumericSizes) {
      return parseFloat(parseVariantName(a.name)) - parseFloat(parseVariantName(b.name));
    }
    return a.name.localeCompare(b.name);
  });

  // If more than 10 variants, use dropdown
  if (variants.length > 10) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Option
        </label>
        <div className="relative">
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg appearance-none bg-white focus:border-safety-green-600 focus:ring-2 focus:ring-safety-green-200 transition-colors"
          >
            <option value="">Choose an option...</option>
            {sortedVariants.map(variant => (
              <option
                key={variant.id}
                value={variant.id}
                disabled={!variant.isActive || variant.stockQuantity === 0}
              >
                {variant.name}
                {variant.stockQuantity === 0 ? ' (Out of Stock)' : ''}
                {variant.basePrice !== sortedVariants[0].basePrice
                  ? ` - $${variant.basePrice.toFixed(2)}`
                  : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  // Use buttons for less than 10 variants
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {isNumericSizes ? 'Size' : 'Select Option'}
        </label>
        {selectedId && (
          <span className="text-sm text-gray-500">
            Selected: <span className="font-medium text-black">
              {parseVariantName(variants.find(v => v.id === selectedId)?.name || '')}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedVariants.map(variant => {
          const isSelected = selectedId === variant.id;
          const isAvailable = variant.isActive && variant.stockQuantity > 0;
          const displayName = parseVariantName(variant.name);

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedId(variant.id)}
              disabled={!isAvailable}
              className={`
                relative min-w-[3rem] px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                ${isSelected
                  ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                  : isAvailable
                    ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 line-through'
                }
              `}
            >
              {displayName}
              {isSelected && (
                <Check className="w-4 h-4 absolute -top-1 -right-1 bg-safety-green-600 text-white rounded-full p-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {!selectedId && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Please select an option to add to cart
        </p>
      )}
    </div>
  );
}

// Attribute-based variant selector (original implementation)
function AttributeVariantSelector({
  variants,
  onVariantSelect,
  selectedVariantId,
}: VariantSelectorProps) {
  // Extract unique attributes and their values from variants
  const attributeMap = new Map<string, { name: string; code: string; values: Set<string> }>();

  for (const variant of variants) {
    for (const av of variant.attributeValues) {
      if (!attributeMap.has(av.attributeId)) {
        attributeMap.set(av.attributeId, {
          name: av.attribute.name,
          code: av.attribute.code,
          values: new Set(),
        });
      }
      attributeMap.get(av.attributeId)!.values.add(av.value);
    }
  }

  const attributes = Array.from(attributeMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    code: data.code,
    values: Array.from(data.values).sort(),
  }));

  // Track selected value for each attribute
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  // Initialize selected values from the selected variant
  useEffect(() => {
    if (selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId);
      if (variant) {
        const values: Record<string, string> = {};
        for (const av of variant.attributeValues) {
          values[av.attributeId] = av.value;
        }
        setSelectedValues(values);
      }
    }
  }, [selectedVariantId, variants]);

  // Find matching variant based on selected values
  useEffect(() => {
    if (Object.keys(selectedValues).length === attributes.length) {
      // All attributes selected, find matching variant
      const matchingVariant = variants.find(v => {
        return v.attributeValues.every(av =>
          selectedValues[av.attributeId] === av.value
        ) && v.attributeValues.length === Object.keys(selectedValues).length;
      });

      onVariantSelect(matchingVariant || null);
    } else {
      onVariantSelect(null);
    }
  }, [selectedValues, variants, attributes.length]);

  const handleValueSelect = (attributeId: string, value: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  // Check if a value is available given current selections
  const isValueAvailable = (attributeId: string, value: string) => {
    // Build partial selection with this value
    const testSelection = { ...selectedValues, [attributeId]: value };

    // Check if any variant matches this selection
    return variants.some(v => {
      return v.isActive && v.stockQuantity > 0 && v.attributeValues.every(av => {
        if (testSelection[av.attributeId]) {
          return testSelection[av.attributeId] === av.value;
        }
        return true;
      });
    });
  };

  // Check if a value is in stock
  const isValueInStock = (attributeId: string, value: string) => {
    return variants.some(v =>
      v.isActive &&
      v.stockQuantity > 0 &&
      v.attributeValues.some(av =>
        av.attributeId === attributeId && av.value === value
      )
    );
  };

  if (attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {attributes.map(attr => (
        <div key={attr.id}>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {attr.name}
            </label>
            {selectedValues[attr.id] && (
              <span className="text-sm text-gray-500">
                Selected: <span className="font-medium text-black">{selectedValues[attr.id]}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {attr.values.map(value => {
              const isSelected = selectedValues[attr.id] === value;
              const inStock = isValueInStock(attr.id, value);
              const available = isValueAvailable(attr.id, value);

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleValueSelect(attr.id, value)}
                  disabled={!available}
                  className={`
                    relative px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${isSelected
                      ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                      : available
                        ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    }
                    ${!inStock ? 'line-through' : ''}
                  `}
                >
                  {value}
                  {isSelected && (
                    <Check className="w-4 h-4 absolute -top-1 -right-1 bg-safety-green-600 text-white rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selection summary */}
      {Object.keys(selectedValues).length > 0 && Object.keys(selectedValues).length < attributes.length && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Please select all options to add to cart
        </p>
      )}
    </div>
  );
}
