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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: 'Excel file is empty' }, { status: 400 });
    }

    let updated = 0;
    let notFound = 0;
    let errors: string[] = [];

    for (const row of data as any[]) {
      const sku = row['SKU'] || row['sku'] || row['Sku'];

      if (!sku) {
        errors.push('Row without SKU found');
        continue;
      }

      // Find product by SKU
      const product = await db.product.findUnique({
        where: { sku: String(sku) },
      });

      if (!product) {
        notFound++;
        errors.push(`SKU not found: ${sku}`);
        continue;
      }

      // Build update data
      const updateData: any = {};

      // Base Price
      const basePrice = row['Base Price'] || row['basePrice'] || row['BasePrice'];
      if (basePrice !== undefined && basePrice !== null && basePrice !== '') {
        const parsed = parseFloat(String(basePrice).replace(/[,$]/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.basePrice = parsed;
        }
      }

      // Sale Price
      const salePrice = row['Sale Price'] || row['salePrice'] || row['SalePrice'];
      if (salePrice !== undefined && salePrice !== null && salePrice !== '') {
        const parsed = parseFloat(String(salePrice).replace(/[,$]/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.salePrice = parsed;
        }
      } else if (salePrice === '' || salePrice === null) {
        updateData.salePrice = null;
      }

      // GSA Price
      const gsaPrice = row['GSA Price'] || row['gsaPrice'] || row['GsaPrice'];
      if (gsaPrice !== undefined && gsaPrice !== null && gsaPrice !== '') {
        const parsed = parseFloat(String(gsaPrice).replace(/[,$]/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.gsaPrice = parsed;
        }
      } else if (gsaPrice === '' || gsaPrice === null) {
        updateData.gsaPrice = null;
      }

      // Wholesale Price
      const wholesalePrice = row['Wholesale Price'] || row['wholesalePrice'] || row['WholesalePrice'];
      if (wholesalePrice !== undefined && wholesalePrice !== null && wholesalePrice !== '') {
        const parsed = parseFloat(String(wholesalePrice).replace(/[,$]/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.wholesalePrice = parsed;
        }
      } else if (wholesalePrice === '' || wholesalePrice === null) {
        updateData.wholesalePrice = null;
      }

      // Cost Price
      const costPrice = row['Cost Price'] || row['costPrice'] || row['CostPrice'];
      if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
        const parsed = parseFloat(String(costPrice).replace(/[,$]/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.costPrice = parsed;
        }
      }

      // Stock Quantity
      const stockQuantity = row['Stock'] || row['stockQuantity'] || row['StockQuantity'] || row['Quantity'];
      if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== '') {
        const parsed = parseInt(String(stockQuantity));
        if (!isNaN(parsed) && parsed >= 0) {
          updateData.stockQuantity = parsed;
        }
      }

      // Update product if there's any data to update
      if (Object.keys(updateData).length > 0) {
        try {
          await db.product.update({
            where: { id: product.id },
            data: updateData,
          });
          updated++;
        } catch (err) {
          errors.push(`Failed to update SKU: ${sku}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} product(s)${notFound > 0 ? `, ${notFound} SKU(s) not found` : ''}`,
      affected: updated,
      notFound,
      errors: errors.length > 5 ? errors.slice(0, 5).concat([`...and ${errors.length - 5} more`]) : errors,
    });
  } catch (error) {
    console.error('Error processing price upload:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process Excel file. Please check the format.',
    }, { status: 500 });
  }
}
