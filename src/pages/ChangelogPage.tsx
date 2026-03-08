import { useState } from "react";
import { ArrowLeft, Sparkles, Bug, Zap, Shield, Calendar, Tag, ChevronDown, ChevronUp, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useChangelogEntries } from "@/hooks/useCMSContent";
import { format } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// Fallback changelog when DB is empty
const FALLBACK_CHANGELOG = [
  { id: "1", version: "3.1.0", published_at: "2026-02-17", title: "Real AI-Powered Proactive Intelligence", description: "Replaced all mock/hardcoded proactive messages with real AI-generated contextual insights.", change_type: "feature", tags: ["ai", "proactive"] },
  { id: "2", version: "3.0.0", published_at: "2025-01-19", title: "ShadowBrowser & Browse Together Mode", description: "Revolutionary AI-powered browser integration with real-time browsing assistance.", change_type: "feature", tags: ["browser", "ai"] },
  { id: "3", version: "2.6.0", published_at: "2025-01-10", title: "Deep Research & Advanced Analytics", description: "Professional research tools and comprehensive usage analytics.", change_type: "feature", tags: ["research", "analytics"] },
  { id: "4", version: "2.5.0", published_at: "2024-12-15", title: "Collaborative Rooms & PWA Support", description: "Real-time collaboration and mobile app experience.", change_type: "feature", tags: ["collaboration", "pwa"] },
  { id: "5", version: "2.0.0", published_at: "2024-12-10", title: "ShadowTalk AI Launch", description: "Initial release of the AI chatbot platform.", change_type: "feature", tags: ["launch"] },
];

const getChangeIcon = (type: string) => {
  switch (type) {
    case "feature": return <Sparkles className="h-4 w-4 text-primary" />;
    case "improvement": return <Zap className="h-4 w-4 text-secondary" />;
    case "bugfix": return <Bug className="h-4 w-4 text-destructive" />;
    case "security": return <Shield className="h-4 w-4 text-accent" />;
    default: return <Sparkles className="h-4 w-4" />;
  }
};

const getChangeBadge = (type: string) => {
  switch (type) {
    case "feature": return <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">New</Badge>;
    case "improvement": return <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[10px]">Improved</Badge>;
    case "bugfix": return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Fixed</Badge>;
    case "security": return <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">Security</Badge>;
    default: return null;
  }
};

const ChangelogPage = () => {
  const navigate = useNavigate();
  const { entries: dbEntries, isLoading } = useChangelogEntries();

  const entries = dbEntries.length > 0 ? dbEntries : FALLBACK_CHANGELOG;
  const [expandedVersions, setExpandedVersions] = useState<string[]>(entries.length > 0 ? [entries[0].version] : []);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) =>
      prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      <header className="border-b border-border/50 glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Changelog</h1>
            <p className="text-sm text-muted-foreground">What's new in ShadowTalk AI</p>
          </div>
        </div>
      </header>

      <section className="pt-12 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
              <Rocket className="h-3 w-3 mr-1" /> Release Notes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
              Every improvement, <span className="gradient-text">documented</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Track our journey of continuous innovation and new capabilities
            </p>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border/40 to-transparent hidden md:block" />

            <div className="space-y-5">
              {entries.map((entry, index) => (
                <motion.div key={entry.id || entry.version} custom={index} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Card className="card-glass relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute left-[19px] top-7 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)] hidden md:block transform -translate-x-1/2 z-10" />

                    <CardHeader className="cursor-pointer md:ml-10 relative z-10" onClick={() => toggleVersion(entry.version)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="font-mono glass-subtle border-primary/20 text-primary">
                            <Tag className="h-3 w-3 mr-1" />v{entry.version}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {entry.published_at ? format(new Date(entry.published_at), 'MMMM d, yyyy') : ''}
                          </div>
                          {index === 0 && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Latest</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 shrink-0">
                          {expandedVersions.includes(entry.version) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                      <CardTitle className="text-lg mt-2 tracking-tight group-hover:text-primary transition-colors">{entry.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    </CardHeader>

                    <AnimatePresence>
                      {expandedVersions.includes(entry.version) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <CardContent className="md:ml-10 pt-0 relative z-10">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-muted/30 transition-colors text-sm">
                              {getChangeIcon(entry.change_type)}
                              <span className="flex-1 text-foreground/90">{entry.description}</span>
                              {getChangeBadge(entry.change_type)}
                            </div>
                            {entry.tags && (entry.tags as string[]).length > 0 && (
                              <div className="flex gap-1 mt-2 ml-2">
                                {(entry.tags as string[]).map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[10px] border-border/30">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} className="mt-16">
          <div className="glass-subtle rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2 tracking-tight">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Follow our changelog to stay informed about the latest features and improvements.
            </p>
            <Button className="btn-glow" onClick={() => navigate("/chatbot")}>Try Latest Features</Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ChangelogPage;
