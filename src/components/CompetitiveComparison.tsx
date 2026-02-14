import { Shield, ShieldOff, Wifi, WifiOff, DollarSign, Server, Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CompetitiveComparison = () => {
  const comparisons = [
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

  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-destructive/50 text-destructive">
            <EyeOff className="h-3.5 w-3.5 mr-2" />
            Your AI Doesn't Watch You
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Creators & CEOs Are{" "}
            <span className="gradient-text">Switching to ShadowTalk</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Centralized AI monopolies charge you monthly while harvesting your data. ShadowTalk gives you <strong className="text-foreground">Sovereign Intelligence</strong> — cloud-quality AI without the cloud.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-6 px-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Metric</div>
            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground line-through">ChatGPT / Claude / Gemini</span>
            </div>
            <div className="text-center">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">ShadowTalk AI</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {comparisons.map((row, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                  <div className="font-semibold text-sm">{row.feature}</div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <row.competitors.icon className="h-4 w-4 text-destructive/60" />
                    <span>{row.competitors.label}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <row.shadowtalk.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{row.shadowtalk.label}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Edge AI Market Stat */}
        <div className="mt-16 text-center">
          <Card className="inline-block border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="text-4xl font-bold gradient-text">$102.97B</div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Edge AI Market by 2030</p>
                <p className="text-sm text-muted-foreground">ShadowTalk is built for this shift — not against it.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveComparison;
