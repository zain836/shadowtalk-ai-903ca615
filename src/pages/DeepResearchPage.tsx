import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { OfflineDisabledNotice } from "@/components/chat/OfflineDisabledNotice";

const DeepResearchPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <OfflineDisabledNotice
          title="Offline Deep Research is paused"
          description="The local research engine is being rebuilt. In the meantime, use the chatbot's research tool — it runs cloud-side and will hand off to the new offline engine once it ships."
        />
      </div>
      <Footer />
    </div>
  );
};

export default DeepResearchPage;
