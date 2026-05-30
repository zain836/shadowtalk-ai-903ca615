 import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import { SecurityProvider } from "@/components/SecurityProvider";
import { ShadowMemoryProvider } from "@/contexts/ShadowMemoryContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import BootScreen from "@/components/BootScreen";
import CommandPalette from "@/components/CommandPalette";
import { createContext, useContext } from "react";

export const CommandPaletteContext = createContext<{ open: () => void }>({ open: () => {} });
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
    const PrivacyScorePage = lazy(() => import("./pages/PrivacyScorePage"));
  const PresentationBuilderPage = lazy(() => import("./pages/PresentationBuilderPage"));
   const MissionControlPage = lazy(() => import("./pages/MissionControlPage"));
   const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const DeepResearchPage = lazy(() => import("./pages/DeepResearchPage"));
const KnowledgeGraphPage = lazy(() => import("./pages/KnowledgeGraphPage"));
const StrategyLabPage = lazy(() => import("./pages/StrategyLabPage"));
const SovereignDataPage = lazy(() => import("./pages/SovereignDataPage"));
const StealthVaultPage = lazy(() => import("./pages/StealthVaultPage"));
const BusinessMemoryPage = lazy(() => import("./pages/BusinessMemoryPage"));
const SovereignWalletPage = lazy(() => import("./pages/SovereignWalletPage"));
const GhostAdsPage = lazy(() => import("./pages/GhostAdsPage"));
const EnterpriseLicensePage = lazy(() => import("./pages/EnterpriseLicensePage"));
const DataInsightsPage = lazy(() => import("./pages/DataInsightsPage"));
const TransparencyPage = lazy(() => import("./pages/TransparencyPage"));
const SecurityAuditPage = lazy(() => import("./pages/SecurityAuditPage"));
const CommandCenterPage = lazy(() => import("./pages/CommandCenterPage"));
const ShadowMemoryPage = lazy(() => import("./pages/ShadowMemoryPage"));
const CompetitivePage = lazy(() => import("./pages/CompetitivePage"));
const AgentArchitecturePage = lazy(() => import("./pages/AgentArchitecturePage"));
const ComplianceDashboardPage = lazy(() => import("./pages/ComplianceDashboardPage"));
const TrustPage = lazy(() => import("./pages/TrustPage"));
const CreativeStudioPage = lazy(() => import("./pages/CreativeStudioPage"));
const CyberCommandPage = lazy(() => import("./pages/CyberCommandPage"));
const PersonalLLMPage = lazy(() => import("./pages/PersonalLLMPage"));
const PWABanner = lazy(() => import("./components/PWABanner"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
const CustomerSupportWidget = lazy(() => import("./components/CustomerSupportWidget"));
const ShadowMemoryTracker = lazy(() => import("./components/ShadowMemoryTracker"));
const JourneyTracker = lazy(() => import("./components/JourneyTracker").then(m => ({ default: m.JourneyTracker })));
const VoiceCommandSystem = lazy(() => import("./components/VoiceCommandSystem"));
const OnboardingFlow = lazy(() => import("./components/OnboardingFlow"));
import { useReferralCapture } from "./hooks/useReferralTracking";
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

const AnimatedRoutes = () => {
  const location = useLocation();
  useReferralCapture();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
          <Route path="/chatbot" element={<PageTransition><ChatbotPage /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
          <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
          <Route path="/changelog" element={<PageTransition><ChangelogPage /></PageTransition>} />
          <Route path="/rooms" element={<PageTransition><ChatRoomsPage /></PageTransition>} />
          <Route path="/rooms/:roomId" element={<PageTransition><CollaborativeRoom /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/api" element={<PageTransition><APIPage /></PageTransition>} />
          <Route path="/analytics" element={<PageTransition><AnalyticsPage /></PageTransition>} />
          <Route path="/enterprise" element={<PageTransition><EnterpriseSettingsPage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
          <Route path="/help" element={<PageTransition><HelpCenterPage /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="/status" element={<PageTransition><StatusPage /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />
          <Route path="/careers" element={<PageTransition><CareersPage /></PageTransition>} />
          <Route path="/press" element={<PageTransition><PressPage /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
          <Route path="/cookies" element={<PageTransition><CookiePolicyPage /></PageTransition>} />
          <Route path="/gdpr" element={<PageTransition><GDPRPage /></PageTransition>} />
          <Route path="/billing" element={<PageTransition><MonetizationPage /></PageTransition>} />
          <Route path="/founder-access" element={<PageTransition><FounderAccessPage /></PageTransition>} />
          <Route path="/lifetime-deal" element={<PageTransition><LifetimeDealPage /></PageTransition>} />
          <Route path="/strategy" element={<PageTransition><StrategyAgentPage /></PageTransition>} />
          <Route path="/workspace" element={<PageTransition><WorkspacePage /></PageTransition>} />
          <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
          <Route path="/developers" element={<PageTransition><DevelopersPage /></PageTransition>} />
          <Route path="/privacy-score" element={<PageTransition><PrivacyScorePage /></PageTransition>} />
          <Route path="/presentations" element={<PageTransition><PresentationBuilderPage /></PageTransition>} />
          <Route path="/missioncontrol" element={<PageTransition><MissionControlPage /></PageTransition>} />
          <Route path="/referral" element={<PageTransition><ReferralPage /></PageTransition>} />
          <Route path="/research" element={<PageTransition><DeepResearchPage /></PageTransition>} />
          <Route path="/knowledge" element={<PageTransition><KnowledgeGraphPage /></PageTransition>} />
          <Route path="/strategy-lab" element={<PageTransition><StrategyLabPage /></PageTransition>} />
          <Route path="/sovereign-data" element={<PageTransition><SovereignDataPage /></PageTransition>} />
          <Route path="/vault" element={<PageTransition><StealthVaultPage /></PageTransition>} />
          <Route path="/business-memory" element={<PageTransition><BusinessMemoryPage /></PageTransition>} />
          <Route path="/wallet" element={<PageTransition><SovereignWalletPage /></PageTransition>} />
          <Route path="/ghost-ads" element={<PageTransition><GhostAdsPage /></PageTransition>} />
          <Route path="/offline-license" element={<PageTransition><EnterpriseLicensePage /></PageTransition>} />
          <Route path="/data-insights" element={<PageTransition><DataInsightsPage /></PageTransition>} />
          <Route path="/transparency" element={<PageTransition><TransparencyPage /></PageTransition>} />
          <Route path="/studio" element={<PageTransition><CreativeStudioPage /></PageTransition>} />
          <Route path="/security-audit" element={<PageTransition><SecurityAuditPage /></PageTransition>} />
          <Route path="/command-center" element={<PageTransition><CommandCenterPage /></PageTransition>} />
          <Route path="/shadow-memory" element={<PageTransition><ShadowMemoryPage /></PageTransition>} />
          <Route path="/competitive" element={<PageTransition><CompetitivePage /></PageTransition>} />
          <Route path="/agents" element={<PageTransition><AgentArchitecturePage /></PageTransition>} />
          <Route path="/compliance" element={<PageTransition><ComplianceDashboardPage /></PageTransition>} />
          <Route path="/trust" element={<PageTransition><TrustPage /></PageTransition>} />
          <Route path="/cyber" element={<PageTransition><CyberCommandPage /></PageTransition>} />
          <Route path="/personal-llm" element={<PageTransition><PersonalLLMPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const App = () => {
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [hasBooted, setHasBooted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    import("@/lib/shadowMode").then(({ initShadowMode }) => initShadowMode());

    // Check if user has seen boot screen this session
    const hasSeenBoot = sessionStorage.getItem('shadowtalk-booted');
    if (hasSeenBoot) {
      setShowBootScreen(false);
      setHasBooted(true);
    }

    // Auto-resume any previously-started on-device model download.
    // The engine singleton outlives every route, so once load() is called
    // the fetch+cache pipeline keeps running even after the user navigates away.
    if (localStorage.getItem('shadowtalk_offline_autoresume') === '1') {
      (async () => {
        try {
          const [{ getGemmaEngine }, { getPreferredLocalModel }, { requestPersistentStorage }] = await Promise.all([
            import('@/lib/offline/gemmaEngine'),
            import('@/lib/offline/hybridRouter'),
            import('@/lib/offline/opfsModelStore'),
          ]);
          await requestPersistentStorage();
          const key = getPreferredLocalModel() as any;
          getGemmaEngine().load(key).catch((e) => console.warn('[Offline] auto-resume failed', e));
        } catch (e) {
          console.warn('[Offline] auto-resume bootstrap failed', e);
        }
      })();
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
              <SecurityProvider>
              <ShadowMemoryProvider>
              <CommandPaletteContext.Provider value={{ open: () => setCmdOpen(true) }}>
              {showBootScreen && !hasBooted && (
                <BootScreen onComplete={handleBootComplete} />
              )}
              <Toaster />
              <Sonner />
               <BrowserRouter>
                 <AnimatedRoutes />
                 <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
                  <Suspense fallback={null}>
                    <OnboardingFlow />
                    <ShadowMemoryTracker />
                   <JourneyTracker />
                   <PWABanner />
                   <CookieConsent />
                   <CustomerSupportWidget />
                 </Suspense>
               </BrowserRouter>
              </CommandPaletteContext.Provider>
              </ShadowMemoryProvider>
              </SecurityProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
