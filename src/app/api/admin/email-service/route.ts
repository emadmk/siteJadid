import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/admin/email-service
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.emailServiceSettings.findFirst({
      where: { isDefault: true },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching email service settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email service settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    const settings = await prisma.emailServiceSettings.create({
      data: {
        provider: data.provider,
        apiKey: data.apiKey,
        domain: data.domain,
        region: data.region,
        defaultFromEmail: data.defaultFromEmail,
        defaultFromName: data.defaultFromName,
        trackOpens: data.trackOpens ?? true,
        trackClicks: data.trackClicks ?? true,
        dailyLimit: data.dailyLimit,
        monthlyLimit: data.monthlyLimit,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? true,
        testMode: data.testMode ?? true,
        testEmail: data.testEmail,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error creating email service settings:', error);
    return NextResponse.json(
      { error: 'Failed to create email service settings', details: error.message },
      { status: 500 }
    );
  }
}
