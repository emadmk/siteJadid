'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to track order');
      }

      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order details to track your shipment</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
              <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-md" placeholder="ORD-12345" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-md" placeholder="you@example.com" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>
        </div>

        {order && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Order {order.orderNumber}</h2>
            <p className="text-gray-600 mb-2">Status: <span className="font-semibold">{order.status}</span></p>
            {order.trackingNumber && (
              <p className="text-gray-600 mb-4">Tracking: <span className="font-mono">{order.trackingNumber}</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
