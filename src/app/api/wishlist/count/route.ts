import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/wishlist/count - Get count of items in wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Return 0 if not logged in (don't error out)
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    // Get wishlist count
    const wishlist = await db.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    const count = wishlist?._count?.items ?? 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching wishlist count:', error);
    return NextResponse.json({ count: 0 });
  }
}
