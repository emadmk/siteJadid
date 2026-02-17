export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { validatePassword } from '@/lib/password-policy';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimit(`reset:${ip}`, 5, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0] },
        { status: 400 }
      );
    }

    // Find the reset token
    const record = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!record || !record.identifier.startsWith('reset:')) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const email = record.identifier.replace('reset:', '');

    // Update user password
    const hashedPassword = await bcrypt.hash(password, 12);
    const updateResult = await db.user.updateMany({
      where: { email },
      data: { password: hashedPassword },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Delete used token
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
