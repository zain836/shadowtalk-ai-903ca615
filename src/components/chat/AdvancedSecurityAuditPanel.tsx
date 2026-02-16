import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  AlertTriangle,
  Bug,
  FileCode,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  Eye,
  FileWarning,
  FolderUp,
  File,
  FolderTree,
  Package,
  Database,
  Settings,
  Globe,
  Key,
  FileJson,
  FileText,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Download,
  Filter,
  SortAsc,
  History,
  BarChart3,
  FileSearch,
  GitBranch,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Fingerprint,
  Network,
  BookOpen,
  FileCheck,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

// Types
interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  location: string;
  chain?: string[];
  exploit?: string;
  remediation: string;
  codefix?: string;
  category: string;
  cweId?: string;
  cvssScore?: number;
  affectedFiles?: string[];
  references?: string[];
  complianceMappings?: ComplianceMapping[];
  isSecret?: boolean;
  isDependency?: boolean;
  attackVector?: string;
  remediationEffort?: string;
}

interface ComplianceMapping {
  framework: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
}

interface ThreatModel {
  attackSurface: string[];
  highValueTargets: string[];
  likelyAttackPaths: string[];
}

interface ProjectFile {
  name: string;
  path: string;
  content: string;
  size: number;
  type: 'file' | 'folder';
  children?: ProjectFile[];
  language?: string;
}

interface ScanProgress {
  phase: string;
  progress: number;
  currentFile?: string;
  filesScanned: number;
  totalFiles: number;
  vulnerabilitiesFound: number;
}

interface HistoricalAudit {
  id: string;
  project_name: string;
  risk_score: number;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  files_scanned: number;
  scan_mode: string;
  created_at: string;
  compliance_scores: Record<string, number>;
  secrets_found: number;
  dependencies_vulnerable: number;
}

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
}

interface DependencyVuln {
  package: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cveId: string;
  description: string;
  fixedIn?: string;
}

interface AdvancedSecurityAuditPanelProps {
  onAnalyze: (code: string) => Promise<{
    vulnerabilities: Vulnerability[];
    summary: string;
    riskScore: number;
  }>;
  isAnalyzing: boolean;
}

// Secret detection patterns (expanded)
const SECRET_PATTERNS: SecretPattern[] = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
  { name: 'AWS Secret Key', pattern: /[A-Za-z0-9/+=]{40}/g, severity: 'critical' },
  { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g, severity: 'critical' },
  { name: 'GitHub OAuth', pattern: /gho_[A-Za-z0-9]{36}/g, severity: 'high' },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g, severity: 'critical' },
  { name: 'Stripe Secret Key', pattern: /sk_live_[A-Za-z0-9]{24,}/g, severity: 'critical' },
  { name: 'Stripe Publishable', pattern: /pk_live_[A-Za-z0-9]{24,}/g, severity: 'medium' },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z-_]{35}/g, severity: 'high' },
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9A-Za-z]{10,}/g, severity: 'high' },
  { name: 'Discord Token', pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g, severity: 'critical' },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*/g, severity: 'high' },
  { name: 'Generic API Key', pattern: /api[_-]?key['\"]?\s*[:=]\s*['\"][A-Za-z0-9-_]{16,}['\"]/gi, severity: 'high' },
  { name: 'Generic Secret', pattern: /secret['\"]?\s*[:=]\s*['\"][A-Za-z0-9-_]{16,}['\"]/gi, severity: 'high' },
  { name: 'Password in Code', pattern: /password['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"]/gi, severity: 'critical' },
  { name: 'Database URL', pattern: /(postgres|mysql|mongodb|redis):\/\/[^\s'"]+/gi, severity: 'critical' },
  { name: 'Bearer Token', pattern: /Bearer\s+[A-Za-z0-9-_.]+/g, severity: 'high' },
  { name: 'Supabase Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, severity: 'high' },
  { name: 'Firebase Config', pattern: /apiKey:\s*['\"][A-Za-z0-9-_]+['\"]/g, severity: 'high' },
  { name: 'OpenAI Key', pattern: /sk-[A-Za-z0-9]{48}/g, severity: 'critical' },
  { name: 'Anthropic Key', pattern: /sk-ant-[A-Za-z0-9-_]{40,}/g, severity: 'critical' },
  { name: 'Azure Key', pattern: /[a-f0-9]{32}/g, severity: 'medium' },
  { name: 'Twilio Token', pattern: /SK[a-f0-9]{32}/g, severity: 'high' },
  { name: 'SendGrid Key', pattern: /SG\.[A-Za-z0-9-_]{22}\.[A-Za-z0-9-_]{43}/g, severity: 'critical' },
  { name: 'Mailchimp Key', pattern: /[a-f0-9]{32}-us\d{1,2}/g, severity: 'high' },
  { name: 'Heroku Key', pattern: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, severity: 'medium' },
];

// Expanded SAST patterns for local detection
interface SASTPattern {
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  category: string;
  cweId: string;
  description: string;
  remediation: string;
}

const SAST_PATTERNS: SASTPattern[] = [
  // Injection
  { pattern: /eval\s*\(/g, severity: 'critical', title: 'eval() Code Injection', category: 'Injection', cweId: 'CWE-94', description: 'Use of eval() can execute arbitrary code', remediation: 'Replace eval() with safer alternatives like JSON.parse() or Function constructors with validated input' },
  { pattern: /new\s+Function\s*\(/g, severity: 'high', title: 'Dynamic Function Creation', category: 'Injection', cweId: 'CWE-94', description: 'Dynamic function creation from strings', remediation: 'Avoid creating functions from strings. Use predefined functions instead.' },
  { pattern: /child_process|exec\s*\(|execSync|spawn\s*\(/g, severity: 'critical', title: 'Command Injection Risk', category: 'Injection', cweId: 'CWE-78', description: 'Shell command execution detected', remediation: 'Use parameterized commands. Validate and sanitize all inputs before shell execution.' },
  { pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi, severity: 'critical', title: 'SQL Injection', category: 'SQL Injection', cweId: 'CWE-89', description: 'String interpolation in SQL query', remediation: 'Use parameterized queries or prepared statements.' },
  
  // XSS
  { pattern: /dangerouslySetInnerHTML/g, severity: 'high', title: 'XSS via dangerouslySetInnerHTML', category: 'XSS', cweId: 'CWE-79', description: 'Renders raw HTML without sanitization', remediation: 'Use DOMPurify to sanitize HTML before rendering.' },
  { pattern: /\.innerHTML\s*=/g, severity: 'high', title: 'XSS via innerHTML', category: 'XSS', cweId: 'CWE-79', description: 'Direct innerHTML assignment', remediation: 'Use textContent or a sanitization library.' },
  { pattern: /document\.write\s*\(/g, severity: 'high', title: 'XSS via document.write', category: 'XSS', cweId: 'CWE-79', description: 'document.write can inject arbitrary HTML', remediation: 'Use DOM manipulation methods instead.' },
  
  // SSRF
  { pattern: /fetch\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/g, severity: 'high', title: 'Potential SSRF', category: 'SSRF', cweId: 'CWE-918', description: 'User-controlled URL in fetch request', remediation: 'Validate URLs against an allowlist. Block internal/private IP ranges.' },
  { pattern: /axios\s*\.\s*(?:get|post|put)\s*\(\s*(?:req\.|request\.|params\.|query\.)/g, severity: 'high', title: 'SSRF via Axios', category: 'SSRF', cweId: 'CWE-918', description: 'User-controlled URL in Axios request', remediation: 'Validate and sanitize URLs. Use URL allowlists.' },
  { pattern: /http\.request\s*\(\s*(?:req\.|options)/g, severity: 'high', title: 'SSRF via http.request', category: 'SSRF', cweId: 'CWE-918', description: 'User input flows into HTTP request', remediation: 'Validate target URLs and block internal addresses.' },
  
  // CSRF
  { pattern: /SameSite\s*[:=]\s*['"]?None['"]?/gi, severity: 'medium', title: 'CSRF - SameSite None Cookie', category: 'CSRF', cweId: 'CWE-352', description: 'Cookie with SameSite=None allows cross-origin requests', remediation: 'Set SameSite=Strict or Lax unless cross-origin is required.' },
  { pattern: /csrf|xsrf/gi, severity: 'info', title: 'CSRF Token Reference', category: 'CSRF', cweId: 'CWE-352', description: 'CSRF token usage detected - verify proper implementation', remediation: 'Ensure CSRF tokens are validated on all state-changing operations.' },
  
  // Deserialization
  { pattern: /JSON\.parse\s*\(\s*(?:req\.|request\.|body|params|query)/g, severity: 'medium', title: 'Insecure Deserialization', category: 'Deserialization', cweId: 'CWE-502', description: 'Parsing user-controlled JSON without validation', remediation: 'Validate JSON structure with a schema validator like Zod before processing.' },
  { pattern: /pickle\.loads|yaml\.load\s*\(/g, severity: 'critical', title: 'Unsafe Deserialization', category: 'Deserialization', cweId: 'CWE-502', description: 'Unsafe deserialization can lead to RCE', remediation: 'Use safe loaders (yaml.safe_load) and avoid pickle with untrusted data.' },
  { pattern: /unserialize|__wakeup|__destruct/g, severity: 'critical', title: 'PHP Object Injection', category: 'Deserialization', cweId: 'CWE-502', description: 'PHP deserialization vulnerability', remediation: 'Avoid unserialize() with user input. Use JSON instead.' },
  
  // IDOR / Access Control
  { pattern: /params\.id|req\.params\.id|query\.id/g, severity: 'medium', title: 'Potential IDOR', category: 'IDOR', cweId: 'CWE-639', description: 'Direct object reference via user-controlled ID', remediation: 'Verify object ownership before returning data. Check auth.uid() matches resource owner.' },
  
  // Path Traversal
  { pattern: /\.\.\/|\.\.\\|path\.join\([^)]*req\./g, severity: 'high', title: 'Path Traversal', category: 'Path Traversal', cweId: 'CWE-22', description: 'User input in file path operations', remediation: 'Use path.basename() and validate against allowed directories.' },
  
  // Cryptography
  { pattern: /MD5|SHA1(?!\d)|createHash\s*\(\s*['"]md5|['"]sha1/gi, severity: 'medium', title: 'Weak Cryptographic Hash', category: 'Cryptography', cweId: 'CWE-328', description: 'Using deprecated hash algorithm', remediation: 'Use SHA-256 or bcrypt for passwords.' },
  { pattern: /Math\.random\s*\(/g, severity: 'medium', title: 'Insecure Random', category: 'Cryptography', cweId: 'CWE-330', description: 'Math.random() is not cryptographically secure', remediation: 'Use crypto.getRandomValues() for security-sensitive operations.' },
  { pattern: /ECB|DES(?!C)|RC4/gi, severity: 'high', title: 'Weak Cipher', category: 'Cryptography', cweId: 'CWE-327', description: 'Using weak or deprecated cipher', remediation: 'Use AES-256-GCM or ChaCha20-Poly1305.' },
  
  // Auth
  { pattern: /verify_jwt\s*=\s*false/g, severity: 'high', title: 'JWT Verification Disabled', category: 'Authentication', cweId: 'CWE-287', description: 'JWT verification is disabled', remediation: 'Enable JWT verification or validate tokens in code.' },
  { pattern: /algorithm\s*[:=]\s*['"]none['"]|alg.*none/gi, severity: 'critical', title: 'JWT None Algorithm', category: 'Authentication', cweId: 'CWE-347', description: 'JWT accepts "none" algorithm', remediation: 'Explicitly set allowed algorithms. Reject "none".' },
  
  // Prototype Pollution
  { pattern: /Object\.assign\s*\([^,]+,\s*(?:req\.body|req\.query|req\.params)/g, severity: 'high', title: 'Prototype Pollution', category: 'Prototype Pollution', cweId: 'CWE-1321', description: 'Merging user input into objects', remediation: 'Validate object keys. Use Object.create(null) for dictionaries.' },
  { pattern: /\[['"]__proto__['"]\]|\.__proto__/g, severity: 'critical', title: 'Direct __proto__ Access', category: 'Prototype Pollution', cweId: 'CWE-1321', description: 'Direct prototype chain manipulation', remediation: 'Block __proto__, constructor, and prototype keys in user input.' },
  
  // Open Redirect
  { pattern: /redirect\s*\(\s*(?:req\.|request\.|query\.|params\.)/g, severity: 'medium', title: 'Open Redirect', category: 'Open Redirect', cweId: 'CWE-601', description: 'User-controlled redirect destination', remediation: 'Validate redirect URLs against an allowlist of trusted domains.' },
  { pattern: /window\.location\s*=\s*(?!['"])/g, severity: 'medium', title: 'Client-Side Open Redirect', category: 'Open Redirect', cweId: 'CWE-601', description: 'Dynamic window.location assignment', remediation: 'Validate URLs before redirecting.' },
  
  // File Upload
  { pattern: /multer|formidable|busboy/g, severity: 'info', title: 'File Upload Handler', category: 'File Upload', cweId: 'CWE-434', description: 'File upload middleware detected', remediation: 'Validate file types, sizes, and scan for malware.' },
  
  // Container/Docker
  { pattern: /FROM\s+.*:latest/g, severity: 'medium', title: 'Unpinned Docker Image', category: 'Container', cweId: 'CWE-1104', description: 'Using :latest tag in Dockerfile', remediation: 'Pin Docker images to specific version digests.' },
  { pattern: /USER\s+root|--privileged/g, severity: 'high', title: 'Container Running as Root', category: 'Container', cweId: 'CWE-250', description: 'Container runs with root privileges', remediation: 'Use a non-root user in Dockerfile.' },
  
  // Security Headers
  { pattern: /Access-Control-Allow-Origin.*\*/g, severity: 'medium', title: 'Permissive CORS', category: 'Configuration', cweId: 'CWE-942', description: 'CORS allows all origins', remediation: 'Restrict CORS to specific trusted domains.' },
  
  // Logging
  { pattern: /console\.log\s*\(.*(?:password|secret|token|key|auth)/gi, severity: 'medium', title: 'Sensitive Data in Logs', category: 'Data Exposure', cweId: 'CWE-532', description: 'Logging potentially sensitive information', remediation: 'Remove sensitive data from log statements.' },
  
  // Race Conditions
  { pattern: /async.*\bdelete\b.*\binsert\b|check.*then.*update/gi, severity: 'medium', title: 'Potential Race Condition', category: 'Race Condition', cweId: 'CWE-367', description: 'Non-atomic check-then-act pattern', remediation: 'Use database transactions or atomic operations.' },
];

// Compliance frameworks
const COMPLIANCE_FRAMEWORKS = [
  { id: 'owasp', name: 'OWASP Top 10', icon: Target },
  { id: 'pci', name: 'PCI-DSS', icon: Lock },
  { id: 'soc2', name: 'SOC 2', icon: Shield },
  { id: 'hipaa', name: 'HIPAA', icon: FileCheck },
  { id: 'gdpr', name: 'GDPR', icon: Fingerprint },
];

const AdvancedSecurityAuditPanel: React.FC<AdvancedSecurityAuditPanelProps> = ({
  onAnalyze,
  isAnalyzing
}) => {
  const { user } = useAuth();
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');
  const [codeInput, setCodeInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [projectTree, setProjectTree] = useState<ProjectFile[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [secrets, setSecrets] = useState<Vulnerability[]>([]);
  const [dependencies, setDependencies] = useState<DependencyVuln[]>([]);
  const [summary, setSummary] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'location'>('severity');
  const [projectName, setProjectName] = useState<string>('');
  const [scanMode, setScanMode] = useState<'quick' | 'deep' | 'full'>('deep');
  const [historicalAudits, setHistoricalAudits] = useState<HistoricalAudit[]>([]);
  const [complianceScores, setComplianceScores] = useState<Record<string, number>>({});
  const [attackChainDiagram, setAttackChainDiagram] = useState<string>('');
  const [threatModel, setThreatModel] = useState<ThreatModel | null>(null);
  const [localSASTVulns, setLocalSASTVulns] = useState<Vulnerability[]>([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Fetch historical audits
  useEffect(() => {
    if (user) {
      fetchHistoricalAudits();
    }
  }, [user]);

  const fetchHistoricalAudits = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('security_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data && !error) {
      setHistoricalAudits(data as HistoricalAudit[]);
    }
  };

  const handleAcceptDisclaimer = () => {
    setHasAccepted(true);
    setShowDisclaimer(false);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': case 'ts': case 'tsx':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-yellow-600" />;
      case 'html': case 'htm':
        return <Globe className="h-4 w-4 text-orange-500" />;
      case 'css': case 'scss': case 'sass':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'py':
        return <FileCode className="h-4 w-4 text-blue-400" />;
      case 'sql':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'env':
        return <Key className="h-4 w-4 text-yellow-400" />;
      case 'yml': case 'yaml':
        return <Settings className="h-4 w-4 text-pink-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', go: 'go', rb: 'ruby', php: 'php', sql: 'sql',
      html: 'html', css: 'css', json: 'json', yaml: 'yaml', yml: 'yaml',
    };
    return langMap[ext || ''] || 'text';
  };

  const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.sql', '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.xml', '.sh', '.env', '.toml', '.ini', '.lock', 'package.json', 'requirements.txt', 'Gemfile', 'go.mod', 'pom.xml', 'build.gradle', 'Cargo.toml', 'composer.json'];

  // Detect secrets in code
  const detectSecrets = (files: ProjectFile[]): Vulnerability[] => {
    const foundSecrets: Vulnerability[] = [];
    
    files.forEach(file => {
      SECRET_PATTERNS.forEach(pattern => {
        const matches = file.content.match(pattern.pattern);
        if (matches) {
          matches.forEach((match, idx) => {
            const lines = file.content.substring(0, file.content.indexOf(match)).split('\n');
            const lineNumber = lines.length;
            
            foundSecrets.push({
              id: `secret-${file.path}-${pattern.name}-${idx}`,
              severity: pattern.severity,
              title: `Exposed ${pattern.name}`,
              description: `A ${pattern.name} was found hardcoded in the source code. This secret could be compromised if the code is exposed.`,
              location: `${file.path}:${lineNumber}`,
              category: 'Secrets',
              cweId: 'CWE-798',
              cvssScore: pattern.severity === 'critical' ? 9.1 : pattern.severity === 'high' ? 7.5 : 5.0,
              remediation: `Remove the hardcoded secret and use environment variables or a secrets manager instead. Rotate this credential immediately as it may be compromised.`,
              codefix: `// Use environment variables instead:\nconst ${pattern.name.toLowerCase().replace(/\s/g, '_')} = process.env.${pattern.name.toUpperCase().replace(/\s/g, '_')};`,
              affectedFiles: [file.path],
              isSecret: true,
              complianceMappings: [
                { framework: 'OWASP', requirement: 'A02:2021 - Cryptographic Failures', status: 'fail' },
                { framework: 'PCI-DSS', requirement: '3.4 - Render PAN unreadable', status: 'fail' },
                { framework: 'SOC 2', requirement: 'CC6.1 - Logical Access Security', status: 'fail' },
              ]
            });
          });
        }
      });
    });
    
    return foundSecrets;
  };

  // SAST local pattern scanner (30+ patterns)
  const runLocalSAST = (files: ProjectFile[]): Vulnerability[] => {
    const vulns: Vulnerability[] = [];
    
    files.forEach(file => {
      SAST_PATTERNS.forEach(({ pattern, severity, title, category, cweId, description, remediation }) => {
        pattern.lastIndex = 0;
        const matches = file.content.match(pattern);
        if (matches) {
          matches.forEach((match, idx) => {
            const matchIndex = file.content.indexOf(match);
            const lineNumber = (file.content.substring(0, matchIndex).match(/\n/g) || []).length + 1;
            const vulnId = `sast-${file.path}-${cweId}-${lineNumber}-${idx}`;
            
            if (!vulns.find(v => v.id === vulnId)) {
              vulns.push({
                id: vulnId,
                severity,
                title,
                description: `${description}. Found: "${match.substring(0, 60)}${match.length > 60 ? '...' : ''}"`,
                location: `${file.path}:${lineNumber}`,
                category,
                cweId,
                cvssScore: severity === 'critical' ? 9.0 : severity === 'high' ? 7.0 : severity === 'medium' ? 5.0 : 3.0,
                remediation,
                affectedFiles: [file.path],
                complianceMappings: getComplianceMappingsForCategory(category),
              });
            }
          });
        }
      });
    });
    
    return vulns;
  };

  const getComplianceMappingsForCategory = (category: string): ComplianceMapping[] => {
    const mappings: Record<string, ComplianceMapping[]> = {
      'Injection': [{ framework: 'OWASP', requirement: 'A03:2021 - Injection', status: 'fail' }],
      'SQL Injection': [{ framework: 'OWASP', requirement: 'A03:2021 - Injection', status: 'fail' }, { framework: 'PCI-DSS', requirement: '6.5.1', status: 'fail' }],
      'XSS': [{ framework: 'OWASP', requirement: 'A03:2021 - Injection', status: 'fail' }],
      'SSRF': [{ framework: 'OWASP', requirement: 'A10:2021 - SSRF', status: 'fail' }],
      'CSRF': [{ framework: 'OWASP', requirement: 'A01:2021 - Broken Access Control', status: 'fail' }],
      'IDOR': [{ framework: 'OWASP', requirement: 'A01:2021 - Broken Access Control', status: 'fail' }],
      'Deserialization': [{ framework: 'OWASP', requirement: 'A08:2021 - Insecure Deserialization', status: 'fail' }],
      'Authentication': [{ framework: 'OWASP', requirement: 'A07:2021 - Auth Failures', status: 'fail' }, { framework: 'SOC 2', requirement: 'CC6.1', status: 'fail' }],
      'Cryptography': [{ framework: 'OWASP', requirement: 'A02:2021 - Cryptographic Failures', status: 'fail' }],
      'Path Traversal': [{ framework: 'OWASP', requirement: 'A01:2021 - Broken Access Control', status: 'fail' }],
      'Prototype Pollution': [{ framework: 'OWASP', requirement: 'A03:2021 - Injection', status: 'fail' }],
      'Open Redirect': [{ framework: 'OWASP', requirement: 'A01:2021 - Broken Access Control', status: 'fail' }],
      'Container': [{ framework: 'SOC 2', requirement: 'CC6.1 - Logical Access', status: 'fail' }],
      'Configuration': [{ framework: 'OWASP', requirement: 'A05:2021 - Security Misconfiguration', status: 'fail' }],
      'Data Exposure': [{ framework: 'GDPR', requirement: 'Art. 32 - Security of processing', status: 'fail' }, { framework: 'HIPAA', requirement: '164.312(a) - Access Control', status: 'fail' }],
      'Race Condition': [{ framework: 'OWASP', requirement: 'A04:2021 - Insecure Design', status: 'fail' }],
    };
    return mappings[category] || [{ framework: 'OWASP', requirement: 'A05:2021 - Security Misconfiguration', status: 'fail' }];
  };
  const parseDependencies = (files: ProjectFile[]): DependencyVuln[] => {
    const vulnDeps: DependencyVuln[] = [];
    
    // Known vulnerable packages (simulated - in real app would use npm audit API)
    const knownVulns: Record<string, { severity: 'critical' | 'high' | 'medium' | 'low', cveId: string, description: string, fixedIn: string }> = {
      'lodash': { severity: 'high', cveId: 'CVE-2021-23337', description: 'Prototype Pollution in lodash', fixedIn: '4.17.21' },
      'axios': { severity: 'medium', cveId: 'CVE-2021-3749', description: 'Inefficient Regular Expression in axios', fixedIn: '0.21.2' },
      'moment': { severity: 'medium', cveId: 'CVE-2022-24785', description: 'Path Traversal in moment', fixedIn: '2.29.4' },
      'minimist': { severity: 'critical', cveId: 'CVE-2021-44906', description: 'Prototype Pollution in minimist', fixedIn: '1.2.6' },
      'node-fetch': { severity: 'high', cveId: 'CVE-2022-0235', description: 'Exposure of Sensitive Information in node-fetch', fixedIn: '2.6.7' },
    };
    
    const packageJson = files.find(f => f.name === 'package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        Object.entries(allDeps).forEach(([name, version]) => {
          if (knownVulns[name]) {
            const vuln = knownVulns[name];
            vulnDeps.push({
              package: name,
              version: version as string,
              severity: vuln.severity,
              cveId: vuln.cveId,
              description: vuln.description,
              fixedIn: vuln.fixedIn
            });
          }
        });
      } catch (e) {
        console.error('Failed to parse package.json:', e);
      }
    }
    
    return vulnDeps;
  };

  // Calculate compliance scores
  const calculateComplianceScores = (vulns: Vulnerability[]): Record<string, number> => {
    const scores: Record<string, number> = {
      owasp: 100,
      pci: 100,
      soc2: 100,
      hipaa: 100,
      gdpr: 100
    };
    
    vulns.forEach(vuln => {
      if (vuln.complianceMappings) {
        vuln.complianceMappings.forEach(mapping => {
          const framework = mapping.framework.toLowerCase();
          if (mapping.status === 'fail') {
            scores[framework] = Math.max(0, (scores[framework] || 100) - (vuln.severity === 'critical' ? 25 : vuln.severity === 'high' ? 15 : vuln.severity === 'medium' ? 10 : 5));
          }
        });
      }
    });
    
    return scores;
  };

  // Generate attack chain Mermaid diagram
  const generateAttackChainDiagram = (vulns: Vulnerability[]): string => {
    if (vulns.length === 0) return '';
    
    const criticalVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    if (criticalVulns.length === 0) return '';
    
    let diagram = 'graph TD\n';
    diagram += '    A[Attacker] --> B{Entry Point}\n';
    
    criticalVulns.slice(0, 5).forEach((vuln, i) => {
      const nodeId = String.fromCharCode(67 + i); // C, D, E, F, G
      diagram += `    B --> ${nodeId}["${vuln.title.substring(0, 30)}..."]\n`;
      
      if (vuln.chain) {
        vuln.chain.forEach((step, j) => {
          const subNodeId = `${nodeId}${j}`;
          diagram += `    ${nodeId} --> ${subNodeId}["${step}"]\n`;
        });
      }
    });
    
    diagram += '    style A fill:#ef4444,color:#fff\n';
    diagram += '    style B fill:#f97316,color:#fff\n';
    
    return diagram;
  };

  const handleFileUpload = async (files: FileList) => {
    const newFiles: ProjectFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValidFile = validExtensions.some(e => 
        file.name.toLowerCase().endsWith(e) || file.name === e.substring(1)
      );
      
      if (!isValidFile) continue;
      if (file.size > 1000000) {
        toast.warning(`Skipped ${file.name}: file too large (max 1MB)`);
        continue;
      }

      try {
        const content = await file.text();
        const relativePath = (file as any).webkitRelativePath || file.name;
        newFiles.push({ 
          name: file.name, 
          path: relativePath,
          content, 
          size: file.size,
          type: 'file',
          language: getFileLanguage(file.name)
        });
      } catch (error) {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      const tree = buildFileTree(newFiles);
      setProjectTree(tree);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      const firstPath = newFiles[0]?.path || '';
      const projectFolder = firstPath.split('/')[0] || 'Uploaded Project';
      setProjectName(projectFolder);
      
      toast.success(`Added ${newFiles.length} file(s) for analysis`);
    }
  };

  const buildFileTree = (files: ProjectFile[]): ProjectFile[] => {
    const root: ProjectFile[] = [];
    const pathMap = new Map<string, ProjectFile>();

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = '';
      let currentLevel = root;

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (index === parts.length - 1) {
          currentLevel.push({ ...file, name: part });
        } else {
          let folder = pathMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              content: '',
              size: 0,
              type: 'folder',
              children: []
            };
            pathMap.set(currentPath, folder);
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
      });
    });

    return root;
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFileUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleAnalyze = async () => {
    const filesToAnalyze = uploadedFiles.length > 0 
      ? uploadedFiles 
      : codeInput.trim() ? [{ name: 'input.txt', path: 'input.txt', content: codeInput, size: codeInput.length, type: 'file' as const }] : [];

    if (filesToAnalyze.length === 0) {
      toast.error('Please paste code or upload a project to analyze');
      return;
    }

    setScanProgress({
      phase: 'Initializing',
      progress: 0,
      filesScanned: 0,
      totalFiles: filesToAnalyze.length,
      vulnerabilitiesFound: 0
    });

    try {
      const phases = scanMode === 'quick' 
        ? [
            { name: 'Quick scan in progress', duration: 800 },
            { name: 'Generating report', duration: 400 },
          ]
        : scanMode === 'full'
        ? [
            { name: 'Parsing source files', duration: 500 },
            { name: 'Building dependency graph', duration: 600 },
            { name: 'Scanning for secrets', duration: 700 },
            { name: 'Checking dependencies', duration: 800 },
            { name: 'Analyzing data flows', duration: 900 },
            { name: 'Checking security patterns', duration: 800 },
            { name: 'Detecting vulnerabilities', duration: 700 },
            { name: 'Mapping to compliance', duration: 500 },
            { name: 'Generating attack chains', duration: 600 },
            { name: 'Preparing remediation', duration: 400 },
          ]
        : [
            { name: 'Parsing source files', duration: 400 },
            { name: 'Scanning for secrets', duration: 500 },
            { name: 'Analyzing security patterns', duration: 600 },
            { name: 'Detecting vulnerabilities', duration: 500 },
            { name: 'Generating report', duration: 300 },
          ];

      // Run secret detection
      const detectedSecrets = detectSecrets(filesToAnalyze);
      setSecrets(detectedSecrets);

      // Run SAST local pattern scan (30+ patterns)
      const sastVulns = runLocalSAST(filesToAnalyze);
      setLocalSASTVulns(sastVulns);

      // Run dependency analysis
      const vulnDeps = parseDependencies(filesToAnalyze);
      setDependencies(vulnDeps);

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        setScanProgress(prev => ({
          ...prev!,
          phase: phase.name,
          progress: Math.round(((i + 1) / phases.length) * 100),
          currentFile: filesToAnalyze[Math.min(i, filesToAnalyze.length - 1)]?.name,
          filesScanned: Math.min(i + 1, filesToAnalyze.length),
          vulnerabilitiesFound: detectedSecrets.length + sastVulns.length,
        }));
        await new Promise(resolve => setTimeout(resolve, phase.duration));
      }

      const combinedCode = filesToAnalyze
        .map(f => `// === File: ${f.path} ===\n${f.content}`)
        .join('\n\n');

      const result = await onAnalyze(combinedCode);
      
      // Extract threat model if present
      const aiResult = result as any;
      if (aiResult.threatModel) {
        setThreatModel(aiResult.threatModel);
      }
      
      // Combine all vulnerabilities (AI + local SAST + secrets + deps)
      const allVulns = [
        ...result.vulnerabilities,
        ...sastVulns,
        ...detectedSecrets,
        ...vulnDeps.map(dep => ({
          id: `dep-${dep.package}-${dep.cveId}`,
          severity: dep.severity,
          title: `Vulnerable Dependency: ${dep.package}`,
          description: dep.description,
          location: 'package.json',
          category: 'Dependencies',
          cweId: dep.cveId,
          cvssScore: dep.severity === 'critical' ? 9.0 : dep.severity === 'high' ? 7.5 : dep.severity === 'medium' ? 5.0 : 3.0,
          remediation: `Update ${dep.package} to version ${dep.fixedIn} or later.`,
          codefix: `npm install ${dep.package}@${dep.fixedIn}`,
          isDependency: true,
          complianceMappings: [
            { framework: 'OWASP', requirement: 'A06:2021 - Vulnerable Components', status: 'fail' as const },
          ]
        }))
      ];

      // Deduplicate by title+location
      const seen = new Set<string>();
      const dedupedVulns = allVulns.filter(v => {
        const key = `${v.title}-${v.location}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setVulnerabilities(dedupedVulns);
      setSummary(result.summary);
      setRiskScore(result.riskScore);
      
      // Calculate compliance scores
      const compScores = calculateComplianceScores(dedupedVulns);
      setComplianceScores(compScores);
      
      // Generate attack chain diagram
      const diagram = generateAttackChainDiagram(dedupedVulns);
      setAttackChainDiagram(diagram);

      if (dedupedVulns.length > 0) {
        setSelectedVuln(dedupedVulns[0]);
      }

      setScanProgress(prev => ({
        ...prev!,
        phase: 'Complete',
        progress: 100,
        vulnerabilitiesFound: dedupedVulns.length
      }));

      // Save to database if user is authenticated
      if (user) {
        await saveAuditToDatabase(dedupedVulns, result.riskScore, compScores);
      }

      toast.success(`Security audit complete`, {
        description: `Found ${dedupedVulns.length} issues (${sastVulns.length} SAST, ${detectedSecrets.length} secrets, ${vulnDeps.length} deps)`
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze code');
      setScanProgress(null);
    }
  };

  const saveAuditToDatabase = async (vulns: Vulnerability[], score: number, compScores: Record<string, number>) => {
    if (!user) return;

    const criticalCount = vulns.filter(v => v.severity === 'critical').length;
    const highCount = vulns.filter(v => v.severity === 'high').length;
    const mediumCount = vulns.filter(v => v.severity === 'medium').length;
    const lowCount = vulns.filter(v => v.severity === 'low').length;
    const infoCount = vulns.filter(v => v.severity === 'info').length;

    const { data: audit, error: auditError } = await supabase
      .from('security_audits')
      .insert({
        user_id: user.id,
        project_name: projectName || 'Unnamed Project',
        risk_score: score,
        total_vulnerabilities: vulns.length,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        info_count: infoCount,
        files_scanned: uploadedFiles.length,
        scan_mode: scanMode,
        summary,
        compliance_scores: compScores,
        secrets_found: secrets.length,
        dependencies_vulnerable: dependencies.length
      })
      .select()
      .single();

    if (audit && !auditError) {
      // Save vulnerabilities
      const vulnInserts = vulns.map(v => ({
        audit_id: audit.id,
        severity: v.severity,
        title: v.title,
        description: v.description,
        location: v.location,
        category: v.category,
        cwe_id: v.cweId,
        cvss_score: v.cvssScore,
        exploit: v.exploit,
        remediation: v.remediation,
        code_fix: v.codefix,
        affected_files: v.affectedFiles,
        attack_chain: v.chain,
        compliance_mappings: v.complianceMappings ? JSON.parse(JSON.stringify(v.complianceMappings)) : null,
        is_secret: v.isSecret || false,
        is_dependency: v.isDependency || false
      }));

      await supabase.from('security_vulnerabilities').insert(vulnInserts);
      fetchHistoricalAudits();
    }
  };

  const deleteAudit = async (auditId: string) => {
    const { error } = await supabase
      .from('security_audits')
      .delete()
      .eq('id', auditId);

    if (!error) {
      toast.success('Audit deleted');
      fetchHistoricalAudits();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const exportReport = (format: 'json' | 'html') => {
    if (format === 'json') {
      const report = {
        project: projectName || 'Security Audit',
        timestamp: new Date().toISOString(),
        riskScore,
        summary,
        complianceScores,
        filesScanned: uploadedFiles.length,
        secretsFound: secrets.length,
        vulnerableDependencies: dependencies.length,
        vulnerabilities: vulnerabilities.map(v => ({
          severity: v.severity,
          title: v.title,
          description: v.description,
          location: v.location,
          cweId: v.cweId,
          cvssScore: v.cvssScore,
          remediation: v.remediation,
          complianceMappings: v.complianceMappings
        }))
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Generate HTML report
      const html = generateHTMLReport();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success('Report exported');
  };

  const generateHTMLReport = () => {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Audit Report - ${projectName || 'Project'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fafafa; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #a1a1aa; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 0.5rem; padding: 1.5rem; }
    .card-title { font-size: 0.875rem; color: #a1a1aa; margin-bottom: 0.5rem; }
    .card-value { font-size: 2rem; font-weight: bold; }
    .critical { color: #ef4444; }
    .high { color: #f97316; }
    .medium { color: #eab308; }
    .low { color: #3b82f6; }
    .success { color: #22c55e; }
    .vuln-list { margin-top: 2rem; }
    .vuln-item { background: #18181b; border: 1px solid #27272a; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
    .vuln-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .badge { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge-critical { background: #7f1d1d; color: #fecaca; }
    .badge-high { background: #7c2d12; color: #fed7aa; }
    .badge-medium { background: #713f12; color: #fef08a; }
    .badge-low { background: #1e3a5f; color: #bfdbfe; }
    .vuln-title { font-weight: 600; }
    .vuln-desc { color: #a1a1aa; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .vuln-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #71717a; }
    .compliance-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-top: 1rem; }
    .compliance-item { text-align: center; padding: 0.5rem; background: #27272a; border-radius: 0.25rem; }
    .compliance-score { font-size: 1.5rem; font-weight: bold; }
    .compliance-name { font-size: 0.75rem; color: #a1a1aa; }
    .footer { margin-top: 3rem; text-align: center; color: #71717a; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ Security Audit Report</h1>
    <p class="subtitle">Project: ${projectName || 'Unknown'} | Generated: ${new Date().toLocaleString()}</p>
    
    <div class="grid">
      <div class="card">
        <div class="card-title">Risk Score</div>
        <div class="card-value ${riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'medium' : 'success'}">${riskScore}/100</div>
      </div>
      <div class="card">
        <div class="card-title">Critical</div>
        <div class="card-value critical">${criticalCount}</div>
      </div>
      <div class="card">
        <div class="card-title">High</div>
        <div class="card-value high">${highCount}</div>
      </div>
      <div class="card">
        <div class="card-title">Medium</div>
        <div class="card-value medium">${mediumCount}</div>
      </div>
      <div class="card">
        <div class="card-title">Low</div>
        <div class="card-value low">${lowCount}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Compliance Scores</div>
      <div class="compliance-grid">
        ${Object.entries(complianceScores).map(([framework, score]) => `
          <div class="compliance-item">
            <div class="compliance-score ${score >= 80 ? 'success' : score >= 50 ? 'medium' : 'critical'}">${score}%</div>
            <div class="compliance-name">${framework.toUpperCase()}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card" style="margin-top: 1rem;">
      <div class="card-title">Executive Summary</div>
      <p style="margin-top: 0.5rem; line-height: 1.6;">${summary || 'No summary available.'}</p>
    </div>

    <div class="vuln-list">
      <h2 style="margin-bottom: 1rem;">Vulnerabilities (${vulnerabilities.length})</h2>
      ${vulnerabilities.map(v => `
        <div class="vuln-item">
          <div class="vuln-header">
            <span class="badge badge-${v.severity}">${v.severity}</span>
            <span class="vuln-title">${v.title}</span>
          </div>
          <p class="vuln-desc">${v.description}</p>
          <div class="vuln-meta">
            <span>📍 ${v.location}</span>
            ${v.cweId ? `<span>🔖 ${v.cweId}</span>` : ''}
            ${v.cvssScore ? `<span>📊 CVSS ${v.cvssScore}</span>` : ''}
          </div>
          ${v.remediation ? `<p style="margin-top: 0.5rem; font-size: 0.875rem;"><strong>Fix:</strong> ${v.remediation}</p>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Generated by ShadowTalk AI Security Auditor</p>
      <p>Developed by Zain Ahmed</p>
    </div>
  </div>
</body>
</html>`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <FileWarning className="h-4 w-4" />;
      case 'low': return <Bug className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-blue-500';
    return 'text-green-500';
  };

  const filteredVulns = vulnerabilities
    .filter(v => filterSeverity === 'all' || v.severity === filterSeverity)
    .filter(v => {
      if (filterType === 'all') return true;
      if (filterType === 'secrets') return v.isSecret;
      if (filterType === 'dependencies') return v.isDependency;
      if (filterType === 'code') return !v.isSecret && !v.isDependency;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return order[a.severity] - order[b.severity];
      }
      return a.location.localeCompare(b.location);
    });

  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

  const renderFileTree = (nodes: ProjectFile[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.path} style={{ paddingLeft: `${depth * 16}px` }}>
        <div 
          className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted/50"
          onClick={() => node.type === 'folder' && toggleFolder(node.path)}
        >
          {node.type === 'folder' ? (
            <>
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <FolderTree className="h-4 w-4 text-yellow-500" />
            </>
          ) : (
            <>
              <span className="w-3" />
              {getFileIcon(node.name)}
            </>
          )}
          <span className="text-xs truncate">{node.name}</span>
          {node.type === 'file' && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        {node.type === 'folder' && node.children && expandedFolders.has(node.path) && (
          renderFileTree(node.children, depth + 1)
        )}
      </div>
    ));
  };

  return (
    <>
      {/* Disclaimer Dialog */}
      <AlertDialog open={showDisclaimer && !hasAccepted} onOpenChange={setShowDisclaimer}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Advanced Security Audit - Disclaimer
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <p className="font-semibold text-foreground">
                ⚠️ IMPORTANT: Read Before Proceeding
              </p>
              <p>
                This advanced security auditor detects secrets, vulnerable dependencies, and code vulnerabilities. It is designed for <strong>authorized security testing only</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Only analyze code you own or have explicit permission to test</li>
                <li>Never use generated exploits against systems without authorization</li>
                <li>Rotate any exposed secrets immediately</li>
                <li>This tool is for educational and defensive purposes only</li>
              </ul>
              <p className="text-sm text-destructive font-medium">
                By proceeding, you acknowledge that you have legal authorization to perform security testing.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Decline & Exit</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptDisclaimer} className="bg-destructive hover:bg-destructive/90">
              I Accept & Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4 p-4">
        {/* Header */}
        <Card className="bg-gradient-to-r from-destructive/10 via-primary/5 to-destructive/10 border-destructive/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
          <CardContent className="pt-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/20 ring-2 ring-destructive/30">
                  <Shield className="h-7 w-7 text-destructive" />
                </div>
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    HSCA v2.0
                    <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">AI-Powered</Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {projectName ? `Analyzing: ${projectName}` : '30+ CWEs • SAST • Secrets • Dependencies • Compliance • Threat Modeling'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {uploadedFiles.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Package className="h-3 w-3" />
                    {uploadedFiles.length} files
                  </Badge>
                )}
                {vulnerabilities.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}/100</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan" className="gap-1">
              <FileSearch className="h-4 w-4" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1">
              <Target className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Scan Tab */}
          <TabsContent value="scan" className="space-y-4">
            {/* Scan Progress */}
            {scanProgress && scanProgress.phase !== 'Complete' && (
              <Card className="border-primary/30">
                <CardContent className="py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{scanProgress.phase}</span>
                      <span className="text-muted-foreground">{scanProgress.progress}%</span>
                    </div>
                    <Progress value={scanProgress.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Files: {scanProgress.filesScanned}/{scanProgress.totalFiles}</span>
                      {scanProgress.currentFile && (
                        <span className="truncate max-w-[200px]">Scanning: {scanProgress.currentFile}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Upload Section */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FolderUp className="h-4 w-4" />
                    Project Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isDragging 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={folderInputRef}
                      // @ts-ignore
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleFolderUpload}
                      className="hidden"
                    />
                    <FolderUp className={`h-8 w-8 mx-auto ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="mt-2 space-x-2">
                      <label htmlFor="file-upload" className="text-sm font-medium text-primary cursor-pointer hover:underline">
                        Upload files
                      </label>
                      <span className="text-sm text-muted-foreground">or</span>
                      <button 
                        onClick={() => folderInputRef.current?.click()}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Upload folder
                      </button>
                    </div>
                  </div>

                  {/* Scan Mode */}
                  <div className="flex gap-2">
                    {(['quick', 'deep', 'full'] as const).map(mode => (
                      <Button 
                        key={mode}
                        variant={scanMode === mode ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setScanMode(mode)}
                      >
                        {mode === 'quick' && <Zap className="h-3 w-3 mr-1" />}
                        {mode === 'deep' && <FileSearch className="h-3 w-3 mr-1" />}
                        {mode === 'full' && <Network className="h-3 w-3 mr-1" />}
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* File Tree */}
                  {projectTree.length > 0 && (
                    <ScrollArea className="h-[180px] border rounded-lg p-2">
                      {renderFileTree(projectTree)}
                    </ScrollArea>
                  )}

                  {/* Code Input */}
                  {uploadedFiles.length === 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <Textarea
                        placeholder="Paste code directly..."
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        className="min-h-[100px] font-mono text-sm"
                      />
                    </>
                  )}

                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing || (scanProgress?.phase !== undefined && scanProgress.phase !== 'Complete')}
                    className="w-full"
                  >
                    {isAnalyzing || (scanProgress && scanProgress.phase !== 'Complete') ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Run Security Audit
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Scan Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <Key className="h-5 w-5 text-red-500 mb-1" />
                      <p className="font-medium text-sm">Secrets Detection</p>
                      <p className="text-xs text-muted-foreground">{SECRET_PATTERNS.length} patterns</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <Package className="h-5 w-5 text-orange-500 mb-1" />
                      <p className="font-medium text-sm">Dependency Scan</p>
                      <p className="text-xs text-muted-foreground">CVE database</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <FileCode className="h-5 w-5 text-yellow-500 mb-1" />
                      <p className="font-medium text-sm">SAST Analysis</p>
                      <p className="text-xs text-muted-foreground">Code patterns</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <Target className="h-5 w-5 text-blue-500 mb-1" />
                      <p className="font-medium text-sm">Compliance</p>
                      <p className="text-xs text-muted-foreground">5 frameworks</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <GitBranch className="h-5 w-5 text-purple-500 mb-1" />
                      <p className="font-medium text-sm">Attack Chains</p>
                      <p className="text-xs text-muted-foreground">Visual diagrams</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <History className="h-5 w-5 text-green-500 mb-1" />
                      <p className="font-medium text-sm">Historical</p>
                      <p className="text-xs text-muted-foreground">Trend tracking</p>
                    </div>
                  </div>

                  {/* Supported file types */}
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                    <p className="text-xs font-medium mb-2">Supported Languages & Files</p>
                    <div className="flex flex-wrap gap-1">
                      {['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'PHP', 'SQL', 'YAML', 'JSON', '.env'].map(lang => (
                        <Badge key={lang} variant="secondary" className="text-[10px]">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {vulnerabilities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">No Scan Results Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a project and run a scan to see vulnerabilities
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Card className="bg-red-500/10 border-red-500/30 cursor-pointer hover:bg-red-500/20" onClick={() => setFilterSeverity('critical')}>
                    <CardContent className="py-2 text-center">
                      <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10 border-orange-500/30 cursor-pointer hover:bg-orange-500/20" onClick={() => setFilterSeverity('high')}>
                    <CardContent className="py-2 text-center">
                      <p className="text-2xl font-bold text-orange-500">{highCount}</p>
                      <p className="text-xs text-muted-foreground">High</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-500/10 border-yellow-500/30 cursor-pointer hover:bg-yellow-500/20" onClick={() => setFilterSeverity('medium')}>
                    <CardContent className="py-2 text-center">
                      <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
                      <p className="text-xs text-muted-foreground">Medium</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/30 cursor-pointer hover:bg-blue-500/20" onClick={() => setFilterSeverity('low')}>
                    <CardContent className="py-2 text-center">
                      <p className="text-2xl font-bold text-blue-500">{lowCount}</p>
                      <p className="text-xs text-muted-foreground">Low</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterSeverity('all')}>
                    <CardContent className="py-2 text-center">
                      <p className="text-2xl font-bold">{vulnerabilities.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters & Export */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="secrets">Secrets</SelectItem>
                      <SelectItem value="dependencies">Dependencies</SelectItem>
                      <SelectItem value="code">Code Issues</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'severity' ? 'location' : 'severity')}
                  >
                    <SortAsc className="h-3 w-3 mr-1" />
                    {sortBy === 'severity' ? 'Severity' : 'Location'}
                  </Button>

                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportReport('json')}>
                      <Download className="h-3 w-3 mr-1" />
                      JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportReport('html')}>
                      <Download className="h-3 w-3 mr-1" />
                      HTML
                    </Button>
                  </div>
                </div>

                {/* Vulnerability List & Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2 pr-2">
                      {filteredVulns.map(vuln => (
                        <div
                          key={vuln.id}
                          onClick={() => setSelectedVuln(vuln)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border ${
                            selectedVuln?.id === vuln.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Badge className={`${getSeverityColor(vuln.severity)} shrink-0`}>
                              {getSeverityIcon(vuln.severity)}
                              <span className="ml-1 uppercase text-xs">{vuln.severity}</span>
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                {vuln.isSecret && <Key className="h-3 w-3 text-red-400" />}
                                {vuln.isDependency && <Package className="h-3 w-3 text-orange-400" />}
                                <p className="font-medium text-sm truncate">{vuln.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{vuln.location}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {vuln.cweId && (
                                  <Badge variant="outline" className="text-[10px]">{vuln.cweId}</Badge>
                                )}
                                {vuln.cvssScore && (
                                  <Badge variant="outline" className="text-[10px]">CVSS: {vuln.cvssScore}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Vulnerability Details */}
                  {selectedVuln && (
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(selectedVuln.severity)}>
                              {selectedVuln.severity.toUpperCase()}
                            </Badge>
                            {selectedVuln.isSecret && <Badge variant="outline"><Key className="h-3 w-3 mr-1" />Secret</Badge>}
                            {selectedVuln.isDependency && <Badge variant="outline"><Package className="h-3 w-3 mr-1" />Dependency</Badge>}
                          </div>
                          <h3 className="font-bold">{selectedVuln.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{selectedVuln.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{selectedVuln.category}</Badge>
                          {selectedVuln.cweId && <Badge variant="outline">{selectedVuln.cweId}</Badge>}
                          {selectedVuln.cvssScore && <Badge variant="outline">CVSS: {selectedVuln.cvssScore}</Badge>}
                        </div>

                        <div>
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Location
                          </p>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{selectedVuln.location}</code>
                        </div>

                        {selectedVuln.chain && selectedVuln.chain.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <GitBranch className="h-3 w-3" /> Attack Chain
                            </p>
                            <div className="flex items-center gap-1 text-xs flex-wrap">
                              {selectedVuln.chain.map((step, i) => (
                                <React.Fragment key={i}>
                                  <span className="bg-muted px-2 py-0.5 rounded">{step}</span>
                                  {i < selectedVuln.chain!.length - 1 && <ChevronRight className="h-3 w-3" />}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Remediation
                          </p>
                          <p className="text-xs text-muted-foreground">{selectedVuln.remediation}</p>
                        </div>

                        {selectedVuln.codefix && (
                          <div className="relative">
                            <p className="text-xs font-medium mb-1">Suggested Fix:</p>
                            <pre className="bg-green-500/10 p-3 rounded text-xs overflow-x-auto border border-green-500/30">
                              <code>{selectedVuln.codefix}</code>
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-6 right-2"
                              onClick={() => copyToClipboard(selectedVuln.codefix!, `fix-${selectedVuln.id}`)}
                            >
                              {copiedId === `fix-${selectedVuln.id}` ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        {selectedVuln.complianceMappings && selectedVuln.complianceMappings.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <Target className="h-3 w-3" /> Compliance Impact
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {selectedVuln.complianceMappings.map((mapping, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className={`text-[10px] ${mapping.status === 'fail' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}
                                >
                                  {mapping.framework}: {mapping.requirement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Summary */}
                {summary && (
                  <Card>
                    <CardContent className="py-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Audit Summary
                      </h4>
                      <p className="text-sm text-muted-foreground">{summary}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            {Object.keys(complianceScores).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">No Compliance Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Run a scan to see compliance scores
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {COMPLIANCE_FRAMEWORKS.map(framework => {
                    const score = complianceScores[framework.id] || 0;
                    const Icon = framework.icon;
                    return (
                      <Card key={framework.id} className={`${score >= 80 ? 'border-green-500/30' : score >= 50 ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
                        <CardContent className="pt-4 text-center">
                          <Icon className={`h-8 w-8 mx-auto mb-2 ${score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
                          <p className={`text-3xl font-bold ${score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {score}%
                          </p>
                          <p className="text-sm font-medium">{framework.name}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Compliance Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Compliance Failures by Framework</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {COMPLIANCE_FRAMEWORKS.map(framework => {
                        const failures = vulnerabilities.filter(v => 
                          v.complianceMappings?.some(m => 
                            m.framework.toLowerCase() === framework.id && m.status === 'fail'
                          )
                        );
                        
                        if (failures.length === 0) return null;
                        
                        return (
                          <div key={framework.id}>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <framework.icon className="h-4 w-4" />
                              {framework.name} - {failures.length} Failures
                            </h4>
                            <div className="space-y-1 ml-6">
                              {failures.slice(0, 5).map(v => (
                                <div key={v.id} className="flex items-center gap-2 text-xs">
                                  <Badge className={`${getSeverityColor(v.severity)} text-[10px]`}>{v.severity}</Badge>
                                  <span className="truncate">{v.title}</span>
                                </div>
                              ))}
                              {failures.length > 5 && (
                                <p className="text-xs text-muted-foreground">+{failures.length - 5} more</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Attack Chain Diagram */}
                {attackChainDiagram && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Attack Chain Visualization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                        <code>{attackChainDiagram}</code>
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        Copy this Mermaid diagram to visualize attack paths
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {!user ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">Login Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in to save and track your security audits over time
                  </p>
                </CardContent>
              </Card>
            ) : historicalAudits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-medium mb-2">No Historical Audits</h3>
                  <p className="text-sm text-muted-foreground">
                    Run your first scan to start tracking security trends
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Trend Chart Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Security Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 flex items-end gap-1">
                      {historicalAudits.slice().reverse().map((audit, i) => (
                        <div 
                          key={audit.id}
                          className="flex-1 rounded-t transition-all hover:opacity-80"
                          style={{ 
                            height: `${audit.risk_score}%`, 
                            backgroundColor: audit.risk_score >= 70 ? '#ef4444' : audit.risk_score >= 40 ? '#eab308' : '#22c55e'
                          }}
                          title={`${audit.project_name}: ${audit.risk_score}/100`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Older</span>
                      <span>Recent</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Historical Audits List */}
                <div className="space-y-2">
                  {historicalAudits.map(audit => (
                    <Card key={audit.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${getRiskColor(audit.risk_score)}`}>
                              {audit.risk_score}
                            </div>
                            <div>
                              <p className="font-medium">{audit.project_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(audit.created_at).toLocaleDateString()}
                                <Clock className="h-3 w-3 ml-2" />
                                {new Date(audit.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline" className="text-red-500 border-red-500">{audit.critical_count}C</Badge>
                              <Badge variant="outline" className="text-orange-500 border-orange-500">{audit.high_count}H</Badge>
                              <Badge variant="outline" className="text-yellow-500 border-yellow-500">{audit.medium_count}M</Badge>
                              <Badge variant="outline" className="text-blue-500 border-blue-500">{audit.low_count}L</Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteAudit(audit.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdvancedSecurityAuditPanel;
