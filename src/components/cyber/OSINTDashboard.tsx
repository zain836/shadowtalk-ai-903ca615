import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe, Search, Server, Shield, ExternalLink,
  Eye, Fingerprint, MapPin, Clock, Loader2, Mail, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeaderAnalysis } from "@/hooks/useCyberData";
import { toast } from "sonner";

const osintTools = [
  { name: "Shodan", url: "https://www.shodan.io/search?query=", icon: Server, desc: "IoT/server search engine", color: "text-destructive" },
  { name: "Censys", url: "https://search.censys.io/search?resource=hosts&q=", icon: Globe, desc: "Internet-wide scan data", color: "text-primary" },
  { name: "VirusTotal", url: "https://www.virustotal.com/gui/search/", icon: Shield, desc: "Malware & URL scanning", color: "text-warning" },
  { name: "Hunter.io", url: "https://hunter.io/search/", icon: Mail, desc: "Email finder", color: "text-success" },
  { name: "Wayback Machine", url: "https://web.archive.org/web/*/", icon: Clock, desc: "Web archives", color: "text-secondary" },
  { name: "crt.sh", url: "https://crt.sh/?q=", icon: Fingerprint, desc: "Certificate transparency", color: "text-accent" },
  { name: "DNSDumpster", url: "https://dnsdumpster.com/", icon: MapPin, desc: "DNS recon", color: "text-primary" },
  { name: "SecurityTrails", url: "https://securitytrails.com/domain/", icon: Eye, desc: "DNS & IP intelligence", color: "text-warning" },
];

const dorksTemplates = [
  { category: "Sensitive Files", dorks: [
    'site:{target} filetype:env', 'site:{target} filetype:sql', 'site:{target} filetype:log',
    'site:{target} filetype:bak', 'site:{target} "index of /" "parent directory"',
  ]},
  { category: "Login & Admin", dorks: [
    'site:{target} inurl:admin', 'site:{target} inurl:login', 'site:{target} inurl:wp-admin',
    'site:{target} intitle:"dashboard"', 'site:{target} inurl:phpmyadmin',
  ]},
  { category: "API & Keys", dorks: [
    'site:{target} inurl:api', 'site:{target} "api_key" OR "apikey" OR "api-key"',
    'site:github.com "{target}" password OR secret OR token', 'site:pastebin.com "{target}"',
  ]},
  { category: "Cloud & Infra", dorks: [
    'site:s3.amazonaws.com "{target}"', 'site:blob.core.windows.net "{target}"',
    'site:storage.googleapis.com "{target}"', 'inurl:".env" "{target}"',
  ]},
];

interface HeaderResult {
  name: string;
  status: "present" | "missing";
  value?: string;
  severity: string;
}

function parseHeaderAnalysis(data: any): HeaderResult[] {
  const results: HeaderResult[] = [];
  if (!data?.files) return results;

  const headerFile = data.files.find((f: any) => f.name === "security-headers.txt");
  if (!headerFile?.content) return results;

  const lines = headerFile.content.split("\n");
  for (const line of lines) {
    const missingMatch = line.match(/\/\/ \[(\w+)\] MISSING: (.+?) \((.+?)\)/);
    if (missingMatch) {
      results.push({ name: missingMatch[2], status: "missing", severity: missingMatch[1] });
    }
    const okMatch = line.match(/\/\/ \[OK\] (.+?): (.+)/);
    if (okMatch) {
      results.push({ name: okMatch[1], status: "present", value: okMatch[2], severity: "OK" });
    }
    const disclosureMatch = line.match(/\/\/ \[MEDIUM\] Server reveals: (.+?): (.+)/);
    if (disclosureMatch) {
      results.push({ name: `Info Disclosure: ${disclosureMatch[1]}`, status: "missing", value: disclosureMatch[2], severity: "MEDIUM" });
    }
  }
  return results;
}

export default function OSINTDashboard() {
  const [target, setTarget] = useState("");
  const [activeTab, setActiveTab] = useState("tools");
  const [headerResults, setHeaderResults] = useState<HeaderResult[]>([]);
  const headerAnalysis = useHeaderAnalysis();

  const openTool = (baseUrl: string) => {
    if (!target.trim()) { toast.error("Enter a target first"); return; }
    window.open(baseUrl + encodeURIComponent(target), "_blank");
  };

  const copyDork = (dork: string) => {
    const resolved = dork.replace("{target}", target || "example.com");
    navigator.clipboard.writeText(resolved);
    toast.success("Dork copied to clipboard");
  };

  const openDork = (dork: string) => {
    const resolved = dork.replace("{target}", target || "example.com");
    window.open(`https://www.google.com/search?q=${encodeURIComponent(resolved)}`, "_blank");
  };

  const runHeaderScan = () => {
    if (!target.trim()) { toast.error("Enter a target domain first"); return; }
    const url = target.startsWith("http") ? target : `https://${target}`;
    headerAnalysis.mutate(url, {
      onSuccess: (data) => {
        const parsed = parseHeaderAnalysis(data);
        setHeaderResults(parsed);
        if (parsed.length === 0) toast.info("No header data found. The target may be unreachable.");
        else toast.success(`Analyzed ${parsed.length} security headers`);
      },
      onError: (e: Error) => toast.error("Scan failed", { description: e.message }),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="Enter target domain, IP, or email..." className="pl-10 h-12 font-mono text-sm bg-muted/30 border-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border rounded-xl p-1 h-auto">
          <TabsTrigger value="tools" className="text-xs py-2 px-4 rounded-lg">OSINT Tools</TabsTrigger>
          <TabsTrigger value="dorks" className="text-xs py-2 px-4 rounded-lg">Google Dorks</TabsTrigger>
          <TabsTrigger value="headers" className="text-xs py-2 px-4 rounded-lg">Header Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {osintTools.map((tool, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <Card className="border-border bg-card hover:border-primary/30 transition-all cursor-pointer group h-full" onClick={() => openTool(tool.url)}>
                  <CardContent className="p-4 text-center">
                    <div className="p-3 rounded-xl bg-muted w-fit mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                      <tool.icon className={cn("h-6 w-6", tool.color)} />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{tool.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-2.5 w-2.5" /> Open
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dorks">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {dorksTemplates.map((group, gi) => (
                <Card key={gi} className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="h-4 w-4 text-warning" />
                      {group.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {group.dorks.map((dork, di) => (
                      <div key={di} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <code className="flex-1 text-xs font-mono text-foreground/80">
                          {dork.replace("{target}", target || "example.com")}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] opacity-0 group-hover:opacity-100" onClick={() => copyDork(dork)}>Copy</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] opacity-0 group-hover:opacity-100" onClick={() => openDork(dork)}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-primary" /> Security Header Analysis
                </CardTitle>
                <Button size="sm" onClick={runHeaderScan} disabled={headerAnalysis.isPending || !target.trim()} className="gap-1.5 text-xs">
                  {headerAnalysis.isPending ? <><Loader2 className="h-3 w-3 animate-spin" /> Scanning...</> : <><Search className="h-3 w-3" /> Scan Headers</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {headerResults.length === 0 && !headerAnalysis.isPending ? (
                <div className="text-center py-8">
                  <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">Analyze Security Headers</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Enter a target domain above and click "Scan Headers" to check for HSTS, CSP, X-Frame-Options, and other security headers.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {headerResults.map((result, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          result.status === "present" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                        )}
                      >
                        {result.status === "present" ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          result.severity === "HIGH" ? <XCircle className="h-4 w-4 text-destructive shrink-0" /> : <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{result.name}</span>
                            <Badge className={cn("text-[9px] px-1.5 py-0",
                              result.severity === "OK" ? "bg-success/15 text-success border-success/30" :
                              result.severity === "HIGH" ? "bg-destructive/15 text-destructive border-destructive/30" :
                              "bg-warning/15 text-warning border-warning/30"
                            )}>{result.severity}</Badge>
                          </div>
                          {result.value && (
                            <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{result.value}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
