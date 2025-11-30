import { HeroSection } from '@/components/storefront/home/HeroSection';
import { CategoriesSection } from '@/components/storefront/home/CategoriesSection';
import { FeaturedProducts } from '@/components/storefront/home/FeaturedProducts';
import { BenefitsSection } from '@/components/storefront/home/BenefitsSection';
import { PromoSection } from '@/components/storefront/home/PromoSection';
import { RecentlyViewedSection } from '@/components/storefront/home/RecentlyViewedSection';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <BenefitsSection />
      <PromoSection />
      <RecentlyViewedSection />
    </div>
  );
}
