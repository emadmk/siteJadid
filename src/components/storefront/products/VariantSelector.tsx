'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

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
  type?: string | null;
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
  // Check if variants have the new color/size/type/material fields
  const hasColorSizeMaterial = variants.some(v => v.color || v.size || v.type || v.material);

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
    // Handle "Size: X, Width: Y" format -> "X Y"
    const sizeWidthMatch = name.match(/Size:\s*([^,]+),?\s*Width:\s*(\w+)/i);
    if (sizeWidthMatch) {
      return `${sizeWidthMatch[1].trim()} ${sizeWidthMatch[2].trim()}`;
    }

    // Handle "Size: X" format
    const sizeMatch = name.match(/Size:\s*(.+)/i);
    if (sizeMatch) {
      return sizeMatch[1].trim();
    }

    // If name contains ":" but not Size/Width pattern, extract just the value
    if (name.includes(':')) {
      return name.split(':').pop()?.trim() || name;
    }
    return name;
  };

  // Extract numeric size from variant name for sorting
  const extractNumericSize = (name: string): number | null => {
    const parsed = parseVariantName(name);
    // Try to extract first number from the string (e.g., "8.5 D" -> 8.5)
    const match = parsed.match(/^(\d+\.?\d*)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return null;
  };

  // Standard size order for sorting
  const sizeOrder: Record<string, number> = {
    'XXS': 1, '2XS': 1,
    'XS': 2,
    'S': 3, 'SMALL': 3,
    'M': 4, 'MEDIUM': 4, 'MED': 4,
    'L': 5, 'LARGE': 5,
    'XL': 6,
    'XXL': 7, '2XL': 7,
    'XXXL': 8, '3XL': 8,
    'XXXXL': 9, '4XL': 9,
    'XXXXXL': 10, '5XL': 10,
    '6XL': 11,
    '7XL': 12,
  };

  // Sort variants by size (small to large)
  const sortedVariants = [...variants].sort((a, b) => {
    const aName = parseVariantName(a.name).toUpperCase().trim();
    const bName = parseVariantName(b.name).toUpperCase().trim();

    // Check for standard size names
    const aOrder = sizeOrder[aName];
    const bOrder = sizeOrder[bName];

    if (aOrder !== undefined && bOrder !== undefined) {
      return aOrder - bOrder;
    }
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;

    // Handle numeric sizes (shoes, etc.) - sort ascending by number first
    const aNum = extractNumericSize(a.name);
    const bNum = extractNumericSize(b.name);
    if (aNum !== null && bNum !== null) {
      if (aNum !== bNum) return aNum - bNum;
      // Same size number, sort by width (D before EE)
      return aName.localeCompare(bName);
    }
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;

    // Fallback to alphabetic
    return a.name.localeCompare(b.name);
  });

  // Detect if these are size variants
  const isSizeVariants = variants.some(v => {
    const parsed = parseVariantName(v.name).toUpperCase().trim();
    return sizeOrder[parsed] !== undefined || !isNaN(parseFloat(parsed));
  });

  // Always use buttons (no dropdown)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {isSizeVariants ? 'Size' : 'Select Option'}
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

// New Color/Size/Type/Material selector - uses direct variant fields
function ColorSizeMaterialSelector({
  variants,
  onVariantSelect,
  selectedVariantId,
  onColorChange,
}: VariantSelectorProps) {
  // Extract unique values for each attribute
  const colors = Array.from(new Set(variants.map(v => v.color).filter((c): c is string => !!c)));
  const sizes = Array.from(new Set(variants.map(v => v.size).filter((s): s is string => !!s)));
  const types = Array.from(new Set(variants.map(v => v.type).filter((t): t is string => !!t)));
  const materials = Array.from(new Set(variants.map(v => v.material).filter((m): m is string => !!m)));

  // Track selected values
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Initialize from selected variant
  useEffect(() => {
    if (selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId);
      if (variant) {
        setSelectedColor(variant.color || null);
        setSelectedSize(variant.size || null);
        setSelectedType(variant.type || null);
        setSelectedMaterial(variant.material || null);
      }
    }
  }, [selectedVariantId, variants]);

  // Find matching variant when selections change
  useEffect(() => {
    const matchingVariant = variants.find(v => {
      const colorMatch = !colors.length || !selectedColor || v.color === selectedColor;
      const sizeMatch = !sizes.length || !selectedSize || v.size === selectedSize;
      const typeMatch = !types.length || !selectedType || v.type === selectedType;
      const materialMatch = !materials.length || !selectedMaterial || v.material === selectedMaterial;
      return colorMatch && sizeMatch && typeMatch && materialMatch && v.isActive && v.stockQuantity > 0;
    });

    // Determine if all required selections are made
    const allSelected =
      (!colors.length || selectedColor) &&
      (!sizes.length || selectedSize) &&
      (!types.length || selectedType) &&
      (!materials.length || selectedMaterial);

    if (allSelected && matchingVariant) {
      onVariantSelect(matchingVariant);
    } else if (allSelected) {
      // All selected but no matching variant (likely out of stock combination)
      const outOfStockVariant = variants.find(v => {
        const colorMatch = !colors.length || !selectedColor || v.color === selectedColor;
        const sizeMatch = !sizes.length || !selectedSize || v.size === selectedSize;
        const typeMatch = !types.length || !selectedType || v.type === selectedType;
        const materialMatch = !materials.length || !selectedMaterial || v.material === selectedMaterial;
        return colorMatch && sizeMatch && typeMatch && materialMatch;
      });
      onVariantSelect(outOfStockVariant || null);
    } else {
      onVariantSelect(null);
    }
  }, [selectedColor, selectedSize, selectedType, selectedMaterial, variants, colors.length, sizes.length, types.length, materials.length]);

  // Notify parent when color changes (for image switching)
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  // Check if a value is available based on current selections
  const isValueAvailable = (attrType: 'color' | 'size' | 'type' | 'material', value: string) => {
    return variants.some(v => {
      const colorMatch = attrType === 'color' ? v.color === value : (!selectedColor || v.color === selectedColor);
      const sizeMatch = attrType === 'size' ? v.size === value : (!selectedSize || v.size === selectedSize);
      const typeMatch = attrType === 'type' ? v.type === value : (!selectedType || v.type === selectedType);
      const materialMatch = attrType === 'material' ? v.material === value : (!selectedMaterial || v.material === selectedMaterial);
      return colorMatch && sizeMatch && typeMatch && materialMatch && v.isActive && v.stockQuantity > 0;
    });
  };

  // Sort sizes intelligently - small to large
  const sortedSizes = [...sizes].sort((a, b) => {
    // Standard clothing size order (including variations)
    const sizeOrder: Record<string, number> = {
      'XXS': 1, '2XS': 1,
      'XS': 2,
      'S': 3, 'SMALL': 3,
      'M': 4, 'MEDIUM': 4, 'MED': 4,
      'L': 5, 'LARGE': 5,
      'XL': 6,
      'XXL': 7, '2XL': 7,
      'XXXL': 8, '3XL': 8,
      'XXXXL': 9, '4XL': 9,
      'XXXXXL': 10, '5XL': 10,
      '6XL': 11,
      '7XL': 12,
    };

    const aUpper = a.toUpperCase().trim();
    const bUpper = b.toUpperCase().trim();

    // Check for standard size names
    const aOrder = sizeOrder[aUpper];
    const bOrder = sizeOrder[bUpper];

    if (aOrder !== undefined && bOrder !== undefined) {
      return aOrder - bOrder;
    }
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;

    // Handle numeric sizes (shoes, etc.) - sort ascending
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;

    // Fallback to alphabetic
    return a.localeCompare(b);
  });

  const renderAttributeSection = (
    label: string,
    values: string[],
    selected: string | null,
    onSelect: (value: string) => void,
    attrType: 'color' | 'size' | 'type' | 'material'
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
            const isAvailable = isValueAvailable(attrType, value);

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
    (types.length > 0 ? 1 : 0) +
    (materials.length > 0 ? 1 : 0);

  const selectedCount =
    (selectedColor ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    (selectedType ? 1 : 0) +
    (selectedMaterial ? 1 : 0);

  return (
    <div className="space-y-4">
      {renderAttributeSection('Color', colors, selectedColor, handleColorChange, 'color')}
      {renderAttributeSection('Size', sortedSizes, selectedSize, setSelectedSize, 'size')}
      {renderAttributeSection('Type', types, selectedType, setSelectedType, 'type')}
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
