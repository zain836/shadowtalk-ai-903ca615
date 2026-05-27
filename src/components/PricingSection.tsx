import React from "react";
import { Check, Star, Zap, Crown, Rocket, Gift, Coins, PlayCircle, TrendingUp, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { PLAN_DETAILS } from "@/lib/stripe";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handleSubscription = (planName: string) => {
    if (planName === "Free") { navigate('/chatbot'); return; }
    navigate('/founder-access');
  };

  const plans = [
    { name: "Free", price: "$0", period: "", description: "Get started — no credit card required", icon: Zap, popular: false, highlight: false, features: PLAN_DETAILS.free.features, comparison: "Same price as ChatGPT Free", cta: "Start Free", variant: "outline" },
    { name: "Pro", price: `$${PLAN_DETAILS.pro.price}`, period: "/month", description: "For power users who want offline AI", icon: Star, popular: false, highlight: false, features: PLAN_DETAILS.pro.features, comparison: "Compare features, not just price", cta: "Upgrade to Pro", variant: "default" },
    { name: "Premium", price: `$${PLAN_DETAILS.premium.price}`, period: "/month", description: "Most popular tier", icon: Rocket, popular: true, highlight: true, features: PLAN_DETAILS.premium.features, comparison: "More features than ChatGPT Plus", cta: "Go Premium", variant: "default" },
    { name: "Elite", price: `$${PLAN_DETAILS.elite.price}`, period: "/month", description: "75% cheaper than ChatGPT Pro ($200/mo)", icon: Crown, popular: false, highlight: false, features: PLAN_DETAILS.elite.features, comparison: "ChatGPT Pro = $200/mo", cta: "Go Elite", variant: "secondary" },
  ];

  const getCurrentPlanBadge = (planName: string) => {
    if (userPlan === planName.toLowerCase()) {
      return <Badge className="absolute -top-3 right-4 bg-success text-success-foreground">Your Plan</Badge>;
    }
    return null;
  };

  return (
    <section id="pricing" ref={sectionRef} className="py-28 bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-20" />
      <motion.div
        animate={isInView ? { scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary/5 rounded-full blur-[150px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-8"
          >
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Better Than ChatGPT • Lower Prices</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Why Pay{" "}
            <span className="line-through text-muted-foreground/60">$200</span>{" "}
            <span className="gradient-text">When You Can Pay $50?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            More features at every price point. Compare and see the difference.
          </motion.p>
          
          {/* Lifetime Deal Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring" }}
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center space-x-3 glass-subtle border-warning/20 rounded-xl px-6 py-4 mb-6"
          >
            <Timer className="h-6 w-6 text-warning animate-pulse" />
            <div className="text-left">
              <span className="text-sm font-bold text-warning">🔥 TONIGHT ONLY: $99 Lifetime Deal</span>
              <p className="text-xs text-muted-foreground">
                First 100 users get EVERYTHING forever.{" "}
                <Button variant="link" className="text-warning p-0 h-auto text-xs" onClick={() => navigate('/lifetime-deal')}>
                  Claim Now →
                </Button>
              </p>
            </div>
          </motion.div>
          
          {/* Referral */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center space-x-2 glass-subtle border-primary/10 rounded-xl px-6 py-3"
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
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -10, scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 20 } }}
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
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.slice(0, 5).map((feature, fi) => (
                      <div key={fi} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{plan.features.length - 5} more features
                      </div>
                    )}
                  </div>

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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400 } }}
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -5, transition: { type: "spring", stiffness: 400 } }}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground mb-4">
            30-day money-back guarantee · Cancel anytime · Secure payment
          </p>
          <div className="flex flex-wrap justify-center items-center gap-5 text-xs text-muted-foreground">
            {["No setup fees", "Instant activation", "Client-side encryption", "GDPR principles applied"].map((t, i) => (
              <span key={i} className="flex items-center space-x-1.5">
                <Check className="h-3.5 w-3.5 text-success" />
                <span>{t}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
