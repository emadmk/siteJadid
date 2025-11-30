'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  Shield,
  Loader2
} from 'lucide-react';

export default function PaymentMethodsPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  // Payment methods would be fetched from API in production
  const paymentMethods: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Payment Methods</h1>
          <p className="text-gray-600">Manage your saved payment methods</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-safety-green-600 hover:bg-safety-green-700 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900">Your payment information is secure</h3>
          <p className="text-sm text-blue-700">
            All payment data is encrypted and processed securely. We never store your full card number.
          </p>
        </div>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">No payment methods saved</h2>
          <p className="text-gray-600 mb-6">
            Add a payment method for faster checkout
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-safety-green-600 hover:bg-safety-green-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Payment Method
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method: any) => (
            <div
              key={method.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-black">
                    •••• •••• •••• {method.last4}
                  </div>
                  <div className="text-sm text-gray-600">
                    Expires {method.expMonth}/{method.expYear}
                  </div>
                </div>
                {method.isDefault && (
                  <span className="bg-safety-green-100 text-safety-green-700 text-xs font-medium px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <Button variant="outline" size="sm">
                    Set Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-black mb-4">Add Payment Method</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="setDefault" className="rounded" />
                <label htmlFor="setDefault" className="text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-safety-green-600 hover:bg-safety-green-700">
                Add Card
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
