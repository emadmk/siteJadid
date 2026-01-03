import { HeroSection } from '@/components/storefront/home/HeroSection';
import { BenefitsSection } from '@/components/storefront/home/BenefitsSection';
import { ProudlySupplyBanner } from '@/components/storefront/home/ProudlySupplyBanner';
import { BrandsSection } from '@/components/storefront/home/BrandsSection';
import { PromoSection } from '@/components/storefront/home/PromoSection';
import { RecentlyViewedSection } from '@/components/storefront/home/RecentlyViewedSection';

// Disable caching - always fetch fresh data
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <BenefitsSection />
      <ProudlySupplyBanner />
      <BrandsSection />
      <PromoSection />
      <RecentlyViewedSection />
    </div>
  );
}
