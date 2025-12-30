'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Save,
  Loader2,
  Upload,
  Plus,
  Pencil,
  ImageIcon,
  Package,
  DollarSign,
  Tag,
  FileText,
  Settings,
  Layers,
  Check,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  salePrice: number | null;
  wholesalePrice: number | null;
  gsaPrice: number | null;
  costPrice: number | null;
  priceUnit?: string;
  qtyPerPack?: number;
  minimumOrderQty?: number;
  images: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  stockQuantity: number;
  lowStockThreshold: number | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  status: string;
  categoryId: string | null;
  brandId: string | null;
  defaultSupplierId: string | null;
  defaultWarehouseId: string | null;
  complianceCertifications: string[];
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  salePrice: number | null;
  wholesalePrice: number | null;
  gsaPrice: number | null;
  costPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  attributeValues: {
    value: string;
    attribute: { name: string };
  }[];
}

interface ProductInlineEditorProps {
  product: ProductData;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'basic' | 'pricing' | 'images' | 'inventory' | 'seo' | 'variants';

export function ProductInlineEditor({ product, isOpen, onClose }: ProductInlineEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantEditData, setVariantEditData] = useState<Partial<Variant>>({});
  const [savingVariant, setSavingVariant] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: product.name || '',
    slug: product.slug || '',
    sku: product.sku || '',
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    basePrice: product.basePrice?.toString() || '',
    salePrice: product.salePrice?.toString() || '',
    wholesalePrice: product.wholesalePrice?.toString() || '',
    gsaPrice: product.gsaPrice?.toString() || '',
    costPrice: product.costPrice?.toString() || '',
    priceUnit: product.priceUnit || 'ea',
    qtyPerPack: product.qtyPerPack?.toString() || '1',
    minimumOrderQty: product.minimumOrderQty?.toString() || '1',
    stockQuantity: product.stockQuantity?.toString() || '0',
    lowStockThreshold: product.lowStockThreshold?.toString() || '10',
    categoryId: product.categoryId || '',
    brandId: product.brandId || '',
    status: product.status || 'ACTIVE',
    weight: product.weight?.toString() || '',
    length: product.length?.toString() || '',
    width: product.width?.toString() || '',
    height: product.height?.toString() || '',
    isFeatured: product.isFeatured ?? false,
    isBestSeller: product.isBestSeller ?? false,
    isNewArrival: product.isNewArrival ?? false,
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    metaKeywords: product.metaKeywords || '',
  });

  const [images, setImages] = useState<string[]>(product.images || []);
  const [imageInput, setImageInput] = useState('');

  // Load categories, brands, and variants
  useEffect(() => {
    if (isOpen) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => setCategories(data.categories || data || []))
        .catch(console.error);

      fetch('/api/brands')
        .then((res) => res.json())
        .then((data) => setBrands(data.brands || data || []))
        .catch(console.error);

      // Fetch variants for this product
      setVariantsLoading(true);
      fetch(`/api/admin/products/${product.id}/variants`)
        .then((res) => res.json())
        .then((data) => {
          // API returns array directly or object with variants property
          const variantsData = Array.isArray(data) ? data : (data.variants || []);
          setVariants(variantsData);
        })
        .catch(console.error)
        .finally(() => setVariantsLoading(false));
    }
  }, [isOpen, product.id]);

  // Reset form when product changes
  useEffect(() => {
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      sku: product.sku || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      basePrice: product.basePrice?.toString() || '',
      salePrice: product.salePrice?.toString() || '',
      wholesalePrice: product.wholesalePrice?.toString() || '',
      gsaPrice: product.gsaPrice?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      priceUnit: product.priceUnit || 'ea',
      qtyPerPack: product.qtyPerPack?.toString() || '1',
      minimumOrderQty: product.minimumOrderQty?.toString() || '1',
      stockQuantity: product.stockQuantity?.toString() || '0',
      lowStockThreshold: product.lowStockThreshold?.toString() || '10',
      categoryId: product.categoryId || '',
      brandId: product.brandId || '',
      status: product.status || 'ACTIVE',
      weight: product.weight?.toString() || '',
      length: product.length?.toString() || '',
      width: product.width?.toString() || '',
      height: product.height?.toString() || '',
      isFeatured: product.isFeatured ?? false,
      isBestSeller: product.isBestSeller ?? false,
      isNewArrival: product.isNewArrival ?? false,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      metaKeywords: product.metaKeywords || '',
    });
    setImages(product.images || []);
  }, [product]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug:
        prev.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
    }));
  };

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setImages([...images, imageInput.trim()]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary
    const newImages = [...images];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    setImages(newImages);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append('files', file);
      });

      if (formData.sku) {
        uploadFormData.append('productSku', formData.sku);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      setImages([...images, ...data.urls]);
      toast.success('Images uploaded successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(formData.basePrice) || 0,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
          gsaPrice: formData.gsaPrice ? parseFloat(formData.gsaPrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
          priceUnit: formData.priceUnit || 'ea',
          qtyPerPack: parseInt(formData.qtyPerPack) || 1,
          minimumOrderQty: parseInt(formData.minimumOrderQty) || 1,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          categoryId: formData.categoryId || null,
          brandId: formData.brandId || null,
          images,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save product');
      }

      toast.success('Product updated successfully!');
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  function buildCategoryOptions(
    cats: Category[],
    parentId: string | null = null,
    level: number = 0
  ): JSX.Element[] {
    const options: JSX.Element[] = [];
    const children = cats.filter((c) => c.parentId === parentId);

    children.forEach((cat) => {
      options.push(
        <option key={cat.id} value={cat.id}>
          {'\u00A0'.repeat(level * 4)}
          {cat.name}
        </option>
      );
      options.push(...buildCategoryOptions(cats, cat.id, level + 1));
    });

    return options;
  }

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as TabType, label: 'Basic Info', icon: Package },
    { id: 'pricing' as TabType, label: 'Pricing', icon: DollarSign },
    { id: 'variants' as TabType, label: `Variants (${variants.length})`, icon: Layers },
    { id: 'images' as TabType, label: 'Images', icon: ImageIcon },
    { id: 'inventory' as TabType, label: 'Inventory', icon: Tag },
    { id: 'seo' as TabType, label: 'SEO', icon: FileText },
  ];

  // Variant editing functions
  const startVariantEdit = (variant: Variant) => {
    setEditingVariantId(variant.id);
    setVariantEditData({
      basePrice: variant.basePrice,
      salePrice: variant.salePrice,
      wholesalePrice: variant.wholesalePrice,
      gsaPrice: variant.gsaPrice,
      stockQuantity: variant.stockQuantity,
    });
  };

  const cancelVariantEdit = () => {
    setEditingVariantId(null);
    setVariantEditData({});
  };

  const saveVariantEdit = async (variantId: string) => {
    setSavingVariant(true);
    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantEditData),
      });

      if (!response.ok) throw new Error('Failed to update variant');

      // Update local state
      setVariants(prev => prev.map(v =>
        v.id === variantId ? { ...v, ...variantEditData } as Variant : v
      ));
      setEditingVariantId(null);
      setVariantEditData({});
      toast.success('Variant updated!');
    } catch (error) {
      toast.error('Failed to update variant');
    } finally {
      setSavingVariant(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-safety-green-100 rounded-lg">
              <Pencil className="w-5 h-5 text-safety-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black">Edit Product</h2>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-safety-green-600 border-b-2 border-safety-green-600 bg-safety-green-50'
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Write product description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="">-- Select Category --</option>
                    {buildCategoryOptions(categories)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, brandId: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                    }
                    className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isBestSeller: e.target.checked }))
                    }
                    className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
                  />
                  <span className="text-sm text-gray-700">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isNewArrival: e.target.checked }))
                    }
                    className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
                  />
                  <span className="text-sm text-gray-700">New Arrival</span>
                </label>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, basePrice: e.target.value }))
                      }
                      className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, salePrice: e.target.value }))
                      }
                      className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    B2B / Wholesale Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.wholesalePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wholesalePrice: e.target.value,
                        }))
                      }
                      className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Price for B2B customers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GSA Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gsaPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, gsaPrice: e.target.value }))
                      }
                      className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Price for GSA contract customers
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price
                </label>
                <div className="relative w-1/2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, costPrice: e.target.value }))
                    }
                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your cost (not shown to customers)
                </p>
              </div>

              {/* Unit Pricing */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Unit
                  </label>
                  <select
                    value={formData.priceUnit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priceUnit: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="ea">Each (ea)</option>
                    <option value="pr">Pair (pr)</option>
                    <option value="pk">Pack (pk)</option>
                    <option value="dz">Dozen (dz)</option>
                    <option value="bx">Box (bx)</option>
                    <option value="cs">Case (cs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qty Per Pack
                  </label>
                  <input
                    type="number"
                    value={formData.qtyPerPack}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, qtyPerPack: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Order Qty
                  </label>
                  <input
                    type="number"
                    value={formData.minimumOrderQty}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minimumOrderQty: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    min="1"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-3">Price Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Base</div>
                    <div className="font-medium text-black">
                      ${parseFloat(formData.basePrice || '0').toFixed(2)}
                    </div>
                  </div>
                  {formData.salePrice && (
                    <div>
                      <div className="text-gray-500">Sale</div>
                      <div className="font-medium text-red-600">
                        ${parseFloat(formData.salePrice).toFixed(2)}
                      </div>
                    </div>
                  )}
                  {formData.wholesalePrice && (
                    <div>
                      <div className="text-gray-500">B2B</div>
                      <div className="font-medium text-blue-600">
                        ${parseFloat(formData.wholesalePrice).toFixed(2)}
                      </div>
                    </div>
                  )}
                  {formData.gsaPrice && (
                    <div>
                      <div className="text-gray-500">GSA</div>
                      <div className="font-medium text-purple-600">
                        ${parseFloat(formData.gsaPrice).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              {variantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : variants.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No variants for this product.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add variants from the full edit page.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Variant
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          SKU
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Base
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Sale
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          B2B
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          GSA
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-gray-50">
                          {editingVariantId === variant.id ? (
                            <>
                              <td className="px-3 py-2" colSpan={2}>
                                <div className="text-sm font-medium text-gray-900">
                                  {variant.attributeValues
                                    .map((av) => av.value)
                                    .join(' / ')}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  {variant.sku}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variantEditData.basePrice ?? ''}
                                  onChange={(e) =>
                                    setVariantEditData((prev) => ({
                                      ...prev,
                                      basePrice: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-20 px-2 py-1 text-sm border rounded text-right"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variantEditData.salePrice ?? ''}
                                  onChange={(e) =>
                                    setVariantEditData((prev) => ({
                                      ...prev,
                                      salePrice: e.target.value ? parseFloat(e.target.value) : null,
                                    }))
                                  }
                                  className="w-20 px-2 py-1 text-sm border rounded text-right"
                                  placeholder="-"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variantEditData.wholesalePrice ?? ''}
                                  onChange={(e) =>
                                    setVariantEditData((prev) => ({
                                      ...prev,
                                      wholesalePrice: e.target.value ? parseFloat(e.target.value) : null,
                                    }))
                                  }
                                  className="w-20 px-2 py-1 text-sm border rounded text-right"
                                  placeholder="-"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variantEditData.gsaPrice ?? ''}
                                  onChange={(e) =>
                                    setVariantEditData((prev) => ({
                                      ...prev,
                                      gsaPrice: e.target.value ? parseFloat(e.target.value) : null,
                                    }))
                                  }
                                  className="w-20 px-2 py-1 text-sm border rounded text-right"
                                  placeholder="-"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={variantEditData.stockQuantity ?? ''}
                                  onChange={(e) =>
                                    setVariantEditData((prev) => ({
                                      ...prev,
                                      stockQuantity: parseInt(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-16 px-2 py-1 text-sm border rounded text-right"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => saveVariantEdit(variant.id)}
                                    disabled={savingVariant}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    title="Save"
                                  >
                                    {savingVariant ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={cancelVariantEdit}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {variant.attributeValues
                                    .map((av) => av.value)
                                    .join(' / ')}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-xs font-mono text-gray-500">
                                  {variant.sku}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-sm">
                                ${Number(variant.basePrice).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-red-600">
                                {variant.salePrice
                                  ? `$${Number(variant.salePrice).toFixed(2)}`
                                  : '-'}
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-blue-600">
                                {variant.wholesalePrice
                                  ? `$${Number(variant.wholesalePrice).toFixed(2)}`
                                  : '-'}
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-purple-600">
                                {variant.gsaPrice
                                  ? `$${Number(variant.gsaPrice).toFixed(2)}`
                                  : '-'}
                              </td>
                              <td className="px-3 py-2 text-right text-sm">
                                <span
                                  className={
                                    variant.stockQuantity < 10
                                      ? 'text-red-600 font-medium'
                                      : ''
                                  }
                                >
                                  {variant.stockQuantity}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => startVariantEdit(variant)}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              {/* Upload Zone */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-safety-green-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-safety-green-600 animate-spin mb-3" />
                    <p className="text-gray-600">Uploading images...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Drop images here or click to upload
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports: JPEG, PNG, GIF, WebP (max 5MB each)
                    </p>
                  </div>
                )}
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg border-2 ${index === 0 ? 'border-safety-green-500' : 'border-gray-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 ? (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-safety-green-600 text-white text-xs rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(index)}
                          className="absolute bottom-2 left-2 p-1.5 bg-gray-800/70 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-safety-green-600"
                          title="Set as primary image"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* URL Input */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">Or add image by URL:</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    variant="outline"
                    className="border-safety-green-600 text-safety-green-600 hover:bg-safety-green-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, stockQuantity: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lowStockThreshold: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-black mb-4">
                  Physical Attributes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, weight: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (in)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.length}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, length: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.width}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, width: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, height: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaDescription: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              {/* SEO Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-3">
                  Search Preview
                </h3>
                <div className="space-y-1">
                  <div className="text-blue-700 text-lg hover:underline cursor-pointer">
                    {formData.metaTitle || formData.name || 'Product Title'}
                  </div>
                  <div className="text-green-700 text-sm">
                    yoursite.com/products/{formData.slug || 'product-slug'}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2">
                    {formData.metaDescription ||
                      formData.shortDescription ||
                      formData.description ||
                      'No description available'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
