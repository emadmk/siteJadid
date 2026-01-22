'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronUp,
  Building2,
  Tag,
  Warehouse,
  Truck,
  Package,
  Layers,
  Footprints,
} from 'lucide-react';

type ImportType = 'gsa' | 'occunomix' | 'pip' | 'wolverine' | 'carhartt';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface WarehouseType {
  id: string;
  name: string;
  code: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
}

export default function ProductImportPage() {
  // Import type selection
  const [importType, setImportType] = useState<ImportType>('occunomix');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dropdown data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  // Import options (now includes selected IDs)
  const [options, setOptions] = useState({
    updateExisting: true,
    importImages: true,
    imageBasePath: '/root/ada/siteJadid/import-images',
    dryRun: false,
    // Default assignments for all imported products
    defaultBrandId: '',
    defaultCategoryId: '',
    defaultWarehouseId: '',
    defaultSupplierId: '',
    // Stock and Status defaults
    defaultStockQuantity: 0,
    defaultStatus: 'PRERELEASE' as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PRERELEASE',
  });

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoadingDropdowns(true);
      try {
        const [brandsRes, categoriesRes, warehousesRes, suppliersRes] = await Promise.all([
          fetch('/api/admin/brands'),
          fetch('/api/categories'),
          fetch('/api/admin/warehouses'),
          fetch('/api/admin/suppliers'),
        ]);

        if (brandsRes.ok) {
          const data = await brandsRes.json();
          setBrands(data.brands || []);
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }
        if (warehousesRes.ok) {
          const data = await warehousesRes.json();
          setWarehouses(Array.isArray(data) ? data : []);
        }
        if (suppliersRes.ok) {
          const data = await suppliersRes.json();
          setSuppliers(data.suppliers || []);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        setIsLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/bulk-import?action=template');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product-import-template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const startImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      // Use different API based on import type
      const apiUrl = importType === 'occunomix'
        ? '/api/admin/occunomix-import'
        : importType === 'pip'
        ? '/api/admin/pip-import'
        : importType === 'wolverine'
        ? '/api/admin/wolverine-import'
        : importType === 'carhartt'
        ? '/api/admin/carhartt-import'
        : '/api/admin/bulk-import';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
      } else {
        setResult({
          success: false,
          totalRows: 0,
          processedRows: 0,
          successCount: 0,
          errorCount: 1,
          errors: [
            {
              row: 0,
              field: 'general',
              value: '',
              message: data.error || 'Import failed',
            },
          ],
          warnings: [],
          createdProducts: [],
          updatedProducts: [],
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        totalRows: 0,
        processedRows: 0,
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            row: 0,
            field: 'general',
            value: '',
            message: 'Network error occurred',
          },
        ],
        warnings: [],
        createdProducts: [],
        updatedProducts: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="outline" size="sm" className="border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Smart Product Importer</h1>
          <p className="text-gray-600">
            Import products from Excel with automatic image processing
          </p>
        </div>
      </div>

      {/* Import Type Selector */}
      <div className="mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-2 inline-flex gap-2">
          <button
            onClick={() => {
              setImportType('occunomix');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              importType === 'occunomix'
                ? 'bg-safety-green-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            OccuNomix Import
          </button>
          <button
            onClick={() => {
              setImportType('pip');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              importType === 'pip'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            PiP Import
          </button>
          <button
            onClick={() => {
              setImportType('wolverine');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              importType === 'wolverine'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Footprints className="w-5 h-5" />
            Wolverine Bates
          </button>
          <button
            onClick={() => {
              setImportType('carhartt');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              importType === 'carhartt'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Footprints className="w-5 h-5" />
            Carhartt Import
          </button>
          <button
            onClick={() => {
              setImportType('gsa');
              setFile(null);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              importType === 'gsa'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-5 h-5" />
            GSA Import
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {importType === 'occunomix'
            ? 'Import OccuNomix products with automatic category matching, variant detection, and image processing.'
            : importType === 'pip'
            ? 'Import PiP products. Creates brands, categories (parent/child), and variants (Color/Size) automatically.'
            : importType === 'wolverine'
            ? 'Import Wolverine/Bates footwear products. Creates size variants automatically from manufacturer part numbers.'
            : importType === 'carhartt'
            ? 'Import Carhartt workwear products. Creates size variants automatically and maps to Footwear category.'
            : 'Import GSA products with custom field mapping and compliance data.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 0: Select Import Type - Info Box */}
          <div className={`rounded-lg border p-6 ${
            importType === 'occunomix'
              ? 'bg-safety-green-50 border-safety-green-200'
              : importType === 'pip'
              ? 'bg-purple-50 border-purple-200'
              : importType === 'wolverine'
              ? 'bg-amber-50 border-amber-200'
              : importType === 'carhartt'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-3 ${
              importType === 'occunomix'
                ? 'text-safety-green-800'
                : importType === 'pip'
                ? 'text-purple-800'
                : importType === 'wolverine'
                ? 'text-amber-800'
                : importType === 'carhartt'
                ? 'text-orange-800'
                : 'text-blue-800'
            }`}>
              {importType === 'occunomix' ? 'OccuNomix Import' : importType === 'pip' ? 'PiP Import' : importType === 'wolverine' ? 'Wolverine Bates Import' : importType === 'carhartt' ? 'Carhartt Import' : 'GSA Import'} Selected
            </h2>
            {importType === 'occunomix' ? (
              <div className="space-y-2 text-sm text-safety-green-700">
                <p><strong>Expected Columns:</strong> STYLE, Sku, Item Description, SubCategory, ADA site Price, LEV2, Images</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Auto-detects variants from STYLE column</li>
                  <li>Matches SubCategory with existing categories</li>
                  <li>Creates missing categories automatically</li>
                  <li>Parses semicolon-separated images</li>
                  <li>Auto-generates SEO fields</li>
                </ul>
              </div>
            ) : importType === 'pip' ? (
              <div className="space-y-2 text-sm text-purple-700">
                <p><strong>Expected Columns:</strong> SKU, STYLE, COLOR, SIZE, BRAND WITH MARKS, SHORT DESCRIPTION, SELECT CODE, COMMODITY CODE</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Product Name = Brand + Short Description</li>
                  <li>Colors and Sizes become variants (same STYLE = one product)</li>
                  <li>Creates brands automatically (Boss®, Brahma, G-Tek®, etc.)</li>
                  <li>Parent/Child categories from SELECT CODE &amp; COMMODITY CODE</li>
                  <li>Price set to $0.01 (update later via bulk edit)</li>
                  <li>Products without images in import-images folder are skipped</li>
                </ul>
              </div>
            ) : importType === 'wolverine' ? (
              <div className="space-y-2 text-sm text-amber-700">
                <p><strong>Expected Columns:</strong> manufacturer_part_number, vendor_part_number, item_name, item_description, commercial_price, Website Price 45% GM, govt_price_with_fee</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Style extracted from manufacturer_part_number (E01830 from E01830-3M)</li>
                  <li>Size variants created automatically (3M, 7EW, 8.5M, etc.)</li>
                  <li>Multiple price types: Commercial, Website, GSA</li>
                  <li>Image matching: {'{style}'}.jpg, {'{style}'}_2.jpg, {'{style}'}_3.jpg</li>
                  <li>Products without images in import-images folder are skipped</li>
                  <li>GSA SIN and pricing automatically captured</li>
                </ul>
              </div>
            ) : importType === 'carhartt' ? (
              <div className="space-y-2 text-sm text-orange-700">
                <p><strong>Expected Columns:</strong> manufacturer_part_number, ADA vendor_part_number, item_name, item_description, commercial_price, Website Sale Price, GSA/Federal Price</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Manufacturer Part Number (CMW6095) → Product SKU</li>
                  <li>ADA Vendor Part Number (CHT-CMW6095-7M) → Variant SKU</li>
                  <li>Size variants created from ADA part numbers (7M, 8W, etc.)</li>
                  <li>Multiple prices: Commercial, Website Sale, Supplier Cost, GSA</li>
                  <li>Images from: /import-images/Images/{'<Category>/<Style>/<PartNumber>'}/JPEG/</li>
                  <li>Auto-creates Carhartt brand and assigns to Footwear category</li>
                  <li>Products go to PreRelease status for review</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Expected Columns:</strong> Vendor Part Number, Item_name, Unit Price, GSA Price, Category, etc.</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>GSA compliance fields (SIN, NSN)</li>
                  <li>Custom field mapping support</li>
                  <li>Multiple price tiers</li>
                  <li>Image pattern matching</li>
                </ul>
              </div>
            )}
          </div>

          {/* Step 1: Download Template - Only for GSA */}
          {importType === 'gsa' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-black mb-2">
                    Download Template
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Get the Excel template with the correct column headers
                  </p>
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template (.xlsx)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Prepare Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-safety-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-safety-green-600 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-2">
                  Prepare Your Images
                </h2>
                <p className="text-gray-600 mb-4">
                  Place your product images in the import folder with this naming pattern:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>import-images/</span>
                  </div>
                  <div className="pl-6 space-y-1 text-gray-600">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <span>1006980.jpg</span>
                      <span className="text-xs text-gray-400">← Main image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <span>1006980_2.jpg</span>
                      <span className="text-xs text-gray-400">← Second image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <span>1006980_3.jpg</span>
                      <span className="text-xs text-gray-400">← Third image</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  The number (1006980) should match the Part Number/SKU in your Excel
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Select Default Assignments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${importType === 'occunomix' ? 'bg-safety-green-100' : 'bg-blue-100'}`}>
                <span className={`font-bold ${importType === 'occunomix' ? 'text-safety-green-600' : 'text-blue-600'}`}>{importType === 'gsa' ? '2' : '1'}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-2">
                  {importType === 'occunomix' ? 'Select Warehouse & Supplier' : 'Select Default Assignments'}
                </h2>
                <p className="text-gray-600 mb-4">
                  {importType === 'occunomix'
                    ? 'Choose default warehouse and supplier for imported products'
                    : 'All imported products will be assigned to these selections'}
                </p>

                {isLoadingDropdowns ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-safety-green-600" />
                    <span className="ml-2 text-gray-600">Loading options...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Brand Select - For GSA and Wolverine */}
                    {(importType === 'gsa' || importType === 'wolverine') && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Tag className="w-4 h-4" />
                          Brand
                        </label>
                        <select
                          value={options.defaultBrandId}
                          onChange={(e) =>
                            setOptions({ ...options, defaultBrandId: e.target.value })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent bg-white"
                        >
                          <option value="">-- Select Brand --</option>
                          {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Category Select - For GSA and Wolverine */}
                    {(importType === 'gsa' || importType === 'wolverine') && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Building2 className="w-4 h-4" />
                          Category
                        </label>
                        <select
                          value={options.defaultCategoryId}
                          onChange={(e) =>
                            setOptions({ ...options, defaultCategoryId: e.target.value })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent bg-white"
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.parentId ? '└─ ' : ''}{category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Warehouse Select */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Warehouse className="w-4 h-4" />
                        Warehouse
                      </label>
                      <select
                        value={options.defaultWarehouseId}
                        onChange={(e) =>
                          setOptions({ ...options, defaultWarehouseId: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent bg-white"
                      >
                        <option value="">-- Select Warehouse --</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Supplier Select */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Truck className="w-4 h-4" />
                        Supplier
                      </label>
                      <select
                        value={options.defaultSupplierId}
                        onChange={(e) =>
                          setOptions({ ...options, defaultSupplierId: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent bg-white"
                      >
                        <option value="">-- Select Supplier --</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stock Quantity */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Default Stock Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={options.defaultStockQuantity}
                        onChange={(e) =>
                          setOptions({ ...options, defaultStockQuantity: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent bg-white"
                        placeholder="0"
                      />
                    </div>

                    {/* Status Select */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        Product Status
                      </label>
                      <select
                        value={options.defaultStatus}
                        onChange={(e) =>
                          setOptions({ ...options, defaultStatus: e.target.value as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PRERELEASE' })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent bg-white"
                      >
                        <option value="PRERELEASE">PreRelease (Review First)</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Selection Summary */}
                {(options.defaultBrandId || options.defaultCategoryId || options.defaultWarehouseId || options.defaultSupplierId) && (
                  <div className="mt-4 p-3 bg-safety-green-50 rounded-lg border border-safety-green-200">
                    <p className="text-sm text-safety-green-800 font-medium mb-2">Selected Defaults:</p>
                    <div className="flex flex-wrap gap-2">
                      {options.defaultBrandId && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {brands.find(b => b.id === options.defaultBrandId)?.name}
                        </span>
                      )}
                      {options.defaultCategoryId && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Building2 className="w-3 h-3 mr-1" />
                          {categories.find(c => c.id === options.defaultCategoryId)?.name}
                        </span>
                      )}
                      {options.defaultWarehouseId && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Warehouse className="w-3 h-3 mr-1" />
                          {warehouses.find(w => w.id === options.defaultWarehouseId)?.name}
                        </span>
                      )}
                      {options.defaultSupplierId && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Truck className="w-3 h-3 mr-1" />
                          {suppliers.find(s => s.id === options.defaultSupplierId)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Upload Excel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-safety-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-safety-green-600 font-bold">4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-2">
                  Upload Your Excel File
                </h2>
                <p className="text-gray-600 mb-4">
                  Drag and drop or click to upload your product list
                </p>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    file
                      ? 'border-safety-green-400 bg-safety-green-50'
                      : 'border-gray-300 hover:border-safety-green-400'
                  }`}
                >
                  {file ? (
                    <div className="space-y-3">
                      <FileSpreadsheet className="w-12 h-12 text-safety-green-600 mx-auto" />
                      <div>
                        <p className="font-medium text-black">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="border-gray-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-600">
                          Drag and drop your Excel file here, or{' '}
                          <label className="text-safety-green-600 hover:underline cursor-pointer">
                            browse
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Supports .xlsx files
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-black">Advanced Options</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 border-t border-gray-200 pt-4 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={options.updateExisting}
                    onChange={(e) =>
                      setOptions({ ...options, updateExisting: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                  />
                  <span className="text-gray-700">
                    Update existing products (match by SKU)
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={options.importImages}
                    onChange={(e) =>
                      setOptions({ ...options, importImages: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                  />
                  <span className="text-gray-700">Import and process images</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={options.dryRun}
                    onChange={(e) =>
                      setOptions({ ...options, dryRun: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-safety-green-600 focus:ring-safety-green-500"
                  />
                  <span className="text-gray-700">
                    Dry run (validate only, don&apos;t save)
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Folder Path
                  </label>
                  <input
                    type="text"
                    value={options.imageBasePath}
                    onChange={(e) =>
                      setOptions({ ...options, imageBasePath: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Start Import Button */}
          <Button
            onClick={startImport}
            disabled={!file || isUploading}
            className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-white py-6 text-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Start Import
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div
              className={`rounded-lg border p-6 ${
                result.success
                  ? 'bg-safety-green-50 border-safety-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-safety-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-lg ${
                      result.success ? 'text-safety-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.success ? 'Import Completed!' : 'Import Failed'}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-black">
                        {result.totalRows}
                      </div>
                      <div className="text-sm text-gray-600">Total Rows</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-safety-green-600">
                        {result.successCount}
                      </div>
                      <div className="text-sm text-gray-600">Successful</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.createdProducts.length}
                      </div>
                      <div className="text-sm text-gray-600">Created</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {result.updatedProducts.length}
                      </div>
                      <div className="text-sm text-gray-600">Updated</div>
                    </div>
                  </div>

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-800 mb-2">
                        Errors ({result.errors.length})
                      </h4>
                      <div className="bg-white rounded-lg max-h-48 overflow-y-auto">
                        {result.errors.slice(0, 10).map((error, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 border-b border-gray-100 text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              Row {error.row}:
                            </span>{' '}
                            <span className="text-red-600">{error.message}</span>
                          </div>
                        ))}
                        {result.errors.length > 10 && (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            ... and {result.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-orange-800 mb-2">
                        Warnings ({result.warnings.length})
                      </h4>
                      <div className="bg-white rounded-lg max-h-32 overflow-y-auto">
                        {result.warnings.slice(0, 5).map((warning, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 border-b border-gray-100 text-sm flex items-start gap-2"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{warning.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-black mb-4">Quick Tips</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-safety-green-500 flex-shrink-0 mt-0.5" />
                <span>Use the template for correct column headers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-safety-green-500 flex-shrink-0 mt-0.5" />
                <span>SKU/Part Number is required and must be unique</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-safety-green-500 flex-shrink-0 mt-0.5" />
                <span>Images are automatically converted to WebP</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-safety-green-500 flex-shrink-0 mt-0.5" />
                <span>4 sizes generated: original, large, medium, thumbnail</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-safety-green-500 flex-shrink-0 mt-0.5" />
                <span>Brands and categories are created automatically</span>
              </li>
            </ul>
          </div>

          {/* Supported Columns */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-black mb-4">Supported Columns</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Vendor Part Number</span>
                <span className="text-safety-green-600 font-medium">Required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item_name</span>
                <span className="text-safety-green-600 font-medium">Required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price</span>
                <span className="text-safety-green-600 font-medium">Required</span>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item_description</span>
                <span className="text-gray-400">Optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer</span>
                <span className="text-gray-400">Optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="text-gray-400">Optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GSA Price</span>
                <span className="text-gray-400">Optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">UPC</span>
                <span className="text-gray-400">Optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock</span>
                <span className="text-gray-400">Optional</span>
              </div>
            </div>
          </div>

          {/* Image Pattern */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-800 mb-2">Your Image Pattern</h3>
            <p className="text-sm text-blue-700 mb-3">
              Based on your format, images should be named:
            </p>
            <div className="font-mono text-sm bg-white rounded p-3 space-y-1">
              <div className="text-blue-700">{'{partNumber}'}.jpg</div>
              <div className="text-blue-700">{'{partNumber}'}_2.jpg</div>
              <div className="text-blue-700">{'{partNumber}'}_3.jpg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
