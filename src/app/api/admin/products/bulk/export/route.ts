import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'No products selected' }, { status: 400 });
    }

    // Fetch products
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        sku: true,
        name: true,
        status: true,
        basePrice: true,
        salePrice: true,
        gsaPrice: true,
        wholesalePrice: true,
        costPrice: true,
        stockQuantity: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        defaultWarehouse: { select: { name: true } },
      },
      orderBy: { sku: 'asc' },
    });

    // Transform to export format
    const exportData = products.map(p => ({
      'SKU': p.sku,
      'Name': p.name,
      'Status': p.status,
      'Category': p.category?.name || '',
      'Brand': p.brand?.name || '',
      'Warehouse': p.defaultWarehouse?.name || '',
      'Base Price': Number(p.basePrice).toFixed(2),
      'Sale Price': p.salePrice ? Number(p.salePrice).toFixed(2) : '',
      'GSA Price': p.gsaPrice ? Number(p.gsaPrice).toFixed(2) : '',
      'Wholesale Price': p.wholesalePrice ? Number(p.wholesalePrice).toFixed(2) : '',
      'Cost Price': p.costPrice ? Number(p.costPrice).toFixed(2) : '',
      'Stock': p.stockQuantity,
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // SKU
      { wch: 40 }, // Name
      { wch: 12 }, // Status
      { wch: 20 }, // Category
      { wch: 15 }, // Brand
      { wch: 15 }, // Warehouse
      { wch: 12 }, // Base Price
      { wch: 12 }, // Sale Price
      { wch: 12 }, // GSA Price
      { wch: 15 }, // Wholesale Price
      { wch: 12 }, // Cost Price
      { wch: 10 }, // Stock
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Export');

    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 });
  }
}
