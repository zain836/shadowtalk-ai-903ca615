import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SovereignDataDashboard from "@/components/chat/SovereignDataDashboard";

const SovereignDataPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <SovereignDataDashboard />
      </div>
      <Footer />
    </div>
  );
};

export default SovereignDataPage;
