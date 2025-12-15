import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pipImportService } from '@/lib/services/pip-import';
import path from 'path';
import fs from 'fs/promises';

// For App Router - set maximum duration
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

// POST - Start PiP import
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

    // Save uploaded file to temp location
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join('/tmp', `pip-import-${Date.now()}.xlsx`);
    await fs.writeFile(tempFilePath, buffer);

    const excelFilePath = tempFilePath;

    // Create import job record
    const importJob = await prisma.bulkImportJob.create({
      data: {
        type: 'PRODUCTS',
        status: 'PROCESSING',
        fileName: file.name,
        fileSize: file.size,
        userId: session.user.id,
        fieldMapping: { importSource: 'pip' },
        options: options,
        startedAt: new Date(),
      },
    });

    try {
      // Parse Excel file
      console.log('Parsing Excel file...');
      const rows = await pipImportService.parseExcel(excelFilePath);

      // Clean up temp file
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }

      // Update job with total rows
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: { totalRows: rows.length },
      });

      console.log(`Found ${rows.length} rows to process`);

      // Import products
      const result = await pipImportService.importProducts(rows, {
        ...options,
        imageBasePath: options.imageBasePath || path.join(process.cwd(), 'import-images'),
      });

      // Update job with results
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          processedRows: result.processedRows,
          successCount: result.successCount,
          errorCount: result.errorCount,
          errors: JSON.parse(JSON.stringify(result.errors.slice(0, 100))), // Limit errors stored
          warnings: JSON.parse(JSON.stringify(result.warnings.slice(0, 100))),
          summary: {
            createdProducts: result.createdProducts.length,
            updatedProducts: result.updatedProducts.length,
            createdVariants: result.createdVariants,
            createdCategories: result.createdCategories,
            createdBrands: result.createdBrands,
            skippedNoImage: result.skippedNoImage,
          },
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        jobId: importJob.id,
        result: {
          ...result,
          // Limit arrays in response
          createdProducts: result.createdProducts.slice(0, 50),
          updatedProducts: result.updatedProducts.slice(0, 50),
          errors: result.errors.slice(0, 50),
          warnings: result.warnings.slice(0, 50),
        },
      });
    } catch (importError) {
      console.error('Import error:', importError);

      // Update job as failed
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: {
          status: 'FAILED',
          errors: JSON.parse(JSON.stringify([
            {
              row: 0,
              field: 'general',
              value: '',
              message:
                importError instanceof Error
                  ? importError.message
                  : 'Unknown error during import',
            },
          ])),
          completedAt: new Date(),
        },
      });

      throw importError;
    }
  } catch (error) {
    console.error('Error in PiP import:', error);
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

    // List recent PiP import jobs
    const jobs = await prisma.bulkImportJob.findMany({
      where: {
        userId: session.user.id,
        type: 'PRODUCTS',
        fieldMapping: {
          path: ['importSource'],
          equals: 'pip',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error in PiP import GET:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
