'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  type: string;
  options: string[];
  isVariant: boolean;
}

interface PriceRule {
  attribute: string;
  condition: '>=' | '<=' | '==' | 'in';
  value: string;
  modifier: string;
}

interface CategoryVariantConfigProps {
  selectedAttributeIds: string[];
  priceRules: PriceRule[];
  onChange: (config: { variantAttributeIds: string[]; priceRules: PriceRule[] }) => void;
}

export function CategoryVariantConfig({
  selectedAttributeIds,
  priceRules: initialRules,
  onChange,
}: CategoryVariantConfigProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selected, setSelected] = useState<string[]>(selectedAttributeIds);
  const [rules, setRules] = useState<PriceRule[]>(initialRules);
  const [loading, setLoading] = useState(true);

  // Fetch variant attributes
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await fetch('/api/admin/product-attributes');
        if (response.ok) {
          const data = await response.json();
          // Filter to only show attributes marked as variant-capable
          setAttributes(data.filter((a: ProductAttribute) => a.isVariant));
        }
      } catch (error) {
        console.error('Failed to fetch attributes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, []);

  // Notify parent of changes
  useEffect(() => {
    onChange({ variantAttributeIds: selected, priceRules: rules });
  }, [selected, rules]);

  const handleAttributeToggle = (attrId: string) => {
    setSelected(prev =>
      prev.includes(attrId)
        ? prev.filter(id => id !== attrId)
        : [...prev, attrId]
    );
  };

  const addPriceRule = () => {
    setRules(prev => [
      ...prev,
      { attribute: '', condition: '>=', value: '', modifier: '' },
    ]);
  };

  const updatePriceRule = (index: number, field: keyof PriceRule, value: string) => {
    setRules(prev => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], [field]: value };
      return newRules;
    });
  };

  const removePriceRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading variant attributes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Variant Attributes Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Variant Attributes
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Select which attributes create product variants for this category.
          Products in this category will have variants based on these attributes.
        </p>

        {attributes.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                No variant attributes found. Please create attributes with "Is Variant" enabled first.
              </p>
              <a
                href="/admin/product-attributes"
                className="text-sm text-yellow-700 underline hover:text-yellow-900"
              >
                Go to Product Attributes
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attributes.map(attr => (
              <label
                key={attr.id}
                className={`
                  flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                  ${selected.includes(attr.id)
                    ? 'border-safety-green-500 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(attr.id)}
                  onChange={() => handleAttributeToggle(attr.id)}
                  className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
                />
                <div>
                  <span className="font-medium text-gray-900">{attr.name}</span>
                  <span className="text-xs text-gray-500 block">{attr.code}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Rules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            Price Rules
          </h3>
          <button
            type="button"
            onClick={addPriceRule}
            className="flex items-center gap-1 text-sm text-safety-green-600 hover:text-safety-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Optional: Add price modifiers based on attribute values (e.g., larger sizes cost more).
        </p>

        {rules.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No price rules configured.</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* Attribute Select */}
                <select
                  value={rule.attribute}
                  onChange={(e) => updatePriceRule(index, 'attribute', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                >
                  <option value="">Select Attribute</option>
                  {attributes
                    .filter(a => selected.includes(a.id))
                    .map(attr => (
                      <option key={attr.id} value={attr.code}>
                        {attr.name}
                      </option>
                    ))}
                </select>

                {/* Condition Select */}
                <select
                  value={rule.condition}
                  onChange={(e) => updatePriceRule(index, 'condition', e.target.value as any)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                >
                  <option value=">=">≥</option>
                  <option value="<=">≤</option>
                  <option value="==">==</option>
                  <option value="in">in</option>
                </select>

                {/* Value Input */}
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => updatePriceRule(index, 'value', e.target.value)}
                  placeholder="Value (e.g., 13)"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />

                {/* Modifier Input */}
                <input
                  type="text"
                  value={rule.modifier}
                  onChange={(e) => updatePriceRule(index, 'modifier', e.target.value)}
                  placeholder="+10 or *1.1"
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removePriceRule(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {rules.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Examples: "+10" adds $10, "-5" subtracts $5, "*1.1" adds 10%, "/0.9" for discounts
          </p>
        )}
      </div>
    </div>
  );
}
