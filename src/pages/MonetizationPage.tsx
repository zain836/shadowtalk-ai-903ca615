import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditSystem } from "@/components/monetization/CreditSystem";
import { AffiliateProgram } from "@/components/monetization/AffiliateProgram";
import { UsageBasedBilling } from "@/components/monetization/UsageBasedBilling";
import { RevenueStreams } from "@/components/monetization/RevenueStreams";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Users, 
  Activity, 
  Crown,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

const MonetizationPage = () => {
  const { user, userPlan } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 bg-card/50 border border-border rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Billing & Credits</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Manage Your{" "}
              <span className="gradient-text">Account</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Credits, usage, affiliate earnings, and billing - all in one place
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              {userPlan === 'free' && (
                <Button className="gap-2" onClick={() => navigate('/founder-access')}>
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="credits" className="gap-2">
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">Credits</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Usage</span>
              </TabsTrigger>
              <TabsTrigger value="affiliate" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Affiliate</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <RevenueStreams />
            </TabsContent>

            <TabsContent value="credits">
              <CreditSystem />
            </TabsContent>

            <TabsContent value="usage">
              <UsageBasedBilling />
            </TabsContent>

            <TabsContent value="affiliate">
              <AffiliateProgram />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
      
    </div>
  );
};

export default MonetizationPage;
