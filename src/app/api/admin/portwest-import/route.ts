import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { portwestImportService } from '@/lib/services/portwest-import';

// 20 minutes - PortWest has 1266 unique images to download
export const maxDuration = 1200;
export const dynamic = 'force-dynamic';

/**
 * POST - Start PortWest import
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const importJob = await prisma.bulkImportJob.create({
      data: {
        type: 'PRODUCTS',
        status: 'PROCESSING',
        fileName: file.name,
        fileSize: file.size,
        userId: session.user.id,
        fieldMapping: { importSource: 'portwest' },
        options,
        startedAt: new Date(),
      },
    });

    console.log('Parsing PortWest Excel file...');
    const rows = await portwestImportService.parseExcel(buffer);
    console.log(`Found ${rows.length} rows to process`);

    await prisma.bulkImportJob.update({
      where: { id: importJob.id },
      data: { totalRows: rows.length },
    });

    // Background import
    const backgroundImport = async () => {
      try {
        const result = await portwestImportService.importProducts(rows, options);

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
              imagesDownloaded: result.imagesDownloaded,
              imagesFailed: result.imagesFailed,
            },
            completedAt: new Date(),
          },
        });

        console.log(
          `PortWest import done: ${result.createdProducts.length} created, ` +
            `${result.updatedProducts.length} updated, ${result.createdVariants} variants, ` +
            `${result.imagesDownloaded} images downloaded, ${result.imagesFailed} failed`
        );
      } catch (err) {
        console.error('PortWest import error:', err);
        await prisma.bulkImportJob.update({
          where: { id: importJob.id },
          data: {
            status: 'FAILED',
            errors: JSON.parse(
              JSON.stringify([
                {
                  row: 0,
                  field: 'general',
                  value: '',
                  message: err instanceof Error ? err.message : 'Unknown error',
                },
              ])
            ),
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
    });
  } catch (error) {
    console.error('Error in PortWest import:', error);
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
        fieldMapping: { path: ['importSource'], equals: 'portwest' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error in PortWest import GET:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
