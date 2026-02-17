export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { imageProcessor } from '@/lib/services/image-processor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Optional: get brand and sku for folder organization
    const brandSlug = formData.get('brandSlug') as string | null;
    const productSku = formData.get('productSku') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const allSizes: Array<{
      original: string;
      large: string;
      medium: string;
      thumb: string;
    }> = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        continue; // Skip files that are too large
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process image with professional handler (4 sizes + WebP conversion)
      const processed = await imageProcessor.processImage(buffer, file.name, {
        brandSlug: brandSlug || undefined,
        productSku: productSku || undefined,
        convertToWebp: true,
      });

      // Return thumbnail URL for backward compatibility (used in product.images array)
      uploadedUrls.push(processed.thumbUrl);

      // Also return all sizes for new implementations
      allSizes.push({
        original: processed.originalUrl,
        large: processed.largeUrl,
        medium: processed.mediumUrl,
        thumb: processed.thumbUrl,
      });
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded. Allowed types: JPEG, PNG, GIF, WebP. Max size: 10MB' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      urls: uploadedUrls,
      images: allSizes, // New: all sizes for each image
      message: `${uploadedUrls.length} image(s) processed with 4 sizes each`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
