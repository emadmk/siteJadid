export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user || !['ADMIN', 'SUPER_ADMIN'].includes(s.user.role)) return null;
  return s.user;
}

function sanitize(body: any) {
  const type = body.type === 'percent' ? 'percent' : 'fixed';
  return {
    minSubtotal: parseFloat(String(body.minSubtotal ?? 0)) || 0,
    maxSubtotal:
      body.maxSubtotal === null || body.maxSubtotal === undefined || body.maxSubtotal === ''
        ? null
        : parseFloat(String(body.maxSubtotal)) || null,
    type,
    value: parseFloat(String(body.value ?? 0)) || 0,
    isActive: body.isActive !== false,
    displayOrder: parseInt(String(body.displayOrder ?? 0), 10) || 0,
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tiers = await db.handlingTier.findMany({
    orderBy: [{ displayOrder: 'asc' }, { minSubtotal: 'asc' }],
  });
  // Also surface the global "skip for government" toggle here so the admin
  // page can keep both in one settings object.
  const skip = await db.setting.findUnique({ where: { key: 'shipping.handlingSkipGovernment' } });
  return NextResponse.json({
    tiers,
    skipForGovernment: skip?.value === 'true',
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const created = await db.handlingTier.create({ data: sanitize(body) });
    return NextResponse.json({ tier: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Used to toggle "skip handling for government" without a tier-id.
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.skipForGovernment !== 'boolean') {
      return NextResponse.json({ error: 'skipForGovernment boolean required' }, { status: 400 });
    }
    await db.setting.upsert({
      where: { key: 'shipping.handlingSkipGovernment' },
      create: {
        key: 'shipping.handlingSkipGovernment',
        value: body.skipForGovernment ? 'true' : 'false',
        type: 'boolean',
        category: 'shipping',
      },
      update: { value: body.skipForGovernment ? 'true' : 'false' },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
