'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function SignOutPage() {
  useEffect(() => {
    // Automatically sign out and redirect to home using current origin
    const baseUrl = window.location.origin;
    signOut({ callbackUrl: baseUrl });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-safety-green-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Signing out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}
