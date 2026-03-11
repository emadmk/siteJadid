'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, X } from 'lucide-react';

export function ImpersonationBanner() {
  const router = useRouter();
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    // Check cookie for impersonation
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const userName = getCookie('impersonate_user_name');
    setImpersonating(userName);
  }, []);

  if (!impersonating) return null;

  const handleStopImpersonation = async () => {
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    router.push('/admin/users');
    router.refresh();
    setImpersonating(null);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg">
      <Eye className="w-4 h-4" />
      <span className="text-sm font-medium">
        Viewing as: <strong>{impersonating}</strong> (Impersonation Mode)
      </span>
      <button
        onClick={handleStopImpersonation}
        className="ml-4 bg-white text-orange-600 px-3 py-1 rounded text-sm font-medium hover:bg-orange-50 flex items-center gap-1"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  );
}
