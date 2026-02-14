 import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import BootScreen from "@/components/BootScreen";
 // Critical path pages - loaded immediately
 import Index from "./pages/Index";
 import AuthPage from "./pages/AuthPage";
 import NotFound from "./pages/NotFound";
 
 // Lazy loaded pages - code splitting for better performance
 const PricingPage = lazy(() => import("./pages/PricingPage"));
 const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
 const AdminPage = lazy(() => import("./pages/AdminPage"));
 const DocsPage = lazy(() => import("./pages/DocsPage"));
 const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
 const ChatRoomsPage = lazy(() => import("./pages/ChatRoomsPage"));
 const CollaborativeRoom = lazy(() => import("./pages/CollaborativeRoom"));
 const ProfilePage = lazy(() => import("./pages/ProfilePage"));
 const APIPage = lazy(() => import("./pages/APIPage"));
 const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
 const EnterpriseSettingsPage = lazy(() => import("./pages/EnterpriseSettingsPage"));
 const AboutPage = lazy(() => import("./pages/AboutPage"));
 const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
 const FAQPage = lazy(() => import("./pages/FAQPage"));
 const ContactPage = lazy(() => import("./pages/ContactPage"));
 const StatusPage = lazy(() => import("./pages/StatusPage"));
 const BlogPage = lazy(() => import("./pages/BlogPage"));
 const CareersPage = lazy(() => import("./pages/CareersPage"));
 const PressPage = lazy(() => import("./pages/PressPage"));
 const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
 const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
 const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
 const GDPRPage = lazy(() => import("./pages/GDPRPage"));
 const MonetizationPage = lazy(() => import("./pages/MonetizationPage"));
 const FounderAccessPage = lazy(() => import("./pages/FounderAccessPage"));
 const StrategyAgentPage = lazy(() => import("./pages/StrategyAgentPage"));
  const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
  const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
  const DevelopersPage = lazy(() => import("./pages/DevelopersPage"));
  const LifetimeDealPage = lazy(() => import("./pages/LifetimeDealPage"));
import PWABanner from "./components/PWABanner";
import CookieConsent from "./components/CookieConsent";
import CustomerSupportWidget from "./components/CustomerSupportWidget";
import { JourneyTracker } from "./components/JourneyTracker";

// ElevenLabs Agent ID is now configured via the backend secret ELEVENLABS_AGENT_ID

 // Configure React Query with production-ready settings
 const queryClient = new QueryClient({
   defaultOptions: {
     queries: {
       staleTime: 1000 * 60 * 5, // 5 minutes
       gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
       retry: (failureCount, error: unknown) => {
         // Don't retry on 4xx errors except 429
         if (error && typeof error === 'object' && 'status' in error) {
           const status = (error as { status: number }).status;
           if (status >= 400 && status < 500 && status !== 429) {
             return false;
           }
         }
         return failureCount < 3;
       },
       retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
     },
     mutations: {
       retry: false,
     },
   },
 });
 
 // Loading fallback component
 const PageLoader = () => (
   <div className="min-h-screen bg-background flex items-center justify-center">
     <div className="flex flex-col items-center gap-4">
       <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
       <p className="text-muted-foreground text-sm">Loading...</p>
     </div>
   </div>
 );

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
                 <Suspense fallback={<PageLoader />}>
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
                      <Route path="/marketplace" element={<MarketplacePage />} />
                      <Route path="/developers" element={<DevelopersPage />} />
                      <Route path="*" element={<NotFound />} />
                   </Routes>
                 </Suspense>
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
