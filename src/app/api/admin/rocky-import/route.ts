import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rockyImportService } from '@/lib/services/rocky-import';
import { existsSync } from 'fs';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Candidate image base paths (in priority order)
const IMAGE_PATHS = [
  '/var/www/static-uploads/rocky',
  '/var/www/siteJadid/public/uploads/rocky',
];

/**
 * POST - Start Rocky/Georgia Boots import
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    const options = optionsStr ? JSON.parse(optionsStr) : {};

    // Auto-detect image base path
    let imageBasePath = options.imageBasePath;
    if (!imageBasePath) {
      for (const p of IMAGE_PATHS) {
        if (existsSync(p)) {
          imageBasePath = p;
          break;
        }
      }
      if (!imageBasePath) imageBasePath = IMAGE_PATHS[0];
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const importJob = await prisma.bulkImportJob.create({
      data: {
        type: 'PRODUCTS',
        status: 'PROCESSING',
        fileName: file.name,
        fileSize: file.size,
        userId: session.user.id,
        fieldMapping: { importSource: 'rocky' },
        options,
        startedAt: new Date(),
      },
    });

    console.log('Parsing Rocky/Georgia Boots Excel file...');
    const rows = await rockyImportService.parseExcel(buffer);
    console.log(`Found ${rows.length} rows to process`);

    await prisma.bulkImportJob.update({
      where: { id: importJob.id },
      data: { totalRows: rows.length },
    });

    // Background import
    const backgroundImport = async () => {
      try {
        const result = await rockyImportService.importProducts(rows, {
          ...options,
          imageBasePath,
        });

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
              createdVariants: result.createdVariants,
              skippedNoImage: result.skippedNoImage,
            },
            completedAt: new Date(),
          },
        });

        console.log(
          `Rocky import done: ${result.createdProducts.length} created, ` +
          `${result.updatedProducts.length} updated, ${result.createdVariants} variants, ` +
          `${result.skippedNoImage} without images`
        );
      } catch (err) {
        console.error('Rocky import error:', err);
        await prisma.bulkImportJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            errors: JSON.parse(JSON.stringify([{
              row: 0,
              field: 'general',
              value: '',
              message: err instanceof Error ? err.message : 'Unknown error',
            }])),
            completedAt: new Date(),
          },
        });
      }
    };

    backgroundImport();

    return NextResponse.json({
      success: true,
      jobId: importJob.id,
      message: `Import started in background. Processing ${rows.length} rows.`,
      totalRows: rows.length,
      imageBasePath,
    });
  } catch (error) {
    console.error('Error in Rocky import:', error);
    return NextResponse.json(
      {
        error: 'Failed to process import',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get import status or list jobs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const job = await prisma.bulkImportJob.findUnique({ where: { id: jobId } });
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      return NextResponse.json({ job });
    }

    const jobs = await prisma.bulkImportJob.findMany({
      where: {
        userId: session.user.id,
        type: 'PRODUCTS',
        fieldMapping: { path: ['importSource'], equals: 'rocky' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error in Rocky import GET:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
