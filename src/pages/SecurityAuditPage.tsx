import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SecurityAuditBoard from "@/components/transparency/SecurityAuditBoard";

const SecurityAuditPage = () => (
  <>
    <Helmet>
      <title>Security Audit | ShadowTalk AI</title>
      <meta name="description" content="Open security audit results, compliance certifications, and encryption verification for ShadowTalk AI's zero-knowledge architecture." />
    </Helmet>
    <Navigation />
    <main className="min-h-screen bg-background pt-20">
      <SecurityAuditBoard />
    </main>
    <Footer />
  </>
);

export default SecurityAuditPage;
