'use client';

import { useState, useCallback } from 'react';
import { Save, Loader2, CheckCircle, MessageSquare } from 'lucide-react';

interface AdminNotesEditorProps {
  orderId: string;
  initialNotes: string | null;
  customerNotes: string | null;
}

export function AdminNotesEditor({ orderId, initialNotes, customerNotes }: AdminNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveNotes = useCallback(async (value: string) => {
    setStatus('saving');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: value }),
      });
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [orderId]);

  return (
    <div>
      <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Notes
      </h2>

      {/* Customer Notes (read-only) */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-1">Customer Notes</div>
        {customerNotes ? (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {customerNotes}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">No notes from customer</div>
        )}
      </div>

      {/* Admin Notes (editable) */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-1">Admin Notes</div>
        <textarea
          className="w-full border border-gray-300 rounded p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          rows={3}
          placeholder="Add internal notes about this order..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (initialNotes ?? '')) {
              saveNotes(notes);
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">
            {status === 'saving' && (
              <span className="flex items-center gap-1 text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
            {status === 'saved' && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" /> Saved
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-500">Failed to save. Try again.</span>
            )}
            {status === 'idle' && 'Auto-saves on blur'}
          </div>
          <button
            type="button"
            onClick={() => saveNotes(notes)}
            disabled={status === 'saving'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
