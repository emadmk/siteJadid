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
  const data: any = {};
  if (body.minSubtotal !== undefined) data.minSubtotal = parseFloat(String(body.minSubtotal)) || 0;
  if (body.maxSubtotal !== undefined) {
    data.maxSubtotal =
      body.maxSubtotal === null || body.maxSubtotal === ''
        ? null
        : parseFloat(String(body.maxSubtotal)) || null;
  }
  if (body.type !== undefined) data.type = body.type === 'percent' ? 'percent' : 'fixed';
  if (body.value !== undefined) data.value = parseFloat(String(body.value)) || 0;
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (body.displayOrder !== undefined) data.displayOrder = parseInt(String(body.displayOrder), 10) || 0;
  return data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const updated = await db.handlingTier.update({ where: { id: params.id }, data: sanitize(body) });
    return NextResponse.json({ tier: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await db.handlingTier.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
