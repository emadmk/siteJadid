import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH /api/reviews/[reviewId] - Update a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = params;
    const body = await request.json();
    const { rating, title, comment, images } = body;

    // Check if review exists and belongs to user
    const review = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (rating !== undefined) {
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
      }
    }

    // Update the review
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined && { rating: parseInt(rating) }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
        ...(images !== undefined && { images }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating average
    const reviewStats = await db.review.aggregate({
      where: { productId: review.productId },
      _avg: {
        rating: true,
      },
    });

    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: reviewStats._avg.rating || 0,
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[reviewId] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = params;

    // Check if review exists and belongs to user
    const review = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (review.userId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the review
    await db.review.delete({
      where: { id: reviewId },
    });

    // Update product rating average
    const reviewStats = await db.review.aggregate({
      where: { productId: review.productId },
      _avg: {
        rating: true,
      },
    });

    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: reviewStats._avg.rating || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
