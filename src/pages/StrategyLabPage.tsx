import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { OfflineDisabledNotice } from "@/components/chat/OfflineDisabledNotice";

const StrategyLabPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <OfflineDisabledNotice
          title="Strategy Lab is being rebuilt"
          description="The offline strategy agent is paused while we ship a new offline mode. Your saved strategies remain safe — check back soon."
        />
      </div>
      <Footer />
    </div>
  );
};

export default StrategyLabPage;
