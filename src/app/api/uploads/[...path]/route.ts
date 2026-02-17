import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// MIME types for images
const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Construct the file path
    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');

    // Prevent directory traversal attacks
    const decodedPath = decodeURIComponent(filePath);
    if (decodedPath.includes('..') || decodedPath.includes('\0') || filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    const fullPath = path.join(process.cwd(), 'public', 'uploads', decodedPath);
    // Verify resolved path is within uploads directory
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file extension and MIME type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Only allow image files
    if (!mimeTypes[ext]) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 403 });
    }

    // Read and return the file
    const fileBuffer = await readFile(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
