export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { createVerificationToken, sendVerificationEmail } from '@/lib/email-verification';

// POST /api/auth/resend-verification
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimit(`resend-verify:${ip}`, 3, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    // Don't reveal if user exists or not
    if (!user || user.emailVerified) {
      return NextResponse.json({
        message: 'If an account with that email exists and is not yet verified, a verification email has been sent.',
      });
    }

    const token = await createVerificationToken(email);
    await sendVerificationEmail(email, token, user.name || undefined, request.url);

    return NextResponse.json({
      message: 'If an account with that email exists and is not yet verified, a verification email has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
