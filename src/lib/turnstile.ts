/**
 * Server-side Cloudflare Turnstile token verification
 */
export async function verifyTurnstileToken(token: string | undefined | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If no secret key configured, skip verification (development mode)
  if (!secretKey) return true;

  // If no token provided but secret key exists, reject
  if (!token) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[TURNSTILE] Verification failed:', error);
    return false;
  }
}
