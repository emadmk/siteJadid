'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-P869KQB8K6';

// Declare gtag on window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsTracker />
      </Suspense>
    </>
  );
}

// Helper functions for e-commerce event tracking
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export function trackViewItem(item: {
  id: string;
  name: string;
  category?: string;
  price?: number;
  brand?: string;
}) {
  trackEvent('view_item', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
    }],
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  category?: string;
  price?: number;
  quantity?: number;
}) {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: (item.price || 0) * (item.quantity || 1),
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity || 1,
    }],
  });
}

export function trackPurchase(transaction: {
  id: string;
  revenue: number;
  tax?: number;
  shipping?: number;
  items: Array<{
    id: string;
    name: string;
    category?: string;
    price?: number;
    quantity?: number;
  }>;
}) {
  trackEvent('purchase', {
    transaction_id: transaction.id,
    value: transaction.revenue,
    tax: transaction.tax,
    shipping: transaction.shipping,
    currency: 'USD',
    items: transaction.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
}
