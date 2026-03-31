'use client';

import { HeroSection } from './HeroSection';
import { BenefitsSection } from './BenefitsSection';
import { ProudlySupplyBanner } from './ProudlySupplyBanner';
import { BrandsSection } from './BrandsSection';
import { PromoSection } from './PromoSection';
import { RecentlyViewedSection } from './RecentlyViewedSection';
import { PhoneNotice } from '../PhoneNotice';

export function HomePageClient() {
  return (
    <div className="min-h-screen bg-white">
      <PhoneNotice />
      <HeroSection />
      <BenefitsSection />
      <ProudlySupplyBanner />
      <BrandsSection />
      <PromoSection />
      <RecentlyViewedSection />
    </div>
  );
}
