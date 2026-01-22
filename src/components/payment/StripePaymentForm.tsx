'use client';

import { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  CardElement,
  LinkAuthenticationElement,
} from '@stripe/react-stripe-js';
import { StripePaymentElementChangeEvent, StripeCardElementChangeEvent } from '@stripe/stripe-js';
import { Loader2, CreditCard, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  showSaveCard?: boolean;
  defaultEmail?: string;
  returnUrl?: string;
  mode?: 'payment' | 'card-only';
}

export function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  onCancel,
  submitLabel = 'Pay Now',
  showSaveCard = false,
  defaultEmail,
  returnUrl,
  mode = 'payment',
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);
  const [email, setEmail] = useState(defaultEmail || '');

  // Handle form ready state
  const handleReady = () => {
    setIsReady(true);
  };

  // Handle payment element changes
  const handleChange = (event: StripePaymentElementChangeEvent | StripeCardElementChangeEvent) => {
    // Check for error - CardElement has error, PaymentElement doesn't have the same structure
    if ('error' in event && event.error) {
      setError(event.error.message || 'Payment error');
    } else {
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system not ready. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/checkout/complete`,
          receipt_email: email || undefined,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        // Payment failed
        const errorMessage = result.error.message || 'Payment failed. Please try again.';
        setError(errorMessage);
        onError(errorMessage);
      } else if (result.paymentIntent) {
        // Payment succeeded without redirect
        if (result.paymentIntent.status === 'succeeded') {
          onSuccess(result.paymentIntent);
        } else if (result.paymentIntent.status === 'processing') {
          // Payment is processing
          onSuccess(result.paymentIntent);
        } else if (result.paymentIntent.status === 'requires_capture') {
          // Payment authorized but not captured
          onSuccess(result.paymentIntent);
        } else {
          setError(`Payment status: ${result.paymentIntent.status}`);
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email for receipts */}
      {!defaultEmail && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email for receipt
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Payment Element */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Details
        </label>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {mode === 'payment' ? (
            <PaymentElement
              onReady={handleReady}
              onChange={handleChange}
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                fields: {
                  billingDetails: {
                    address: {
                      country: 'auto',
                    },
                  },
                },
              }}
            />
          ) : (
            <CardElement
              onReady={handleReady}
              onChange={handleChange}
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                  invalid: {
                    color: '#dc2626',
                  },
                },
                hidePostalCode: false,
              }}
            />
          )}
        </div>
      </div>

      {/* Save card option */}
      {showSaveCard && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="w-4 h-4 text-safety-green-600 rounded border-gray-300 focus:ring-safety-green-500"
          />
          <span className="text-sm text-gray-700">
            Save card for future purchases
          </span>
        </label>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-safety-green-600" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="w-4 h-4 text-safety-green-600" />
          <span>PCI DSS Compliant</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CreditCard className="w-4 h-4 text-safety-green-600" />
          <span>Secure Payment</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing || !isReady}
          className={`flex-1 bg-safety-green-600 hover:bg-safety-green-700 text-white font-semibold py-3 ${
            onCancel ? '' : 'w-full'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              {submitLabel} ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      {/* Test mode indicator */}
      {clientSecret?.includes('_test_') && (
        <div className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg py-2">
          Test Mode - Use card 4242 4242 4242 4242, any future date, any CVC
        </div>
      )}
    </form>
  );
}

/**
 * Simple card input component using CardElement
 */
interface SimpleCardInputProps {
  onComplete: (complete: boolean) => void;
  onError: (error: string | null) => void;
}

export function SimpleCardInput({ onComplete, onError }: SimpleCardInputProps) {
  const handleChange = (event: StripeCardElementChangeEvent) => {
    if (event.error) {
      onError(event.error.message);
      onComplete(false);
    } else {
      onError(null);
      onComplete(event.complete);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <CardElement
        onChange={handleChange}
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#1f2937',
              fontFamily: 'Inter, system-ui, sans-serif',
              '::placeholder': {
                color: '#9ca3af',
              },
            },
            invalid: {
              color: '#dc2626',
              iconColor: '#dc2626',
            },
          },
          hidePostalCode: false,
        }}
      />
    </div>
  );
}

/**
 * Card input with manual confirmation
 */
interface CardInputWithConfirmProps {
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  submitLabel?: string;
  disabled?: boolean;
}

export function CardInputWithConfirm({
  clientSecret,
  onSuccess,
  onError,
  submitLabel = 'Confirm Payment',
  disabled = false,
}: CardInputWithConfirmProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      onError('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card input not found');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        const errorMessage = result.error.message || 'Payment failed';
        setError(errorMessage);
        onError(errorMessage);
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent);
      } else {
        onError(`Payment status: ${result.paymentIntent?.status}`);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment error';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <SimpleCardInput
        onComplete={setIsComplete}
        onError={setError}
      />

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={disabled || !isComplete || isProcessing || !stripe}
        className="w-full bg-safety-green-600 hover:bg-safety-green-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
