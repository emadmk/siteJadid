import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;

    // Get all approved questions for the product
    const questions = await prisma.productQuestion.findMany({
      where: {
        productId,
        status: 'APPROVED',
        isPublic: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { productId } = params;
    const body = await request.json();
    const { question, askerName, askerEmail } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // For guest users, require name and email
    if (!session?.user?.id) {
      if (!askerName || !askerEmail) {
        return NextResponse.json(
          { error: 'Name and email are required for guest questions' },
          { status: 400 }
        );
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(askerEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Create the question
    const newQuestion = await prisma.productQuestion.create({
      data: {
        productId,
        userId: session?.user?.id || null,
        question: question.trim(),
        askerName: askerName || session?.user?.name || null,
        askerEmail: askerEmail || session?.user?.email || null,
        status: 'PENDING', // Questions need approval before showing
      },
    });

    return NextResponse.json({
      message: 'Question submitted successfully. It will appear after approval.',
      question: {
        id: newQuestion.id,
        question: newQuestion.question,
        status: newQuestion.status,
      },
    });

  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    );
  }
}
