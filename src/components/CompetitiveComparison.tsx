import { Shield, ShieldOff, Wifi, WifiOff, DollarSign, Server, Smartphone, Lock, Eye, EyeOff, Image, Search, MessageCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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

  const detailedComparisons = [
    {
      competitor: "ChatGPT",
      weaknesses: ["Privacy concerns — data used for training", "Requires internet — no offline mode", "High cost ($20/mo Plus, $200/mo Pro)"],
      shadowAdvantages: ["Stealth Vault (E2E encrypted)", "Full Offline Mode via WebGPU", "75% cheaper Elite plan ($20/mo)"],
      priceDiff: "75% cheaper",
    },
    {
      competitor: "Claude",
      weaknesses: ["Limited image generation in free tier", "No native offline mode", "No autonomous agent framework"],
      shadowAdvantages: ["4 free images/day", "Dedicated on-device engine", "Strategy Agent + Smart Scripts"],
      priceDiff: "More generous free tier",
    },
    {
      competitor: "Perplexity",
      weaknesses: ["High privacy risks & data retention", "Expensive Pro plan ($20/mo)", "No local inference capability"],
      shadowAdvantages: ["Zero-knowledge, privacy-first", "Pay-per-solution options available", "On-device AI OS architecture"],
      priceDiff: "Privacy-first alternative",
    },
  ];

  const architectureComparisons = [
    {
      feature: "Data Control",
      shadowtalk: { label: "User-Owned (Stealth Vault)", icon: Lock, advantage: true },
      competitors: { label: "Corporate Servers (High Risk)", icon: Eye },
    },
    {
      feature: "Availability",
      shadowtalk: { label: "100% Offline (Resilient)", icon: Wifi, advantage: true },
      competitors: { label: "Requires Internet (Fragile)", icon: WifiOff },
    },
    {
      feature: "Cost Scalability",
      shadowtalk: { label: "Zero Marginal Inference Cost", icon: DollarSign, advantage: true },
      competitors: { label: "High Marginal Cost per User", icon: DollarSign },
    },
    {
      feature: "Architecture",
      shadowtalk: { label: "On-Device AI OS / Platform", icon: Smartphone, advantage: true },
      competitors: { label: "SaaS Application", icon: Server },
    },
    {
      feature: "Privacy Model",
      shadowtalk: { label: "Zero-Knowledge, E2E Encrypted", icon: EyeOff, advantage: true },
      competitors: { label: "Data Harvested for Training", icon: Eye },
    },
    {
      feature: "Security Posture",
      shadowtalk: { label: "Air-Gapped Capable", icon: Shield, advantage: true },
      competitors: { label: "Cloud-Dependent", icon: ShieldOff },
    },
  ];

  const freeFeatures = [
    { icon: MessageCircle, label: "50 messages/day", competitor: "ChatGPT: 20/day" },
    { icon: Image, label: "4 images/day", competitor: "Claude: 0 free" },
    { icon: Search, label: "5 deep research/day", competitor: "Perplexity: 3/day" },
    { icon: Sparkles, label: "Offline AI included", competitor: "Others: $20+/mo" },
  ];

  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-destructive/50 text-destructive">
              <EyeOff className="h-3.5 w-3.5 mr-2" />
              The Anti-Spyware AI
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Why Creators & CEOs Are{" "}
            <span className="gradient-text">Switching to ShadowTalk</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            ChatGPT's market share dropped from 87% to 68% as users seek privacy-first alternatives. ShadowTalk delivers <strong className="text-foreground">Sovereign Intelligence</strong> — cloud-quality AI without the cloud.
          </motion.p>
        </div>

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
              whileHover={{
                y: -10,
                scale: 1.03,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-6"
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
                whileHover={{
                  y: -5,
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 400 },
                }}
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
          <div className="grid grid-cols-3 gap-4 mb-6 px-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Metric</div>
            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground line-through">ChatGPT / Claude / Perplexity</span>
            </div>
            <div className="text-center">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">ShadowTalk AI</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {architectureComparisons.map((row, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={tableRowVariants}
                initial="hidden"
                animate={tableInView ? "visible" : "hidden"}
                whileHover={{
                  scale: 1.01,
                  x: 4,
                  transition: { type: "spring", stiffness: 400 },
                }}
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
                  <p className="font-semibold text-foreground">Edge AI Market by 2030</p>
                  <p className="text-sm text-muted-foreground">ShadowTalk is built for this shift — the On-Device AI OS for the post-cloud era.</p>
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
