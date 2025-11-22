'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');

  const handleUpdate = async () => {
    if (status === currentStatus) {
      setError('Please select a different status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      router.refresh();
      setNotes('');
      setError('Status updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className={`p-3 rounded text-sm ${
          error.includes('successfully')
            ? 'bg-safety-green-50 text-safety-green-800 border border-safety-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
        >
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add notes about this status change..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
        />
      </div>

      <Button
        onClick={handleUpdate}
        disabled={loading}
        className="w-full bg-safety-green-600 hover:bg-safety-green-700"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Order Status'
        )}
      </Button>
    </div>
  );
}
