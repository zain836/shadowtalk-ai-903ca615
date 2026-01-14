import { AdvancedAnalyticsDashboard } from "@/components/analytics/AdvancedAnalyticsDashboard";
import Navigation from "@/components/Navigation";

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <AdvancedAnalyticsDashboard />
      </div>
    </div>
  );
};

export default AnalyticsPage;
