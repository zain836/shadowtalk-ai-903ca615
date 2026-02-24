import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BusinessMemoryExplorer from "@/components/chat/BusinessMemoryExplorer";
import { PrivacyBanner } from "@/components/transparency/PrivacyBadge";
const BusinessMemoryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <PrivacyBanner dataLocation="encrypted-server" featureName="Business Memory" />
        <div className="h-[calc(100vh-10rem)]">
          <BusinessMemoryExplorer />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessMemoryPage;
