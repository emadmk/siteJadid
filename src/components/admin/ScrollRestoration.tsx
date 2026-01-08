'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function ScrollRestoration() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a scroll parameter in URL
    const scrollParam = searchParams.get('scroll');
    if (scrollParam) {
      const scrollY = parseInt(scrollParam);
      if (!isNaN(scrollY)) {
        // Use setTimeout to ensure the page is fully rendered
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 100);
      }

      // Clean up URL by removing scroll parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('scroll');
      window.history.replaceState({}, '', url.toString());
    }

    // Also restore from sessionStorage if coming back
    const savedScroll = sessionStorage.getItem('productsScrollPosition');
    if (savedScroll && !scrollParam) {
      const scrollY = parseInt(savedScroll);
      if (!isNaN(scrollY)) {
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 100);
      }
      // Clear after restoring
      sessionStorage.removeItem('productsScrollPosition');
    }
  }, [searchParams]);

  return null;
}
