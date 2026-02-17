import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MissionControl } from "@/components/chat/MissionControl";

const MissionControlPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <MissionControl
          isOpen={true}
          onClose={() => window.history.back()}
        />
      </div>
      <Footer />
    </div>
  );
};

export default MissionControlPage;
