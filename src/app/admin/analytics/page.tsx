import { db } from '@/lib/db';
import { TrendingUp, DollarSign, Users, Package } from 'lucide-react';

export default async function AnalyticsPage() {
  const [orderCount, revenue, customerCount, productCount] = await Promise.all([
    db.order.count(),
    db.order.aggregate({ _sum: { total: true } }),
    db.user.count({ where: { role: { in: ['CUSTOMER', 'B2B_CUSTOMER'] } } }),
    db.product.count(),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <Package className="w-8 h-8 text-blue-600 mb-4" />
          <div className="text-3xl font-bold">{orderCount}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <DollarSign className="w-8 h-8 text-green-600 mb-4" />
          <div className="text-3xl font-bold">${Number(revenue._sum.total || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <Users className="w-8 h-8 text-purple-600 mb-4" />
          <div className="text-3xl font-bold">{customerCount}</div>
          <div className="text-sm text-gray-600">Customers</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <TrendingUp className="w-8 h-8 text-orange-600 mb-4" />
          <div className="text-3xl font-bold">{productCount}</div>
          <div className="text-sm text-gray-600">Products</div>
        </div>
      </div>
    </div>
  );
}
