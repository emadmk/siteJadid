import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Helper function to ensure unique slug
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data } = await request.json();

    if (type === 'products') {
      const results: Array<{ success: boolean; sku: string; id?: string; error?: string }> = [];
      for (const item of data) {
        try {
          const baseSlug = generateSlug(item.name || item.sku);
          const slug = await getUniqueSlug(baseSlug);

          const product = await db.product.create({
            data: {
              sku: item.sku,
              name: item.name,
              slug,
              description: item.description || null,
              basePrice: parseFloat(item.basePrice),
              stockQuantity: parseInt(item.stockQuantity) || 0,
              categoryId: item.categoryId || null,
            },
          });
          results.push({ success: true, sku: item.sku, id: product.id });
        } catch (error) {
          results.push({ success: false, sku: item.sku, error: 'Failed to import' });
        }
      }
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
