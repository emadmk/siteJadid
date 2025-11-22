'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, X, RefreshCw } from 'lucide-react';

interface GSAApprovalActionsProps {
  userId: string;
  userName: string;
}

export function GSAApprovalActions({ userId, userName }: GSAApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const handleApproval = async (action: 'APPROVED' | 'REJECTED') => {
    if (!notes.trim() && showNotesInput) {
      setError('Please provide notes for this decision');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/customers/${userId}/gsa-approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          notes: notes.trim() || `GSA request ${action.toLowerCase()}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update approval status');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {showNotesInput ? (
        <>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this decision (optional)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleApproval('APPROVED')}
              disabled={loading}
              className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
            <Button
              onClick={() => handleApproval('REJECTED')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
          </div>
          <Button
            onClick={() => {
              setShowNotesInput(false);
              setNotes('');
              setError('');
            }}
            variant="outline"
            className="w-full border-gray-300"
            disabled={loading}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={() => handleApproval('APPROVED')}
            disabled={loading}
            className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Approve
          </Button>
          <Button
            onClick={() => handleApproval('REJECTED')}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            Reject
          </Button>
          <Button
            onClick={() => setShowNotesInput(true)}
            variant="outline"
            className="w-full border-gray-300"
            disabled={loading}
          >
            Add Notes
          </Button>
        </>
      )}
    </div>
  );
}
