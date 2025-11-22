import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const cart = await db.cart.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    const count = cart?.items.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Cart count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
