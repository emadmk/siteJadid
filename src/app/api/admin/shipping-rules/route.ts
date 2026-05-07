export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }
  return session.user;
}

const VALID_MODES = ['FREE', 'FIXED', 'PERCENT', 'SHIPPO'] as const;

function sanitize(body: any) {
  const data: any = {
    name: String(body.name || '').trim(),
    description: body.description ? String(body.description).trim() : null,
    priority: parseInt(String(body.priority ?? 0), 10) || 0,
    isActive: body.isActive !== false,
    supplierIds: Array.isArray(body.supplierIds) ? body.supplierIds.filter((x: any) => typeof x === 'string') : [],
    warehouseIds: Array.isArray(body.warehouseIds) ? body.warehouseIds.filter((x: any) => typeof x === 'string') : [],
    mode: VALID_MODES.includes(body.mode) ? body.mode : 'SHIPPO',
    flatAmount: null,
    percentValue: null,
    shippoMarkupType: null,
    shippoMarkupValue: null,
  };
  if (data.mode === 'FIXED') data.flatAmount = parseFloat(String(body.flatAmount ?? 0)) || 0;
  if (data.mode === 'PERCENT') data.percentValue = parseFloat(String(body.percentValue ?? 0)) || 0;
  if (data.mode === 'SHIPPO' && body.shippoMarkupType) {
    const t = String(body.shippoMarkupType);
    if (t === 'fixed' || t === 'percent') {
      data.shippoMarkupType = t;
      data.shippoMarkupValue = parseFloat(String(body.shippoMarkupValue ?? 0)) || 0;
    }
  }
  return data;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rules = await db.shippingRule.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const data = sanitize(body);
    const created = await db.shippingRule.create({ data });
    return NextResponse.json({ rule: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
