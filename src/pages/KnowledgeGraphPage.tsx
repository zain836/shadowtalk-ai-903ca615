import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OfflineKnowledgeExplorer from "@/components/chat/OfflineKnowledgeExplorer";

const KnowledgeGraphPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <div className="h-[calc(100vh-10rem)]">
          <OfflineKnowledgeExplorer />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default KnowledgeGraphPage;
