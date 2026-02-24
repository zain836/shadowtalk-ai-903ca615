import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TransparencyDashboard from "@/components/transparency/TransparencyDashboard";

const TransparencyPage = () => (
  <>
    <Helmet>
      <title>Data Transparency | ShadowTalk AI</title>
      <meta name="description" content="See exactly how ShadowTalk protects your data. Real-time encryption proofs, zero-knowledge architecture, and on-device processing verification." />
    </Helmet>
    <Navigation />
    <main className="min-h-screen bg-background pt-20">
      <TransparencyDashboard />
    </main>
    <Footer />
  </>
);

export default TransparencyPage;
