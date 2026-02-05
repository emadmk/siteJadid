'use client';

import { useHomeStyle } from '@/contexts/HomeStyleContext';
import { HeroSection } from './HeroSection';
import { BenefitsSection } from './BenefitsSection';
import { ProudlySupplyBanner } from './ProudlySupplyBanner';
import { BrandsSection } from './BrandsSection';
import { PromoSection } from './PromoSection';
import { RecentlyViewedSection } from './RecentlyViewedSection';

export function HomePageClient() {
  const { homeStyle } = useHomeStyle();

  return (
    <div className="min-h-screen bg-white">
      <HeroSection homeStyle={homeStyle} />
      <BenefitsSection />
      {/* Hide ProudlySupplyBanner for Style 3 */}
      {homeStyle !== 3 && <ProudlySupplyBanner />}
      <BrandsSection />
      <PromoSection />
      <RecentlyViewedSection />
    </div>
  );
}
