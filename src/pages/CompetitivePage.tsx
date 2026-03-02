import { useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Shield, Cloud, Globe, Code, Lock, Users, DollarSign, Cpu, Network, CheckCircle2, XCircle, Minus, ArrowRight, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5 },
  }),
};

const dimensions = [
  { label: "Data Sovereignty", shadow: "100% On-Device", kimi: "Cloud-dependent", macron: "Government-backed", icon: Lock },
  { label: "Reasoning Power", shadow: "Excellent", kimi: "Excellent", macron: "Good", icon: Cpu },
  { label: "Privacy", shadow: "Absolute", kimi: "Limited", macron: "Good", icon: Shield },
  { label: "Developer Ecosystem", shadow: "Thriving", kimi: "Moderate", macron: "Limited", icon: Code },
  { label: "Global Reach", shadow: "Worldwide", kimi: "Worldwide", macron: "EU-focused", icon: Globe },
  { label: "User Control", shadow: "Complete", kimi: "Limited", macron: "Limited", icon: Users },
  { label: "Cost", shadow: "Free / Low-cost", kimi: "Expensive", macron: "Moderate", icon: DollarSign },
  { label: "Customization", shadow: "Unlimited", kimi: "Limited", macron: "Limited", icon: Zap },
  { label: "Decentralization", shadow: "Complete", kimi: "None", macron: "Some", icon: Network },
  { label: "Community-Driven", shadow: "Yes", kimi: "No", macron: "No", icon: Crown },
];

const getRating = (val: string) => {
  const top = ["100% on-device", "excellent", "absolute", "thriving", "worldwide", "complete", "free / low-cost", "unlimited", "yes"];
  const mid = ["good", "moderate", "some", "government-backed", "eu-focused"];
  const low = ["limited", "cloud-dependent", "none", "no", "expensive"];
  const v = val.toLowerCase();
  if (top.some(t => v.includes(t))) return "top";
  if (mid.some(t => v.includes(t))) return "mid";
  if (low.some(t => v.includes(t))) return "low";
  return "mid";
};

const RatingIcon = ({ rating }: { rating: string }) => {
  if (rating === "top") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (rating === "mid") return <Minus className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const counterPoints = [
  {
    competitor: "Kimi 2.5",
    strengths: ["100+ parallel agents", "Advanced reasoning", "Native multimodal", "Enterprise automation"],
    counters: ["Distributed Agent Architecture — unlimited local agents, zero cloud", "On-device CoT optimization matching cloud quality", "Vision + audio processing locally via WebGPU", "Developer-first SDKs & community-driven tools"],
  },
  {
    competitor: "Macron AI",
    strengths: ["EU government backing", "Regulatory compliance", "Ethical AI framework", "Strategic autonomy"],
    counters: ["Decentralized governance — users vote on platform decisions", "Cryptographic compliance enforcement, not just policy", "User-defined ethics with real-time auditability", "Open-source core — truly independent, no government control"],
  },
];

const CompetitivePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "ShadowTalk AI vs Kimi 2.5 vs Macron AI — Competitive Comparison";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-8">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Competitive Intelligence Report</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Why ShadowTalk AI <span className="gradient-text">Dominates</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground max-w-3xl mx-auto">
            The future of AI isn't in the cloud — it's on your device. See how ShadowTalk AI outperforms Kimi 2.5 and Macron AI across every critical dimension.
          </motion.p>
        </div>
      </section>

      {/* Positioning Matrix */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-2xl font-bold mb-8 text-center">
            Competitive Positioning Matrix
          </motion.h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground w-1/4">Dimension</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground/60 w-1/4">Kimi 2.5</th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground/60 w-1/4">Macron AI</th>
                  <th className="text-center py-4 px-4 w-1/4">
                    <span className="text-sm font-bold gradient-text">ShadowTalk AI</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map((d, i) => (
                  <motion.tr key={d.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <d.icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium">{d.label}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <RatingIcon rating={getRating(d.kimi)} />
                        <span className="text-sm text-muted-foreground">{d.kimi}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <RatingIcon rating={getRating(d.macron)} />
                        <span className="text-sm text-muted-foreground">{d.macron}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <RatingIcon rating={getRating(d.shadow)} />
                        <span className="text-sm font-semibold text-foreground">{d.shadow}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Counter Strategies */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-2xl font-bold mb-10 text-center">
            Head-to-Head Counter Strategies
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {counterPoints.map((cp) => (
              <motion.div key={cp.competitor} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border border-border/50 rounded-2xl p-6 bg-card/50">
                <h3 className="text-lg font-bold mb-6">vs <span className="text-destructive">{cp.competitor}</span></h3>
                <div className="space-y-4">
                  {cp.strengths.map((s, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5 text-destructive/60 shrink-0" />
                        <span className="line-through opacity-70">{s}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm pl-5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-medium text-foreground">{cp.counters[i]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Differentiator */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20 rounded-2xl p-10">
            <Cloud className="h-12 w-12 text-primary mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-4">The Future of AI Is On-Device</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              ShadowTalk AI offers everything Kimi 2.5 and Macron AI do — but entirely on your device, with zero privacy compromise, globally available, user-controlled, and truly decentralized.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="btn-glow gap-2" onClick={() => navigate("/chatbot")}>
                Try ShadowTalk Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/pricing")}>
                View Pricing Plans
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CompetitivePage;
