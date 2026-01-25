import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Code, 
  Palette, 
  FileText, 
  Users, 
  Zap,
  ArrowRight,
  Crown
} from "lucide-react";
import { 
  CREDIT_PACKAGES, 
  PAY_PER_SOLUTIONS, 
  API_PLANS, 
  WHITELABEL_PLANS 
} from "@/lib/monetization";

export function RevenueStreams() {
  const navigate = useNavigate();

  const streams = [
    {
      id: 'credits',
      title: 'Pay-Per-Use Credits',
      description: 'Buy credits for AI generations without a subscription',
      icon: Coins,
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-500',
      cta: 'Buy Credits',
      highlight: `From $${CREDIT_PACKAGES[0].price}`,
    },
    {
      id: 'solutions',
      title: 'Pay-Per-Solution',
      description: 'One-time purchases for documents, reports & audits',
      icon: FileText,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-500',
      cta: 'View Solutions',
      highlight: `${PAY_PER_SOLUTIONS.length} products`,
    },
    {
      id: 'api',
      title: 'API Access',
      description: 'Integrate ShadowTalk AI into your applications',
      icon: Code,
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-500',
      cta: 'Get API Keys',
      highlight: `From $${API_PLANS[0].price}/mo`,
    },
    {
      id: 'whitelabel',
      title: 'White-Label License',
      description: 'Rebrand & deploy ShadowTalk for your business',
      icon: Palette,
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-500',
      cta: 'Learn More',
      highlight: `From $${WHITELABEL_PLANS[0].price}/mo`,
    },
    {
      id: 'affiliate',
      title: 'Affiliate Program',
      description: 'Earn 20-40% recurring commission on referrals',
      icon: Users,
      color: 'from-success/20 to-green-500/20',
      borderColor: 'border-success/30',
      iconColor: 'text-success',
      cta: 'Start Earning',
      highlight: 'Up to 40%',
    },
    {
      id: 'elite',
      title: 'Elite Membership',
      description: 'Lifetime founding member access - one payment',
      icon: Crown,
      color: 'from-primary/20 to-secondary/20',
      borderColor: 'border-primary/30',
      iconColor: 'text-primary',
      cta: 'Claim Now',
      highlight: '$39.99 lifetime',
      featured: true,
    },
  ];

  const handleAction = (streamId: string) => {
    // All streams redirect to founder-access page
    navigate('/founder-access');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-4">
          <Zap className="w-3 h-3 mr-1" />
          Multiple Ways to Access
        </Badge>
        <h2 className="text-2xl font-bold mb-2">Choose Your Path</h2>
        <p className="text-muted-foreground">
          Flexible options to match your needs and budget
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {streams.map((stream) => (
          <Card 
            key={stream.id}
            className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
              stream.featured ? 'ring-2 ring-primary' : ''
            } ${stream.borderColor}`}
            onClick={() => handleAction(stream.id)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stream.color} opacity-50`} />
            
            {stream.featured && (
              <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-primary/80">
                RECOMMENDED
              </Badge>
            )}
            
            <CardHeader className="relative pb-2">
              <div className={`w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center mb-2 ${stream.iconColor}`}>
                <stream.icon className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">{stream.title}</CardTitle>
              <CardDescription className="text-sm">{stream.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-background/80">
                  {stream.highlight}
                </Badge>
                <Button size="sm" variant="ghost" className="gap-1">
                  {stream.cta}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
