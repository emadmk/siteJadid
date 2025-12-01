import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from '@/lib/services/image-processor';

// POST - Upload images for a product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const productId = formData.get('productId') as string;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get product with brand info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const uploadedImages: unknown[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        continue;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        continue;
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process image with professional handler
      const processed = await imageProcessor.processImage(buffer, file.name, {
        brandSlug: product.brand?.slug,
        productSku: product.sku,
        convertToWebp: true,
      });

      // Get current max position
      const maxPosition = await prisma.productImage.aggregate({
        where: { productId },
        _max: { position: true },
      });

      // Save to database
      const savedImage = await prisma.productImage.create({
        data: {
          productId,
          originalUrl: processed.originalUrl,
          largeUrl: processed.largeUrl,
          mediumUrl: processed.mediumUrl,
          thumbUrl: processed.thumbUrl,
          originalName: file.name,
          fileSize: processed.fileSize,
          mimeType: 'image/webp',
          width: processed.width,
          height: processed.height,
          hash: processed.hash,
          storagePath: processed.storagePath,
          position: (maxPosition._max.position || 0) + i + 1,
          isPrimary: i === 0 && !(await prisma.productImage.findFirst({
            where: { productId, isPrimary: true },
          })),
        },
      });

      uploadedImages.push(savedImage);
    }

    // Update legacy images array on product
    const allImages = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        images: allImages.map((img) => img.thumbUrl),
      },
    });

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      message: `${uploadedImages.length} images uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}

// GET - Get images for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete files from storage
    if (image.storagePath && image.hash) {
      await imageProcessor.deleteImage(image.storagePath, image.hash);
    }

    // Delete from database
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // Update legacy images array
    const remainingImages = await prisma.productImage.findMany({
      where: { productId: image.productId },
      orderBy: { position: 'asc' },
    });

    await prisma.product.update({
      where: { id: image.productId },
      data: {
        images: remainingImages.map((img) => img.thumbUrl),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

// PATCH - Update image (reorder, set primary, update alt text)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageId, position, isPrimary, altText, title } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: image.productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Update image
    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        ...(position !== undefined && { position }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(altText !== undefined && { altText }),
        ...(title !== undefined && { title }),
      },
    });

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
