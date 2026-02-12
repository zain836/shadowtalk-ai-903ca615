import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CommunitySection from "@/components/CommunitySection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import CouponBanner from "@/components/CouponBanner";
import PWABanner from "@/components/PWABanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CouponBanner />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CommunitySection />
      <FAQSection />
      <Footer />
      <PWABanner />
    </div>
  );
};

export default Index;
