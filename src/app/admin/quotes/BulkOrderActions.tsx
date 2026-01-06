'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BulkOrderActionsProps {
  requestId: string;
  currentStatus: string;
}

export function BulkOrderActions({ requestId, currentStatus }: BulkOrderActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/quote-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setStatus(newStatus);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUpdating) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'PENDING' && (
        <>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => updateStatus('CONTACTED')}
          >
            <Phone className="w-3 h-3 mr-1" />
            Contacted
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-300 text-gray-700"
            onClick={() => updateStatus('CLOSED')}
          >
            Close
          </Button>
        </>
      )}
      {status === 'CONTACTED' && (
        <>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => updateStatus('CONVERTED')}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Converted
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-gray-300 text-gray-700"
            onClick={() => updateStatus('CLOSED')}
          >
            Close
          </Button>
        </>
      )}
      {(status === 'CONVERTED' || status === 'CLOSED') && (
        <span className="text-xs text-gray-500 italic">
          {status === 'CONVERTED' ? 'Order placed' : 'Closed'}
        </span>
      )}
    </div>
  );
}
