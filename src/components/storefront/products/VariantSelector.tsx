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
  color?: string | null;
  size?: string | null;
  material?: string | null;
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
  onColorChange?: (color: string | null) => void;
}

export function VariantSelector({
  variants,
  onVariantSelect,
  selectedVariantId,
  onColorChange,
}: VariantSelectorProps) {
  // Check if variants have the new color/size/material fields
  const hasColorSizeMaterial = variants.some(v => v.color || v.size || v.material);

  // Check if variants have legacy attributeValues
  const hasAttributeValues = variants.some(v => v.attributeValues && v.attributeValues.length > 0);

  if (variants.length === 0) {
    return null;
  }

  // Use the new color/size/material selector if any variant has these fields
  if (hasColorSizeMaterial) {
    return (
      <ColorSizeMaterialSelector
        variants={variants}
        onVariantSelect={onVariantSelect}
        selectedVariantId={selectedVariantId}
        onColorChange={onColorChange}
      />
    );
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

  // Use legacy attribute-based selection
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

// New Color/Size/Material selector - uses direct variant fields
function ColorSizeMaterialSelector({
  variants,
  onVariantSelect,
  selectedVariantId,
  onColorChange,
}: VariantSelectorProps) {
  // Extract unique values for each attribute
  const colors = Array.from(new Set(variants.map(v => v.color).filter((c): c is string => !!c)));
  const sizes = Array.from(new Set(variants.map(v => v.size).filter((s): s is string => !!s)));
  const materials = Array.from(new Set(variants.map(v => v.material).filter((m): m is string => !!m)));

  // Track selected values
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Initialize from selected variant
  useEffect(() => {
    if (selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId);
      if (variant) {
        setSelectedColor(variant.color || null);
        setSelectedSize(variant.size || null);
        setSelectedMaterial(variant.material || null);
      }
    }
  }, [selectedVariantId, variants]);

  // Find matching variant when selections change
  useEffect(() => {
    const matchingVariant = variants.find(v => {
      const colorMatch = !colors.length || !selectedColor || v.color === selectedColor;
      const sizeMatch = !sizes.length || !selectedSize || v.size === selectedSize;
      const materialMatch = !materials.length || !selectedMaterial || v.material === selectedMaterial;
      return colorMatch && sizeMatch && materialMatch && v.isActive && v.stockQuantity > 0;
    });

    // Determine if all required selections are made
    const allSelected =
      (!colors.length || selectedColor) &&
      (!sizes.length || selectedSize) &&
      (!materials.length || selectedMaterial);

    if (allSelected && matchingVariant) {
      onVariantSelect(matchingVariant);
    } else if (allSelected) {
      // All selected but no matching variant (likely out of stock combination)
      const outOfStockVariant = variants.find(v => {
        const colorMatch = !colors.length || !selectedColor || v.color === selectedColor;
        const sizeMatch = !sizes.length || !selectedSize || v.size === selectedSize;
        const materialMatch = !materials.length || !selectedMaterial || v.material === selectedMaterial;
        return colorMatch && sizeMatch && materialMatch;
      });
      onVariantSelect(outOfStockVariant || null);
    } else {
      onVariantSelect(null);
    }
  }, [selectedColor, selectedSize, selectedMaterial, variants, colors.length, sizes.length, materials.length]);

  // Notify parent when color changes (for image switching)
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  // Check if a value is available based on current selections
  const isValueAvailable = (type: 'color' | 'size' | 'material', value: string) => {
    return variants.some(v => {
      const colorMatch = type === 'color' ? v.color === value : (!selectedColor || v.color === selectedColor);
      const sizeMatch = type === 'size' ? v.size === value : (!selectedSize || v.size === selectedSize);
      const materialMatch = type === 'material' ? v.material === value : (!selectedMaterial || v.material === selectedMaterial);
      return colorMatch && sizeMatch && materialMatch && v.isActive && v.stockQuantity > 0;
    });
  };

  // Sort sizes intelligently (numeric first, then alphabetic)
  const sortedSizes = [...sizes].sort((a, b) => {
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    // Sort by standard size order
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const aIdx = sizeOrder.indexOf(a.toUpperCase());
    const bIdx = sizeOrder.indexOf(b.toUpperCase());
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    return a.localeCompare(b);
  });

  const renderAttributeSection = (
    label: string,
    values: string[],
    selected: string | null,
    onSelect: (value: string) => void,
    type: 'color' | 'size' | 'material'
  ) => {
    if (values.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {selected && (
            <span className="text-sm text-gray-500">
              Selected: <span className="font-medium text-black">{selected}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {values.map(value => {
            const isSelected = selected === value;
            const isAvailable = isValueAvailable(type, value);

            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelect(value)}
                disabled={!isAvailable}
                className={`
                  relative px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                  ${isSelected
                    ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                    : isAvailable
                      ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 line-through'
                  }
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
    );
  };

  const allRequired =
    (colors.length > 0 ? 1 : 0) +
    (sizes.length > 0 ? 1 : 0) +
    (materials.length > 0 ? 1 : 0);

  const selectedCount =
    (selectedColor ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    (selectedMaterial ? 1 : 0);

  return (
    <div className="space-y-4">
      {renderAttributeSection('Color', colors, selectedColor, handleColorChange, 'color')}
      {renderAttributeSection('Size', sortedSizes, selectedSize, setSelectedSize, 'size')}
      {renderAttributeSection('Material', materials, selectedMaterial, setSelectedMaterial, 'material')}

      {selectedCount < allRequired && selectedCount > 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Please select all options to add to cart
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
