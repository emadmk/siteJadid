import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, X, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';

export default async function ProductComparisonPage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/compare');
  }

  const productIds = searchParams.ids?.split(',').filter(Boolean) || [];

  if (productIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="bg-white rounded-lg border p-12 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-black mb-4">Product Comparison</h1>
            <p className="text-gray-600 mb-8">
              Add products to your comparison to see features side-by-side. You can compare up to 4 products at once.
            </p>
            <Link href="/products">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Compare Products</h1>
              <p className="text-gray-600">Comparing {productIds.length} products</p>
            </div>
            <div className="flex gap-3">
              {productIds.length < 4 && (
                <Link href="/products">
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </Link>
              )}
              <Button variant="outline">Clear All</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left bg-gray-50 w-48 sticky left-0">Feature</th>
                  {/* Product columns will be here */}
                  <th className="p-4 min-w-[280px]">
                    <div className="text-center">
                      <div className="w-full h-48 bg-gray-100 rounded mb-4"></div>
                      <div className="font-bold text-black mb-2">Product 1</div>
                      <div className="text-2xl font-bold text-black mb-4">$99.99</div>
                      <div className="space-y-2">
                        <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </Button>
                        <Button variant="outline" className="w-full gap-2">
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Pricing Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Price</td>
                  <td className="p-4 text-center">$99.99</td>
                </tr>

                {/* Stock Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Availability</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-safety-green-100 text-safety-green-800 text-sm rounded">
                      <CheckCircle className="w-3 h-3" />
                      In Stock
                    </span>
                  </td>
                </tr>

                {/* Category Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Category</td>
                  <td className="p-4 text-center text-gray-700">Safety Equipment</td>
                </tr>

                {/* Weight Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Weight</td>
                  <td className="p-4 text-center text-gray-700">1.5 lbs</td>
                </tr>

                {/* Dimensions Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Dimensions</td>
                  <td className="p-4 text-center text-gray-700">10" x 8" x 4"</td>
                </tr>

                {/* Certifications Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Certifications</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">ANSI Z87.1</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">OSHA</span>
                    </div>
                  </td>
                </tr>

                {/* Description Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium bg-gray-50 sticky left-0">Description</td>
                  <td className="p-4 text-sm text-gray-700">
                    High-quality safety equipment designed for maximum protection...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Tip: You can add up to 4 products to compare. Click "Add Product" to browse more items.
          </p>
        </div>
      </div>
    </div>
  );
}
