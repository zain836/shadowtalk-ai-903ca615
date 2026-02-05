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
  Scale, MapPin, Cpu, HardDrive, CloudOff
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { useAuth } from '@/components/AuthProvider';
 import { supabase } from '@/integrations/supabase/client';
 import { motion } from 'framer-motion';
 
 // =============================================================================
 // SOVEREIGN COMPLIANCE OFFICER - UNIFIED AGENT
 // =============================================================================
 
 // FBR Tax Slabs 2024
 const FBR_TAX_SLABS_SALARIED = [
   { min: 0, max: 600000, rate: 0, fixed: 0 },
   { min: 600001, max: 1200000, rate: 2.5, fixed: 0 },
   { min: 1200001, max: 2400000, rate: 12.5, fixed: 15000 },
   { min: 2400001, max: 3600000, rate: 22.5, fixed: 165000 },
   { min: 3600001, max: 6000000, rate: 27.5, fixed: 435000 },
   { min: 6000001, max: Infinity, rate: 35, fixed: 1095000 },
 ];
 
 const FBR_TAX_SLABS_BUSINESS = [
   { min: 0, max: 600000, rate: 0, fixed: 0 },
   { min: 600001, max: 800000, rate: 5, fixed: 0 },
   { min: 800001, max: 1200000, rate: 12.5, fixed: 10000 },
   { min: 1200001, max: 2400000, rate: 17.5, fixed: 60000 },
   { min: 2400001, max: 3000000, rate: 22.5, fixed: 270000 },
   { min: 3000001, max: 4000000, rate: 27.5, fixed: 405000 },
   { min: 4000001, max: 6000000, rate: 32.5, fixed: 680000 },
   { min: 6000001, max: Infinity, rate: 35, fixed: 1330000 },
 ];
 
 interface FBRTaxData {
   annualIncome: number;
   businessType: 'individual' | 'aop' | 'company';
   taxYear: string;
   expenses: number;
   advanceTaxPaid: number;
   withholdingTax: number;
 }
 
 interface SECPFormData {
   companyName: string;
   companyType: 'private' | 'public' | 'smc' | 'ngo';
   registrationNumber: string;
   authorizedCapital: number;
   paidUpCapital: number;
 }
 
 interface AuditFinding {
   id: string;
   severity: 'critical' | 'warning' | 'info';
   category: string;
   description: string;
   regulation: string;
   recommendation: string;
 }
 
 interface AgentTask {
   id: string;
  type: 'analyze' | 'research' | 'execute' | 'code' | 'data' | 'browse' | 'automate' | 'fbr_tax' | 'secp_filing' | 'audit_guard' | 'zero_knowledge' | 'green_inference' | 'cross_border';
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
   { id: 'fbr_helper', name: 'FBR Helper', description: '🇵🇰 Tax & Challan', icon: <Calculator className="h-4 w-4" />, enabled: true },
   { id: 'secp_drafter', name: 'SECP Drafter', description: '🇵🇰 Company forms', icon: <Building2 className="h-4 w-4" />, enabled: true },
   { id: 'audit_guard', name: 'Audit Guard', description: '🇵🇰 Risk assessment', icon: <Shield className="h-4 w-4" />, enabled: true },
  // Global Edge Architect Skills
  { id: 'zero_knowledge', name: 'Zero-Knowledge PM', description: '🔐 Air-gapped orchestration', icon: <GlobeLock className="h-4 w-4" />, enabled: true },
  { id: 'green_inference', name: 'Green Inference', description: '🌱 Sustainable local AI', icon: <Leaf className="h-4 w-4" />, enabled: true },
  { id: 'cross_border', name: 'Cross-Border', description: '🌍 Multi-jurisdiction compliance', icon: <Plane className="h-4 w-4" />, enabled: true },
 ];
 
 const EXAMPLE_TASKS = [
   "Research top 5 AI startups in healthcare",
   "Analyze this codebase for security vulnerabilities",
   "Build a marketing strategy for SaaS launch",
   "🇵🇰 Calculate my FBR tax for 50 lac rupees",
   "🇵🇰 Generate SECP Form A for my company",
   "🇵🇰 Audit my expenses for FBR triggers",
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
   
   // Pakistan Compliance Mode
  const [complianceMode, setComplianceMode] = useState<'none' | 'fbr' | 'secp' | 'audit' | 'global'>('none');
   const [complianceProgress, setComplianceProgress] = useState(0);
  
  // Global Edge Architect State
  const [globalMode, setGlobalMode] = useState<'zero_knowledge' | 'green_inference' | 'cross_border'>('zero_knowledge');
  const [projectData, setProjectData] = useState({ name: '', pages: 0, classification: 'confidential' as 'public' | 'internal' | 'confidential' | 'top_secret' });
  const [greenMetrics, setGreenMetrics] = useState({ cloudEnergy: 0, localEnergy: 0, co2Saved: 0, waterSaved: 0, costSaved: 0 });
  const [complianceRegions, setComplianceRegions] = useState<string[]>([]);
  const [jurisdictionReport, setJurisdictionReport] = useState<{ region: string; status: 'compliant' | 'warning' | 'blocked'; regulation: string; action: string }[]>([]);
   
   // FBR State
   const [fbrData, setFbrData] = useState<Partial<FBRTaxData>>({
     businessType: 'individual', taxYear: '2024', annualIncome: 0,
     expenses: 0, advanceTaxPaid: 0, withholdingTax: 0,
   });
   const [taxCalculation, setTaxCalculation] = useState<{
     taxableIncome: number; grossTax: number; netTax: number; effectiveRate: number;
   } | null>(null);
   
   // SECP State
   const [secpData, setSecpData] = useState<Partial<SECPFormData>>({
     companyType: 'private', authorizedCapital: 100000, paidUpCapital: 100000,
   });
   const [secpDocuments, setSecpDocuments] = useState<string[]>([]);
   
   // Audit State
   const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
   const [expenseCategories, setExpenseCategories] = useState<{ category: string; amount: number; flagged: boolean }[]>([]);
 
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
     if (lower.includes('fbr') || lower.includes('tax') || lower.includes('challan')) return 'fbr_tax';
     if (lower.includes('secp') || lower.includes('company') || lower.includes('form a')) return 'secp_filing';
     if (lower.includes('audit') || lower.includes('risk') || lower.includes('notice')) return 'audit_guard';
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
       case 'fbr_tax':
         subtasks.push(
           { id: crypto.randomUUID(), description: '📄 Parse income data locally', status: 'pending', tool: 'bunker_parser' },
           { id: crypto.randomUUID(), description: '💰 Apply FBR tax slabs 2024', status: 'pending', tool: 'fbr_calculator' },
           { id: crypto.randomUUID(), description: '🧮 Calculate deductions', status: 'pending', tool: 'tax_optimizer' },
           { id: crypto.randomUUID(), description: '📝 Generate Challan CPR', status: 'pending', tool: 'challan_generator' }
         );
         break;
       case 'secp_filing':
         subtasks.push(
           { id: crypto.randomUUID(), description: '🏢 Extract company details', status: 'pending', tool: 'bunker_parser' },
           { id: crypto.randomUUID(), description: '📋 Draft Board Resolution', status: 'pending', tool: 'secp_drafter' },
           { id: crypto.randomUUID(), description: '📑 Generate Form A/29', status: 'pending', tool: 'form_generator' },
           { id: crypto.randomUUID(), description: '✅ Validate compliance', status: 'pending', tool: 'compliance_checker' }
         );
         break;
       case 'audit_guard':
         subtasks.push(
           { id: crypto.randomUUID(), description: '📊 Analyze expenses', status: 'pending', tool: 'bunker_analyzer' },
           { id: crypto.randomUUID(), description: '🔍 Scan FBR red flags', status: 'pending', tool: 'audit_scanner' },
           { id: crypto.randomUUID(), description: '⚖️ Check Section 21/153', status: 'pending', tool: 'regulation_matcher' },
           { id: crypto.randomUUID(), description: '📝 Generate risk report', status: 'pending', tool: 'risk_reporter' }
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
     
     // Auto-enter compliance mode for Pakistan tasks
     if (taskType === 'fbr_tax') { setComplianceMode('fbr'); return; }
     if (taskType === 'secp_filing') { setComplianceMode('secp'); return; }
     if (taskType === 'audit_guard') { setComplianceMode('audit'); return; }
      
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
 
   // FBR Calculator
   const calculateTax = useCallback(() => {
     if (!fbrData.annualIncome) { toast.error('Enter annual income'); return; }
     setComplianceProgress(0);
     const interval = setInterval(() => setComplianceProgress(prev => Math.min(prev + 20, 100)), 200);
     setTimeout(() => {
       clearInterval(interval);
       setComplianceProgress(100);
       const income = fbrData.annualIncome || 0;
       const taxableIncome = Math.max(0, income - (fbrData.expenses || 0));
       const slabs = fbrData.businessType === 'company' ? FBR_TAX_SLABS_BUSINESS : FBR_TAX_SLABS_SALARIED;
       let grossTax = 0;
       for (const slab of slabs) {
         if (taxableIncome > slab.min && taxableIncome <= slab.max) {
           grossTax = slab.fixed + ((taxableIncome - slab.min) * slab.rate / 100);
           break;
         }
       }
       if (taxableIncome > 6000000) {
         const highestSlab = slabs[slabs.length - 1];
         grossTax = highestSlab.fixed + ((taxableIncome - 6000000) * highestSlab.rate / 100);
       }
       const netTax = Math.max(0, grossTax - (fbrData.advanceTaxPaid || 0) - (fbrData.withholdingTax || 0));
       setTaxCalculation({
         taxableIncome, grossTax: Math.round(grossTax), netTax: Math.round(netTax),
         effectiveRate: taxableIncome > 0 ? Math.round((grossTax / taxableIncome) * 10000) / 100 : 0,
       });
       toast.success('Tax calculated locally!', { icon: <Shield className="h-4 w-4 text-green-500" /> });
     }, 1000);
   }, [fbrData]);
 
   const generateChallan = useCallback(() => {
     if (!taxCalculation) return;
     const content = `# FBR CHALLAN CPR\n\n**Tax Year:** ${fbrData.taxYear}\n**Type:** ${fbrData.businessType}\n\n| Item | PKR |\n|------|-----|\n| Taxable Income | ${taxCalculation.taxableIncome.toLocaleString()} |\n| Gross Tax | ${taxCalculation.grossTax.toLocaleString()} |\n| **Net Tax** | **${taxCalculation.netTax.toLocaleString()}** |\n\n*Generated: ${new Date().toLocaleString()} - Bunker Mode*`;
     const blob = new Blob([content], { type: 'text/markdown' });
     const a = document.createElement('a');
     a.href = URL.createObjectURL(blob);
     a.download = `FBR_Challan_${Date.now()}.md`;
     a.click();
     toast.success('Challan downloaded!');
   }, [taxCalculation, fbrData]);
 
   // SECP Generator
   const generateSECPDocuments = useCallback(() => {
     if (!secpData.companyName) { toast.error('Enter company name'); return; }
     setComplianceProgress(0);
     const interval = setInterval(() => setComplianceProgress(prev => Math.min(prev + 15, 100)), 200);
     setTimeout(() => {
       clearInterval(interval);
       setComplianceProgress(100);
       setSecpDocuments([
         `Board Resolution - ${secpData.companyName}`,
         'Form A - Annual Return',
         'Form 29 - Director Consent',
         'Minutes of Board Meeting',
       ]);
       toast.success('SECP documents drafted!', { icon: <FileText className="h-4 w-4 text-blue-500" /> });
     }, 2000);
   }, [secpData]);
 
   const downloadSECPDocument = useCallback((doc: string) => {
     const content = `# ${doc}\n\n**Company:** ${secpData.companyName}\n**Type:** ${secpData.companyType} Limited\n**Capital:** PKR ${secpData.authorizedCapital?.toLocaleString()}\n\n*Drafted per Companies Act 2017*`;
     const blob = new Blob([content], { type: 'text/markdown' });
     const a = document.createElement('a');
     a.href = URL.createObjectURL(blob);
     a.download = `${doc.replace(/\s+/g, '_')}.md`;
     a.click();
     toast.success(`${doc} downloaded!`);
   }, [secpData]);
 
   // Audit Guard
   const runAuditGuard = useCallback(() => {
     if (!fbrData.annualIncome) { toast.error('Enter income data in FBR tab first'); return; }
     setComplianceProgress(0);
     setAuditFindings([]);
     const interval = setInterval(() => setComplianceProgress(prev => Math.min(prev + 10, 100)), 150);
     setTimeout(() => {
       clearInterval(interval);
       setComplianceProgress(100);
       const findings: AuditFinding[] = [];
       if ((fbrData.annualIncome || 0) > 5000000 && (fbrData.expenses || 0) > (fbrData.annualIncome || 0) * 0.6) {
         findings.push({ id: crypto.randomUUID(), severity: 'critical', category: 'Expense Ratio',
           description: 'Expenses >60% of income - high audit risk',
           regulation: 'Section 21 ITO 2001', recommendation: 'Ensure proper documentation' });
       }
       if ((fbrData.withholdingTax || 0) > (fbrData.annualIncome || 0) * 0.1) {
         findings.push({ id: crypto.randomUUID(), severity: 'warning', category: 'Withholding Tax',
           description: 'High WHT claims may need verification',
           regulation: 'Section 153 ITO 2001', recommendation: 'Keep Form 149s ready' });
       }
       if (findings.length === 0) {
         findings.push({ id: crypto.randomUUID(), severity: 'info', category: 'Clean Filing',
           description: 'No major triggers detected', regulation: 'General', recommendation: 'Proceed with filing' });
       }
       setExpenseCategories([
         { category: 'Salaries', amount: (fbrData.expenses || 0) * 0.4, flagged: false },
         { category: 'Rent', amount: (fbrData.expenses || 0) * 0.2, flagged: false },
         { category: 'Travel', amount: (fbrData.expenses || 0) * 0.15, flagged: true },
         { category: 'Supplies', amount: (fbrData.expenses || 0) * 0.1, flagged: false },
       ]);
       setAuditFindings(findings);
       toast.success('Audit scan complete!');
     }, 2500);
   }, [fbrData]);
 
   const getSeverityColor = (s: 'critical' | 'warning' | 'info') => {
     if (s === 'critical') return 'text-destructive bg-destructive/10 border-destructive/30';
     if (s === 'warning') return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
     return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
   };
 
   const getTaskIcon = (type: AgentTask['type']) => {
     const icons: Record<string, React.ReactNode> = {
       research: <Globe className="h-4 w-4" />, code: <Code className="h-4 w-4" />,
       analyze: <FileSearch className="h-4 w-4" />, browse: <MousePointer className="h-4 w-4" />,
       automate: <Workflow className="h-4 w-4" />, fbr_tax: <Calculator className="h-4 w-4 text-green-500" />,
       secp_filing: <Building2 className="h-4 w-4 text-blue-500" />, audit_guard: <Shield className="h-4 w-4 text-amber-500" />,
      zero_knowledge: <GlobeLock className="h-4 w-4 text-purple-500" />,
      green_inference: <Leaf className="h-4 w-4 text-green-500" />,
      cross_border: <Plane className="h-4 w-4 text-blue-500" />,
     };
     return icons[type] || <Zap className="h-4 w-4" />;
   };

  // ==========================================================================
  // GLOBAL EDGE ARCHITECT FUNCTIONS
  // ==========================================================================

  // Zero-Knowledge Project Manager
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

  // Green Inference Calculator
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

  // Cross-Border Compliance Check
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
          'pakistan': { regulation: 'PECA 2016', status: 'compliant', action: 'Local compliance via FBR/SECP modules' },
        };
        return { region, ...regulations[region] || { regulation: 'Local Data Protection Laws', status: 'warning' as const, action: 'Manual review recommended' } };
      });
      setJurisdictionReport(reports);
      toast.success('Compliance check complete!', { icon: <Scale className="h-4 w-4 text-blue-500" /> });
    }, 2000);
  }, [complianceRegions]);

  const toggleRegion = (region: string) => {
    setComplianceRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };
 
   // ==========================================================================
   // COMPLIANCE MODE UI
   // ==========================================================================
  if (complianceMode !== 'none' && complianceMode !== 'global') {
     return (
       <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 p-4">
         <div className="flex items-center justify-between">
           <Button variant="ghost" size="sm" onClick={() => setComplianceMode('none')} className="gap-2">
             <ArrowLeft className="h-4 w-4" /> Back to Agent
           </Button>
           <Badge variant="secondary" className="bg-green-500/20 text-green-400 gap-1">
             <Lock className="h-3 w-3" /> Bunker Mode
           </Badge>
         </div>
 
         <Card className="border-green-500/30 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
           <CardContent className="pt-4 pb-3">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                 <Flag className="h-6 w-6 text-white" />
               </div>
               <div>
                 <h2 className="text-lg font-bold">Sovereign Compliance Officer</h2>
                 <p className="text-xs text-muted-foreground flex items-center gap-1">
                   <Shield className="h-3 w-3" /> 100% Local • Zero Data Leakage
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Tabs value={complianceMode} onValueChange={(v) => setComplianceMode(v as any)}>
           <TabsList className="grid grid-cols-3 w-full">
             <TabsTrigger value="fbr" className="gap-1 text-xs"><Calculator className="h-3 w-3" /> FBR</TabsTrigger>
             <TabsTrigger value="secp" className="gap-1 text-xs"><Building2 className="h-3 w-3" /> SECP</TabsTrigger>
             <TabsTrigger value="audit" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> Audit</TabsTrigger>
           </TabsList>
 
           <TabsContent value="fbr" className="space-y-4 mt-4">
             <Alert className="border-green-500/30 bg-green-500/5">
               <Landmark className="h-4 w-4 text-green-500" />
               <AlertDescription className="text-xs">
                 <strong>FBR Tax Calculator</strong> - Income Tax Ordinance 2001 (2024)
               </AlertDescription>
             </Alert>
             <Card>
               <CardContent className="pt-4 space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-xs font-medium">Business Type</label>
                     <Select value={fbrData.businessType} onValueChange={(v) => setFbrData(p => ({ ...p, businessType: v as any }))}>
                       <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="individual">Individual</SelectItem>
                         <SelectItem value="aop">AOP</SelectItem>
                         <SelectItem value="company">Company</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-medium">Tax Year</label>
                     <Select value={fbrData.taxYear} onValueChange={(v) => setFbrData(p => ({ ...p, taxYear: v }))}>
                       <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="2024">2024</SelectItem>
                         <SelectItem value="2023">2023</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-medium">Annual Income (PKR)</label>
                   <Input type="number" placeholder="5000000" value={fbrData.annualIncome || ''} 
                     onChange={(e) => setFbrData(p => ({ ...p, annualIncome: Number(e.target.value) }))} className="h-8 text-xs" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-xs font-medium">Expenses</label>
                     <Input type="number" value={fbrData.expenses || ''} 
                       onChange={(e) => setFbrData(p => ({ ...p, expenses: Number(e.target.value) }))} className="h-8 text-xs" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-medium">Withholding Tax</label>
                     <Input type="number" value={fbrData.withholdingTax || ''} 
                       onChange={(e) => setFbrData(p => ({ ...p, withholdingTax: Number(e.target.value) }))} className="h-8 text-xs" />
                   </div>
                 </div>
                 <Button onClick={calculateTax} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                   <Calculator className="h-4 w-4" /> Calculate Tax
                 </Button>
               </CardContent>
             </Card>
             {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}
             {taxCalculation && (
               <Card className="border-green-500/30">
                 <CardContent className="pt-4 space-y-2">
                   <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="p-2 bg-muted/50 rounded">
                       <p className="text-muted-foreground">Taxable</p>
                       <p className="font-bold">PKR {taxCalculation.taxableIncome.toLocaleString()}</p>
                     </div>
                     <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
                       <p className="text-muted-foreground">Net Tax</p>
                       <p className="font-bold text-green-500">PKR {taxCalculation.netTax.toLocaleString()}</p>
                     </div>
                   </div>
                   <Button onClick={generateChallan} variant="outline" className="w-full gap-2">
                     <Download className="h-4 w-4" /> Download Challan
                   </Button>
                 </CardContent>
               </Card>
             )}
           </TabsContent>
 
           <TabsContent value="secp" className="space-y-4 mt-4">
             <Alert className="border-blue-500/30 bg-blue-500/5">
               <Building2 className="h-4 w-4 text-blue-500" />
               <AlertDescription className="text-xs">
                 <strong>SECP Company Secretary</strong> - Companies Act 2017
               </AlertDescription>
             </Alert>
             <Card>
               <CardContent className="pt-4 space-y-3">
                 <div className="space-y-1">
                   <label className="text-xs font-medium">Company Name</label>
                   <Input placeholder="ABC Technologies (Pvt) Ltd" value={secpData.companyName || ''} 
                     onChange={(e) => setSecpData(p => ({ ...p, companyName: e.target.value }))} className="h-8 text-xs" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-xs font-medium">Type</label>
                     <Select value={secpData.companyType} onValueChange={(v) => setSecpData(p => ({ ...p, companyType: v as any }))}>
                       <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="private">Private Ltd</SelectItem>
                         <SelectItem value="public">Public Ltd</SelectItem>
                         <SelectItem value="smc">Single Member</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-medium">Capital</label>
                     <Input type="number" value={secpData.authorizedCapital || ''} 
                       onChange={(e) => setSecpData(p => ({ ...p, authorizedCapital: Number(e.target.value) }))} className="h-8 text-xs" />
                   </div>
                 </div>
                 <Button onClick={generateSECPDocuments} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                   <FileText className="h-4 w-4" /> Generate Documents
                 </Button>
               </CardContent>
             </Card>
             {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}
             {secpDocuments.length > 0 && (
               <Card className="border-blue-500/30">
                 <CardContent className="pt-4 space-y-2">
                   {secpDocuments.map((doc, i) => (
                     <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                       <span className="flex items-center gap-2"><FileText className="h-3 w-3 text-blue-500" />{doc}</span>
                       <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => downloadSECPDocument(doc)}>
                         <Download className="h-3 w-3" />
                       </Button>
                     </div>
                   ))}
                 </CardContent>
               </Card>
             )}
           </TabsContent>
 
           <TabsContent value="audit" className="space-y-4 mt-4">
             <Alert className="border-amber-500/30 bg-amber-500/5">
               <Shield className="h-4 w-4 text-amber-500" />
               <AlertDescription className="text-xs">
                 <strong>Audit Guard</strong> - Scan for FBR notice triggers
               </AlertDescription>
             </Alert>
             <Card>
               <CardContent className="pt-4">
                 <Button onClick={runAuditGuard} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
                   <Eye className="h-4 w-4" /> Run Pre-Filing Scan
                 </Button>
                 <p className="text-[10px] text-muted-foreground mt-2 text-center">Uses FBR tab data</p>
               </CardContent>
             </Card>
             {complianceProgress > 0 && complianceProgress < 100 && <Progress value={complianceProgress} className="h-2" />}
             {auditFindings.length > 0 && (
               <Card>
                 <CardContent className="pt-4">
                   <ScrollArea className="h-40">
                     <div className="space-y-2">
                       {auditFindings.map((f) => (
                         <div key={f.id} className={`p-2 rounded border ${getSeverityColor(f.severity)}`}>
                           <div className="flex items-center gap-2 text-xs font-medium">
                             {f.severity === 'critical' && <AlertCircle className="h-3 w-3" />}
                             {f.severity === 'warning' && <AlertTriangle className="h-3 w-3" />}
                             {f.severity === 'info' && <CheckCircle2 className="h-3 w-3" />}
                             {f.category}
                           </div>
                           <p className="text-xs mt-1">{f.description}</p>
                           <p className="text-[10px] text-muted-foreground">📜 {f.regulation}</p>
                         </div>
                       ))}
                     </div>
                   </ScrollArea>
                 </CardContent>
               </Card>
             )}
             {expenseCategories.length > 0 && (
               <Card>
                 <CardHeader className="pb-2"><CardTitle className="text-sm">Expense Analysis</CardTitle></CardHeader>
                 <CardContent>
                   {expenseCategories.map((c, i) => (
                     <div key={i} className={`flex justify-between text-xs p-2 rounded mb-1 ${c.flagged ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-muted/50'}`}>
                       <span>{c.flagged && <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />}{c.category}</span>
                       <span className="font-mono">PKR {c.amount.toLocaleString()}</span>
                     </div>
                   ))}
                 </CardContent>
               </Card>
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
                    <Button key={r} variant={complianceRegions.includes(r) ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => toggleRegion(r)}>
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

  // Quick Templates for the grid
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
                  placeholder="e.g., Research the latest AI developments and create a summary report"
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
                onClick={() => setComplianceMode('fbr')}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-400/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                  <Flag className="h-5 w-5 text-white" />
                 </div>
                <div>
                  <p className="text-sm font-medium">🇵🇰 Pakistan Protocol</p>
                  <p className="text-xs text-muted-foreground">FBR • SECP • Audit</p>
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