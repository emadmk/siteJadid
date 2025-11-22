import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tag, Plus, Search } from 'lucide-react';

// This page is a placeholder for the Coupons feature
// The Coupon model needs to be added to Prisma schema

export default async function CouponsPage() {
  // Placeholder data - will be replaced with actual database queries
  const coupons: any[] = [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Coupon Codes</h1>
          <p className="text-gray-600">Create and manage discount coupon codes</p>
        </div>
        <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">0</div>
          <div className="text-sm text-gray-600">Total Coupons</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">0</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
          <div className="text-sm text-gray-600">Times Used</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">$0.00</div>
          <div className="text-sm text-gray-600">Total Discount</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-600 mb-1">0</div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search coupon codes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              name="type"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage Off</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/coupons">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Coupons List - Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-black mb-2">Coupons Feature</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            The coupons feature requires database schema updates. Add the Coupon model to
            your Prisma schema to enable this functionality.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
            <h4 className="font-semibold text-blue-900 mb-2">
              Suggested Coupon Model:
            </h4>
            <pre className="text-sm text-blue-800 overflow-x-auto">
              {`model Coupon {
  id               String    @id @default(uuid())
  code             String    @unique
  description      String?
  discountType     String    // PERCENTAGE, FIXED, FREE_SHIPPING
  discountValue    Decimal
  minPurchase      Decimal?
  maxDiscount      Decimal?
  startDate        DateTime
  endDate          DateTime
  usageLimit       Int?
  usageCount       Int       @default(0)
  perCustomerLimit Int?
  isActive         Boolean   @default(true)
  accountTypes     String[]  // B2C, B2B, GSA
  productIds       String[]
  categoryIds      String[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  orders           Order[]
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
