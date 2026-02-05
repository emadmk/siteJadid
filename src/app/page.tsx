import { HomePageClient } from '@/components/storefront/home/HomePageClient';

// Disable caching - always fetch fresh data
export const revalidate = 0;

export default function HomePage() {
  return <HomePageClient />;
}
