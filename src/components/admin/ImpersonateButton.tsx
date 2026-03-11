'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImpersonateButtonProps {
  userId: string;
  userName: string;
}

export function ImpersonateButton({ userId, userName }: ImpersonateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!confirm(`You are about to view the site as "${userName}". You will see what this customer sees. Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to the storefront as this user
        router.push('/');
        router.refresh();
      } else {
        alert(data.error || 'Failed to impersonate user');
      }
    } catch (err) {
      alert('Failed to impersonate user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-black mb-3">View as Customer</h2>
      <p className="text-sm text-gray-600 mb-4">
        See the site from this customer&apos;s perspective. You will be able to view their dashboard, orders, and pricing.
      </p>
      <Button
        onClick={handleImpersonate}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Eye className="w-4 h-4 mr-2" />
        )}
        Login as {userName}
      </Button>
    </div>
  );
}
