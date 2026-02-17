export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Notification preferences are stored client-side for now
    // In a full implementation, these would be stored in a separate table
    const { orderUpdates, promotions, newsletter } = await request.json();

    // Accept the preferences (no-op since User model doesn't have these fields)
    return NextResponse.json({
      success: true,
      preferences: { orderUpdates, promotions, newsletter }
    });
  } catch (error: any) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
