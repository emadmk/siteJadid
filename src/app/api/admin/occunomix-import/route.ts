import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { occuNomixImportService } from '@/lib/services/occunomix-import';

// For App Router - set maximum duration
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

// POST - Start OccuNomix import
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
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
        type: 'OCCUNOMIX',
        status: 'PROCESSING',
        fileName: file.name,
        fileSize: file.size,
        userId: session.user.id,
        fieldMapping: { type: 'occunomix' },
        options: options,
        startedAt: new Date(),
      },
    });

    try {
      // Parse Excel file
      const rows = await occuNomixImportService.parseExcel(buffer);

      // Update job with total rows
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: { totalRows: rows.length },
      });

      // Import products
      const result = await occuNomixImportService.importProducts(rows, {
        ...options,
        imageBasePath: options.imageBasePath || process.cwd() + '/import-images',
      });

      // Update job with results
      await prisma.bulkImportJob.update({
        where: { id: importJob.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          processedRows: result.processedRows,
          successCount: result.successCount,
          errorCount: result.errorCount,
          errors: JSON.parse(JSON.stringify(result.errors)),
          warnings: JSON.parse(JSON.stringify(result.warnings)),
          summary: {
            createdProducts: result.createdProducts,
            updatedProducts: result.updatedProducts,
            createdVariants: result.createdVariants,
            createdCategories: result.createdCategories,
          },
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        jobId: importJob.id,
        result,
      });
    } catch (importError) {
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
    console.error('Error in OccuNomix import:', error);
    return NextResponse.json(
      {
        error: 'Failed to process import',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - Get import status or download template
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

    // List recent OccuNomix import jobs
    const jobs = await prisma.bulkImportJob.findMany({
      where: {
        userId: session.user.id,
        type: 'OCCUNOMIX',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error in OccuNomix import GET:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
