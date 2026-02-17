export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create template data
    const templateData = [
      {
        'SKU': 'EXAMPLE-001',
        'Base Price': '99.99',
        'Sale Price': '79.99',
        'GSA Price': '69.99',
        'Wholesale Price': '59.99',
        'Cost Price': '40.00',
        'Stock': '100',
      },
      {
        'SKU': 'EXAMPLE-002',
        'Base Price': '149.99',
        'Sale Price': '',
        'GSA Price': '129.99',
        'Wholesale Price': '119.99',
        'Cost Price': '80.00',
        'Stock': '50',
      },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // SKU
      { wch: 12 }, // Base Price
      { wch: 12 }, // Sale Price
      { wch: 12 }, // GSA Price
      { wch: 15 }, // Wholesale Price
      { wch: 12 }, // Cost Price
      { wch: 10 }, // Stock
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Price Update Template');

    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="price_update_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
