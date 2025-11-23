import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';

export default async function BulkOrderPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/bulk-order');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black mb-2">Bulk Order Entry</h1>
          <p className="text-gray-600">Upload multiple items at once using CSV format</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h2 className="text-xl font-bold text-black mb-4">Upload CSV File</h2>
              <p className="text-gray-600 mb-4">
                Upload a CSV file with SKU and quantity for each product. Maximum 1000 items per upload.
              </p>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-semibold text-black mb-2">Drop CSV file here or click to upload</div>
                <div className="text-sm text-gray-600 mb-4">Supports .csv files up to 5MB</div>
                <Button className="bg-primary hover:bg-primary/90">Choose File</Button>
              </div>

              {/* Download Template */}
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4 text-safety-green-600" />
                <button className="text-sm text-safety-green-600 hover:text-safety-green-700 font-medium">
                  Download CSV Template
                </button>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold text-black mb-4">Manual Entry</h2>
              <p className="text-gray-600 mb-4">Enter SKUs and quantities manually, one per line</p>

              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none"
                placeholder="SKU001, 10&#10;SKU002, 25&#10;SKU003, 5"
              />

              <div className="flex gap-3 mt-4">
                <Button className="flex-1 bg-primary hover:bg-primary/90">Process Order</Button>
                <Button variant="outline" className="flex-1">Clear</Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <h3 className="text-lg font-bold text-black mb-4">CSV Format Instructions</h3>

              <div className="space-y-4">
                <div>
                  <div className="font-medium text-black mb-2">Required Columns:</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <span className="font-mono bg-gray-100 px-1">SKU</span> - Product SKU code</li>
                    <li>• <span className="font-mono bg-gray-100 px-1">Quantity</span> - Number of units</li>
                  </ul>
                </div>

                <div>
                  <div className="font-medium text-black mb-2">Example Format:</div>
                  <div className="bg-gray-50 border rounded p-3 font-mono text-xs">
                    SKU001,10<br />
                    SKU002,25<br />
                    SKU003,5
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">Processing Rules:</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-safety-green-600 flex-shrink-0 mt-0.5" />
                      <span>Valid SKUs will be added to cart</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>Invalid SKUs will be reported</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>Out-of-stock items will be flagged</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">Tips:</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• No header row needed</li>
                    <li>• Use comma separation</li>
                    <li>• One product per line</li>
                    <li>• Quantities must be positive integers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
