import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { StealthVault } from "@/components/chat/StealthVault";
import { PrivacyBanner } from "@/components/transparency/PrivacyBadge";
const StealthVaultPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <PrivacyBanner dataLocation="encrypted-server" featureName="Stealth Vault" />
        <StealthVault isOpen={true} onClose={() => window.history.back()} />
      </div>
      <Footer />
    </div>
  );
};

export default StealthVaultPage;
