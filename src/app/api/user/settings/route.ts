import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    return NextResponse.json({
      phone: user?.phone || '',
      notifications: {
        orderUpdates: true,
        promotions: user?.emailNotifications ?? false,
        newsletter: true,
      },
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
