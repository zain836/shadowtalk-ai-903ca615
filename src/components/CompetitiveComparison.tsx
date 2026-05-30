import { Shield, Wifi, WifiOff, Server, Lock, Eye, Image, Search, MessageCircle, Sparkles, Brain, Zap } from "lucide-react";
import { FREE_TIER_DAILY } from "@/lib/productClaims";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";

const competitorCardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const CompetitiveComparison = () => {
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: "-80px" });
  const { hoverLift, variants, viewport } = useLandingMotion();

  const detailedComparisons = [
    {
      competitor: "ChatGPT",
      weaknesses: ["Agent features locked behind expensive tiers", "Limited tool orchestration in free tier", "Pro tier costs $200/mo"],
      shadowAdvantages: ["Agentic Task Runner + Mission Control", "30+ tools from natural language", "Elite tier at a fraction of ChatGPT Pro"],
      priceDiff: "More agents, lower cost",
    },
    {
      competitor: "Manus",
      weaknesses: ["Sandbox-only execution model", "No optional on-device privacy mode", "Premium agent pricing"],
      shadowAdvantages: ["Human-in-the-loop safety controls", "Multi-model consensus + tool graph", "Optional local AI when privacy matters"],
      priceDiff: "Agents + privacy choice",
    },
    {
      competitor: "Claude",
      weaknesses: ["No visual mission dashboard", "Partial agent workflows only", "No native offline option"],
      shadowAdvantages: ["Full agentic task runner", "Strategy Agent + Smart Scripts", "Optional on-device Gemma"],
      priceDiff: "Deeper agent stack",
    },
  ];

  const architectureComparisons = [
    {
      feature: "Agentic Execution",
      shadowtalk: { label: "Task Runner + Mission Control", icon: Sparkles, advantage: true },
      competitors: { label: "Chat-only or limited agents", icon: MessageCircle },
    },
    {
      feature: "Tool Orchestration",
      shadowtalk: { label: "30+ tools, NL triggers", icon: Zap, advantage: true },
      competitors: { label: "Fewer integrated actions", icon: Server },
    },
    {
      feature: "Human-in-the-Loop",
      shadowtalk: { label: "Approve / reject agent steps", icon: Shield, advantage: true },
      competitors: { label: "Often auto-run only", icon: Eye },
    },
    {
      feature: "Multi-Model",
      shadowtalk: { label: "Gemini + GPT-class + modes", icon: Brain, advantage: true },
      competitors: { label: "Single vendor stack", icon: Server },
    },
    {
      feature: "Privacy Model",
      shadowtalk: { label: "Vault + optional on-device AI", icon: Lock, advantage: true },
      competitors: { label: "Cloud-only by default", icon: Eye },
    },
    {
      feature: "Offline Option",
      shadowtalk: { label: "Opt-in Gemma via WebGPU", icon: Wifi, advantage: true },
      competitors: { label: "Requires internet", icon: WifiOff },
    },
  ];

  const freeFeatures = [
    { icon: Sparkles, label: "Agentic Task Runner", competitor: "ChatGPT: paid agents" },
    { icon: MessageCircle, label: "50 messages/day", competitor: "ChatGPT: 20/day" },
    { icon: Search, label: "5 deep research/day", competitor: "Perplexity: 3/day" },
    { icon: Image, label: "4 images/day", competitor: "Claude: 0 free" },
  ];

  return (
    <section className="py-16 sm:py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <LandingSectionHeader
          badge={LANDING_COPY.comparison.badge}
          badgeIcon={Sparkles}
          title={
            <>
              {LANDING_COPY.comparison.title[0]}{" "}
              <span className="gradient-text">{LANDING_COPY.comparison.title[1]}</span>
            </>
          }
          subtitle={LANDING_COPY.comparison.subtitle}
        />

        {/* Competitor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto" style={{ perspective: "1000px" }}>
          {detailedComparisons.map((comp, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={competitorCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={hoverLift}
            >
              <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.2)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">vs {comp.competitor}</h3>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{comp.priceDiff}</Badge>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs font-medium text-destructive/80 uppercase tracking-wider mb-2">Their Weaknesses</p>
                    <ul className="space-y-1.5">
                      {comp.weaknesses.map((w, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 + j * 0.05 }}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-destructive/60 mt-0.5">✕</span> {w}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-2">ShadowTalk Wins</p>
                    <ul className="space-y-1.5">
                      {comp.shadowAdvantages.map((a, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.1 + j * 0.05 }}
                          className="text-sm text-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-0.5">✓</span> {a}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Free Tier Comparison */}
        <div className="max-w-3xl mx-auto mb-16">
          <motion.h3
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-2xl sm:text-3xl font-bold text-center mb-6"
          >
            The <span className="gradient-text">50/50 Rule</span>: 50% More Features, 50% Less Cost
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {freeFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                whileHover={hoverLift}
              >
                <Card className="border-primary/20 bg-primary/5 text-center hover:border-primary/40 transition-colors hover:shadow-[0_5px_20px_-10px_hsl(var(--primary)/0.3)]">
                  <CardContent className="p-4">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <f.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    </motion.div>
                    <p className="font-semibold text-sm text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-through">{f.competitor}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Architecture Comparison Table */}
        <div className="max-w-5xl mx-auto" ref={tableRef}>
          <motion.div
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 px-2 sm:px-4"
          >
            <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Metric</div>
            <div className="text-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground line-through">Others</span>
            </div>
            <div className="text-center">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 text-[10px] sm:text-xs">ShadowTalk AI</Badge>
            </div>
          </motion.div>

          <div className="space-y-3">
            {architectureComparisons.map((row, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={tableRowVariants}
                initial="hidden"
                animate={tableInView ? "visible" : "hidden"}
                whileHover={hoverLift}
              >
                <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.15)]">
                  <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                    <div className="font-semibold text-sm">{row.feature}</div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <row.competitors.icon className="h-4 w-4 text-destructive/60" />
                      <span>{row.competitors.label}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <motion.div
                        animate={tableInView ? { scale: [0, 1.2, 1] } : {}}
                        transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                      >
                        <row.shadowtalk.icon className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span className="font-medium text-foreground">{row.shadowtalk.label}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Edge AI Market Stat */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring" }}
          className="mt-16 text-center"
        >
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="inline-block border-primary/20 bg-primary/5 hover:border-primary/40 transition-all hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.25)]">
              <CardContent className="p-6 flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-4xl font-bold gradient-text"
                >
                  $102.97B
                </motion.div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Agentic AI is the next wave</p>
                  <p className="text-sm text-muted-foreground">ShadowTalk combines autonomous agents, tool orchestration, and optional on-device privacy — not just another chat box.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CompetitiveComparison;
