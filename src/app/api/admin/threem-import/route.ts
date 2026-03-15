import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { threeMImportService } from '@/lib/services/3m-import';

// For App Router - set maximum duration
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

// POST - Start 3M import
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Handle FormData upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx)' },
        { status: 400 }
      );
    }

    // Parse options
    const options = optionsStr ? JSON.parse(optionsStr) : {};

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create import job record
    const importJob = await prisma.bulkImportJob.create({
      data: {
        type: 'PRODUCTS',
        status: 'PROCESSING',
        fileName: file.name,
        fileSize: file.size,
        userId: session.user.id,
        fieldMapping: { importSource: '3m' },
        options: options,
        startedAt: new Date(),
      },
    });

    // Parse Excel file
    console.log('Parsing 3M Excel file...');
    const rows = await threeMImportService.parseExcel(buffer);

    // Update job with total rows
    await prisma.bulkImportJob.update({
      where: { id: importJob.id },
      data: { totalRows: rows.length },
    });

    console.log(`Found ${rows.length} 3M rows to process`);

    // Run import synchronously so the result is returned to the UI
    try {
      const result = await threeMImportService.importProducts(rows, options);

      // Update job with results
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          processedRows: result.processedRows,
          successCount: result.successCount,
          errorCount: result.errorCount,
          errors: JSON.parse(JSON.stringify(result.errors.slice(0, 100))),
          warnings: JSON.parse(JSON.stringify(result.warnings.slice(0, 100))),
          summary: {
            createdProducts: result.createdProducts.length,
            updatedProducts: result.updatedProducts.length,
            createdCategories: result.createdCategories.length,
          },
          completedAt: new Date(),
        },
      });

      console.log(`3M import completed: ${result.createdProducts.length} created, ${result.updatedProducts.length} updated, ${result.createdCategories.length} categories`);

      return NextResponse.json({
        success: true,
        result,
        jobId: importJob.id,
      });
    } catch (importError) {
      console.error('3M import error:', importError);
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: {
          status: 'FAILED',
          errors: JSON.parse(JSON.stringify([
            {
              row: 0,
              field: 'general',
              value: '',
              message: importError instanceof Error ? importError.message : 'Unknown error',
            },
          ])),
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: importError instanceof Error ? importError.message : 'Import failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in 3M import:', error);
    return NextResponse.json(
      {
        error: 'Failed to process import',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - Get import status or list jobs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const job = await prisma.bulkImportJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ job });
    }

    // List recent 3M import jobs
    const jobs = await prisma.bulkImportJob.findMany({
      where: {
        userId: session.user.id,
        type: 'PRODUCTS',
        fieldMapping: {
          path: ['importSource'],
          equals: '3m',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error in 3M import GET:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
