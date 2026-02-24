'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DeleteOrderButtonProps {
  orderId: string;
  orderNumber: string;
}

export function DeleteOrderButton({ orderId, orderNumber }: DeleteOrderButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete order');
      }
    } catch {
      alert('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="destructive"
          className="text-xs"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            'Yes, Delete'
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-gray-300"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
      onClick={() => setShowConfirm(true)}
      title={`Delete order ${orderNumber}`}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
