import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  Shield, 
  AlertTriangle,
  Bug,
  Code,
  FileCode,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  Unlock,
  Eye,
  FileWarning,
  Terminal,
  RefreshCw,
  Upload,
  FolderUp,
  File,
  X,
  FolderTree,
  GitBranch,
  Package,
  Database,
  Settings,
  Globe,
  Server,
  Key,
  FileJson,
  FileText,
  Archive,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Download,
  Filter,
  SortAsc
} from 'lucide-react';
import { toast } from 'sonner';

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

interface SecurityAuditPanelProps {
  onAnalyze: (code: string) => Promise<{
    vulnerabilities: Vulnerability[];
    summary: string;
    riskScore: number;
  }>;
  isAnalyzing: boolean;
}

const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({
  onAnalyze,
  isAnalyzing
}) => {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [projectTree, setProjectTree] = useState<ProjectFile[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [summary, setSummary] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'location'>('severity');
  const [projectName, setProjectName] = useState<string>('');
  const [scanMode, setScanMode] = useState<'quick' | 'deep' | 'full'>('deep');
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Local pattern-based vulnerability detection
  const detectLocalVulnerabilities = useCallback((files: ProjectFile[]): Vulnerability[] => {
    const localVulns: Vulnerability[] = [];
    
    // Security patterns to detect
    const patterns: Array<{ pattern: RegExp; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; title: string; category: string; cweId: string }> = [
      // Secrets & API Keys
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi, severity: 'high', title: 'Hardcoded API Key', category: 'Secrets', cweId: 'CWE-798' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi, severity: 'high', title: 'Hardcoded Secret', category: 'Secrets', cweId: 'CWE-798' },
      { pattern: /password\s*[:=]\s*['"][^'"]{4,}['"]/gi, severity: 'critical', title: 'Hardcoded Password', category: 'Secrets', cweId: 'CWE-798' },
      { pattern: /sk_live_[A-Za-z0-9]{24,}/g, severity: 'critical', title: 'Stripe Secret Key Exposed', category: 'Secrets', cweId: 'CWE-798' },
      { pattern: /sk-[A-Za-z0-9]{48}/g, severity: 'critical', title: 'OpenAI API Key Exposed', category: 'Secrets', cweId: 'CWE-798' },
      { pattern: /ghp_[A-Za-z0-9]{36}/g, severity: 'critical', title: 'GitHub Token Exposed', category: 'Secrets', cweId: 'CWE-798' },
      { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, severity: 'critical', title: 'Private Key in Code', category: 'Secrets', cweId: 'CWE-321' },
      
      // XSS Vulnerabilities
      { pattern: /dangerouslySetInnerHTML/g, severity: 'high', title: 'Potential XSS via dangerouslySetInnerHTML', category: 'XSS', cweId: 'CWE-79' },
      { pattern: /\.innerHTML\s*=/g, severity: 'high', title: 'Potential XSS via innerHTML', category: 'XSS', cweId: 'CWE-79' },
      { pattern: /document\.write\s*\(/g, severity: 'high', title: 'Potential XSS via document.write', category: 'XSS', cweId: 'CWE-79' },
      
      // Code Injection
      { pattern: /eval\s*\(/g, severity: 'critical', title: 'Use of eval() - Code Injection Risk', category: 'Injection', cweId: 'CWE-94' },
      { pattern: /new\s+Function\s*\(/g, severity: 'high', title: 'Dynamic Function Creation', category: 'Injection', cweId: 'CWE-94' },
      
      // SQL Injection
      { pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi, severity: 'critical', title: 'Potential SQL Injection', category: 'SQL Injection', cweId: 'CWE-89' },
      { pattern: /query\s*\(\s*[`'"].*\$\{/g, severity: 'critical', title: 'Unparameterized SQL Query', category: 'SQL Injection', cweId: 'CWE-89' },
      
      // Path Traversal
      { pattern: /\.\.\/|\.\.\\|path\.join\([^)]*req\./g, severity: 'high', title: 'Potential Path Traversal', category: 'Path Traversal', cweId: 'CWE-22' },
      
      // Insecure Crypto
      { pattern: /MD5|SHA1(?!\d)/gi, severity: 'medium', title: 'Weak Cryptographic Hash', category: 'Cryptography', cweId: 'CWE-328' },
      
      // Missing Security Headers/Configs
      { pattern: /verify_jwt\s*=\s*false/g, severity: 'high', title: 'JWT Verification Disabled', category: 'Authentication', cweId: 'CWE-287' },
      
      // Prototype Pollution
      { pattern: /Object\.assign\s*\([^,]+,\s*(?:req\.body|req\.query|req\.params)/g, severity: 'high', title: 'Potential Prototype Pollution', category: 'Prototype Pollution', cweId: 'CWE-1321' },
    ];
    
    files.forEach(file => {
      patterns.forEach(({ pattern, severity, title, category, cweId }) => {
        // Reset pattern state for global regexes
        pattern.lastIndex = 0;
        const matches = file.content.match(pattern);
        
        if (matches) {
          matches.forEach((match) => {
            // Find line number
            const matchIndex = file.content.indexOf(match);
            const beforeMatch = file.content.substring(0, matchIndex);
            const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
            
            // Avoid duplicate detections in same location
            const vulnId = `local-${file.path}-${title.replace(/\s/g, '-')}-${lineNumber}`;
            if (!localVulns.find(v => v.id === vulnId)) {
              localVulns.push({
                id: vulnId,
                severity,
                title,
                description: `Found suspicious pattern "${match.substring(0, 50)}${match.length > 50 ? '...' : ''}" that may indicate a security vulnerability.`,
                location: `${file.path}:${lineNumber}`,
                category,
                cweId,
                remediation: getLocalRemediation(category),
                codefix: getLocalCodeFix(category),
                affectedFiles: [file.path]
              });
            }
          });
        }
      });
    });
    
    return localVulns;
  }, []);
  
  const getLocalRemediation = (category: string): string => {
    const remediations: Record<string, string> = {
      'Secrets': 'Move secrets to environment variables. Use a secrets manager for production. Never commit secrets to version control.',
      'XSS': 'Sanitize all user input before rendering. Use textContent instead of innerHTML. Consider using DOMPurify for HTML content.',
      'Injection': 'Never use eval() or new Function() with user input. Use parameterized queries for database operations.',
      'SQL Injection': 'Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.',
      'Path Traversal': 'Validate and sanitize file paths. Use path.basename() and whitelist allowed directories.',
      'Cryptography': 'Use SHA-256 or stronger for hashing. Use crypto.getRandomValues() for secure random numbers.',
      'Authentication': 'Enable JWT verification. Implement proper session management.',
      'Prototype Pollution': 'Validate object keys before assignment. Use Object.create(null) for dictionary objects.',
    };
    return remediations[category] || 'Review and address this security concern according to security best practices.';
  };
  
  const getLocalCodeFix = (category: string): string => {
    const fixes: Record<string, string> = {
      'Secrets': `// Use environment variables:\nconst apiKey = process.env.API_KEY;\n// Or for Vite: import.meta.env.VITE_API_KEY`,
      'XSS': `// Use textContent instead:\nelement.textContent = userInput;\n// Or use DOMPurify for HTML`,
      'Injection': `// Avoid eval - use safer alternatives`,
      'SQL Injection': `// Use parameterized queries:\nconst result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);`,
      'Cryptography': `// Use crypto.getRandomValues() for secure random`,
    };
    return fixes[category] || '// Review and fix according to security best practices';
  };

  const handleAcceptDisclaimer = () => {
    setHasAccepted(true);
    setShowDisclaimer(false);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-yellow-600" />;
      case 'html':
      case 'htm':
        return <Globe className="h-4 w-4 text-orange-500" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'py':
        return <FileCode className="h-4 w-4 text-blue-400" />;
      case 'java':
      case 'kt':
        return <FileCode className="h-4 w-4 text-red-500" />;
      case 'go':
        return <FileCode className="h-4 w-4 text-cyan-500" />;
      case 'sql':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'env':
        return <Key className="h-4 w-4 text-yellow-400" />;
      case 'yml':
      case 'yaml':
        return <Settings className="h-4 w-4 text-pink-500" />;
      case 'xml':
        return <FileText className="h-4 w-4 text-orange-400" />;
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', kt: 'kotlin', go: 'go', rb: 'ruby',
      php: 'php', sql: 'sql', html: 'html', css: 'css', scss: 'scss',
      json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml', sh: 'bash',
      c: 'c', cpp: 'cpp', h: 'c', cs: 'csharp', rs: 'rust', swift: 'swift',
      vue: 'vue', svelte: 'svelte'
    };
    return langMap[ext || ''] || 'text';
  };

  const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.sql', '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.xml', '.sh', '.bash', '.c', '.cpp', '.h', '.cs', '.rs', '.swift', '.kt', '.vue', '.svelte', '.env', '.gitignore', '.dockerignore', 'Dockerfile', '.toml', '.ini', '.cfg', '.conf'];

  const handleFileUpload = async (files: FileList) => {
    const newFiles: ProjectFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      // Check if it's a valid file or special config file
      const isValidFile = validExtensions.some(e => 
        file.name.toLowerCase().endsWith(e) || file.name === e.substring(1)
      );
      
      if (!isValidFile) {
        continue; // Skip silently for bulk uploads
      }

      if (file.size > 1000000) { // 1MB limit per file
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
      // Build tree structure from paths
      const tree = buildFileTree(newFiles);
      setProjectTree(tree);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Detect project name from common patterns
      const firstPath = newFiles[0]?.path || '';
      const projectFolder = firstPath.split('/')[0] || 'Uploaded Project';
      setProjectName(projectFolder);
      
      toast.success(`Added ${newFiles.length} file(s) for analysis`, {
        description: `Project: ${projectFolder}`
      });
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
          // It's a file
          currentLevel.push({ ...file, name: part });
        } else {
          // It's a folder
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
    const files = e.target.files;
    if (files) {
      await handleFileUpload(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Handle both files and folders
    const items = e.dataTransfer.items;
    if (items) {
      const filePromises: Promise<File>[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry?.();
        if (item) {
          if (item.isDirectory) {
            // Handle directory
            traverseDirectory(item as any, filePromises);
          } else if (item.isFile) {
            filePromises.push(new Promise((resolve) => {
              (item as any).file((file: File) => resolve(file));
            }));
          }
        }
      }
      
      Promise.all(filePromises).then(files => {
        const fileList = new DataTransfer();
        files.forEach(file => fileList.items.add(file));
        handleFileUpload(fileList.files);
      });
    } else if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const traverseDirectory = async (entry: any, filePromises: Promise<File>[]) => {
    const reader = entry.createReader();
    const entries = await new Promise<any[]>((resolve) => {
      reader.readEntries((entries: any[]) => resolve(entries));
    });
    
    for (const childEntry of entries) {
      if (childEntry.isFile) {
        filePromises.push(new Promise((resolve) => {
          childEntry.file((file: File) => {
            // Preserve relative path
            Object.defineProperty(file, 'webkitRelativePath', {
              value: childEntry.fullPath.substring(1), // Remove leading /
              writable: false
            });
            resolve(file);
          });
        }));
      } else if (childEntry.isDirectory) {
        await traverseDirectory(childEntry, filePromises);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (path: string) => {
    setUploadedFiles(prev => prev.filter(f => f.path !== path));
    setProjectTree(prev => removeFromTree(prev, path));
  };

  const removeFromTree = (tree: ProjectFile[], path: string): ProjectFile[] => {
    return tree.filter(node => {
      if (node.path === path) return false;
      if (node.children) {
        node.children = removeFromTree(node.children, path);
      }
      return true;
    });
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
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

    // Simulate progressive scanning
    setScanProgress({
      phase: 'Initializing',
      progress: 0,
      filesScanned: 0,
      totalFiles: filesToAnalyze.length,
      vulnerabilitiesFound: 0
    });

    try {
      // Phase 1: Local pattern detection (fast)
      setScanProgress(prev => ({
        ...prev!,
        phase: 'Running local pattern detection',
        progress: 10,
      }));
      
      const localVulns = detectLocalVulnerabilities(filesToAnalyze);
      console.log('[SecurityAudit] Local detection found:', localVulns.length, 'issues');
      
      const phases = [
        { name: 'Analyzing code structure', duration: 300 },
        { name: 'Sending to AI for deep analysis', duration: 400 },
        { name: 'Processing AI findings', duration: 300 },
      ];

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        setScanProgress(prev => ({
          ...prev!,
          phase: phase.name,
          progress: 20 + Math.round((i / phases.length) * 60),
          currentFile: filesToAnalyze[Math.min(i, filesToAnalyze.length - 1)]?.name,
          filesScanned: Math.min(i + 1, filesToAnalyze.length),
          vulnerabilitiesFound: localVulns.length,
        }));
        await new Promise(resolve => setTimeout(resolve, phase.duration));
      }

      const combinedCode = filesToAnalyze
        .map(f => `// === File: ${f.path} ===\n// Language: ${f.language || 'unknown'}\n${f.content}`)
        .join('\n\n');

      console.log('[SecurityAudit] Sending code for analysis, length:', combinedCode.length);
      
      // Send to AI for deep analysis
      let aiVulns: Vulnerability[] = [];
      let aiSummary = '';
      let aiRiskScore = 0;
      
      try {
        const result = await onAnalyze(combinedCode);
        console.log('[SecurityAudit] AI analysis result:', result);
        
        const resultAny = result as any;
        if (result && !resultAny.error) {
          aiVulns = Array.isArray(result.vulnerabilities) ? result.vulnerabilities : [];
          aiSummary = result.summary || '';
          aiRiskScore = typeof result.riskScore === 'number' ? result.riskScore : 0;
        }
      } catch (aiError) {
        console.warn('[SecurityAudit] AI analysis failed, using local results only:', aiError);
      }
      
      // Combine local and AI vulnerabilities
      const aiEnhancedVulns = aiVulns.map((v: Vulnerability) => ({
        ...v,
        id: v.id || `ai-${Math.random().toString(36).substr(2, 9)}`,
        affectedFiles: filesToAnalyze
          .filter(f => (v.location && v.location.includes(f.name)) || (v.description && v.description.toLowerCase().includes(f.name.toLowerCase())))
          .map(f => f.path)
      }));
      
      // Merge and deduplicate vulnerabilities
      const allVulns = [...localVulns, ...aiEnhancedVulns];
      const uniqueVulns = allVulns.filter((v, index, self) => 
        index === self.findIndex(t => 
          t.title === v.title && t.location === v.location
        )
      );
      
      // Sort by severity
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      uniqueVulns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      
      // Calculate combined risk score
      const localRiskContribution = localVulns.length > 0 
        ? Math.min(50, localVulns.filter(v => v.severity === 'critical').length * 15 + 
                       localVulns.filter(v => v.severity === 'high').length * 10 +
                       localVulns.filter(v => v.severity === 'medium').length * 5)
        : 0;
      const finalRiskScore = Math.min(100, Math.max(aiRiskScore, localRiskContribution));
      
      // Generate summary
      const finalSummary = aiSummary || 
        `Found ${uniqueVulns.length} potential security issues: ` +
        `${uniqueVulns.filter(v => v.severity === 'critical').length} critical, ` +
        `${uniqueVulns.filter(v => v.severity === 'high').length} high, ` +
        `${uniqueVulns.filter(v => v.severity === 'medium').length} medium, ` +
        `${uniqueVulns.filter(v => v.severity === 'low').length} low.`;

      setVulnerabilities(uniqueVulns);
      setSummary(finalSummary);
      setRiskScore(finalRiskScore);
      
      if (uniqueVulns.length > 0) {
        setSelectedVuln(uniqueVulns[0]);
      }

      setScanProgress(prev => ({
        ...prev!,
        phase: 'Complete',
        progress: 100,
        vulnerabilitiesFound: uniqueVulns.length
      }));

      toast.success(`Security audit complete`, {
        description: `Found ${uniqueVulns.length} vulnerabilities (${localVulns.length} local + ${aiEnhancedVulns.length} AI-detected)`
      });

    } catch (error) {
      console.error('[SecurityAudit] Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to analyze code', {
        description: errorMessage
      });
      setScanProgress(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const exportReport = () => {
    const report = {
      project: projectName || 'Security Audit',
      timestamp: new Date().toISOString(),
      riskScore,
      summary,
      filesScanned: uploadedFiles.length,
      vulnerabilities: vulnerabilities.map(v => ({
        severity: v.severity,
        title: v.title,
        description: v.description,
        location: v.location,
        cweId: v.cweId,
        remediation: v.remediation,
        affectedFiles: v.affectedFiles
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
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
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted/50 ${
            selectedFiles.has(node.path) ? 'bg-primary/10' : ''
          }`}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              setSelectedFiles(prev => {
                const next = new Set(prev);
                if (next.has(node.path)) next.delete(node.path);
                else next.add(node.path);
                return next;
              });
            }
          }}
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
              Security Audit Disclaimer
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <p className="font-semibold text-foreground">
                ⚠️ IMPORTANT: Read Before Proceeding
              </p>
              <p>
                The Hyper-Security Contextual Auditor (HSCA) is designed for <strong>authorized security testing only</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Only analyze code you own or have explicit permission to test</li>
                <li>Never use generated exploits against systems without authorization</li>
                <li>This tool is for educational and defensive purposes only</li>
                <li>Misuse may violate computer fraud and abuse laws</li>
              </ul>
              <p className="text-sm text-destructive font-medium">
                By proceeding, you acknowledge that you have legal authorization to perform security testing on the code you submit.
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
        {/* Header with Project Info */}
        <Card className="bg-gradient-to-r from-destructive/10 to-primary/10 border-destructive/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">HSCA Security Auditor</h2>
                  <p className="text-xs text-muted-foreground">
                    {projectName ? `Analyzing: ${projectName}` : 'Full Project Security Analysis'}
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
                  <span>Vulnerabilities: {scanProgress.vulnerabilitiesFound}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vulnerability Summary */}
        {vulnerabilities.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
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
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Upload & File Tree */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FolderUp className="h-4 w-4" />
                Project Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Drag and Drop Zone */}
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
                <div className="flex flex-col items-center gap-2">
                  <FolderUp className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="space-x-2">
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
                  <p className="text-xs text-muted-foreground">
                    Drop entire projects, ZIP files, or folders
                  </p>
                </div>
              </div>

              {/* Scan Mode Selector */}
              <div className="flex gap-2">
                <Button 
                  variant={scanMode === 'quick' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setScanMode('quick')}
                >
                  Quick
                </Button>
                <Button 
                  variant={scanMode === 'deep' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setScanMode('deep')}
                >
                  Deep
                </Button>
                <Button 
                  variant={scanMode === 'full' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setScanMode('full')}
                >
                  Full
                </Button>
              </div>

              {/* File Tree */}
              {projectTree.length > 0 && (
                <ScrollArea className="h-[200px] border rounded-lg p-2">
                  {renderFileTree(projectTree)}
                </ScrollArea>
              )}

              {/* Code Input (if no files) */}
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

              {/* Analyze Button */}
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || scanProgress?.phase !== undefined && scanProgress.phase !== 'Complete'}
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

          {/* Right Panel - Results */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Vulnerabilities ({filteredVulns.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFilterSeverity('all')}
                    className={filterSeverity === 'all' ? 'bg-muted' : ''}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'severity' ? 'location' : 'severity')}
                  >
                    <SortAsc className="h-3 w-3 mr-1" />
                    {sortBy === 'severity' ? 'Severity' : 'Location'}
                  </Button>
                  {vulnerabilities.length > 0 && (
                    <Button variant="outline" size="sm" onClick={exportReport}>
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Upload your project to scan for vulnerabilities</p>
                  <p className="text-xs mt-1">Supports web apps, APIs, backend services, and more</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Vulnerability List */}
                  <ScrollArea className="h-[400px]">
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
                              <p className="font-medium text-sm truncate">{vuln.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{vuln.location}</p>
                              {vuln.cweId && (
                                <Badge variant="outline" className="text-[10px] mt-1">
                                  {vuln.cweId}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Vulnerability Details */}
                  {selectedVuln && (
                    <div className="space-y-3">
                      <Tabs defaultValue="details">
                        <TabsList className="grid w-full grid-cols-3 h-8">
                          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                          <TabsTrigger value="exploit" className="text-xs">Exploit</TabsTrigger>
                          <TabsTrigger value="fix" className="text-xs">Fix</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-3 space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-1">{selectedVuln.title}</h4>
                            <p className="text-xs text-muted-foreground">{selectedVuln.description}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{selectedVuln.category}</Badge>
                            {selectedVuln.cweId && (
                              <Badge variant="outline">{selectedVuln.cweId}</Badge>
                            )}
                            {selectedVuln.cvssScore && (
                              <Badge variant="outline">CVSS: {selectedVuln.cvssScore}</Badge>
                            )}
                          </div>
                          {selectedVuln.affectedFiles && selectedVuln.affectedFiles.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Affected Files:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedVuln.affectedFiles.map((file, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    <File className="h-3 w-3 mr-1" />
                                    {file}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedVuln.chain && (
                            <div>
                              <p className="text-xs font-medium mb-1">Attack Chain:</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                                {selectedVuln.chain.map((step, i) => (
                                  <React.Fragment key={i}>
                                    <span className="bg-muted px-2 py-0.5 rounded">{step}</span>
                                    {i < selectedVuln.chain!.length - 1 && <ChevronRight className="h-3 w-3" />}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="exploit" className="mt-3">
                          {selectedVuln.exploit ? (
                            <div className="relative">
                              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                <code>{selectedVuln.exploit}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(selectedVuln.exploit!, `exploit-${selectedVuln.id}`)}
                              >
                                {copiedId === `exploit-${selectedVuln.id}` ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No exploit available</p>
                          )}
                        </TabsContent>

                        <TabsContent value="fix" className="mt-3 space-y-3">
                          <div>
                            <h4 className="text-xs font-medium mb-1">Remediation:</h4>
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
                          {selectedVuln.references && (
                            <div>
                              <p className="text-xs font-medium mb-1">References:</p>
                              <div className="space-y-1">
                                {selectedVuln.references.map((ref, i) => (
                                  <a
                                    key={i}
                                    href={ref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {ref}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {summary && (
          <Card>
            <CardContent className="py-4">
              <h4 className="font-medium mb-2">Audit Summary</h4>
              <p className="text-sm text-muted-foreground">{summary}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default SecurityAuditPanel;
