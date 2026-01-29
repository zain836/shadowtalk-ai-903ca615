import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import BootScreen from "@/components/BootScreen";
import Index from "./pages/Index";
import PricingPage from "./pages/PricingPage";
import ChatbotPage from "./pages/ChatbotPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import DocsPage from "./pages/DocsPage";
import ChangelogPage from "./pages/ChangelogPage";
import ChatRoomsPage from "./pages/ChatRoomsPage";
import CollaborativeRoom from "./pages/CollaborativeRoom";
import ProfilePage from "./pages/ProfilePage";
import APIPage from "./pages/APIPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EnterpriseSettingsPage from "./pages/EnterpriseSettingsPage";
import AboutPage from "./pages/AboutPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import StatusPage from "./pages/StatusPage";
import BlogPage from "./pages/BlogPage";
import CareersPage from "./pages/CareersPage";
import PressPage from "./pages/PressPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import GDPRPage from "./pages/GDPRPage";
import NotFound from "./pages/NotFound";
import MonetizationPage from "./pages/MonetizationPage";
import FounderAccessPage from "./pages/FounderAccessPage";
import StrategyAgentPage from "./pages/StrategyAgentPage";
import WorkspacePage from "./pages/WorkspacePage";
import LifetimeDealPage from "./pages/LifetimeDealPage";
import PWABanner from "./components/PWABanner";
import CookieConsent from "./components/CookieConsent";
import CustomerSupportWidget from "./components/CustomerSupportWidget";
import { JourneyTracker } from "./components/JourneyTracker";

// ElevenLabs Agent ID is now configured via the backend secret ELEVENLABS_AGENT_ID

const queryClient = new QueryClient();

const App = () => {
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    // Check if user has seen boot screen this session
    const hasSeenBoot = sessionStorage.getItem('shadowtalk-booted');
    if (hasSeenBoot) {
      setShowBootScreen(false);
      setHasBooted(true);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('shadowtalk-booted', 'true');
    setShowBootScreen(false);
    setHasBooted(true);
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider>
            <AuthProvider>
              {showBootScreen && !hasBooted && (
                <BootScreen onComplete={handleBootComplete} />
              )}
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/chatbot" element={<ChatbotPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/changelog" element={<ChangelogPage />} />
                  <Route path="/rooms" element={<ChatRoomsPage />} />
                  <Route path="/rooms/:roomId" element={<CollaborativeRoom />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/api" element={<APIPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/enterprise" element={<EnterpriseSettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/help" element={<HelpCenterPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/press" element={<PressPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/gdpr" element={<GDPRPage />} />
                  <Route path="/billing" element={<MonetizationPage />} />
                  <Route path="/founder-access" element={<FounderAccessPage />} />
                  <Route path="/lifetime-deal" element={<LifetimeDealPage />} />
                  <Route path="/strategy" element={<StrategyAgentPage />} />
                  <Route path="/workspace" element={<WorkspacePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <JourneyTracker />
                <PWABanner />
                <CookieConsent />
                <CustomerSupportWidget />
              </BrowserRouter>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
