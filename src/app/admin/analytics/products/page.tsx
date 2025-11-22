import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { db } from '@/lib/db';

async function getProductPerformance() {
  // Get all products with their order items
  const products = await db.product.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      orderItems: {
        select: {
          quantity: true,
          price: true,
          order: {
            select: {
              status: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    take: 100,
  });

  return products.map((product) => {
    // Filter out cancelled/refunded orders
    const validOrderItems = product.orderItems.filter(
      (item) =>
        item.order.status !== 'CANCELLED' && item.order.status !== 'REFUNDED'
    );

    const totalSold = validOrderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const revenue = validOrderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      images: product.images,
      category: product.category?.name,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      stockQuantity: product.stockQuantity,
      totalSold,
      revenue,
      reviewCount: product._count.reviews,
      status: product.status,
    };
  });
}

async function getTopPerformers() {
  const orderItems = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
      basePrice: true,
    },
    orderBy: {
      _sum: {
        price: 'desc',
      },
    },
    take: 5,
  });

  const productIds = orderItems.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
    },
  });

  return orderItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      product,
      quantitySold: item._sum.quantity || 0,
      revenue: Number(item._sum.price || 0),
    };
  });
}

async function getLowPerformers() {
  const products = await db.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      orderItems: {
        select: {
          quantity: true,
        },
      },
    },
    take: 100,
  });

  const productsWithSales = products.map((product) => {
    const totalSold = product.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      images: product.images,
      stockQuantity: product.stockQuantity,
      totalSold,
    };
  });

  // Sort by lowest sales and return bottom 5
  return productsWithSales.sort((a, b) => a.totalSold - b.totalSold).slice(0, 5);
}

export default async function ProductPerformancePage() {
  const [products, topPerformers, lowPerformers] = await Promise.all([
    getProductPerformance(),
    getTopPerformers(),
    getLowPerformers(),
  ]);

  // Sort products by revenue
  const sortedProducts = [...products].sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSold = products.reduce((sum, p) => sum + p.totalSold, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/analytics">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Product Performance</h1>
          <p className="text-gray-600">Analyze product sales and performance metrics</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">
            {products.length}
          </div>
          <div className="text-sm text-gray-600">Products Tracked</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">{totalSold}</div>
          <div className="text-sm text-gray-600">Units Sold</div>
        </div>
      </div>

      {/* Top and Low Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Performers */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-safety-green-600" />
              Top Performers
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topPerformers.map((item, index) => {
                const images = item.product?.images as string[] | undefined;
                return (
                  <div
                    key={item.product?.id || index}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                      {images && images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={item.product?.name || ''}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black line-clamp-1">
                        {item.product?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.quantitySold} units sold
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-safety-green-600">
                        ${item.revenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Low Performers */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Low Performers
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {lowPerformers.map((product) => {
                const images = product.images as string[] | undefined;
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                      {images && images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {product.totalSold} units sold
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Stock: {product.stockQuantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* All Products Performance */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">All Products Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Reviews
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedProducts.slice(0, 50).map((product) => {
                const images = product.images as string[] | undefined;
                const price = product.salePrice || product.basePrice;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0">
                          {images && images.length > 0 ? (
                            <img
                              src={images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-black line-clamp-1">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-black">
                      ${Number(price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          product.totalSold > 100
                            ? 'bg-safety-green-100 text-safety-green-800'
                            : product.totalSold > 50
                            ? 'bg-blue-100 text-blue-800'
                            : product.totalSold > 0
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.totalSold}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                      ${product.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stockQuantity === 0
                            ? 'bg-red-100 text-red-800'
                            : product.stockQuantity <= 10
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-safety-green-100 text-safety-green-800'
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.reviewCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/products/${product.slug}`} target="_blank">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
