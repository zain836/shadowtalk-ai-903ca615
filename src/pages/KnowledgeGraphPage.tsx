import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VisualKnowledgeGraph from "@/components/chat/VisualKnowledgeGraph";
import { PrivacyBanner } from "@/components/transparency/PrivacyBadge";
const KnowledgeGraphPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <PrivacyBanner dataLocation="device" featureName="Knowledge Graph" />
        <div className="h-[calc(100vh-10rem)]">
          <VisualKnowledgeGraph />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default KnowledgeGraphPage;
