import Navigation from "@/components/Navigation";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <PricingSection />
      </div>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default PricingPage;
