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

    const webhooks = await db.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, events, isActive } = await request.json();

    const webhook = await db.webhook.create({
      data: {
        url,
        events,
        isActive: isActive !== false,
        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
