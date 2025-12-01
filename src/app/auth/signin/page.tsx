'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/contexts/AuthModalContext';

export default function SignInPage() {
  const router = useRouter();
  const { openModal } = useAuthModal();

  useEffect(() => {
    // Redirect to home and open login modal
    router.replace('/');
    setTimeout(() => openModal('login'), 100);
  }, [router, openModal]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
