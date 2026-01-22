import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, 
  Gift, 
  ShoppingCart,
  Sparkles,
  MessageSquare,
  Image,
  Code,
  Search,
  Mic,
  FileText
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

interface CreditUsage {
  action: string;
  icon: React.ElementType;
  cost: number;
  description: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", name: "Starter Pack", credits: 100, price: 4.99, bonus: 0 },
  { id: "popular", name: "Value Pack", credits: 500, price: 19.99, bonus: 50, popular: true },
  { id: "pro", name: "Pro Pack", credits: 1200, price: 39.99, bonus: 200 },
  { id: "enterprise", name: "Enterprise Pack", credits: 5000, price: 149.99, bonus: 1000 },
];

const CREDIT_COSTS: CreditUsage[] = [
  { action: "AI Chat Message", icon: MessageSquare, cost: 1, description: "Per message sent" },
  { action: "Image Generation", icon: Image, cost: 10, description: "Per image created" },
  { action: "Code Generation", icon: Code, cost: 5, description: "Per code snippet" },
  { action: "Web Search", icon: Search, cost: 3, description: "Per search query" },
  { action: "Voice Input", icon: Mic, cost: 2, description: "Per voice transcription" },
  { action: "Document Analysis", icon: FileText, cost: 8, description: "Per document analyzed" },
];

export function CreditSystem() {
  const { user, userPlan } = useAuth();
  const [credits, setCredits] = useState(0);
  const [dailyFreeCredits, setDailyFreeCredits] = useState(50);
  const [usedToday, setUsedToday] = useState(0);

  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  const loadCredits = async () => {
    // In a real implementation, fetch from database
    const freeCreditsPerPlan: Record<string, number> = {
      free: 50,
      pro: 500,
      premium: 2000,
      elite: 10000,
      enterprise: Infinity,
    };
    setDailyFreeCredits(freeCreditsPerPlan[userPlan] || 50);
    setCredits(freeCreditsPerPlan[userPlan] || 50);
  };

  const handlePurchase = () => {
    // Redirect to Founder's Access page
    window.location.href = '/founder-access';
  };

  const usagePercentage = (usedToday / dailyFreeCredits) * 100;

  return (
    <div className="space-y-6">
      {/* Current Credits Display */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Your Credits
            </CardTitle>
            <Badge variant="outline" className="text-primary border-primary">
              {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold gradient-text">{credits.toLocaleString()}</span>
              <span className="text-muted-foreground">credits remaining</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily usage</span>
                <span>{usedToday} / {dailyFreeCredits === Infinity ? '∞' : dailyFreeCredits}</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resets daily at midnight UTC • Unused credits roll over on paid plans
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Buy More Credits
          </h3>
          <Badge variant="secondary" className="gap-1">
            <Gift className="h-3 w-3" />
            Up to 20% bonus
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative transition-all hover:shadow-lg ${
                pkg.popular ? 'ring-2 ring-primary shadow-glow' : ''
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-primary">
                  Most Popular
                </Badge>
              )}
              <CardContent className="pt-6 text-center space-y-4">
                <div className="space-y-1">
                  <h4 className="font-semibold">{pkg.name}</h4>
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{pkg.credits.toLocaleString()}</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <Badge variant="outline" className="text-success border-success">
                      +{pkg.bonus} bonus
                    </Badge>
                  )}
                </div>
                
                <div className="text-3xl font-bold gradient-text">${pkg.price}</div>
                
                <p className="text-xs text-muted-foreground">
                  ${((pkg.price / (pkg.credits + pkg.bonus)) * 100).toFixed(1)}¢ per credit
                </p>

                <Button 
                  className={`w-full ${pkg.popular ? 'btn-glow' : ''}`}
                  variant={pkg.popular ? 'default' : 'outline'}
                  onClick={() => handlePurchase()}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5" />
            Credit Usage Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CREDIT_COSTS.map((item) => (
              <div key={item.action} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant="secondary">{item.cost}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
