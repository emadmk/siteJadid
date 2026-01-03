'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Check, Plus, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ColorImageMapperProps {
  productId: string;
  images: string[];
  variants: { color?: string | null }[];
  colorImages: Record<string, number[]> | null;
  onSave: (colorImages: Record<string, number[]>) => Promise<void>;
}

export function ColorImageMapper({
  productId,
  images,
  variants,
  colorImages: initialColorImages,
  onSave,
}: ColorImageMapperProps) {
  const [colorImages, setColorImages] = useState<Record<string, number[]>>(
    initialColorImages || {}
  );
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Extract unique colors from variants
  const uniqueColors = Array.from(
    new Set(variants.map(v => v.color).filter((c): c is string => !!c))
  );

  const handleToggleImage = (color: string, imageIndex: number) => {
    setColorImages(prev => {
      const current = prev[color] || [];
      if (current.includes(imageIndex)) {
        return {
          ...prev,
          [color]: current.filter(i => i !== imageIndex),
        };
      } else {
        return {
          ...prev,
          [color]: [...current, imageIndex],
        };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(colorImages);
    } finally {
      setSaving(false);
    }
  };

  if (uniqueColors.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No color variants defined yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Add color values to your variants first, then you can link images to colors.
        </p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No product images available.</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload images to the product first, then link them to colors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Link Images to Colors</h4>
            <p className="text-sm text-blue-700 mt-1">
              Select a color, then click on the images that should be shown when that color is selected.
              This helps customers see the correct product images for each color variant.
            </p>
          </div>
        </div>
      </div>

      {/* Color Pills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a Color to Map
        </label>
        <div className="flex flex-wrap gap-2">
          {uniqueColors.map(color => {
            const linkedCount = colorImages[color]?.length || 0;
            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                className={`
                  px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                  ${selectedColor === color
                    ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }
                `}
              >
                {color}
                {linkedCount > 0 && (
                  <span className="ml-2 bg-safety-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {linkedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Grid */}
      {selectedColor && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Click images to link/unlink from "{selectedColor}"
          </label>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((image, index) => {
              const isLinked = colorImages[selectedColor]?.includes(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleToggleImage(selectedColor, index)}
                  className={`
                    relative aspect-square rounded-lg border-2 overflow-hidden transition-all
                    ${isLinked
                      ? 'border-safety-green-600 ring-2 ring-safety-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isLinked && (
                    <div className="absolute inset-0 bg-safety-green-600/20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-safety-green-600 bg-white rounded-full p-1" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {Object.keys(colorImages).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Current Mappings</h4>
          <div className="space-y-2">
            {uniqueColors.map(color => {
              const indices = colorImages[color] || [];
              if (indices.length === 0) return null;
              return (
                <div key={color} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700 w-24">{color}:</span>
                  <div className="flex gap-1">
                    {indices.map(idx => (
                      <span key={idx} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                        Image #{idx + 1}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
        >
          {saving ? 'Saving...' : 'Save Color-Image Links'}
        </Button>
      </div>
    </div>
  );
}
