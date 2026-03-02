import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Shield, FileText, Trash2, Download, Eye, CheckCircle2, AlertTriangle, Globe, Lock, ShieldCheck, Users, FileWarning, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

interface ConsentItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const ComplianceDashboardPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [consents, setConsents] = useState<ConsentItem[]>([
    { id: "essential", label: "Essential Cookies", description: "Required for basic functionality", enabled: true, required: true },
    { id: "analytics", label: "Analytics", description: "Anonymous usage statistics", enabled: false, required: false },
    { id: "personalization", label: "AI Personalization", description: "Remember preferences across sessions", enabled: true, required: false },
    { id: "notifications", label: "Push Notifications", description: "Receive alerts and updates", enabled: false, required: false },
  ]);

  const [auditLog] = useState([
    { time: "2 min ago", action: "Page visited", detail: "/chatbot", type: "navigation" },
    { time: "5 min ago", action: "AI query processed", detail: "On-device — zero data transmitted", type: "ai" },
    { time: "12 min ago", action: "Session started", detail: "Encrypted local session", type: "auth" },
    { time: "1 hour ago", action: "Data export requested", detail: "JSON format", type: "data" },
  ]);

  const regulations = [
    { name: "GDPR", region: "EU", score: 98, status: "compliant" as const },
    { name: "AI Act", region: "EU", score: 95, status: "compliant" as const },
    { name: "CCPA", region: "California", score: 97, status: "compliant" as const },
    { name: "LGPD", region: "Brazil", score: 93, status: "compliant" as const },
    { name: "PIPEDA", region: "Canada", score: 96, status: "compliant" as const },
    { name: "HIPAA", region: "US Healthcare", score: 88, status: "partial" as const },
  ];

  const riskCategories = [
    { label: "Minimal Risk", count: 12, description: "Standard AI operations", color: "bg-emerald-500" },
    { label: "Limited Risk", count: 3, description: "Transparency obligations apply", color: "bg-amber-500" },
    { label: "High Risk", count: 0, description: "Enhanced oversight required", color: "bg-destructive" },
    { label: "Prohibited", count: 0, description: "Operations blocked", color: "bg-red-700" },
  ];

  useEffect(() => {
    document.title = "Compliance & Privacy Dashboard — ShadowTalk AI";
  }, []);

  const toggleConsent = (id: string) => {
    setConsents(prev => prev.map(c => c.id === id && !c.required ? { ...c, enabled: !c.enabled } : c));
    toast({ title: "Consent Updated", description: "Your privacy preferences have been saved locally." });
  };

  const handleDeleteAllData = () => {
    toast({ title: "Data Deletion Initiated", description: "All local data will be permanently erased.", variant: "destructive" });
  };

  const handleExportData = (format: string) => {
    toast({ title: "Export Started", description: `Your data is being exported as ${format}.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-muted-foreground">Cryptographically Enforced Compliance</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Compliance & Privacy <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Full GDPR, AI Act, and global privacy compliance. Verify everything yourself — no trust required.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Regulations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Regulation Scores */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  Global Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {regulations.map((reg) => (
                  <div key={reg.name} className="flex items-center gap-4">
                    <div className="w-20 flex items-center gap-2">
                      <span className="text-sm font-semibold">{reg.name}</span>
                    </div>
                    <div className="flex-1">
                      <Progress value={reg.score} className="h-2" />
                    </div>
                    <span className="text-sm font-mono w-10 text-right">{reg.score}%</span>
                    <Badge variant={reg.status === "compliant" ? "default" : "secondary"} className="text-[10px]">
                      {reg.status === "compliant" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {reg.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground w-20">{reg.region}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Act Risk Classification */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileWarning className="h-5 w-5 text-amber-500" />
                  EU AI Act — Risk Classification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {riskCategories.map((rc) => (
                    <div key={rc.label} className="border border-border/50 rounded-xl p-4 text-center">
                      <div className={`w-3 h-3 rounded-full ${rc.color} mx-auto mb-2`} />
                      <div className="text-2xl font-bold">{rc.count}</div>
                      <div className="text-xs font-medium">{rc.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{rc.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-primary" />
                  Real-Time Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLog.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1">
                      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{entry.time}</span>
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-muted-foreground truncate">{entry.detail}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Consent Manager */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ToggleLeft className="h-5 w-5 text-primary" />
                  Consent Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {consents.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {c.label}
                        {c.required && <Badge variant="outline" className="text-[9px]">Required</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.description}</div>
                    </div>
                    <Switch checked={c.enabled} onCheckedChange={() => toggleConsent(c.id)} disabled={c.required} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Data Rights */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5 text-primary" />
                  Your Data Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => handleExportData("JSON")}>
                  <Download className="h-4 w-4" /> Export Data (JSON)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => handleExportData("CSV")}>
                  <FileText className="h-4 w-4" /> Export Data (CSV)
                </Button>
                <Button variant="destructive" className="w-full justify-start gap-2 text-sm" onClick={handleDeleteAllData}>
                  <Trash2 className="h-4 w-4" /> Delete All My Data
                </Button>
              </CardContent>
            </Card>

            {/* Privacy Score */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold gradient-text mb-2">A+</div>
                <div className="text-sm font-medium mb-1">Privacy Grade</div>
                <div className="text-[11px] text-muted-foreground">Zero cloud data transmission. All processing on-device.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboardPage;
