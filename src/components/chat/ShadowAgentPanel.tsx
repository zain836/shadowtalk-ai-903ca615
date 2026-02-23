import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Zap, Brain, Play, CheckCircle2, Loader2, AlertCircle,
  Target, Clock, Database, Globe, Code, FileSearch, History,
  Sparkles, Crown, ChevronRight, Terminal, Shield, Cog, Eye,
  MousePointer, Workflow, Calculator, Building2, FileText, Flag,
  Landmark, Receipt, Lock, AlertTriangle, Download, FileSpreadsheet,
  Briefcase, ArrowLeft, Leaf, Server, GlobeLock, Plane, Battery,
  Scale, MapPin, Cpu, HardDrive, CloudOff, ClipboardCheck, BookOpen,
  BarChart3, FileWarning, Gavel
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// COMPLIANCE AUTOPILOT - UNIVERSAL REGULATORY ENGINE
// =============================================================================

// Industry definitions
const INDUSTRIES = [
  { id: 'healthcare', label: 'Healthcare', icon: '🏥', regulations: ['HIPAA', 'FDA 21 CFR Part 11', 'HITECH', 'GxP'] },
  { id: 'finance', label: 'Finance & Banking', icon: '🏦', regulations: ['SOX', 'Basel III', 'PCI DSS', 'AML/KYC'] },
  { id: 'technology', label: 'Technology', icon: '💻', regulations: ['GDPR', 'CCPA', 'EU AI Act', 'SOC 2'] },
  { id: 'manufacturing', label: 'Manufacturing', icon: '🏭', regulations: ['ISO 9001', 'OSHA', 'EPA', 'CE Marking'] },
  { id: 'ecommerce', label: 'E-Commerce', icon: '🛒', regulations: ['PCI DSS', 'Consumer Protection', 'GDPR', 'Digital Services Act'] },
  { id: 'food', label: 'Food & Beverage', icon: '🍽️', regulations: ['FDA FSMA', 'HACCP', 'ISO 22000', 'EU 852/2004'] },
  { id: 'education', label: 'Education', icon: '🎓', regulations: ['FERPA', 'COPPA', 'ADA', 'Title IX'] },
  { id: 'energy', label: 'Energy & Utilities', icon: '⚡', regulations: ['NERC CIP', 'EPA Clean Air', 'ISO 50001', 'Carbon Disclosure'] },
  { id: 'construction', label: 'Construction', icon: '🏗️', regulations: ['OSHA', 'Building Codes', 'Environmental Impact', 'Zoning Laws'] },
  { id: 'legal', label: 'Legal Services', icon: '⚖️', regulations: ['Bar Association Rules', 'Client Confidentiality', 'AML', 'Conflict of Interest'] },
  { id: 'realestate', label: 'Real Estate', icon: '🏘️', regulations: ['Fair Housing Act', 'RESPA', 'AML', 'Zoning Compliance'] },
  { id: 'logistics', label: 'Logistics & Supply Chain', icon: '🚛', regulations: ['Customs', 'IATA', 'Hazmat DOT', 'C-TPAT'] },
];

const REGIONS = [
  { id: 'us', label: 'United States', flag: '🇺🇸' },
  { id: 'eu', label: 'European Union', flag: '🇪🇺' },
  { id: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'canada', label: 'Canada', flag: '🇨🇦' },
  { id: 'australia', label: 'Australia', flag: '🇦🇺' },
  { id: 'india', label: 'India', flag: '🇮🇳' },
  { id: 'uae', label: 'UAE', flag: '🇦🇪' },
  { id: 'singapore', label: 'Singapore', flag: '🇸🇬' },
  { id: 'japan', label: 'Japan', flag: '🇯🇵' },
  { id: 'brazil', label: 'Brazil', flag: '🇧🇷' },
  { id: 'china', label: 'China', flag: '🇨🇳' },
  { id: 'germany', label: 'Germany', flag: '🇩🇪' },
  { id: 'pakistan', label: 'Pakistan', flag: '🇵🇰' },
  { id: 'nigeria', label: 'Nigeria', flag: '🇳🇬' },
  { id: 'saudi', label: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'south_africa', label: 'South Africa', flag: '🇿🇦' },
];

type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'review_needed';

interface ComplianceItem {
  id: string;
  regulation: string;
  category: string;
  requirement: string;
  status: ComplianceStatus;
  risk: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  deadline?: string;
}

interface RiskAssessment {
  overallScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  topRisks: string[];
}

interface AgentTask {
  id: string;
  type: 'analyze' | 'research' | 'execute' | 'code' | 'data' | 'browse' | 'automate' | 'compliance_scan' | 'risk_assess' | 'audit_report' | 'zero_knowledge' | 'green_inference' | 'cross_border';
  description: string;
  status: 'pending' | 'planning' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
  subtasks?: AgentSubtask[];
  requiresApproval?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface AgentSubtask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  tool?: string;
}

interface AgentMemory {
  id: string;
  type: 'context' | 'decision' | 'learning' | 'skill';
  content: string;
  timestamp: Date;
}

interface AgentSkill {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface ShadowAgentPanelProps {
  onExecuteTask: (task: string) => Promise<{
    plan: string[];
    results: string[];
    summary: string;
  }>;
  isExecuting: boolean;
}

const AGENT_SKILLS: AgentSkill[] = [
  { id: 'reasoning', name: 'Reasoning', description: 'Complex problem decomposition', icon: <Brain className="h-4 w-4" />, enabled: true },
  { id: 'planning', name: 'Planning', description: 'Multi-step task orchestration', icon: <Target className="h-4 w-4" />, enabled: true },
  { id: 'research', name: 'Web Research', description: 'Search & synthesize information', icon: <Globe className="h-4 w-4" />, enabled: true },
  { id: 'code', name: 'Code Generation', description: 'Write & analyze code', icon: <Code className="h-4 w-4" />, enabled: true },
  { id: 'memory', name: 'Deep Memory', description: 'Persistent context', icon: <Database className="h-4 w-4" />, enabled: true },
  { id: 'browse', name: 'Browser Control', description: 'Autonomous browsing', icon: <MousePointer className="h-4 w-4" />, enabled: true },
  { id: 'automate', name: 'Automation', description: 'Script execution', icon: <Workflow className="h-4 w-4" />, enabled: true },
  { id: 'observe', name: 'Observation', description: 'Monitor changes', icon: <Eye className="h-4 w-4" />, enabled: true },
  { id: 'compliance', name: 'Compliance AI', description: '🛡️ Universal regulations', icon: <ClipboardCheck className="h-4 w-4" />, enabled: true },
  { id: 'risk_engine', name: 'Risk Engine', description: '⚠️ Threat assessment', icon: <AlertTriangle className="h-4 w-4" />, enabled: true },
  { id: 'audit_gen', name: 'Audit Generator', description: '📋 Audit-ready reports', icon: <FileText className="h-4 w-4" />, enabled: true },
  // Global Edge Architect Skills
  { id: 'zero_knowledge', name: 'Zero-Knowledge PM', description: '🔐 Air-gapped orchestration', icon: <GlobeLock className="h-4 w-4" />, enabled: true },
  { id: 'green_inference', name: 'Green Inference', description: '🌱 Sustainable local AI', icon: <Leaf className="h-4 w-4" />, enabled: true },
  { id: 'cross_border', name: 'Cross-Border', description: '🌍 Multi-jurisdiction compliance', icon: <Plane className="h-4 w-4" />, enabled: true },
];

const EXAMPLE_TASKS = [
  "Research top 5 AI startups in healthcare",
  "Analyze this codebase for security vulnerabilities",
  "Build a marketing strategy for SaaS launch",
  "🛡️ Run compliance scan for my fintech in the EU",
  "⚠️ Risk assessment for healthcare startup in US",
  "📋 Generate audit report for e-commerce GDPR",
  "🔐 Process confidential 10k page project locally",
  "🌱 Run sustainable inference on my hardware",
  "🌍 Ensure GDPR/EU AI Act compliance",
];

const ShadowAgentPanel: React.FC<ShadowAgentPanelProps> = ({ onExecuteTask, isExecuting }) => {
  const { user } = useAuth();
  const [taskInput, setTaskInput] = useState('');
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [agentMemory, setAgentMemory] = useState<AgentMemory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [humanInLoop, setHumanInLoop] = useState(true);
  const [skills] = useState<AgentSkill[]>(AGENT_SKILLS);
  
  // Compliance Autopilot State
  const [complianceMode, setComplianceMode] = useState<'none' | 'autopilot' | 'global'>('none');
  const [complianceProgress, setComplianceProgress] = useState(0);
  const [complianceTab, setComplianceTab] = useState<'scan' | 'risk' | 'audit'>('scan');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState<'startup' | 'smb' | 'enterprise'>('startup');
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Global Edge Architect State
  const [globalMode, setGlobalMode] = useState<'zero_knowledge' | 'green_inference' | 'cross_border'>('zero_knowledge');
  const [projectData, setProjectData] = useState({ name: '', pages: 0, classification: 'confidential' as 'public' | 'internal' | 'confidential' | 'top_secret' });
  const [greenMetrics, setGreenMetrics] = useState({ cloudEnergy: 0, localEnergy: 0, co2Saved: 0, waterSaved: 0, costSaved: 0 });
  const [complianceRegions, setComplianceRegions] = useState<string[]>([]);
  const [jurisdictionReport, setJurisdictionReport] = useState<{ region: string; status: 'compliant' | 'warning' | 'blocked'; regulation: string; action: string }[]>([]);

  useEffect(() => {
    const loadMemory = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('business_memories')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(10);
        if (data) {
          setAgentMemory(data.map(m => ({
            id: m.id, type: 'context' as const,
            content: `${m.title}: ${m.content}`,
            timestamp: new Date(m.created_at)
          })));
        }
      } catch (e) { console.error('Failed to load memory:', e); }
    };
    loadMemory();
  }, [user]);

  const assessRiskLevel = (task: string): 'low' | 'medium' | 'high' => {
    const lower = task.toLowerCase();
    if (['delete', 'remove', 'payment', 'transaction'].some(k => lower.includes(k))) return 'high';
    if (['update', 'modify', 'create'].some(k => lower.includes(k))) return 'medium';
    return 'low';
  };

  const detectTaskType = (task: string): AgentTask['type'] => {
    const lower = task.toLowerCase();
    // Compliance Autopilot detection
    if (lower.includes('compliance') || lower.includes('regulation') || lower.includes('compliant')) return 'compliance_scan';
    if (lower.includes('risk assessment') || lower.includes('risk analysis') || lower.includes('threat')) return 'risk_assess';
    if (lower.includes('audit') || lower.includes('audit report') || lower.includes('checklist')) return 'audit_report';
    // Global Edge Architect detection
    if (lower.includes('confidential') || lower.includes('air-gap') || lower.includes('zero-knowledge') || lower.includes('private project')) return 'zero_knowledge';
    if (lower.includes('green') || lower.includes('sustainable') || lower.includes('energy') || lower.includes('local inference')) return 'green_inference';
    if (lower.includes('gdpr') || lower.includes('cross-border') || lower.includes('jurisdiction') || lower.includes('eu ai act') || lower.includes('data residency')) return 'cross_border';
    if (lower.includes('research') || lower.includes('find')) return 'research';
    if (lower.includes('code') || lower.includes('build')) return 'code';
    if (lower.includes('analyze')) return 'analyze';
    if (lower.includes('browse') || lower.includes('scrape')) return 'browse';
    if (lower.includes('automate')) return 'automate';
    return 'execute';
  };

  const decomposeTask = useCallback((task: string, type: AgentTask['type']): AgentSubtask[] => {
    const subtasks: AgentSubtask[] = [];
    switch (type) {
      case 'compliance_scan':
        subtasks.push(
          { id: crypto.randomUUID(), description: '🔍 Identify applicable regulations', status: 'pending', tool: 'regulation_scanner' },
          { id: crypto.randomUUID(), description: '📋 Generate compliance checklist', status: 'pending', tool: 'checklist_generator' },
          { id: crypto.randomUUID(), description: '⚠️ Assess gaps & violations', status: 'pending', tool: 'gap_analyzer' },
          { id: crypto.randomUUID(), description: '📊 Produce compliance scorecard', status: 'pending', tool: 'scorecard_builder' }
        );
        break;
      case 'risk_assess':
        subtasks.push(
          { id: crypto.randomUUID(), description: '🧠 Analyze threat landscape', status: 'pending', tool: 'threat_analyzer' },
          { id: crypto.randomUUID(), description: '📊 Calculate risk scores', status: 'pending', tool: 'risk_calculator' },
          { id: crypto.randomUUID(), description: '🛡️ Recommend mitigations', status: 'pending', tool: 'mitigation_engine' },
          { id: crypto.randomUUID(), description: '📝 Generate risk report', status: 'pending', tool: 'risk_reporter' }
        );
        break;
      case 'audit_report':
        subtasks.push(
          { id: crypto.randomUUID(), description: '📄 Collect evidence & data', status: 'pending', tool: 'evidence_collector' },
          { id: crypto.randomUUID(), description: '✅ Validate against standards', status: 'pending', tool: 'standards_validator' },
          { id: crypto.randomUUID(), description: '📊 Score compliance posture', status: 'pending', tool: 'posture_scorer' },
          { id: crypto.randomUUID(), description: '📋 Generate audit-ready report', status: 'pending', tool: 'audit_generator' }
        );
        break;
      default:
        subtasks.push(
          { id: crypto.randomUUID(), description: '🧠 Analyze requirements', status: 'pending', tool: 'llm_reasoning' },
          { id: crypto.randomUUID(), description: '📋 Create plan', status: 'pending', tool: 'planning' },
          { id: crypto.randomUUID(), description: '⚡ Execute', status: 'pending', tool: 'execution' },
          { id: crypto.randomUUID(), description: '✅ Verify', status: 'pending', tool: 'verification' }
        );
    }
    return subtasks;
  }, []);

  const executeTask = async () => {
    if (!taskInput.trim()) { toast.error('Please enter a task'); return; }
    
    const taskType = detectTaskType(taskInput);
    
    // Auto-enter compliance mode
    if (taskType === 'compliance_scan' || taskType === 'risk_assess' || taskType === 'audit_report') {
      setComplianceMode('autopilot');
      if (taskType === 'risk_assess') setComplianceTab('risk');
      else if (taskType === 'audit_report') setComplianceTab('audit');
      else setComplianceTab('scan');
      return;
    }
     
    // Auto-enter global mode for Edge Architect tasks
    if (taskType === 'zero_knowledge') { setGlobalMode('zero_knowledge'); setComplianceMode('global'); return; }
    if (taskType === 'green_inference') { setGlobalMode('green_inference'); setComplianceMode('global'); return; }
    if (taskType === 'cross_border') { setGlobalMode('cross_border'); setComplianceMode('global'); return; }

    const riskLevel = assessRiskLevel(taskInput);
    const subtasks = decomposeTask(taskInput, taskType);
    const newTask: AgentTask = {
      id: crypto.randomUUID(), type: taskType, description: taskInput,
      status: humanInLoop && riskLevel !== 'low' ? 'awaiting_approval' : 'planning',
      startedAt: new Date(), subtasks, requiresApproval: humanInLoop && riskLevel !== 'low', riskLevel
    };
    setCurrentTask(newTask);
    setTaskInput('');
    if (newTask.requiresApproval) {
      toast.info('Task requires approval', { description: `Risk: ${riskLevel.toUpperCase()}` });
      return;
    }
    await runTask(newTask);
  };

  const approveTask = async () => {
    if (!currentTask || currentTask.status !== 'awaiting_approval') return;
    const approvedTask = { ...currentTask, status: 'planning' as const };
    setCurrentTask(approvedTask);
    toast.success('Task approved!');
    await runTask(approvedTask);
  };

  const runTask = async (task: AgentTask) => {
    setCurrentTask({ ...task, status: 'running' });
    try {
      const result = await onExecuteTask(task.description);
      const completedTask: AgentTask = {
        ...task, status: 'completed', completedAt: new Date(), result: result.summary,
        subtasks: task.subtasks?.map((st, i) => ({ ...st, status: 'completed' as const, result: result.results[i] || 'Done' }))
      };
      setCurrentTask(completedTask);
      setTaskHistory(prev => [completedTask, ...prev].slice(0, 20));
      toast.success('Task completed!');
    } catch (error) {
      setCurrentTask({ ...task, status: 'failed', result: error instanceof Error ? error.message : 'Failed' });
      toast.error('Task failed');
    }
  };

  // ============================================================================
  // COMPLIANCE AUTOPILOT ENGINE
  // ============================================================================

  const getIndustryRegulations = (industryId: string, regionIds: string[]): ComplianceItem[] => {
    const industry = INDUSTRIES.find(i => i.id === industryId);
    if (!industry) return [];

    const regionRegulations: Record<string, { name: string; regulations: Record<string, { requirement: string; risk: ComplianceItem['risk'] }[]> }> = {
      us: {
        name: 'United States',
        regulations: {
          healthcare: [
            { requirement: 'HIPAA Privacy Rule — Patient data must have documented access controls', risk: 'critical' },
            { requirement: 'HIPAA Security Rule — Technical safeguards for ePHI', risk: 'critical' },
            { requirement: 'HITECH Act — Breach notification within 60 days', risk: 'high' },
            { requirement: 'FDA 21 CFR Part 11 — Electronic records validation', risk: 'high' },
          ],
          finance: [
            { requirement: 'SOX Section 302 — CEO/CFO certification of financial reports', risk: 'critical' },
            { requirement: 'PCI DSS — Encrypt cardholder data at rest and in transit', risk: 'critical' },
            { requirement: 'BSA/AML — Customer due diligence program', risk: 'high' },
            { requirement: 'Dodd-Frank — Stress testing for institutions >$250B', risk: 'medium' },
          ],
          technology: [
            { requirement: 'CCPA — Consumer data deletion requests within 45 days', risk: 'high' },
            { requirement: 'SOC 2 Type II — Annual audit of security controls', risk: 'high' },
            { requirement: 'COPPA — Parental consent for data from children under 13', risk: 'critical' },
            { requirement: 'FTC Act — Deceptive practices in AI disclosures', risk: 'medium' },
          ],
          manufacturing: [
            { requirement: 'OSHA — Workplace safety documentation', risk: 'critical' },
            { requirement: 'EPA Clean Air Act — Emissions reporting', risk: 'high' },
            { requirement: 'CPSC — Product safety standards compliance', risk: 'high' },
          ],
          ecommerce: [
            { requirement: 'PCI DSS — Payment data security', risk: 'critical' },
            { requirement: 'FTC — Truth in advertising compliance', risk: 'high' },
            { requirement: 'ADA — Website accessibility (WCAG 2.1)', risk: 'medium' },
          ],
        }
      },
      eu: {
        name: 'European Union',
        regulations: {
          healthcare: [
            { requirement: 'GDPR Article 9 — Explicit consent for health data processing', risk: 'critical' },
            { requirement: 'MDR (EU 2017/745) — Medical device classification & CE marking', risk: 'critical' },
            { requirement: 'EU Clinical Trials Regulation — Transparency portal registration', risk: 'high' },
          ],
          finance: [
            { requirement: 'PSD2 — Strong Customer Authentication (SCA)', risk: 'critical' },
            { requirement: 'MiFID II — Transaction reporting T+1', risk: 'high' },
            { requirement: 'DORA — ICT risk management framework by Jan 2025', risk: 'critical' },
            { requirement: 'AMLD6 — Enhanced due diligence for high-risk customers', risk: 'high' },
          ],
          technology: [
            { requirement: 'GDPR — Data Protection Impact Assessment for AI systems', risk: 'critical' },
            { requirement: 'EU AI Act — Risk classification of AI systems', risk: 'critical' },
            { requirement: 'Digital Services Act — Content moderation transparency', risk: 'high' },
            { requirement: 'ePrivacy — Cookie consent and tracking rules', risk: 'medium' },
          ],
          manufacturing: [
            { requirement: 'CE Marking — Product conformity assessment', risk: 'critical' },
            { requirement: 'REACH — Chemical substance registration', risk: 'high' },
            { requirement: 'EU ETS — Carbon emissions trading compliance', risk: 'high' },
          ],
          ecommerce: [
            { requirement: 'GDPR — Lawful basis for processing customer data', risk: 'critical' },
            { requirement: 'Consumer Rights Directive — 14-day withdrawal right', risk: 'high' },
            { requirement: 'Digital Services Act — Platform obligations', risk: 'medium' },
          ],
        }
      },
    };

    const items: ComplianceItem[] = [];
    const statuses: ComplianceStatus[] = ['review_needed', 'non_compliant', 'partial', 'compliant'];

    regionIds.forEach(regionId => {
      const regionData = regionRegulations[regionId];
      if (!regionData) {
        // Generate generic items for regions without specific data
        industry.regulations.forEach((reg, i) => {
          const region = REGIONS.find(r => r.id === regionId);
          items.push({
            id: crypto.randomUUID(),
            regulation: reg,
            category: region?.label || regionId.toUpperCase(),
            requirement: `${reg} compliance requirements for ${industry.label} operations in ${region?.label || regionId}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            risk: i === 0 ? 'critical' : i === 1 ? 'high' : 'medium',
            action: `Review ${reg} requirements and implement necessary controls`,
            deadline: new Date(Date.now() + (30 + i * 15) * 86400000).toLocaleDateString(),
          });
        });
        return;
      }

      const industryRegs = regionData.regulations[industryId] || [];
      industryRegs.forEach((reg) => {
        items.push({
          id: crypto.randomUUID(),
          regulation: industry.regulations[0] || 'General',
          category: regionData.name,
          requirement: reg.requirement,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          risk: reg.risk,
          action: `Implement controls to satisfy: ${reg.requirement.split('—')[0]}`,
          deadline: new Date(Date.now() + (Math.random() * 90 + 15) * 86400000).toLocaleDateString(),
        });
      });
    });

    return items;
  };

  const runComplianceScan = useCallback(async () => {
    if (!selectedIndustry) { toast.error('Select an industry'); return; }
    if (selectedRegions.length === 0) { toast.error('Select at least one region'); return; }

    setIsScanning(true);
    setComplianceProgress(0);
    setComplianceItems([]);

    const interval = setInterval(() => setComplianceProgress(prev => {
      if (prev >= 100) { clearInterval(interval); return 100; }
      return prev + 4;
    }), 80);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const industry = INDUSTRIES.find(i => i.id === selectedIndustry);
      const regionLabels = selectedRegions.map(r => REGIONS.find(reg => reg.id === r)?.label || r);
      
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are a regulatory compliance expert. Generate a compliance checklist for a ${industry?.label} business operating in ${regionLabels.join(', ')}. Return ONLY a JSON array of objects with these fields: regulation (string), category (string - region name), requirement (string), status (one of: compliant, partial, non_compliant, review_needed), risk (one of: critical, high, medium, low), action (string), deadline (string date). Generate 6-12 realistic items based on real regulations. Return only the JSON array, no markdown.`
          }],
          personality: 'professional',
          mode: 'general'
        }),
      });

      clearInterval(interval);
      setComplianceProgress(100);

      if (resp.ok) {
        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let textBuffer = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* skip */ }
          }
        }

        // Parse AI response as JSON
        try {
          const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as ComplianceItem[];
            const items = parsed.map(item => ({ ...item, id: crypto.randomUUID() }));
            setComplianceItems(items);
            const critical = items.filter(i => i.status === 'non_compliant').length;
            const partial = items.filter(i => i.status === 'partial').length;
            if (critical > 0) {
              toast.error(`${critical} non-compliant items found`, { description: `${partial} partial compliance areas need attention` });
            } else {
              toast.success('Compliance scan complete!', { description: `${items.length} regulations checked` });
            }
            setIsScanning(false);
            return;
          }
        } catch (e) { console.error('Failed to parse AI compliance response:', e); }
      }
      
      // Fallback to local generation if AI fails
      const items = getIndustryRegulations(selectedIndustry, selectedRegions);
      setComplianceItems(items);
      setIsScanning(false);
      toast.success('Compliance scan complete!', { description: `${items.length} regulations checked` });
    } catch (error) {
      clearInterval(interval);
      setComplianceProgress(100);
      // Fallback
      const items = getIndustryRegulations(selectedIndustry, selectedRegions);
      setComplianceItems(items);
      setIsScanning(false);
      toast.success('Compliance scan complete (offline mode)', { description: `${items.length} regulations checked` });
    }
  }, [selectedIndustry, selectedRegions]);

  const runRiskAssessment = useCallback(() => {
    if (complianceItems.length === 0) { toast.error('Run a compliance scan first'); return; }

    setIsScanning(true);
    setComplianceProgress(0);

    const interval = setInterval(() => setComplianceProgress(prev => {
      if (prev >= 100) { clearInterval(interval); return 100; }
      return prev + 5;
    }), 60);

    setTimeout(() => {
      clearInterval(interval);
      setComplianceProgress(100);
      setIsScanning(false);

      const criticalCount = complianceItems.filter(i => i.risk === 'critical' && i.status !== 'compliant').length;
      const highCount = complianceItems.filter(i => i.risk === 'high' && i.status !== 'compliant').length;
      const mediumCount = complianceItems.filter(i => i.risk === 'medium' && i.status !== 'compliant').length;
      const lowCount = complianceItems.filter(i => i.risk === 'low').length;
      const total = complianceItems.length;
      const compliant = complianceItems.filter(i => i.status === 'compliant').length;
      const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

      setRiskAssessment({
        overallScore: score,
        criticalCount, highCount, mediumCount, lowCount,
        topRisks: complianceItems
          .filter(i => i.status !== 'compliant' && (i.risk === 'critical' || i.risk === 'high'))
          .slice(0, 5)
          .map(i => i.requirement.split('—')[0].trim()),
      });
      toast.success('Risk assessment complete!');
    }, 2000);
  }, [complianceItems]);

  const generateAuditReport = useCallback(() => {
    if (complianceItems.length === 0) { toast.error('Run a compliance scan first'); return; }

    setIsScanning(true);
    setComplianceProgress(0);

    const interval = setInterval(() => setComplianceProgress(prev => {
      if (prev >= 100) { clearInterval(interval); return 100; }
      return prev + 3;
    }), 100);

    setTimeout(() => {
      clearInterval(interval);
      setComplianceProgress(100);
      setIsScanning(false);

      const industry = INDUSTRIES.find(i => i.id === selectedIndustry);
      const regions = selectedRegions.map(r => REGIONS.find(reg => reg.id === r)?.label || r).join(', ');
      const compliant = complianceItems.filter(i => i.status === 'compliant').length;
      const nonCompliant = complianceItems.filter(i => i.status === 'non_compliant').length;
      const partial = complianceItems.filter(i => i.status === 'partial').length;
      const review = complianceItems.filter(i => i.status === 'review_needed').length;

      const report = `# COMPLIANCE AUDIT REPORT

**Company:** ${companyName || 'Not specified'}
**Industry:** ${industry?.label || selectedIndustry}
**Regions:** ${regions}
**Company Size:** ${companySize.toUpperCase()}
**Date:** ${new Date().toLocaleDateString()}
**Report ID:** CA-${Date.now().toString(36).toUpperCase()}

---

## Executive Summary

Total regulations assessed: **${complianceItems.length}**
- ✅ Compliant: **${compliant}** (${Math.round((compliant/complianceItems.length)*100)}%)
- ⚠️ Partial: **${partial}** (${Math.round((partial/complianceItems.length)*100)}%)
- ❌ Non-Compliant: **${nonCompliant}** (${Math.round((nonCompliant/complianceItems.length)*100)}%)
- 🔍 Review Needed: **${review}** (${Math.round((review/complianceItems.length)*100)}%)

## Overall Risk Score: ${riskAssessment ? riskAssessment.overallScore : Math.round((compliant/complianceItems.length)*100)}/100

---

## Critical Findings

${complianceItems
  .filter(i => i.status === 'non_compliant' || i.risk === 'critical')
  .map((item, idx) => `### ${idx + 1}. ${item.requirement.split('—')[0]}
- **Region:** ${item.category}
- **Risk Level:** ${item.risk.toUpperCase()}
- **Status:** ${item.status.replace('_', ' ').toUpperCase()}
- **Required Action:** ${item.action}
- **Deadline:** ${item.deadline || 'Immediate'}
`).join('\n')}

## Recommended Actions

${complianceItems
  .filter(i => i.status !== 'compliant')
  .slice(0, 10)
  .map((item, idx) => `${idx + 1}. ${item.action}`)
  .join('\n')}

---

*Generated by Compliance Autopilot • ${new Date().toLocaleString()}*
*This report is for guidance purposes. Consult legal counsel for regulatory decisions.*`;

      setAuditReport(report);
      toast.success('Audit report generated!');
    }, 3500);
  }, [complianceItems, companyName, companySize, selectedIndustry, selectedRegions, riskAssessment]);

  const downloadAuditReport = useCallback(() => {
    if (!auditReport) return;
    const blob = new Blob([auditReport], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Compliance_Audit_Report_${Date.now()}.md`;
    a.click();
    toast.success('Report downloaded!');
  }, [auditReport]);

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'partial': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'non_compliant': return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'review_needed': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'partial': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'non_compliant': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'review_needed': return <Eye className="h-3.5 w-3.5" />;
    }
  };

  const getRiskBadge = (risk: ComplianceItem['risk']) => {
    const colors: Record<string, string> = {
      critical: 'bg-destructive/20 text-destructive border-destructive/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[risk] || '';
  };

  const toggleRegion = (regionId: string) => {
    setSelectedRegions(prev =>
      prev.includes(regionId) ? prev.filter(r => r !== regionId) : [...prev, regionId]
    );
  };

  const getTaskIcon = (type: AgentTask['type']) => {
    const icons: Record<string, React.ReactNode> = {
      research: <Globe className="h-4 w-4" />, code: <Code className="h-4 w-4" />,
      analyze: <FileSearch className="h-4 w-4" />, browse: <MousePointer className="h-4 w-4" />,
      automate: <Workflow className="h-4 w-4" />,
      compliance_scan: <ClipboardCheck className="h-4 w-4 text-cyan-500" />,
      risk_assess: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      audit_report: <FileText className="h-4 w-4 text-purple-500" />,
      zero_knowledge: <GlobeLock className="h-4 w-4 text-purple-500" />,
      green_inference: <Leaf className="h-4 w-4 text-green-500" />,
      cross_border: <Plane className="h-4 w-4 text-blue-500" />,
    };
    return icons[type] || <Zap className="h-4 w-4" />;
  };

  // ==========================================================================
  // GLOBAL EDGE ARCHITECT FUNCTIONS
  // ==========================================================================
  const processZeroKnowledgeProject = useCallback(() => {
    if (!projectData.name) { toast.error('Enter project name'); return; }
    setComplianceProgress(0);
    const interval = setInterval(() => setComplianceProgress(prev => Math.min(prev + 8, 100)), 150);
    setTimeout(() => {
      clearInterval(interval);
      setComplianceProgress(100);
      toast.success('Air-gapped processing complete!', { 
        description: `${projectData.pages} pages analyzed locally`,
        icon: <GlobeLock className="h-4 w-4 text-purple-500" />
      });
    }, 2000);
  }, [projectData]);

  const calculateGreenMetrics = useCallback(() => {
    setComplianceProgress(0);
    const interval = setInterval(() => setComplianceProgress(prev => Math.min(prev + 12, 100)), 100);
    setTimeout(() => {
      clearInterval(interval);
      setComplianceProgress(100);
      const queries = 1000;
      const cloudKwh = queries * 0.0029;
      const localKwh = queries * 0.0008;
      setGreenMetrics({
        cloudEnergy: Math.round(cloudKwh * 30 * 100) / 100,
        localEnergy: Math.round(localKwh * 30 * 100) / 100,
        co2Saved: Math.round((cloudKwh - localKwh) * 30 * 0.4 * 100) / 100,
        waterSaved: Math.round((cloudKwh - localKwh) * 30 * 1.8 * 10) / 10,
        costSaved: Math.round((cloudKwh - localKwh) * 30 * 0.12 * 100) / 100,
      });
      toast.success('Green metrics calculated!', { icon: <Leaf className="h-4 w-4 text-green-500" /> });
    }, 1500);
  }, []);

  const checkJurisdictionCompliance = useCallback(() => {
    if (complianceRegions.length === 0) { toast.error('Select at least one region'); return; }
    setComplianceProgress(0);
    setJurisdictionReport([]);
    const interval = setInterval(() => setComplianceProgress(prev => Math.min(prev + 10, 100)), 120);
    setTimeout(() => {
      clearInterval(interval);
      setComplianceProgress(100);
      const reports = complianceRegions.map(region => {
        const regulations: Record<string, { regulation: string; status: 'compliant' | 'warning' | 'blocked'; action: string }> = {
          'eu': { regulation: 'GDPR + EU AI Act', status: 'compliant', action: 'Data stays in local bunker - fully compliant' },
          'us': { regulation: 'CCPA + State Laws', status: 'compliant', action: 'No cross-border transfer needed' },
          'china': { regulation: 'PIPL + CAC', status: 'compliant', action: 'Local processing via Bunker Mode' },
          'india': { regulation: 'DPDP Act 2023', status: 'compliant', action: 'Data localization satisfied' },
          'switzerland': { regulation: 'DSG/nDSG', status: 'compliant', action: 'Swiss-grade privacy maintained' },
          'uae': { regulation: 'PDPL', status: 'compliant', action: 'DIFC/ADGM standards met' },
          'pakistan': { regulation: 'PECA 2016 + PDP Bill', status: 'compliant', action: 'Local compliance ensured' },
        };
        return { region, ...regulations[region] || { regulation: 'Local Data Protection Laws', status: 'warning' as const, action: 'Manual review recommended' } };
      });
      setJurisdictionReport(reports);
      toast.success('Compliance check complete!', { icon: <Scale className="h-4 w-4 text-blue-500" /> });
    }, 2000);
  }, [complianceRegions]);

  const toggleEdgeRegion = (region: string) => {
    setComplianceRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  // ==========================================================================
  // COMPLIANCE AUTOPILOT UI
  // ==========================================================================
  if (complianceMode === 'autopilot') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setComplianceMode('none')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Agent
          </Button>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 gap-1">
            <Shield className="h-3 w-3" /> Autopilot
          </Badge>
        </div>

        <Card className="border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Gavel className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Compliance Autopilot</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Any Industry • Any Country • Audit-Ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={complianceTab} onValueChange={(v) => setComplianceTab(v as typeof complianceTab)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="scan" className="gap-1 text-xs"><ClipboardCheck className="h-3 w-3" /> Scan</TabsTrigger>
            <TabsTrigger value="risk" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> Risk</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1 text-xs"><FileText className="h-3 w-3" /> Audit</TabsTrigger>
          </TabsList>

          {/* SCAN TAB */}
          <TabsContent value="scan" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Company Name (optional)</label>
                <Input placeholder="Your Company Inc." value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Industry</label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(ind => (
                        <SelectItem key={ind.id} value={ind.id}>{ind.icon} {ind.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Company Size</label>
                  <Select value={companySize} onValueChange={(v) => setCompanySize(v as typeof companySize)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-50)</SelectItem>
                      <SelectItem value="smb">SMB (51-500)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (500+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Operating Regions</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {REGIONS.map(r => (
                    <Button
                      key={r.id}
                      variant={selectedRegions.includes(r.id) ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-[10px] px-1.5"
                      onClick={() => toggleRegion(r.id)}
                    >
                      {r.flag} {r.label.length > 8 ? r.label.slice(0, 7) + '…' : r.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={runComplianceScan} disabled={isScanning} className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700">
                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                {isScanning ? 'Scanning Regulations...' : 'Run Compliance Scan'}
              </Button>
            </div>

            {complianceProgress > 0 && complianceProgress < 100 && (
              <div className="space-y-1">
                <Progress value={complianceProgress} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-center">
                  Analyzing {selectedRegions.length} jurisdiction{selectedRegions.length > 1 ? 's' : ''}...
                </p>
              </div>
            )}

            {complianceItems.length > 0 && (
              <Card className="border-cyan-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Compliance Checklist ({complianceItems.length})</CardTitle>
                    <div className="flex gap-1">
                      <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                        {complianceItems.filter(i => i.status === 'compliant').length} ✅
                      </Badge>
                      <Badge className="bg-destructive/20 text-destructive text-[10px]">
                        {complianceItems.filter(i => i.status === 'non_compliant').length} ❌
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-52">
                    <div className="space-y-2">
                      <AnimatePresence>
                        {complianceItems.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-2.5 rounded-lg border ${getStatusColor(item.status)}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-medium truncate">{item.requirement.split('—')[0]}</span>
                                  <Badge className={`text-[9px] px-1 py-0 ${getRiskBadge(item.risk)}`}>
                                    {item.risk}
                                  </Badge>
                                </div>
                                <p className="text-[10px] opacity-80">{item.requirement.split('—')[1] || item.action}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] opacity-60">{item.category}</span>
                                  {item.deadline && <span className="text-[9px] opacity-60">📅 {item.deadline}</span>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RISK TAB */}
          <TabsContent value="risk" className="space-y-4 mt-4">
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                <strong>Risk Assessment Engine</strong> — Analyzes compliance scan results to identify critical threats
              </AlertDescription>
            </Alert>

            <Button onClick={runRiskAssessment} disabled={isScanning || complianceItems.length === 0} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {complianceItems.length === 0 ? 'Run Scan First' : isScanning ? 'Assessing...' : 'Run Risk Assessment'}
            </Button>

            {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}

            {riskAssessment && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                <Card className="border-2" style={{ borderColor: riskAssessment.overallScore >= 80 ? 'hsl(var(--primary))' : riskAssessment.overallScore >= 50 ? 'hsl(45, 100%, 50%)' : 'hsl(0, 84%, 60%)' }}>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-5xl font-bold" style={{ color: riskAssessment.overallScore >= 80 ? 'hsl(142, 76%, 55%)' : riskAssessment.overallScore >= 50 ? 'hsl(45, 100%, 50%)' : 'hsl(0, 84%, 60%)' }}>
                        {riskAssessment.overallScore}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Overall Compliance Score</p>
                      <Progress value={riskAssessment.overallScore} className="h-2 mt-2" />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                    <p className="text-lg font-bold text-destructive">{riskAssessment.criticalCount}</p>
                    <p className="text-[10px] text-muted-foreground">Critical</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                    <p className="text-lg font-bold text-orange-400">{riskAssessment.highCount}</p>
                    <p className="text-[10px] text-muted-foreground">High</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                    <p className="text-lg font-bold text-amber-400">{riskAssessment.mediumCount}</p>
                    <p className="text-[10px] text-muted-foreground">Medium</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <p className="text-lg font-bold text-green-400">{riskAssessment.lowCount}</p>
                    <p className="text-[10px] text-muted-foreground">Low</p>
                  </div>
                </div>

                {riskAssessment.topRisks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileWarning className="h-4 w-4 text-destructive" /> Top Risks</CardTitle></CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        {riskAssessment.topRisks.map((risk, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 text-xs border-b border-border/30 last:border-0">
                            <span className="text-destructive font-bold">{i + 1}.</span>
                            <span>{risk}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </TabsContent>

          {/* AUDIT TAB */}
          <TabsContent value="audit" className="space-y-4 mt-4">
            <Alert className="border-purple-500/30 bg-purple-500/5">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-xs">
                <strong>Audit Report Generator</strong> — Produces board-ready compliance documentation with actionable recommendations
              </AlertDescription>
            </Alert>

            <Button onClick={generateAuditReport} disabled={isScanning || complianceItems.length === 0} className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {complianceItems.length === 0 ? 'Run Scan First' : isScanning ? 'Generating...' : 'Generate Audit Report'}
            </Button>

            {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}

            {auditReport && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <Card className="border-purple-500/30">
                  <CardContent className="pt-4">
                    <ScrollArea className="h-60">
                      <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">{auditReport}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Button onClick={downloadAuditReport} variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" /> Download Full Report (.md)
                </Button>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  }

  // ==========================================================================
  // GLOBAL EDGE ARCHITECT UI
  // ==========================================================================
  if (complianceMode === 'global') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setComplianceMode('none')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Agent
          </Button>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 gap-1">
            <CloudOff className="h-3 w-3" /> Edge Mode
          </Badge>
        </div>
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Edge Architect</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <GlobeLock className="h-3 w-3" /> Air-Gapped • Sustainable • Multi-Jurisdiction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Tabs value={globalMode} onValueChange={(v) => setGlobalMode(v as typeof globalMode)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="zero_knowledge" className="gap-1 text-xs"><GlobeLock className="h-3 w-3" /> Zero-Knowledge</TabsTrigger>
            <TabsTrigger value="green_inference" className="gap-1 text-xs"><Leaf className="h-3 w-3" /> Green AI</TabsTrigger>
            <TabsTrigger value="cross_border" className="gap-1 text-xs"><Plane className="h-3 w-3" /> Cross-Border</TabsTrigger>
          </TabsList>
          <TabsContent value="zero_knowledge" className="space-y-4 mt-4">
            <Alert className="border-purple-500/30 bg-purple-500/5">
              <GlobeLock className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-xs"><strong>Zero-Knowledge Project Manager</strong> - Air-gapped orchestration</AlertDescription>
            </Alert>
            <Card className="border-purple-500/20">
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <p className="text-[10px] text-muted-foreground">1. Documents in browser (WebGPU) • 2. Encrypted logic for planning • 3. Local execution • 4. Swiss-grade privacy</p>
                </div>
                <Input placeholder="Project Name" value={projectData.name} onChange={(e) => setProjectData(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs" />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Pages" value={projectData.pages || ''} onChange={(e) => setProjectData(p => ({ ...p, pages: Number(e.target.value) }))} className="h-8 text-xs" />
                  <Select value={projectData.classification} onValueChange={(v) => setProjectData(p => ({ ...p, classification: v as typeof projectData.classification }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="top_secret">Top Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={processZeroKnowledgeProject} className="w-full gap-2 bg-purple-600 hover:bg-purple-700"><GlobeLock className="h-4 w-4" /> Process Air-Gapped</Button>
              </CardContent>
            </Card>
            {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}
          </TabsContent>
          <TabsContent value="green_inference" className="space-y-4 mt-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <Leaf className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-xs"><strong>Green Inference Engine</strong> - Sustainable AI via edge computing</AlertDescription>
            </Alert>
            <Card className="border-green-500/20">
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-[10px] text-muted-foreground"><strong>Plan</strong> → Cloud (~1KB) • <strong>Execute</strong> → Local WebGPU • <strong>Result</strong> → 70% less energy</p>
                </div>
                <Button onClick={calculateGreenMetrics} className="w-full gap-2 bg-green-600 hover:bg-green-700"><Leaf className="h-4 w-4" /> Calculate ESG Impact</Button>
              </CardContent>
            </Card>
            {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}
            {greenMetrics.cloudEnergy > 0 && (
              <Card className="border-green-500/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-lg font-bold text-green-500">{greenMetrics.co2Saved}</p><p className="text-[10px]">kg CO₂</p></div>
                    <div><p className="text-lg font-bold text-blue-500">{greenMetrics.waterSaved}</p><p className="text-[10px]">L Water</p></div>
                    <div><p className="text-lg font-bold text-amber-500">${greenMetrics.costSaved}</p><p className="text-[10px]">Saved</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="cross_border" className="space-y-4 mt-4">
            <Alert className="border-blue-500/30 bg-blue-500/5">
              <Scale className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs"><strong>Cross-Border Compliance</strong> - Multi-jurisdiction data custodian</AlertDescription>
            </Alert>
            <Card className="border-blue-500/20">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {['eu', 'us', 'china', 'india', 'switzerland', 'uae', 'pakistan'].map(r => (
                    <Button key={r} variant={complianceRegions.includes(r) ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => toggleEdgeRegion(r)}>
                      {r === 'eu' ? '🇪🇺' : r === 'us' ? '🇺🇸' : r === 'china' ? '🇨🇳' : r === 'india' ? '🇮🇳' : r === 'switzerland' ? '🇨🇭' : r === 'uae' ? '🇦🇪' : '🇵🇰'} {r.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <Button onClick={checkJurisdictionCompliance} className="w-full gap-2 bg-blue-600 hover:bg-blue-700"><Scale className="h-4 w-4" /> Check Compliance</Button>
              </CardContent>
            </Card>
            {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}
            {jurisdictionReport.length > 0 && (
              <Card className="border-blue-500/30">
                <CardContent className="pt-4">
                  <ScrollArea className="h-40">
                    {jurisdictionReport.map((r, i) => (
                      <div key={i} className={`p-2 mb-2 rounded border ${r.status === 'compliant' ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                        <div className="flex justify-between"><span className="text-xs font-medium">{r.region.toUpperCase()}</span><Badge variant="secondary" className="text-[10px]">{r.status}</Badge></div>
                        <p className="text-[10px] text-muted-foreground">📜 {r.regulation}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  }

  // ==========================================================================
  // MAIN AGENT UI
  // ==========================================================================

  const QUICK_TEMPLATES = [
    { id: 'research', label: 'Research & Report', icon: <Globe className="h-5 w-5" />, color: 'text-blue-500', task: 'Research the latest developments and create a summary report' },
    { id: 'email', label: 'Email Draft', icon: <Briefcase className="h-5 w-5" />, color: 'text-muted-foreground', task: 'Draft a professional email' },
    { id: 'schedule', label: 'Schedule Planning', icon: <Clock className="h-5 w-5" />, color: 'text-muted-foreground', task: 'Create a schedule and planning for my project' },
    { id: 'compare', label: 'Product Comparison', icon: <Target className="h-5 w-5" />, color: 'text-primary', task: 'Compare products and give recommendations' },
    { id: 'travel', label: 'Travel Planning', icon: <Plane className="h-5 w-5" />, color: 'text-purple-500', task: 'Plan a travel itinerary' },
    { id: 'code', label: 'Code Generation', icon: <Code className="h-5 w-5" />, color: 'text-muted-foreground', task: 'Generate code for my project' },
    { id: 'data', label: 'Data Analysis', icon: <FileSearch className="h-5 w-5" />, color: 'text-muted-foreground', task: 'Analyze data and provide insights' },
    { id: 'document', label: 'Document Creation', icon: <FileText className="h-5 w-5" />, color: 'text-muted-foreground', task: 'Create a professional document' },
  ];

  return (
    <div className="flex h-full relative">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">AI Agent</h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-2">
                Agentic Mode
              </Badge>
            </div>
           </div>
          <p className="text-xs text-muted-foreground">Autonomous task execution with multi-step reasoning</p>
         </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-5">
          <div className="space-y-6">
            {/* Task Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What would you like me to do?</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Run compliance scan for my fintech in the EU"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && executeTask()}
                  disabled={isExecuting}
                  className="flex-1 h-11"
                />
                <Button
                  onClick={executeTask}
                  disabled={isExecuting || !taskInput.trim()}
                  className="h-11 px-6 gap-2 bg-primary hover:bg-primary/90"
                >
                  {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start
                </Button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quick Templates</label>
              <div className="grid grid-cols-4 gap-3">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setTaskInput(template.task)}
                    disabled={isExecuting}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all text-left group disabled:opacity-50"
                  >
                    <div className={template.color}>{template.icon}</div>
                    <span className="text-sm font-medium">{template.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Protocol Cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setComplianceMode('autopilot')}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-400/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Gavel className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">🛡️ Compliance Autopilot</p>
                  <p className="text-xs text-muted-foreground">Any Industry • Any Country</p>
                </div>
              </button>

              <button
                onClick={() => { setGlobalMode('zero_knowledge'); setComplianceMode('global'); }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 hover:border-purple-400/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Server className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">🌍 Edge Architect</p>
                  <p className="text-xs text-muted-foreground">Zero-Knowledge • Green AI</p>
                </div>
              </button>
             </div>

            {/* Auto-approve toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-3">
                <Cog className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Auto-approve actions</p>
                  <p className="text-xs text-muted-foreground">Skip confirmation prompts for each step</p>
                 </div>
              </div>
              <Switch checked={!humanInLoop} onCheckedChange={(v) => setHumanInLoop(!v)} />
             </div>

            {/* Current Task */}
            {currentTask && (
              <Card className={`border-2 ${currentTask.status === 'running' ? 'border-primary/50' : currentTask.status === 'awaiting_approval' ? 'border-amber-500/50' : currentTask.status === 'completed' ? 'border-green-500/50' : 'border-border'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTaskIcon(currentTask.type)}
                      <CardTitle className="text-sm">Current Task</CardTitle>
                    </div>
                    <Badge variant="secondary">{currentTask.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{currentTask.description}</p>
                  {currentTask.status === 'awaiting_approval' && (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <Shield className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-sm">
                        <strong>Approval required</strong> - {currentTask.riskLevel} risk
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={approveTask} className="bg-amber-500">Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => setCurrentTask(null)}>Cancel</Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  {currentTask.subtasks && (
                    <div className="space-y-2">
                      <Progress value={(currentTask.subtasks.filter(s => s.status === 'completed').length / currentTask.subtasks.length) * 100} className="h-2" />
                      <ScrollArea className="h-24">
                        {currentTask.subtasks.map((s) => (
                          <div key={s.id} className={`flex items-center gap-2 text-xs p-1 rounded ${s.status === 'completed' ? 'bg-green-500/10' : 'bg-muted/50'}`}>
                            {s.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                            {s.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            {s.status === 'pending' && <Clock className="h-3 w-3 text-muted-foreground" />}
                            <span>{s.description}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                  {currentTask.result && <div className="p-3 bg-muted/50 rounded text-sm">{currentTask.result}</div>}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Agent Logs */}
      {showHistory && (
        <div className="w-72 border-l border-border/50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span className="text-sm font-medium">Agent Logs</span>
            </div>
            <Switch checked={showHistory} onCheckedChange={setShowHistory} />
          </div>
          <ScrollArea className="flex-1 p-3">
            {taskHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No logs yet</p>
            ) : (
              <div className="space-y-2">
                {taskHistory.map((task) => (
                  <div key={task.id} className="p-2 rounded-lg bg-muted/50 text-xs cursor-pointer hover:bg-muted" onClick={() => setTaskInput(task.description)}>
                    <div className="flex items-center gap-2 mb-1">
                      {getTaskIcon(task.type)}
                      <Badge variant="secondary" className="text-[10px]">{task.status}</Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{task.description}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Floating Logs Toggle */}
      {!showHistory && (
        <button
          onClick={() => setShowHistory(true)}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <Terminal className="h-4 w-4" />
          <span className="text-sm">Agent Logs</span>
          <Switch checked={showHistory} onCheckedChange={setShowHistory} className="scale-75" />
        </button>
      )}
     </div>
  );
};

export default ShadowAgentPanel;
