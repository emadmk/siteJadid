'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

export function Turnstile({ onVerify, onExpire, onError, theme = 'light', size = 'normal', className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      size,
      callback: (token: string) => onVerify(token),
      'expired-callback': () => onExpire?.(),
      'error-callback': () => onError?.(),
    });
  }, [siteKey, theme, size, onVerify, onExpire, onError]);

  useEffect(() => {
    if (!siteKey) return;

    // Check if script already loaded
    if (window.turnstile) {
      setLoaded(true);
      renderWidget();
      return;
    }

    // Check if script tag already exists
    const existing = document.querySelector('script[src*="turnstile"]');
    if (existing) {
      window.onTurnstileLoad = () => {
        setLoaded(true);
        renderWidget();
      };
      return;
    }

    // Load Turnstile script
    window.onTurnstileLoad = () => {
      setLoaded(true);
      renderWidget();
    };

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget]);

  useEffect(() => {
    if (loaded) renderWidget();
  }, [loaded, renderWidget]);

  if (!siteKey) {
    // No site key configured - skip captcha silently
    return null;
  }

  return <div ref={containerRef} className={className} />;
}

/**
 * Server-side Turnstile token verification
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // No secret key configured - skip verification
    return true;
  }

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
    console.error('[TURNSTILE] Verification error:', error);
    return false;
  }
}
