import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credit = await prisma.customerCredit.findUnique({
      where: { userId: params.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
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

    if (!credit) {
      return NextResponse.json(
        { error: 'Customer credit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(credit);
  } catch (error) {
    console.error('Error fetching customer credit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer credit' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      creditLimit,
      paymentTerms,
      status,
      creditScore,
    } = body;

    if (creditLimit === undefined || creditLimit < 0) {
      return NextResponse.json(
        { error: 'Valid credit limit is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingCredit = await prisma.customerCredit.findUnique({
      where: { userId: params.id },
    });

    if (existingCredit) {
      return NextResponse.json(
        { error: 'Customer credit already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    const credit = await prisma.customerCredit.create({
      data: {
        userId: params.id,
        creditLimit,
        availableCredit: creditLimit,
        usedCredit: 0,
        paymentTerms: paymentTerms || 30,
        status: status || 'ACTIVE',
        creditScore,
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

    return NextResponse.json(credit, { status: 201 });
  } catch (error) {
    console.error('Error creating customer credit:', error);
    return NextResponse.json(
      { error: 'Failed to create customer credit' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      creditLimit,
      paymentTerms,
      status,
      creditScore,
    } = body;

    const existingCredit = await prisma.customerCredit.findUnique({
      where: { userId: params.id },
    });

    if (!existingCredit) {
      return NextResponse.json(
        { error: 'Customer credit not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (creditLimit !== undefined) {
      updateData.creditLimit = creditLimit;
      const creditDiff = creditLimit - Number(existingCredit.creditLimit);
      updateData.availableCredit = Number(existingCredit.availableCredit) + creditDiff;
    }

    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (status !== undefined) updateData.status = status;
    if (creditScore !== undefined) updateData.creditScore = creditScore;

    const credit = await prisma.customerCredit.update({
      where: { userId: params.id },
      data: updateData,
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

    return NextResponse.json(credit);
  } catch (error) {
    console.error('Error updating customer credit:', error);
    return NextResponse.json(
      { error: 'Failed to update customer credit' },
      { status: 500 }
    );
  }
}
