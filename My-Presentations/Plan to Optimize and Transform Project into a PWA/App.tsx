import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
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
import ApiKeysPage from "./pages/ApiKeysPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import NotFound from "./pages/NotFound";
import PWABanner from "./components/PWABanner";
import CookieConsent from "./components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <AuthProvider>
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
              <Route path="/api-keys" element={<ApiKeysPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PWABanner />
            <CookieConsent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
