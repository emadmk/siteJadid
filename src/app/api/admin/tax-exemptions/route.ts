export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const exemptions = await prisma.taxExemption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
      },
    });

    return NextResponse.json(exemptions);
  } catch (error) {
    console.error('Error fetching tax exemptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax exemptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      userId,
      certificateNumber,
      exemptionType,
      states,
      issueDate,
      expiryDate,
      certificateUrl,
    } = body;

    if (!userId || !certificateNumber || !exemptionType || !issueDate) {
      return NextResponse.json(
        { error: 'User, certificate number, exemption type, and issue date are required' },
        { status: 400 }
      );
    }

    const exemption = await prisma.taxExemption.create({
      data: {
        userId,
        certificateNumber,
        exemptionType,
        states: states || [],
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateUrl,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
      },
    });

    return NextResponse.json(exemption, { status: 201 });
  } catch (error) {
    console.error('Error creating tax exemption:', error);
    return NextResponse.json(
      { error: 'Failed to create tax exemption' },
      { status: 500 }
    );
  }
}
