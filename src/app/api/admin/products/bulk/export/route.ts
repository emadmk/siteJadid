export const dynamic = 'force-dynamic';
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

    // Fetch products with their variants
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
        variants: {
          select: {
            sku: true,
            name: true,
            basePrice: true,
            salePrice: true,
            gsaPrice: true,
            wholesalePrice: true,
            costPrice: true,
            stockQuantity: true,
            isActive: true,
            attributeValues: {
              select: {
                value: true,
                attribute: { select: { name: true } },
              },
            },
          },
          orderBy: { sku: 'asc' },
        },
      },
      orderBy: { sku: 'asc' },
    });

    // Transform to export format - one row per variant (or product if no variants)
    const exportData: any[] = [];

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        // Export each variant as a row
        for (const v of p.variants) {
          // Build attributes string (e.g., "Size: L, Color: Red")
          const attributes = v.attributeValues
            .map((av) => `${av.attribute.name}: ${av.value}`)
            .join(', ');

          exportData.push({
            'Type': 'Variant',
            'Product SKU': p.sku,
            'SKU': v.sku,
            'Name': v.name,
            'Attributes': attributes,
            'Status': v.isActive ? 'ACTIVE' : 'INACTIVE',
            'Category': p.category?.name || '',
            'Brand': p.brand?.name || '',
            'Warehouse': p.defaultWarehouse?.name || '',
            'Base Price': Number(v.basePrice).toFixed(2),
            'Sale Price': v.salePrice ? Number(v.salePrice).toFixed(2) : '',
            'GSA Price': v.gsaPrice ? Number(v.gsaPrice).toFixed(2) : '',
            'Wholesale Price': v.wholesalePrice ? Number(v.wholesalePrice).toFixed(2) : '',
            'Cost Price': v.costPrice ? Number(v.costPrice).toFixed(2) : '',
            'Stock': v.stockQuantity,
          });
        }
      } else {
        // No variants - export product itself
        exportData.push({
          'Type': 'Product',
          'Product SKU': p.sku,
          'SKU': p.sku,
          'Name': p.name,
          'Attributes': '',
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
        });
      }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 }, // Type
      { wch: 20 }, // Product SKU
      { wch: 25 }, // SKU
      { wch: 40 }, // Name
      { wch: 30 }, // Attributes
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
        'Content-Disposition': `attachment; filename="products_variants_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 });
  }
}
