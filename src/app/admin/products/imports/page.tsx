'use client';

import { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage?: number;
  createdProducts: string[] | number;
  updatedProducts: string[] | number;
  createdVariants: number;
  createdCategories: string[];
  createdBrands?: string[];
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ row: number; field: string; message: string }>;
}

export default function ProductImportsPage() {
  const [activeImporter, setActiveImporter] = useState<'occunomix' | 'pip' | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OccuNomix file upload
  const [occuNomixFile, setOccuNomixFile] = useState<File | null>(null);

  const handleOccuNomixImport = async () => {
    if (!occuNomixFile) {
      setError('Please select an Excel file');
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', occuNomixFile);
      formData.append('options', JSON.stringify({
        updateExisting: true,
        importImages: true,
        defaultStatus: 'ACTIVE',
        defaultStockQuantity: 100,
      }));

      const response = await fetch('/api/admin/occunomix-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handlePipImport = async () => {
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/pip-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            updateExisting: true,
            importImages: true,
            defaultStatus: 'ACTIVE',
            defaultStockQuantity: 100,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Import failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const resetImporter = () => {
    setActiveImporter(null);
    setResult(null);
    setError(null);
    setOccuNomixFile(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Product Importers</h1>
        <p className="text-gray-600 mt-1">
          Import products from supplier catalogs
        </p>
      </div>

      {!activeImporter && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* OccuNomix Importer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">OccuNomix Importer</h2>
                <p className="text-sm text-gray-500">Safety Products</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Import products from OccuNomix Excel catalog. Supports variants,
              images, and automatic category creation.
            </p>
            <Button
              onClick={() => setActiveImporter('occunomix')}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Import
            </Button>
          </div>

          {/* PiP Importer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">PiP Importer</h2>
                <p className="text-sm text-gray-500">Protective Industrial Products</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Import from PiP catalog. Uses pre-uploaded Excel and CSV files.
              Creates brands, categories, and variants automatically.
            </p>
            <Button
              onClick={() => setActiveImporter('pip')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Start Import
            </Button>
          </div>
        </div>
      )}

      {/* OccuNomix Import Form */}
      {activeImporter === 'occunomix' && !result && (
        <div className="max-w-2xl bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">OccuNomix Import</h2>
            <Button variant="outline" onClick={resetImporter}>
              Cancel
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excel File (.xlsx)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setOccuNomixFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="occunomix-file"
                />
                <label
                  htmlFor="occunomix-file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-2" />
                  {occuNomixFile ? (
                    <span className="text-green-600 font-medium">
                      {occuNomixFile.name}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Click to select Excel file
                    </span>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Before importing:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Place product images in <code>/import-images</code> folder</li>
                <li>Existing products will be updated</li>
                <li>Categories will be created automatically</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleOccuNomixImport}
              disabled={importing || !occuNomixFile}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing... (this may take a few minutes)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PiP Import Form */}
      {activeImporter === 'pip' && !result && (
        <div className="max-w-2xl bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">PiP Import</h2>
            <Button variant="outline" onClick={resetImporter}>
              Cancel
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Files Required</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ PIP-Product-Information-2025-12.xlsx (in /public/uploads)</li>
                <li>✓ PIP-Product-Images-SKU-Level.csv (in /public/uploads)</li>
                <li>✓ Product images (in /import-images folder)</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Import Details:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Product name = Brand + Short Description</li>
                <li>Colors and Sizes become variants</li>
                <li>Price set to $0.01 (update later)</li>
                <li>Products without images are skipped</li>
                <li>Brands and categories created automatically</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handlePipImport}
              disabled={importing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing... (this may take several minutes)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start PiP Import
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="max-w-3xl bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {result.success ? 'Import Completed' : 'Import Completed with Errors'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {activeImporter === 'pip' ? 'PiP' : 'OccuNomix'} Import
                </p>
              </div>
            </div>
            <Button onClick={resetImporter}>
              New Import
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{result.totalRows}</p>
              <p className="text-sm text-gray-500">Total Rows</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
              <p className="text-sm text-gray-500">Products Created/Updated</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{result.createdVariants}</p>
              <p className="text-sm text-gray-500">Variants Created</p>
            </div>
            {result.skippedNoImage !== undefined && (
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{result.skippedNoImage}</p>
                <p className="text-sm text-gray-500">Skipped (No Image)</p>
              </div>
            )}
            {result.errorCount > 0 && (
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{result.errorCount}</p>
                <p className="text-sm text-gray-500">Errors</p>
              </div>
            )}
          </div>

          {/* Created Items */}
          <div className="space-y-4">
            {result.createdCategories && result.createdCategories.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Categories Created ({result.createdCategories.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.createdCategories.slice(0, 20).map((cat, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                    >
                      {cat}
                    </span>
                  ))}
                  {result.createdCategories.length > 20 && (
                    <span className="text-gray-500 text-sm">
                      +{result.createdCategories.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {result.createdBrands && result.createdBrands.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Brands Created ({result.createdBrands.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.createdBrands.map((brand, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-red-700 mb-2">
                  Errors ({result.errors.length})
                </h3>
                <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <p key={i} className="text-sm text-red-700 mb-1">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div>
                <h3 className="font-medium text-yellow-700 mb-2">
                  Warnings ({result.warnings.length})
                </h3>
                <div className="bg-yellow-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {result.warnings.slice(0, 20).map((warn, i) => (
                    <p key={i} className="text-sm text-yellow-700 mb-1">
                      {warn.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
