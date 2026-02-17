export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/redis-settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let settings = await prisma.redisCacheSettings.findFirst();

    if (settings && settings.password) {
      settings = { ...settings, password: '****' + settings.password.slice(-4) };
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching Redis settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Redis settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/redis-settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    const settings = await prisma.redisCacheSettings.upsert({
      where: { id: data.id || 'default' },
      update: {
        host: data.host || 'localhost',
        port: data.port || 6379,
        password: data.password,
        database: data.database || 0,
        useTls: data.useTls ?? false,
        useSentinel: data.useSentinel ?? false,
        sentinelHosts: data.sentinelHosts || [],
        sentinelMaster: data.sentinelMaster,
        useCluster: data.useCluster ?? false,
        clusterNodes: data.clusterNodes || [],
        defaultTTL: data.defaultTTL || 3600,
        keyPrefix: data.keyPrefix || 'app:',
        maxRetries: data.maxRetries || 3,
        enableOfflineQueue: data.enableOfflineQueue ?? true,
        isActive: data.isActive ?? true,
        updatedBy: session.user.id,
      },
      create: {
        id: 'default',
        host: data.host || 'localhost',
        port: data.port || 6379,
        password: data.password,
        database: data.database || 0,
        useTls: data.useTls ?? false,
        useSentinel: data.useSentinel ?? false,
        sentinelHosts: data.sentinelHosts || [],
        sentinelMaster: data.sentinelMaster,
        useCluster: data.useCluster ?? false,
        clusterNodes: data.clusterNodes || [],
        defaultTTL: data.defaultTTL || 3600,
        keyPrefix: data.keyPrefix || 'app:',
        maxRetries: data.maxRetries || 3,
        enableOfflineQueue: data.enableOfflineQueue ?? true,
        isActive: data.isActive ?? true,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error saving Redis settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Redis settings' },
      { status: 500 }
    );
  }
}
