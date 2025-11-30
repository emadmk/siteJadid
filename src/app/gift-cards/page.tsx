'use client';

import { useState } from 'react';

export default function GiftCardsPage() {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setResult(null);

    try {
      const response = await fetch('/api/gift-cards/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check gift card' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Gift Card Balance</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={checkBalance} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Gift Card Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-2 border rounded-lg"
              maxLength={19}
              required
            />
          </div>

          <button
            type="submit"
            disabled={checking}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {checking ? 'Checking...' : 'Check Balance'}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 rounded-lg" style={{
            backgroundColor: result.valid ? '#d1fae5' : '#fee2e2',
            color: result.valid ? '#065f46' : '#991b1b'
          }}>
            {result.valid ? (
              <div>
                <h3 className="font-semibold mb-2">Gift Card Details</h3>
                <p>Code: {result.code}</p>
                <p className="text-lg font-bold mt-2">
                  Current Balance: ${Number(result.balance).toFixed(2)}
                </p>
                <p className="text-sm mt-1">
                  Initial Amount: ${Number(result.initialAmount).toFixed(2)}
                </p>
                {result.expiresAt && (
                  <p className="text-sm mt-1">
                    Expires: {new Date(result.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {result.minPurchase && (
                  <p className="text-sm mt-1">
                    Minimum Purchase: ${Number(result.minPurchase).toFixed(2)}
                  </p>
                )}
              </div>
            ) : (
              <p>{result.error || 'Gift card not found or invalid'}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How to Use Your Gift Card</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Add items to your cart</li>
          <li>Proceed to checkout</li>
          <li>Enter your gift card code at checkout</li>
          <li>The gift card balance will be applied to your order</li>
          <li>Pay any remaining balance with another payment method if needed</li>
        </ol>
      </div>
    </div>
  );
}
