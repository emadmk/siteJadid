'use client';

import { HeroSection } from './HeroSection';
import { BenefitsSection } from './BenefitsSection';
import { ProudlySupplyBanner } from './ProudlySupplyBanner';
import { BrandsSection } from './BrandsSection';
import { PromoSection } from './PromoSection';
import { RecentlyViewedSection } from './RecentlyViewedSection';

export function HomePageClient() {
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
