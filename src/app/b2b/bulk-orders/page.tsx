'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Package,
  Upload,
  Download,
  FileText,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShoppingCart,
  X
} from 'lucide-react';

export default function BulkOrdersPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [results, setResults] = useState<{
    success: Array<{ sku: string; quantity: number; productName: string }>;
    errors: Array<{ sku?: string; line?: string; error: string; available?: number }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvData.trim()) {
      alert('Please enter CSV data or upload a file');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const res = await fetch('/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process bulk order');
      }
    } catch (error) {
      console.error('Error processing bulk order:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'SKU,Quantity\nSAFE-001,10\nSAFE-002,25\nSAFE-003,50';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-order-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/b2b" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to B2B
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Bulk Orders</h1>
              <p className="text-gray-600">Upload a CSV file to add multiple items to your cart</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-black">Upload CSV File</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-safety-green-500 hover:bg-safety-green-50 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV file with SKU and Quantity columns
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Manual Entry */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Or paste CSV data directly
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="SKU,Quantity&#10;SAFE-001,10&#10;SAFE-002,25"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing || !csvData.trim()}
                  className="w-full bg-safety-green-600 hover:bg-safety-green-700 py-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </form>

              {/* Results */}
              {results && (
                <div className="mt-8 space-y-4">
                  {results.success.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-green-800">
                          {results.success.length} items added to cart
                        </h3>
                      </div>
                      <ul className="space-y-1 text-sm text-green-700">
                        {results.success.map((item, i) => (
                          <li key={i}>
                            {item.productName} (SKU: {item.sku}) - Qty: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-red-800">
                          {results.errors.length} errors encountered
                        </h3>
                      </div>
                      <ul className="space-y-1 text-sm text-red-700">
                        {results.errors.map((error, i) => (
                          <li key={i}>
                            {error.sku ? `SKU ${error.sku}: ` : ''}
                            {error.error}
                            {error.available !== undefined && ` (Available: ${error.available})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.success.length > 0 && (
                    <div className="flex gap-4">
                      <Link href="/cart" className="flex-1">
                        <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                          View Cart
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCsvData('');
                          setResults(null);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-black mb-4">CSV Format</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm mb-4">
                <p className="text-gray-600">SKU,Quantity</p>
                <p className="text-gray-800">SAFE-001,10</p>
                <p className="text-gray-800">SAFE-002,25</p>
                <p className="text-gray-800">SAFE-003,50</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>First column: Product SKU</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>Second column: Quantity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <span>No header row required</span>
                </li>
              </ul>
            </div>

            <div className="bg-safety-green-50 rounded-lg border border-safety-green-200 p-6">
              <h3 className="text-lg font-bold text-black mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact our B2B team for assistance with bulk orders.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4" />
                  <span>1-800-ADASUPPLY</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4" />
                  <span>b2b@adasupply.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
