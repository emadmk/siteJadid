import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { wolverineImportService } from '@/lib/services/wolverine-import';
import path from 'path';
import { existsSync } from 'fs';

// For App Router - set maximum duration
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

// Default image paths to check
const IMAGE_PATHS = [
  '/root/ada/siteJadid/import-images',
  path.join(process.cwd(), 'import-images'),
  '/home/user/siteJadid/import-images',
];

// POST - Start Wolverine import
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
        fieldMapping: { importSource: 'wolverine' },
        options: options,
        startedAt: new Date(),
      },
    });

    // Parse Excel file from buffer first (sync)
    console.log('Parsing Wolverine Excel file...');
    const rows = await wolverineImportService.parseExcel(buffer);

    // Update job with total rows
    await prisma.bulkImportJob.update({
      where: { id: importJob.id },
      data: { totalRows: rows.length },
    });

    console.log(`Found ${rows.length} rows to process`);

    // Find the correct image path
    let imageBasePath = options.imageBasePath;
    if (!imageBasePath) {
      for (const testPath of IMAGE_PATHS) {
        if (existsSync(testPath)) {
          imageBasePath = testPath;
          console.log(`Found image folder at: ${testPath}`);
          break;
        }
      }
    }

    if (!imageBasePath) {
      imageBasePath = IMAGE_PATHS[0]; // Default to first path
      console.log(`No image folder found, using default: ${imageBasePath}`);
    }

    console.log(`Using image base path: ${imageBasePath}`);

    // Start background import (don't await - continues after response)
    const backgroundImport = async () => {
      try {
        console.log('Starting background Wolverine import...');
        const result = await wolverineImportService.importProducts(rows, {
          ...options,
          imageBasePath,
        });

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
              createdVariants: result.createdVariants,
              skippedNoImage: result.skippedNoImage,
            },
            completedAt: new Date(),
          },
        });

        console.log(`Wolverine import completed: ${result.createdProducts.length} created, ${result.updatedProducts.length} updated, ${result.skippedNoImage} skipped (no image)`);
      } catch (importError) {
        console.error('Background Wolverine import error:', importError);
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
      }
    };

    // Start in background - don't await!
    backgroundImport();

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId: importJob.id,
      message: `Import started in background. Processing ${rows.length} rows. Check status with job ID.`,
      totalRows: rows.length,
    });
  } catch (error) {
    console.error('Error in Wolverine import:', error);
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

    // List recent Wolverine import jobs
    const jobs = await prisma.bulkImportJob.findMany({
      where: {
        userId: session.user.id,
        type: 'PRODUCTS',
        fieldMapping: {
          path: ['importSource'],
          equals: 'wolverine',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error in Wolverine import GET:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
