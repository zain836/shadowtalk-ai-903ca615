import React from "react";
import { Check, Star, Zap, Crown, Rocket, Gift, Coins, PlayCircle, TrendingUp, Sparkles, Timer, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { PLAN_DETAILS } from "@/lib/stripe";
import {
  dailyPrice,
  getRiskReversalBullets,
  getSocialProofLine,
  getValueAnchorLine,
} from "@/lib/conversionPsychology";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const PricingSection = () => {
  const navigate = useNavigate();
  const { userPlan } = useAuth();
  const { totalUsers, isLoading: metricsLoading } = usePlatformMetrics();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { hoverLift, variants, viewport, isMobile } = useLandingMotion();

  const handleSubscription = (planName: string) => {
    if (planName === "Free") { navigate('/chatbot'); return; }
    const planId = planName.toLowerCase();
    navigate(planId === "free" ? "/founder-access" : `/founder-access?plan=${planId}`);
  };

  const plans = [
    { name: "Free", price: "$0", period: "", daily: "", description: "Try everything — no card required", icon: Zap, popular: false, highlight: false, features: PLAN_DETAILS.free.features, comparison: "ChatGPT Free blocks tools. We don't.", cta: "Start Free", variant: "outline" as const },
    { name: "Pro", price: `$${PLAN_DETAILS.pro.price}`, period: "/month", daily: dailyPrice(PLAN_DETAILS.pro.price), description: "Unlimited messages · best for daily drivers", icon: Star, popular: false, highlight: false, features: PLAN_DETAILS.pro.features, comparison: getValueAnchorLine("pro"), cta: "Start Pro — $5/mo", variant: "outline" as const },
    { name: "Premium", price: `$${PLAN_DETAILS.premium.price}`, period: "/month", daily: dailyPrice(PLAN_DETAILS.premium.price), description: "Most teams pick this · agentic workflows included", icon: Rocket, popular: true, highlight: true, features: PLAN_DETAILS.premium.features, comparison: getValueAnchorLine("premium"), cta: "Go Premium — $15/mo", variant: "default" as const },
    { name: "Elite", price: `$${PLAN_DETAILS.elite.price}`, period: "/month", daily: dailyPrice(PLAN_DETAILS.elite.price), description: "Everything + white-label & phone support", icon: Crown, popular: false, highlight: false, features: PLAN_DETAILS.elite.features, comparison: getValueAnchorLine("elite"), cta: "Go Elite — $20/mo", variant: "secondary" as const },
  ];

  const getCurrentPlanBadge = (planName: string) => {
    if (userPlan === planName.toLowerCase()) {
      return <Badge className="absolute -top-3 right-4 bg-success text-success-foreground">Your Plan</Badge>;
    }
    return null;
  };

  return (
    <section id="pricing" ref={sectionRef} className="py-16 sm:py-28 bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-20" />
      <LandingAmbientOrb
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 ${
          isMobile ? "w-[400px] h-[200px] blur-[80px]" : "w-[800px] h-[400px] blur-[150px]"
        } bg-secondary/5 rounded-full`}
        animate={isInView ? { scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] } : undefined}
        duration={10}
      />

      <div className="container mx-auto px-4 relative z-10">
        <LandingSectionHeader
          badge={LANDING_COPY.pricing.badge}
          badgeIcon={Star}
          title={
            <>
              {LANDING_COPY.pricing.title[0]}{" "}
              <span className="gradient-text">{LANDING_COPY.pricing.title[1]}</span>
            </>
          }
          subtitle={
            <>
              {LANDING_COPY.pricing.subtitle}
              {!metricsLoading && (
                <span className="block mt-2 text-xs text-primary/80 font-medium">
                  {getSocialProofLine(totalUsers)}
                </span>
              )}
            </>
          }
          className="mb-10 sm:mb-14"
        />

        <div className="text-center mb-12 sm:mb-16">
          {/* Lifetime alternative — anchors monthly as the default path */}
          <motion.div
            variants={variants.scaleFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            whileHover={hoverLift}
            className="inline-flex items-center space-x-3 glass-subtle border-warning/20 rounded-xl px-4 sm:px-6 py-3 sm:py-4 mb-6"
          >
            <Timer className="h-6 w-6 text-warning" />
            <div className="text-left">
              <span className="text-sm font-bold text-warning">Prefer one payment? $99 lifetime</span>
              <p className="text-xs text-muted-foreground">
                Or stay flexible with Premium at $15/mo — cancel anytime.{" "}
                <Button variant="link" className="text-warning p-0 h-auto text-xs" onClick={() => navigate('/lifetime-deal')}>
                  See lifetime →
                </Button>
              </p>
            </div>
          </motion.div>
          
          {/* Referral */}
          <motion.div
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            whileHover={hoverLift}
            className="inline-flex items-center space-x-2 glass-subtle border-primary/10 rounded-xl px-4 sm:px-6 py-3"
          >
            <Gift className="h-5 w-5 text-primary" />
            <span className="text-sm">
              <span className="font-semibold text-primary">Earn 20% commission</span> on every referral!{" "}
              <Button variant="link" className="text-primary p-0 ml-1 h-auto text-xs" onClick={() => navigate('/profile')}>
                Get your link →
              </Button>
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto" style={{ perspective: "1200px" }}>
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={variants.cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={hoverLift}
            >
              <Card className={`relative h-full border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] overflow-hidden ${
                plan.highlight ? 'ring-2 ring-primary/50 lg:scale-105' : ''
              }`}>
                {/* Top glow */}
                {plan.highlight && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />}
                
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground shadow-lg">
                    Most Popular
                  </Badge>
                )}
                {getCurrentPlanBadge(plan.name)}

                <CardHeader className="text-center pb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted/60 mb-4 mx-auto"
                  >
                    <plan.icon className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold gradient-text">{plan.price}</span>
                      <span className="text-muted-foreground ml-1 text-sm">{plan.period}</span>
                    </div>
                    {"daily" in plan && plan.daily && (
                      <p className="text-[11px] text-primary mt-1 font-medium">{plan.daily}/day</p>
                    )}
                  </div>

                  <motion.div
                    className="space-y-2 mb-4"
                    variants={variants.staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewport}
                  >
                    {plan.features.slice(0, 5).map((feature, fi) => (
                      <motion.div
                        key={fi}
                        variants={variants.fadeSlideUp}
                        className="flex items-start space-x-2"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={viewport}
                          transition={{ type: "spring", stiffness: 400, delay: fi * 0.04 }}
                        >
                          <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        </motion.div>
                        <span className="text-xs">{feature}</span>
                      </motion.div>
                    ))}
                    {plan.features.length > 5 && (
                      <motion.div
                        variants={variants.fadeSlideUp}
                        className="text-xs text-muted-foreground text-center"
                      >
                        +{plan.features.length - 5} more features
                      </motion.div>
                    )}
                  </motion.div>

                  {plan.comparison && (
                    <div className="bg-success/5 border border-success/15 rounded-lg px-2 py-1.5 mb-4">
                      <p className="text-xs text-success font-medium text-center">✨ {plan.comparison}</p>
                    </div>
                  )}

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
            </motion.div>
          ))}
        </div>

        {/* Pay Per Solution */}
        <div className="mt-20 max-w-4xl mx-auto">
          <motion.div
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-center mb-10"
          >
            <h3 className="text-2xl font-bold mb-3 tracking-tight">💼 Pay-Per-Solution</h3>
            <p className="text-muted-foreground text-sm">One-time solutions, no subscription needed.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { emoji: "📄", title: "Document Generation", desc: "Contracts, NDAs, forms", price: "$5-$50" },
              { emoji: "🔍", title: "Document Review", desc: "Analysis & risk assessment", price: "$10-$75" },
              { emoji: "🌍", title: "Workflow Report", desc: "Multi-jurisdictional guidance", price: "$50-$200" },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={variants.cardReveal}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                whileHover={hoverLift}
              >
                <Card className="border-border/50 hover:border-primary/20 transition-all hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.1)]">
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl mb-2">{item.emoji}</div>
                    <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
                    <div className="text-xl font-bold gradient-text mb-4">{item.price}</div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/founder-access')}>
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Revenue Streams */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Coins, title: "Pay-Per-Use Credits", desc: "Buy credits, no subscription", gradient: "from-primary/10 to-secondary/5", borderColor: "border-primary/15" },
              { icon: TrendingUp, title: "Affiliate Program", desc: "Earn 20-40% recurring commission", gradient: "from-success/10 to-primary/5", borderColor: "border-success/15" },
              { icon: BookOpen, title: "Documentation", desc: "API reference and product guides", gradient: "from-secondary/10 to-primary/5", borderColor: "border-secondary/15" },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={variants.cardReveal}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                whileHover={hoverLift}
              >
                <Card className={`bg-gradient-to-br ${item.gradient} ${item.borderColor} hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.1)] transition-all`}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{item.desc}</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(item.title === "Video Tutorials" ? '/docs' : '/founder-access')}>
                      {item.title === "Affiliate Program" ? "Start Earning" : item.title === "Video Tutorials" ? "Watch Now" : "Buy Credits"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom trust */}
        <motion.div
          variants={variants.fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Most builders choose <span className="text-foreground font-medium">Premium ($15/mo)</span> for unlimited messages + Mission Control
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-5 text-xs text-muted-foreground">
            {getRiskReversalBullets().map((label, i) => (
              <motion.span
                key={label}
                custom={i}
                variants={variants.cardReveal}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                whileHover={hoverLift}
                className="flex items-center space-x-1.5 glass-subtle rounded-lg px-3 py-1.5"
              >
                <Check className="h-3.5 w-3.5 text-success" />
                <span>{label}</span>
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
