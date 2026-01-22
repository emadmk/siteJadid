'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

interface StripeContextType {
  stripe: Stripe | null;
  publishableKey: string | null;
  loading: boolean;
  error: string | null;
  testMode: boolean;
}

const StripeContext = createContext<StripeContextType>({
  stripe: null,
  publishableKey: null,
  loading: true,
  error: null,
  testMode: false,
});

export function useStripeContext() {
  return useContext(StripeContext);
}

interface StripeProviderProps {
  children: React.ReactNode;
  options?: {
    clientSecret?: string;
    appearance?: {
      theme?: 'stripe' | 'night' | 'flat';
      variables?: Record<string, string>;
    };
  };
}

export function StripeProvider({ children, options }: StripeProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    async function initStripe() {
      try {
        // Fetch Stripe publishable key from our API
        const response = await fetch('/api/payments/checkout');

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load payment configuration');
        }

        const config = await response.json();

        if (!config.publishableKey) {
          throw new Error('Payment system is not configured');
        }

        setPublishableKey(config.publishableKey);
        setTestMode(config.testMode || config.publishableKey.startsWith('pk_test_'));

        // Load Stripe
        const stripeInstance = await loadStripe(config.publishableKey);
        setStripe(stripeInstance);
        setStripePromise(Promise.resolve(stripeInstance));
      } catch (err: any) {
        console.error('Error initializing Stripe:', err);
        setError(err.message || 'Failed to initialize payment system');
      } finally {
        setLoading(false);
      }
    }

    initStripe();
  }, []);

  const contextValue: StripeContextType = {
    stripe,
    publishableKey,
    loading,
    error,
    testMode,
  };

  // Default appearance for Stripe Elements
  const appearance = options?.appearance || {
    theme: 'stripe',
    variables: {
      colorPrimary: '#16a34a', // safety-green-600
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const elementsOptions = {
    ...(options?.clientSecret && { clientSecret: options.clientSecret }),
    appearance,
    locale: 'en' as const,
  };

  if (loading) {
    return (
      <StripeContext.Provider value={contextValue}>
        {children}
      </StripeContext.Provider>
    );
  }

  if (error || !stripePromise) {
    return (
      <StripeContext.Provider value={contextValue}>
        {children}
      </StripeContext.Provider>
    );
  }

  return (
    <StripeContext.Provider value={contextValue}>
      <Elements stripe={stripePromise} options={elementsOptions}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
}

/**
 * Simple provider when you already have a client secret
 */
interface StripeElementsProviderProps {
  publishableKey: string;
  clientSecret?: string;
  children: React.ReactNode;
  appearance?: {
    theme?: 'stripe' | 'night' | 'flat';
    variables?: Record<string, string>;
  };
}

export function StripeElementsProvider({
  publishableKey,
  clientSecret,
  children,
  appearance,
}: StripeElementsProviderProps) {
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  const defaultAppearance = appearance || {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#16a34a',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    ...(clientSecret && { clientSecret }),
    appearance: defaultAppearance,
    locale: 'en' as const,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
