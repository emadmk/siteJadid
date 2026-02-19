export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ACCOUNTANT',
  'CUSTOMER_SERVICE',
  'WAREHOUSE_MANAGER',
  'MARKETING_MANAGER',
  'CONTENT_MANAGER',
] as const;

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional().nullable(),
  role: z.enum(STAFF_ROLES),
});

// GET - List all staff/admin users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    const where: any = {
      role: { in: STAFF_ROLES as unknown as string[] },
    };

    if (roleFilter) {
      where.role = roleFilter;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
      // Keep the role filter when searching
      if (roleFilter) {
        where.AND = [{ role: roleFilter }];
        delete where.role;
      } else {
        where.AND = [{ role: { in: STAFF_ROLES as unknown as string[] } }];
        delete where.role;
      }
    }

    const [users, counts] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          emailVerified: true,
        },
        orderBy: [
          { role: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      db.user.groupBy({
        by: ['role'],
        where: { role: { in: STAFF_ROLES as unknown as string[] } },
        _count: true,
      }),
    ]);

    const stats = {
      total: counts.reduce((sum, c) => sum + c._count, 0),
      byRole: Object.fromEntries(counts.map(c => [c.role, c._count])),
    };

    return NextResponse.json({ users, stats });
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create new staff user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admin can create staff accounts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createStaffSchema.parse(body);

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Only SUPER_ADMIN can create another SUPER_ADMIN
    if (data.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot create Super Admin accounts' },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        role: data.role,
        isActive: true,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating staff user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
