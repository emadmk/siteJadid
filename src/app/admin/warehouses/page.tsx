import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Warehouse, Package, TrendingUp, AlertTriangle, Plus, MapPin } from 'lucide-react';

async function getWarehouseData() {
  const [warehouses, transfers, lowStockProducts] = await Promise.all([
    db.warehouse.findMany({
      include: {
        stock: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                costPrice: true,
                basePrice: true,
                stockQuantity: true,
              },
            },
          },
        },
        // Products that have this warehouse as their default warehouse
        defaultProducts: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            basePrice: true,
            stockQuantity: true,
          },
        },
        _count: {
          select: {
            stock: true,
            defaultProducts: true, // Count products with defaultWarehouseId = this warehouse
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    db.warehouseTransfer.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        sourceWarehouse: true,
        destinationWarehouse: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    db.warehouseStock.findMany({
      where: {
        quantity: {
          lte: 10,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            lowStockThreshold: true,
          },
        },
        warehouse: true,
      },
      orderBy: {
        quantity: 'asc',
      },
      take: 10,
    }),
  ]);

  // Calculate total stock from both WarehouseStock and products with defaultWarehouseId
  const totalStock = warehouses.reduce((sum, warehouse) => {
    // Stock from WarehouseStock records
    const stockFromRecords = warehouse.stock.reduce((s, stock) => s + stock.quantity, 0);
    // Stock from products with defaultWarehouseId (if not already counted in stock records)
    const stockProductIds = new Set(warehouse.stock.map(s => s.product.id));
    const stockFromProducts = warehouse.defaultProducts
      .filter(p => !stockProductIds.has(p.id))
      .reduce((s, p) => s + (p.stockQuantity || 0), 0);
    return sum + stockFromRecords + stockFromProducts;
  }, 0);

  const totalValue = warehouses.reduce((sum, warehouse) => {
    // Value from WarehouseStock records
    const valueFromRecords = warehouse.stock.reduce((s, stock) => {
      const cost = stock.product.costPrice || stock.product.basePrice || 0;
      return s + stock.quantity * Number(cost);
    }, 0);
    // Value from products with defaultWarehouseId (if not already counted)
    const stockProductIds = new Set(warehouse.stock.map(s => s.product.id));
    const valueFromProducts = warehouse.defaultProducts
      .filter(p => !stockProductIds.has(p.id))
      .reduce((s, p) => {
        const cost = p.costPrice || p.basePrice || 0;
        return s + (p.stockQuantity || 0) * Number(cost);
      }, 0);
    return sum + valueFromRecords + valueFromProducts;
  }, 0);

  return { warehouses, transfers, lowStockProducts, totalStock, totalValue };
}

export default async function WarehousesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/warehouses');
  }

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'];
  if (!adminRoles.includes(session.user.role)) {
    redirect('/admin');
  }

  const { warehouses, transfers, lowStockProducts, totalStock, totalValue } = await getWarehouseData();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Warehouse Management</h1>
          <p className="text-gray-600">Manage inventory across multiple locations</p>
        </div>
        <Link href="/admin/warehouses/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add Warehouse
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Warehouses</span>
            <Warehouse className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-black">{warehouses.length}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Stock Units</span>
            <Package className="w-5 h-5 text-safety-green-600" />
          </div>
          <div className="text-3xl font-bold text-black">{totalStock.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Inventory Value</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-black">${totalValue.toFixed(0)}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Low Stock Items</span>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-black">{lowStockProducts.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Warehouses List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-black">Warehouses</h2>
            </div>

            <div className="divide-y">
              {warehouses.map((warehouse) => {
                // Get IDs of products already counted in stock records
                const stockProductIds = new Set(warehouse.stock.map(s => s.product.id));
                // Products from defaultWarehouseId that aren't already in stock records
                const additionalProducts = warehouse.defaultProducts.filter(p => !stockProductIds.has(p.id));

                // Total product count = stock records + additional products with defaultWarehouseId
                const productCount = warehouse._count.stock + additionalProducts.length;

                // Total units from stock records
                const unitsFromStock = warehouse.stock.reduce((sum, s) => sum + s.quantity, 0);
                // Total units from additional products
                const unitsFromProducts = additionalProducts.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
                const totalUnits = unitsFromStock + unitsFromProducts;

                // Total value from stock records
                const valueFromStock = warehouse.stock.reduce((sum, s) => {
                  const cost = s.product.costPrice || s.product.basePrice || 0;
                  return sum + s.quantity * Number(cost);
                }, 0);
                // Total value from additional products
                const valueFromProducts = additionalProducts.reduce((sum, p) => {
                  const cost = p.costPrice || p.basePrice || 0;
                  return sum + (p.stockQuantity || 0) * Number(cost);
                }, 0);
                const totalValue = valueFromStock + valueFromProducts;

                return (
                  <div key={warehouse.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/admin/warehouses/${warehouse.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link
                          href={`/admin/warehouses/${warehouse.id}`}
                          className="text-lg font-semibold text-black hover:text-safety-green-700 mb-1"
                        >
                          {warehouse.name}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.zipCode}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          warehouse.isActive
                            ? 'bg-safety-green-100 text-safety-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Products</div>
                        <div className="text-lg font-semibold text-black">{productCount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Units</div>
                        <div className="text-lg font-semibold text-black">{totalUnits.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Value</div>
                        <div className="text-lg font-semibold text-black">${totalValue.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {warehouses.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No warehouses configured. Add your first warehouse to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pending Transfers */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="font-bold text-black">Pending Transfers</h3>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="p-4">
                  <div className="text-sm font-medium text-black mb-1">
                    {transfer.sourceWarehouse.name} → {transfer.destinationWarehouse.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(transfer.createdAt).toLocaleDateString()}
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Pending
                  </span>
                </div>
              ))}

              {transfers.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">No pending transfers</div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="font-bold text-black">Low Stock Alerts</h3>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {lowStockProducts.map((stock) => (
                <div key={stock.id} className="p-4">
                  <div className="text-sm font-medium text-black mb-1">{stock.product.name}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {stock.warehouse.name} • SKU: {stock.product.sku}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded font-medium">
                      {stock.quantity} units
                    </span>
                  </div>
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">No low stock alerts</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
