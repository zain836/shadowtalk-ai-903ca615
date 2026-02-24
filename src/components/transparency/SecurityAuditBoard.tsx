import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Shield, Lock, FileText, ExternalLink, CheckCircle2,
  Code2, Globe, Server, KeyRound, FileCheck, Scale
} from "lucide-react";

const complianceItems = [
  { framework: "GDPR", status: "compliant", detail: "All data processing compliant with EU General Data Protection Regulation. Right to erasure, data portability, and consent management implemented.", region: "EU" },
  { framework: "CCPA", status: "compliant", detail: "California Consumer Privacy Act compliance. Users can opt out of data collection, request deletion, and view collected data.", region: "US" },
  { framework: "SOC 2 Type II", status: "in-progress", detail: "Security, availability, and confidentiality controls under audit. Zero-knowledge architecture exceeds most requirements.", region: "Global" },
  { framework: "HIPAA Ready", status: "architecture-ready", detail: "Client-side encryption and zero-knowledge design meet HIPAA technical safeguards. BAA available for enterprise.", region: "US" },
];

const encryptionSpecs = [
  { algo: "AES-256-GCM", use: "Vault & data at rest", strength: "Military-grade symmetric encryption", bits: 256 },
  { algo: "PBKDF2-SHA256", use: "Key derivation", strength: "100,000 iterations, per-entry salt", bits: 256 },
  { algo: "TLS 1.3", use: "Data in transit", strength: "Forward secrecy, zero round-trip", bits: 256 },
  { algo: "Web Crypto API", use: "Browser-native crypto", strength: "Hardware-backed, no JS polyfills", bits: null },
  { algo: "WebAuthn/FIDO2", use: "Biometric auth", strength: "Hardware security keys & biometrics", bits: null },
];

const openSourceRefs = [
  { name: "Encryption Engine", file: "src/hooks/useStealthVault.ts", desc: "AES-256-GCM encryption/decryption with PBKDF2 key derivation" },
  { name: "Privacy Score Monitor", file: "src/hooks/usePrivacyScore.ts", desc: "Real-time tracker blocking and privacy event monitoring" },
  { name: "Zero-Knowledge Sync", file: "src/hooks/useZeroKnowledgeSync.ts", desc: "Offline-first sync queue with encrypted payloads" },
  { name: "Kill Switch", file: "src/hooks/useStealthKillSwitch.ts", desc: "Emergency network traffic blocker for complete isolation" },
  { name: "RLS Policies", file: "supabase/migrations/", desc: "Row-Level Security ensuring data isolation per user" },
  { name: "Security Policy", file: "security.txt", desc: "Vulnerability disclosure and security contact information" },
];

const SecurityAuditBoard = () => {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
          <FileCheck className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground font-medium">Security Audit Report</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Open <span className="gradient-text">Security Audit</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Full transparency into our encryption, compliance, and security practices. 
          Verify everything — trust nothing blindly.
        </p>
      </motion.div>

      {/* Compliance Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" /> Compliance & Certifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {complianceItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-foreground">{item.framework}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{item.region}</Badge>
                      <Badge className={`text-[10px] ${
                        item.status === "compliant" ? "bg-success/15 text-success border-success/30" :
                        item.status === "in-progress" ? "bg-warning/15 text-warning border-warning/30" :
                        "bg-primary/15 text-primary border-primary/30"
                      }`}>
                        {item.status === "compliant" ? "✓ Compliant" : 
                         item.status === "in-progress" ? "⏳ In Progress" : "🏗 Architecture Ready"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Encryption Specifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-secondary" /> Encryption Specifications
        </h2>
        <Card className="mb-12">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Algorithm</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Use Case</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Strength</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Bits</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {encryptionSpecs.map((spec, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <code className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded">{spec.algo}</code>
                      </td>
                      <td className="p-4 text-foreground">{spec.use}</td>
                      <td className="p-4 text-muted-foreground">{spec.strength}</td>
                      <td className="p-4">
                        {spec.bits ? (
                          <Badge variant="outline" className="text-xs">{spec.bits}-bit</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Native</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Open Source Code References */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Code2 className="h-6 w-6 text-accent" /> Open Source Code References
        </h2>
        <p className="text-muted-foreground mb-6">
          Our encryption and security code is inspectable. Here are the exact files that handle your data protection:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
          {openSourceRefs.map((ref, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border hover:border-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                      <FileText className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{ref.name}</h3>
                      <code className="text-xs text-primary/80 font-mono break-all">{ref.file}</code>
                      <p className="text-xs text-muted-foreground mt-1">{ref.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Security Contact */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="py-10 text-center">
            <Globe className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Found a Vulnerability?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We take security seriously. Report vulnerabilities responsibly and get acknowledged.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="outline" className="gap-2">
                <Lock className="h-4 w-4" />
                security@shadowtalk.ai
              </Button>
              <Button variant="outline" asChild>
                <a href="/.well-known/security.txt" target="_blank" rel="noopener noreferrer" className="gap-2">
                  <FileText className="h-4 w-4" />
                  security.txt
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SecurityAuditBoard;
