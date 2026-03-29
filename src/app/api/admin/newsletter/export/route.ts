export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER'];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { subscribedAt: 'desc' },
      select: {
        email: true,
        subscribedAt: true,
        source: true,
      },
    });

    // Build CSV
    const header = 'Email,Subscribed Date,Source';
    const rows = subscribers.map((s) => {
      const date = new Date(s.subscribedAt).toISOString().split('T')[0];
      return `${s.email},${date},${s.source}`;
    });
    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[NEWSLETTER EXPORT] Error:', error);
    return NextResponse.json({ error: 'Failed to export subscribers' }, { status: 500 });
  }
}
