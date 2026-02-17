import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { buildPasswordResetEmailHtml, sendResetEmail } from '@/lib/password-reset';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimit(`forgot:${ip}`, 3, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Remove any existing reset tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    });

    // Store reset token
    await db.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token,
        expires,
      },
    });

    // Send reset email
    await sendResetEmail(normalizedEmail, token, user.name || undefined);

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
