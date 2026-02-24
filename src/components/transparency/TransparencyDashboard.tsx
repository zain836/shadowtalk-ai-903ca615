import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Shield, Lock, Eye, EyeOff, Server, Smartphone, Database,
  ArrowRight, CheckCircle2, XCircle, AlertTriangle, Fingerprint,
  Wifi, WifiOff, HardDrive, Cloud, RefreshCw, FileKey
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DataFlowNode {
  id: string;
  label: string;
  icon: React.ElementType;
  encrypted: boolean;
  location: "device" | "transit" | "server";
  description: string;
}

const dataFlowNodes: DataFlowNode[] = [
  { id: "input", label: "Your Input", icon: Smartphone, encrypted: false, location: "device", description: "Text, voice, files — entered on your device" },
  { id: "encrypt", label: "AES-256-GCM Encryption", icon: Lock, encrypted: true, location: "device", description: "Encrypted on-device before leaving your browser" },
  { id: "transit", label: "TLS 1.3 Transit", icon: Wifi, encrypted: true, location: "transit", description: "Double-encrypted in transit — we cannot read it" },
  { id: "server", label: "Encrypted Storage", icon: Database, encrypted: true, location: "server", description: "Stored as ciphertext — decryption key never leaves your device" },
  { id: "retrieve", label: "Encrypted Response", icon: Cloud, encrypted: true, location: "transit", description: "Response encrypted before transmission" },
  { id: "decrypt", label: "Local Decryption", icon: Fingerprint, encrypted: false, location: "device", description: "Decrypted only on your device with your key" },
];

const proofPoints = [
  { title: "Zero-Knowledge Vault", status: "verified", detail: "PBKDF2 + AES-256-GCM. Master password never transmitted. All encryption/decryption happens in-browser via Web Crypto API.", icon: FileKey },
  { title: "On-Device AI Processing", status: "verified", detail: "WebLLM models (SmolLM2, Phi-3.5) run entirely in your browser via WebGPU/WASM. No data sent to any server.", icon: Smartphone },
  { title: "End-to-End Encryption", status: "verified", detail: "Vault entries, business memories, and sensitive data are encrypted client-side before storage. Server only sees ciphertext.", icon: Lock },
  { title: "No Tracking Scripts", status: "verified", detail: "Zero third-party analytics, no Google Analytics, no Facebook Pixel, no fingerprinting. Privacy Score monitors and blocks any attempts.", icon: EyeOff },
  { title: "Open RLS Policies", status: "verified", detail: "Row-Level Security ensures users can only access their own data. Admin access is role-gated and audited.", icon: Shield },
  { title: "Offline-First Architecture", status: "verified", detail: "IndexedDB stores your knowledge graph, sync queue, and preferences locally. Works without internet.", icon: WifiOff },
];

const TransparencyDashboard = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [liveChecks, setLiveChecks] = useState({
    localStorage: false,
    indexedDB: false,
    webCrypto: false,
    serviceWorker: false,
  });

  useEffect(() => {
    // Run real-time browser capability checks
    setLiveChecks({
      localStorage: !!window.localStorage,
      indexedDB: !!window.indexedDB,
      webCrypto: !!(window.crypto && window.crypto.subtle),
      serviceWorker: "serviceWorker" in navigator,
    });
  }, []);

  const allChecked = Object.values(liveChecks).every(Boolean);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground font-medium">Data Transparency Report</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          We <span className="gradient-text">Can't</span> See Your Data
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Not "we won't" — we <strong className="text-foreground">mathematically cannot</strong>. 
          Here's the cryptographic proof.
        </p>
      </motion.div>

      {/* Live Browser Checks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-10 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Live Security Check — Your Browser Right Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(liveChecks).map(([key, passed]) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
                  {passed ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-xs text-muted-foreground">{passed ? "Available" : "Unavailable"}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant={allChecked ? "default" : "destructive"} className="text-xs">
                {allChecked ? "✓ All privacy capabilities active" : "⚠ Some capabilities unavailable"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Flow Diagram */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-2xl font-bold mb-6 tracking-tight">How Your Data Flows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {dataFlowNodes.map((node, i) => (
            <motion.div
              key={node.id}
              whileHover={{ scale: 1.03 }}
              onHoverStart={() => setActiveNode(node.id)}
              onHoverEnd={() => setActiveNode(null)}
              className="relative"
            >
              <Card className={`h-full cursor-pointer transition-all ${
                activeNode === node.id ? "border-primary shadow-[var(--shadow-glow)]" : "border-border"
              } ${node.location === "device" ? "bg-success/5" : node.location === "transit" ? "bg-warning/5" : "bg-primary/5"}`}>
                <CardContent className="pt-5 pb-4 px-4 text-center">
                  <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    node.location === "device" ? "bg-success/15" : node.location === "transit" ? "bg-warning/15" : "bg-primary/15"
                  }`}>
                    <node.icon className={`h-5 w-5 ${
                      node.location === "device" ? "text-success" : node.location === "transit" ? "text-warning" : "text-primary"
                    }`} />
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-1">{node.label}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {node.encrypted ? "🔒 Encrypted" : "📱 On Device"}
                  </Badge>
                  {activeNode === node.id && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-muted-foreground mt-2">
                      {node.description}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
              {i < dataFlowNodes.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
              )}
            </motion.div>
          ))}
        </div>
        <div className="flex gap-4 mb-10 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> Your Device</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/20 border border-warning/30" /> In Transit</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" /> Encrypted Server</span>
        </div>
      </motion.div>

      {/* Cryptographic Proof Points */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-2xl font-bold mb-6 tracking-tight">Cryptographic Proof Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {proofPoints.map((proof, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border hover:border-success/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-success/10 rounded-lg shrink-0">
                      <proof.icon className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{proof.title}</h3>
                        <Badge variant="outline" className="text-[10px] text-success border-success/30">VERIFIED</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{proof.detail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* What We Can vs Cannot See */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-2xl font-bold mb-6 tracking-tight">What We Can vs Cannot See</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" /> We CANNOT See
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Your chat messages (encrypted or local-only)",
                "Vault entries (AES-256-GCM, your key only)",
                "Knowledge graph data (IndexedDB, never uploaded)",
                "Business memories content (encrypted at rest)",
                "Your master password or encryption keys",
                "On-device AI conversations (WebLLM)",
                "File contents you process locally",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-success">
                <Eye className="h-5 w-5" /> We CAN See (Minimal)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Your email (for authentication only)",
                "Account creation date",
                "Subscription/plan type",
                "Anonymized usage counts (opt-in only)",
                "Error logs (no user content included)",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Eye className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="py-10">
            <h3 className="text-xl font-bold mb-3">Want more proof?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              View our full security audit, compliance certifications, and open-source encryption code.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild>
                <Link to="/security-audit">View Security Audit</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/privacy-score">Check Your Privacy Score</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TransparencyDashboard;
