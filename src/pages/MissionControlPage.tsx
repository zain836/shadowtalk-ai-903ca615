import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MissionControl } from "@/components/chat/MissionControl";
import { useSearchParams } from "react-router-dom";

const MissionControlPage = () => {
  const [searchParams] = useSearchParams();
  const initialGoal = searchParams.get("goal") ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <MissionControl
          isOpen={true}
          onClose={() => window.history.back()}
          initialGoal={initialGoal}
        />
      </div>
      <Footer />
    </div>
  );
};

export default MissionControlPage;
