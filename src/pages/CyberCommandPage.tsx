import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { lazy, Suspense } from "react";

const CyberCommandCenter = lazy(() => import("@/components/cyber/CyberCommandCenter"));

const CyberCommandPage = () => (
  <>
    <Helmet>
      <title>Cyber Command Center | ShadowTalk AI</title>
      <meta name="description" content="AI-powered cybersecurity command center with live threat intelligence, pentesting copilot, incident response war room, and zero-day research lab." />
    </Helmet>
    <Navigation />
    <main className="min-h-screen bg-background pt-20">
      <Suspense fallback={<div className="flex items-center justify-center h-96 text-muted-foreground">Loading Cyber Command...</div>}>
        <CyberCommandCenter />
      </Suspense>
    </main>
    <Footer />
  </>
);

export default CyberCommandPage;
