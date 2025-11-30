import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderUpdates, promotions, newsletter } = await request.json();

    await db.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications: promotions ?? false,
        smsNotifications: orderUpdates ?? true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
