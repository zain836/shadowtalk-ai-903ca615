import { useEffect } from "react";
import StrategyAgent from "@/components/strategy/StrategyAgent";
import Navigation from "@/components/Navigation";

const StrategyAgentPage = () => {
  useEffect(() => {
    document.title = "Strategy Agent - ShadowTalk AI | Business Intelligence Platform";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <StrategyAgent />
    </div>
  );
};

export default StrategyAgentPage;
