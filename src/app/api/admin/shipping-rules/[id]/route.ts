export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_MODES = ['FREE', 'FIXED', 'PERCENT', 'SHIPPO'] as const;

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user || !['ADMIN', 'SUPER_ADMIN'].includes(s.user.role)) return null;
  return s.user;
}

function sanitize(body: any) {
  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.priority !== undefined) data.priority = parseInt(String(body.priority), 10) || 0;
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (Array.isArray(body.supplierIds)) data.supplierIds = body.supplierIds.filter((x: any) => typeof x === 'string');
  if (Array.isArray(body.warehouseIds)) data.warehouseIds = body.warehouseIds.filter((x: any) => typeof x === 'string');

  if (body.mode !== undefined) {
    if (!VALID_MODES.includes(body.mode)) throw new Error('Invalid mode');
    data.mode = body.mode;
    // Reset price fields per mode so stale values from another mode don't leak.
    data.flatAmount = null;
    data.percentValue = null;
    data.shippoMarkupType = null;
    data.shippoMarkupValue = null;
    if (body.mode === 'FIXED') data.flatAmount = parseFloat(String(body.flatAmount ?? 0)) || 0;
    if (body.mode === 'PERCENT') data.percentValue = parseFloat(String(body.percentValue ?? 0)) || 0;
    if (body.mode === 'SHIPPO' && body.shippoMarkupType) {
      const t = String(body.shippoMarkupType);
      if (t === 'fixed' || t === 'percent') {
        data.shippoMarkupType = t;
        data.shippoMarkupValue = parseFloat(String(body.shippoMarkupValue ?? 0)) || 0;
      }
    }
  }
  return data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const data = sanitize(body);
    const updated = await db.shippingRule.update({ where: { id: params.id }, data });
    return NextResponse.json({ rule: updated });
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
    await db.shippingRule.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
