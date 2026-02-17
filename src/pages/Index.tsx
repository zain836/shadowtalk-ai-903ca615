import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import CompetitiveComparison from "@/components/CompetitiveComparison";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CommunitySection from "@/components/CommunitySection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import CouponBanner from "@/components/CouponBanner";
import PWABanner from "@/components/PWABanner";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";

const Index = () => {
  return (
    <>
      <SEOHead meta={PAGE_SEO.home} />
      <div className="min-h-screen bg-background">
      <CouponBanner />
      <Navigation />
      <HeroSection />
      <CompetitiveComparison />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CommunitySection />
      <FAQSection />
      <Footer />
      <PWABanner />
      </div>
    </>
  );
};

export default Index;
