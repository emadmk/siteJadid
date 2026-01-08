'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthModal } from '@/contexts/AuthModalContext';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useAuthModal();

  useEffect(() => {
    const type = searchParams.get('type');
    // Redirect to home and open register modal with B2B type if specified
    router.replace('/');
    setTimeout(() => openModal('register', type === 'b2b' ? 'b2b' : undefined), 100);
  }, [router, openModal, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
