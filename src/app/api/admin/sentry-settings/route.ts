import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/sentry-settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.sentrySettings.findFirst();

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching Sentry settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Sentry settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/sentry-settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    const settings = await prisma.sentrySettings.upsert({
      where: { id: data.id || 'default' },
      update: {
        dsn: data.dsn,
        organization: data.organization,
        project: data.project,
        authToken: data.authToken,
        enableTracing: data.enableTracing ?? true,
        tracesSampleRate: data.tracesSampleRate ?? 0.1,
        enableProfiling: data.enableProfiling ?? false,
        profilesSampleRate: data.profilesSampleRate ?? 0.1,
        environment: data.environment || 'production',
        release: data.release,
        ignoreErrors: data.ignoreErrors || [],
        captureConsole: data.captureConsole ?? false,
        captureUnhandledRejections: data.captureUnhandledRejections ?? true,
        isActive: data.isActive ?? true,
        updatedBy: session.user.id,
      },
      create: {
        id: 'default',
        dsn: data.dsn,
        organization: data.organization,
        project: data.project,
        authToken: data.authToken,
        enableTracing: data.enableTracing ?? true,
        tracesSampleRate: data.tracesSampleRate ?? 0.1,
        enableProfiling: data.enableProfiling ?? false,
        profilesSampleRate: data.profilesSampleRate ?? 0.1,
        environment: data.environment || 'production',
        release: data.release,
        ignoreErrors: data.ignoreErrors || [],
        captureConsole: data.captureConsole ?? false,
        captureUnhandledRejections: data.captureUnhandledRejections ?? true,
        isActive: data.isActive ?? true,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error saving Sentry settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Sentry settings', details: error.message },
      { status: 500 }
    );
  }
}
