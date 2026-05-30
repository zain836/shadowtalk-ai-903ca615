import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import BrandManifestoSection from "@/components/brand/BrandManifestoSection";
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
import LandingPageShell from "@/components/landing/LandingPageShell";
import LandingSectionReveal from "@/components/landing/LandingSectionReveal";

const Index = () => {
  return (
    <>
      <SEOHead meta={PAGE_SEO.home} />
      <LandingPageShell>
        <div className="min-h-screen bg-background text-foreground landing-page-content">
          <CouponBanner />
          <Navigation />
          <HeroSection />
          <LandingSectionReveal>
            <BrandManifestoSection />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <CompetitiveComparison />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <FeaturesSection />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <PricingSection />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <TestimonialsSection />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <CommunitySection />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <FAQSection />
          </LandingSectionReveal>
          <LandingSectionReveal>
            <Footer />
          </LandingSectionReveal>
          <PWABanner />
        </div>
      </LandingPageShell>
    </>
  );
};

export default Index;
