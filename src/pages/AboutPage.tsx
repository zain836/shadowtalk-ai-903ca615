import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AboutHero from "@/components/about/AboutHero";
import AboutMission from "@/components/about/AboutMission";
import AboutStack from "@/components/about/AboutStack";
import AboutProof from "@/components/about/AboutProof";
import AboutProjects from "@/components/about/AboutProjects";
import AboutCTA from "@/components/about/AboutCTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Back to Home */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2 glass-strong border-border/50 hover:border-primary/40 shadow-lg backdrop-blur-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <AboutHero />
      <Separator className="max-w-4xl mx-auto opacity-30" />
      <AboutMission />
      <AboutStack />
      <AboutProof />
      <AboutProjects />
      <AboutCTA />
      <Footer />
    </div>
  );
};

export default AboutPage;
