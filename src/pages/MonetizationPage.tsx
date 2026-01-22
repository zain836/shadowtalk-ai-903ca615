import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditSystem } from "@/components/monetization/CreditSystem";
import { AffiliateProgram } from "@/components/monetization/AffiliateProgram";
import { UsageBasedBilling } from "@/components/monetization/UsageBasedBilling";
import { VideoTutorials } from "@/components/onboarding/VideoTutorials";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Users, 
  Activity, 
  PlayCircle,
  Crown,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const MonetizationPage = () => {
  const { user, userPlan } = useAuth();
  const [showTutorials, setShowTutorials] = useState(false);

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
              <Button variant="outline" className="gap-2" onClick={() => setShowTutorials(true)}>
                <PlayCircle className="h-4 w-4" />
                Video Tutorials
              </Button>
              {userPlan === 'free' && (
                <Button className="gap-2" onClick={() => window.location.href = '/founder-access'}>
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="credits" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
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
      
      <VideoTutorials 
        open={showTutorials} 
        onOpenChange={setShowTutorials} 
      />
    </div>
  );
};

export default MonetizationPage;
