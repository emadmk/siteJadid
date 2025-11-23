import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ShoppingCart, Upload, Download } from 'lucide-react';

export default async function QuickOrderPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/quick-order');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black mb-2">Quick Order Pad</h1>
          <p className="text-gray-600">Enter SKUs and quantities to quickly add products to your cart</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Entry Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Enter Products</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Import CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Row
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...Array(10)].map((_, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">{i + 1}</td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Enter SKU"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">-</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">-</div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            placeholder="Qty"
                            className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                            min="1"
                            defaultValue="1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-black">-</div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button variant="outline">Clear All</Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export Template
                    </Button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-sm text-gray-600">Estimated Total</div>
                      <div className="text-2xl font-bold text-black">$0.00</div>
                    </div>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions & Tips */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <h3 className="text-lg font-bold text-black mb-4">How to Use</h3>

              <div className="space-y-4">
                <div>
                  <div className="font-medium text-black mb-2">Manual Entry</div>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Enter product SKU in the SKU column</li>
                    <li>Product details will auto-populate</li>
                    <li>Enter desired quantity</li>
                    <li>Click "Add to Cart" when ready</li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">CSV Import</div>
                  <p className="text-sm text-gray-700 mb-2">
                    Upload a CSV file with two columns: SKU and Quantity
                  </p>
                  <div className="bg-gray-50 border rounded p-3 font-mono text-xs mb-2">
                    SKU001,10<br />
                    SKU002,25<br />
                    SKU003,5
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <Download className="w-3 h-3" />
                    Download Template
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">Tips</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Use Tab key to quickly move between fields</li>
                    <li>• SKUs are case-insensitive</li>
                    <li>• Invalid SKUs will be highlighted in red</li>
                    <li>• Stock availability is checked in real-time</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <div className="font-medium text-black mb-2">Keyboard Shortcuts</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Add row:</span>
                      <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+Enter</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Submit:</span>
                      <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+S</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear:</span>
                      <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+K</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
