import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OfflineResearchPanel from "@/components/chat/OfflineResearchPanel";

const DeepResearchPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <div className="h-[calc(100vh-10rem)]">
          <OfflineResearchPanel />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeepResearchPage;
