import React from "react";
import { Check, Star, Zap, Crown, Rocket, Gift, Coins, PlayCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { PLAN_DETAILS } from "@/lib/stripe";

const PricingSection = () => {
  const navigate = useNavigate();
  const { userPlan } = useAuth();

  const handleSubscription = (planName: string) => {
    if (planName === "Free") {
      navigate('/chatbot');
      return;
    }
    // Redirect all paid plans to Founder's Access page
    navigate('/founder-access');
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "",
      description: "Try our revolutionary AI capabilities",
      icon: Zap,
      popular: false,
      highlight: false,
      features: PLAN_DETAILS.free.features,
      limitations: [
        "🔒 No Proactive Context Engine (PCE)",
        "🔒 No Multi-Step Workflow Executor",
        "🔒 No cross-jurisdictional comparisons",
        "Contains ads",
      ],
      cta: "Start Free",
      variant: "outline",
    },
    {
      name: "Pro",
      price: `$${PLAN_DETAILS.pro.price}`,
      period: "/month",
      description: "Perfect for freelancers & small businesses",
      icon: Star,
      popular: false,
      highlight: false,
      features: PLAN_DETAILS.pro.features,
      limitations: [],
      cta: "Upgrade to Pro",
      variant: "default",
    },
    {
      name: "Premium",
      price: `$${PLAN_DETAILS.premium.price}`,
      period: "/month",
      description: "For serious professionals & agencies",
      icon: Rocket,
      popular: true,
      highlight: true,
      features: PLAN_DETAILS.premium.features,
      limitations: [],
      cta: "Go Premium",
      variant: "default",
    },
    {
      name: "Elite",
      price: `$${PLAN_DETAILS.elite.price}`,
      period: "/month",
      description: "Power users who demand everything",
      icon: Crown,
      popular: false,
      highlight: false,
      features: PLAN_DETAILS.elite.features,
      limitations: [],
      cta: "Go Elite",
      variant: "secondary",
    },
  ];

  const getCurrentPlanBadge = (planName: string) => {
    const planLower = planName.toLowerCase();
    if (userPlan === planLower) {
      return <Badge className="absolute -top-3 right-4 bg-success text-success-foreground">Your Plan</Badge>;
    }
    return null;
  };

  return (
    <section id="pricing" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 border border-border rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Value-Driven Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Invest in Your{" "}
            <span className="gradient-text">Success</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Navigate legal, financial & regulatory complexity with AI that pays for itself. Start free, scale as you grow.
          </p>
          
          {/* Referral Banner */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl px-6 py-3">
            <Gift className="h-5 w-5 text-primary" />
            <span className="text-sm">
              <span className="font-semibold text-primary">Earn 20% commission</span> on every referral! 
              <Button variant="link" className="text-primary p-0 ml-1 h-auto" onClick={() => navigate('/profile')}>
                Get your referral link →
              </Button>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative card-hover ${
                plan.highlight
                  ? 'ring-2 ring-primary shadow-glow lg:scale-105'
                  : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              {getCurrentPlanBadge(plan.name)}

              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-primary mb-4 mx-auto`}>
                  <plan.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold gradient-text">{plan.price}</span>
                    <span className="text-muted-foreground ml-1 text-sm">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {plan.features.slice(0, 6).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 6 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{plan.features.length - 6} more features
                    </div>
                  )}
                  {plan.limitations.map((limitation, limitIndex) => (
                    <div key={limitIndex} className="flex items-start space-x-2">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full mx-auto mt-1"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  className={`w-full ${plan.highlight ? 'btn-glow' : ''}`}
                  variant={plan.variant as any}
                  size="sm"
                  onClick={() => handleSubscription(plan.name)}
                  disabled={userPlan === plan.name.toLowerCase()}
                >
                  {userPlan === plan.name.toLowerCase() ? 'Current Plan' : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pay Per Solution Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold mb-4">
              💼 Pay-Per-Solution Options
            </h3>
            <p className="text-muted-foreground">
              Need a one-time solution? Get exactly what you need without a subscription.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-hover">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl mb-2">📄</div>
                <h4 className="font-semibold mb-2">Document Generation</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Contracts, NDAs, business forms
                </p>
                <div className="text-2xl font-bold gradient-text mb-4">$5-$50</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/founder-access')}>
                  Generate Document
                </Button>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold mb-2">Document Review</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Contract analysis & risk assessment
                </p>
                <div className="text-2xl font-bold gradient-text mb-4">$10-$75</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/founder-access')}>
                  Review Document
                </Button>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl mb-2">🌍</div>
                <h4 className="font-semibold mb-2">Complex Workflow Report</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Multi-jurisdictional guidance
                </p>
                <div className="text-2xl font-bold gradient-text mb-4">$50-$200</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/founder-access')}>
                  Get Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Revenue Streams */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Credit System */}
            <Card className="card-hover bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Pay-Per-Use Credits</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Buy credits for AI generations, no subscription needed
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/founder-access')}>
                  Buy Credits
                </Button>
              </CardContent>
            </Card>
            
            {/* Affiliate Program */}
            <Card className="card-hover bg-gradient-to-br from-success/5 to-primary/5 border-success/20">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <h4 className="font-semibold mb-2">Affiliate Program</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Earn 20-40% recurring commission on referrals
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/founder-access')}>
                  Start Earning
                </Button>
              </CardContent>
            </Card>
            
            {/* Video Tutorials */}
            <Card className="card-hover bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h4 className="font-semibold mb-2">Video Tutorials</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn to master all AI features step-by-step
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate('/docs')}>
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include 30-day money-back guarantee • Cancel anytime • Secure payment via Stripe
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>No setup fees</span>
            </span>
            <span className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>Instant activation</span>
            </span>
            <span className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>SOC 2 compliant</span>
            </span>
            <span className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>GDPR ready</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
