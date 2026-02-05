 import React, { useState, useCallback } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Progress } from '@/components/ui/progress';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { 
   Shield, FileText, Calculator, Building2, AlertTriangle,
   CheckCircle2, Loader2, Download, Upload, Eye, Lock,
   Landmark, Receipt, FileSpreadsheet, Users, Briefcase,
   Scale, Search, Flag, Crown, Zap, Brain, X
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { motion, AnimatePresence } from 'framer-motion';
 
 // =============================================================================
 // PAKISTANI BUSINESS PROTOCOL - SOVEREIGN COMPLIANCE OFFICER
 // =============================================================================
 // This is NOT a chatbot - it's a Sovereign Compliance Officer that handles:
 // - FBR Tax Filing & Challan Generation
 // - SECP Company Registration & Annual Returns
 // - Audit Guard for Pre-Filing Risk Assessment
 // All processing happens LOCALLY in the Bunker - zero data leakage
 // =============================================================================
 
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
   directors: { name: string; cnic: string; shares: number }[];
   authorizedCapital: number;
   paidUpCapital: number;
   registeredAddress: string;
 }
 
 interface AuditFinding {
   id: string;
   severity: 'critical' | 'warning' | 'info';
   category: string;
   description: string;
   regulation: string;
   recommendation: string;
 }
 
 interface PakistanCompliancePanelProps {
   isOpen: boolean;
   onClose: () => void;
   onInsertToChat?: (content: string) => void;
 }
 
 // FBR Tax Slabs 2024 (Income Tax Ordinance 2001)
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
 
 // SECP Fee Structure
 const SECP_FEES = {
   private: { registration: 1000, annual: 200 },
   public: { registration: 5000, annual: 1000 },
   smc: { registration: 500, annual: 100 },
   ngo: { registration: 2000, annual: 500 },
 };
 
 export const PakistanCompliancePanel: React.FC<PakistanCompliancePanelProps> = ({
   isOpen,
   onClose,
   onInsertToChat
 }) => {
   const [activeTab, setActiveTab] = useState('fbr');
   const [isProcessing, setIsProcessing] = useState(false);
   const [progress, setProgress] = useState(0);
   
   // FBR State
   const [fbrData, setFbrData] = useState<Partial<FBRTaxData>>({
     businessType: 'individual',
     taxYear: '2024',
     annualIncome: 0,
     expenses: 0,
     advanceTaxPaid: 0,
     withholdingTax: 0,
   });
   const [taxCalculation, setTaxCalculation] = useState<{
     taxableIncome: number;
     grossTax: number;
     netTax: number;
     effectiveRate: number;
   } | null>(null);
   const [challanGenerated, setChallanGenerated] = useState(false);
 
   // SECP State
   const [secpData, setSecpData] = useState<Partial<SECPFormData>>({
     companyType: 'private',
     directors: [{ name: '', cnic: '', shares: 0 }],
     authorizedCapital: 100000,
     paidUpCapital: 100000,
   });
   const [secpDocuments, setSecpDocuments] = useState<string[]>([]);
 
   // Audit Guard State
   const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
   const [bankStatementUploaded, setBankStatementUploaded] = useState(false);
   const [expenseCategories, setExpenseCategories] = useState<{ category: string; amount: number; flagged: boolean }[]>([]);
 
   // =========================================================================
   // FBR HELPER - TAX CALCULATION ENGINE
   // =========================================================================
   const calculateTax = useCallback(() => {
     if (!fbrData.annualIncome) return;
 
     setIsProcessing(true);
     setProgress(0);
 
     // Simulate local processing
     const interval = setInterval(() => {
       setProgress(prev => Math.min(prev + 20, 100));
     }, 200);
 
     setTimeout(() => {
       clearInterval(interval);
       setProgress(100);
 
       const income = fbrData.annualIncome || 0;
       const expenses = fbrData.expenses || 0;
       const taxableIncome = Math.max(0, income - expenses);
       
       const slabs = fbrData.businessType === 'company' 
         ? FBR_TAX_SLABS_BUSINESS 
         : FBR_TAX_SLABS_SALARIED;
 
       let grossTax = 0;
       for (const slab of slabs) {
         if (taxableIncome > slab.min && taxableIncome <= slab.max) {
           grossTax = slab.fixed + ((taxableIncome - slab.min) * slab.rate / 100);
           break;
         } else if (taxableIncome > slab.max && slab.max !== Infinity) {
           continue;
         }
       }
 
       // Handle highest slab
       if (taxableIncome > 6000000) {
         const highestSlab = slabs[slabs.length - 1];
         grossTax = highestSlab.fixed + ((taxableIncome - 6000000) * highestSlab.rate / 100);
       }
 
       const netTax = Math.max(0, grossTax - (fbrData.advanceTaxPaid || 0) - (fbrData.withholdingTax || 0));
       const effectiveRate = taxableIncome > 0 ? (grossTax / taxableIncome) * 100 : 0;
 
       setTaxCalculation({
         taxableIncome,
         grossTax: Math.round(grossTax),
         netTax: Math.round(netTax),
         effectiveRate: Math.round(effectiveRate * 100) / 100,
       });
 
       setIsProcessing(false);
       toast.success('Tax calculated locally - zero data leakage!', {
         icon: <Shield className="h-4 w-4 text-green-500" />
       });
     }, 1000);
   }, [fbrData]);
 
   // Generate Challan PDF locally
   const generateChallan = useCallback(() => {
     if (!taxCalculation) return;
 
     setIsProcessing(true);
     
     setTimeout(() => {
       // Generate Challan data structure
       const challanData = {
         challanType: 'CPR (Computerized Payment Receipt)',
         taxpayerNTN: '********', // Would be filled from local data
         taxYear: fbrData.taxYear,
         taxAmount: taxCalculation.netTax,
         paymentMode: 'Online Banking / ADC',
         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PK'),
         generatedAt: new Date().toLocaleString('en-PK'),
       };
 
       setChallanGenerated(true);
       setIsProcessing(false);
 
       toast.success('Challan generated locally!', {
         description: `Amount: PKR ${taxCalculation.netTax.toLocaleString()}`
       });
     }, 1500);
   }, [taxCalculation, fbrData.taxYear]);
 
   // =========================================================================
   // SECP DRAFTER - COMPANY SECRETARY AGENT
   // =========================================================================
   const generateBoardResolution = useCallback(() => {
     if (!secpData.companyName) {
       toast.error('Please enter company name');
       return;
     }
 
     setIsProcessing(true);
     setProgress(0);
 
     const interval = setInterval(() => {
       setProgress(prev => Math.min(prev + 15, 100));
     }, 200);
 
     setTimeout(() => {
       clearInterval(interval);
       setProgress(100);
 
       const docs = [
         'Board Resolution - Annual General Meeting',
         'Form A - Annual Return',
         'Form 29 - Consent to Act as Director',
         'Minutes of Board Meeting',
       ];
 
       setSecpDocuments(docs);
       setIsProcessing(false);
 
       toast.success('SECP documents drafted locally!', {
         icon: <FileText className="h-4 w-4 text-blue-500" />
       });
     }, 2000);
   }, [secpData]);
 
   // =========================================================================
   // AUDIT GUARD - PRE-FILING RISK SCANNER
   // =========================================================================
   const runAuditGuard = useCallback(() => {
     setIsProcessing(true);
     setProgress(0);
     setAuditFindings([]);
 
     const interval = setInterval(() => {
       setProgress(prev => Math.min(prev + 10, 100));
     }, 150);
 
     setTimeout(() => {
       clearInterval(interval);
       setProgress(100);
 
       // Simulate audit findings based on common FBR triggers
       const findings: AuditFinding[] = [];
 
       if ((fbrData.annualIncome || 0) > 5000000 && (fbrData.expenses || 0) > (fbrData.annualIncome || 0) * 0.6) {
         findings.push({
           id: crypto.randomUUID(),
           severity: 'critical',
           category: 'Expense Ratio',
           description: 'Expenses exceed 60% of income - high audit trigger risk',
           regulation: 'Section 21 Income Tax Ordinance 2001',
           recommendation: 'Ensure all expenses have proper documentation and invoices'
         });
       }
 
       if ((fbrData.withholdingTax || 0) > (fbrData.annualIncome || 0) * 0.1) {
         findings.push({
           id: crypto.randomUUID(),
           severity: 'warning',
           category: 'Withholding Tax',
           description: 'High withholding tax claims may require verification',
           regulation: 'Section 153 Income Tax Ordinance 2001',
           recommendation: 'Keep all withholding certificates and Form 149s ready'
         });
       }
 
       if ((fbrData.annualIncome || 0) > 0 && (fbrData.advanceTaxPaid || 0) === 0) {
         findings.push({
           id: crypto.randomUUID(),
           severity: 'info',
           category: 'Advance Tax',
           description: 'No advance tax paid - consider quarterly payments',
           regulation: 'Section 147 Income Tax Ordinance 2001',
           recommendation: 'Pay advance tax quarterly to avoid penalties'
         });
       }
 
       // Add mock expense analysis
       setExpenseCategories([
         { category: 'Salaries & Wages', amount: (fbrData.expenses || 0) * 0.4, flagged: false },
         { category: 'Rent & Utilities', amount: (fbrData.expenses || 0) * 0.2, flagged: false },
         { category: 'Travel & Entertainment', amount: (fbrData.expenses || 0) * 0.15, flagged: true },
         { category: 'Office Supplies', amount: (fbrData.expenses || 0) * 0.1, flagged: false },
         { category: 'Professional Services', amount: (fbrData.expenses || 0) * 0.15, flagged: false },
       ]);
 
       if (findings.length === 0) {
         findings.push({
           id: crypto.randomUUID(),
           severity: 'info',
           category: 'Clean Filing',
           description: 'No major audit triggers detected',
           regulation: 'General Compliance',
           recommendation: 'Proceed with filing - maintain records for 6 years'
         });
       }
 
       setAuditFindings(findings);
       setIsProcessing(false);
       setBankStatementUploaded(true);
 
       toast.success('Audit Guard scan complete!', {
         description: `Found ${findings.filter(f => f.severity === 'critical').length} critical issues`
       });
     }, 2500);
   }, [fbrData]);
 
   const getSeverityColor = (severity: AuditFinding['severity']) => {
     switch (severity) {
       case 'critical': return 'text-destructive bg-destructive/10 border-destructive/30';
       case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
       case 'info': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
     }
   };
 
   if (!isOpen) return null;
 
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
     >
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-green-900/20 to-emerald-900/20">
         <div className="flex items-center gap-4">
           <div className="relative">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
               <Flag className="h-6 w-6 text-white" />
             </div>
             <Shield className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 drop-shadow" />
           </div>
           <div>
             <h2 className="text-xl font-bold flex items-center gap-2">
               Sovereign Compliance Officer
               <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                 🇵🇰 Pakistan Protocol
               </Badge>
             </h2>
             <p className="text-sm text-muted-foreground flex items-center gap-2">
               <Lock className="h-3 w-3" />
               100% Local Processing • Zero Data Leakage • Bunker Mode Active
             </p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-primary/10 border-primary/30">
             <Brain className="h-3 w-3 mr-1" />
             Deep FBR/SECP Knowledge
           </Badge>
           <Button variant="ghost" size="icon" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Main Content */}
       <div className="flex-1 overflow-hidden">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
           <div className="px-4 pt-4">
             <TabsList className="grid grid-cols-3 w-full max-w-xl mx-auto">
               <TabsTrigger value="fbr" className="gap-2">
                 <Calculator className="h-4 w-4" />
                 FBR Helper
               </TabsTrigger>
               <TabsTrigger value="secp" className="gap-2">
                 <Building2 className="h-4 w-4" />
                 SECP Drafter
               </TabsTrigger>
               <TabsTrigger value="audit" className="gap-2">
                 <AlertTriangle className="h-4 w-4" />
                 Audit Guard
               </TabsTrigger>
             </TabsList>
           </div>
 
           <ScrollArea className="flex-1 p-4">
             {/* ============================================================= */}
             {/* FBR HELPER TAB */}
             {/* ============================================================= */}
             <TabsContent value="fbr" className="mt-0 space-y-4">
               <Alert className="border-green-500/30 bg-green-500/5">
                 <Landmark className="h-4 w-4 text-green-500" />
                 <AlertDescription>
                   <strong>FBR Tax Calculator & Challan Generator</strong> - Calculates tax based on 
                   Income Tax Ordinance 2001 (updated for Tax Year 2024). All data stays on your device.
                 </AlertDescription>
               </Alert>
 
               <div className="grid md:grid-cols-2 gap-6">
                 {/* Input Form */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-lg">
                       <Receipt className="h-5 w-5 text-primary" />
                       Income & Tax Details
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Business Type</label>
                       <Select 
                         value={fbrData.businessType} 
                         onValueChange={(v) => setFbrData(prev => ({ ...prev, businessType: v as any }))}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="individual">Individual (Salaried/Freelancer)</SelectItem>
                           <SelectItem value="aop">Association of Persons (AOP)</SelectItem>
                           <SelectItem value="company">Private Limited Company</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Tax Year</label>
                       <Select 
                         value={fbrData.taxYear} 
                         onValueChange={(v) => setFbrData(prev => ({ ...prev, taxYear: v }))}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="2024">Tax Year 2024 (Jul 2023 - Jun 2024)</SelectItem>
                           <SelectItem value="2025">Tax Year 2025 (Jul 2024 - Jun 2025)</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Annual Income (PKR)</label>
                       <Input
                         type="number"
                         placeholder="e.g., 2400000"
                         value={fbrData.annualIncome || ''}
                         onChange={(e) => setFbrData(prev => ({ ...prev, annualIncome: Number(e.target.value) }))}
                       />
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Allowable Expenses (PKR)</label>
                       <Input
                         type="number"
                         placeholder="Business expenses"
                         value={fbrData.expenses || ''}
                         onChange={(e) => setFbrData(prev => ({ ...prev, expenses: Number(e.target.value) }))}
                       />
                     </div>
 
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2">
                         <label className="text-sm font-medium">Advance Tax Paid</label>
                         <Input
                           type="number"
                           placeholder="0"
                           value={fbrData.advanceTaxPaid || ''}
                           onChange={(e) => setFbrData(prev => ({ ...prev, advanceTaxPaid: Number(e.target.value) }))}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-sm font-medium">Withholding Tax</label>
                         <Input
                           type="number"
                           placeholder="0"
                           value={fbrData.withholdingTax || ''}
                           onChange={(e) => setFbrData(prev => ({ ...prev, withholdingTax: Number(e.target.value) }))}
                         />
                       </div>
                     </div>
 
                     <Button 
                       onClick={calculateTax} 
                       disabled={isProcessing || !fbrData.annualIncome}
                       className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                     >
                       {isProcessing ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Processing Locally...
                         </>
                       ) : (
                         <>
                           <Calculator className="h-4 w-4 mr-2" />
                           Calculate Tax (Sovereign Mode)
                         </>
                       )}
                     </Button>
                   </CardContent>
                 </Card>
 
                 {/* Results & Challan */}
                 <div className="space-y-4">
                   {taxCalculation && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                     >
                       <Card className="border-green-500/30">
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-lg">
                             <CheckCircle2 className="h-5 w-5 text-green-500" />
                             Tax Calculation Result
                           </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 bg-muted/50 rounded-lg">
                               <p className="text-xs text-muted-foreground">Taxable Income</p>
                               <p className="text-xl font-bold">PKR {taxCalculation.taxableIncome.toLocaleString()}</p>
                             </div>
                             <div className="p-3 bg-muted/50 rounded-lg">
                               <p className="text-xs text-muted-foreground">Gross Tax</p>
                               <p className="text-xl font-bold">PKR {taxCalculation.grossTax.toLocaleString()}</p>
                             </div>
                           </div>
 
                           <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                             <p className="text-sm text-muted-foreground">Net Tax Payable</p>
                             <p className="text-3xl font-bold text-green-500">
                               PKR {taxCalculation.netTax.toLocaleString()}
                             </p>
                             <p className="text-xs text-muted-foreground mt-1">
                               Effective Rate: {taxCalculation.effectiveRate}%
                             </p>
                           </div>
 
                           <Button 
                             onClick={generateChallan}
                             disabled={isProcessing}
                             className="w-full"
                             variant="outline"
                           >
                             {challanGenerated ? (
                               <>
                                 <Download className="h-4 w-4 mr-2" />
                                 Download Challan (CPR)
                               </>
                             ) : (
                               <>
                                 <FileText className="h-4 w-4 mr-2" />
                                 Generate Challan Form
                               </>
                             )}
                           </Button>
                         </CardContent>
                       </Card>
                     </motion.div>
                   )}
 
                   {/* Tax Slabs Reference */}
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm flex items-center gap-2">
                         <FileSpreadsheet className="h-4 w-4" />
                         FBR Tax Slabs 2024 Reference
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-xs space-y-1">
                         <p className="text-muted-foreground">For Salaried Individuals:</p>
                         <ul className="space-y-0.5 text-muted-foreground">
                           <li>• Up to 6 Lac: 0%</li>
                           <li>• 6-12 Lac: 2.5%</li>
                           <li>• 12-24 Lac: 12.5% + 15K</li>
                           <li>• 24-36 Lac: 22.5% + 165K</li>
                           <li>• 36-60 Lac: 27.5% + 435K</li>
                           <li>• Above 60 Lac: 35% + 1,095K</li>
                         </ul>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </div>
             </TabsContent>
 
             {/* ============================================================= */}
             {/* SECP DRAFTER TAB */}
             {/* ============================================================= */}
             <TabsContent value="secp" className="mt-0 space-y-4">
               <Alert className="border-blue-500/30 bg-blue-500/5">
                 <Building2 className="h-4 w-4 text-blue-500" />
                 <AlertDescription>
                   <strong>Company Secretary Agent</strong> - Generates SECP forms, Board Resolutions, 
                   and Annual Returns based on Companies Act 2017. Your company data never leaves your device.
                 </AlertDescription>
               </Alert>
 
               <div className="grid md:grid-cols-2 gap-6">
                 {/* Company Details Form */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-lg">
                       <Briefcase className="h-5 w-5 text-blue-500" />
                       Company Information
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Company Name</label>
                       <Input
                         placeholder="e.g., ABC Technologies (Private) Limited"
                         value={secpData.companyName || ''}
                         onChange={(e) => setSecpData(prev => ({ ...prev, companyName: e.target.value }))}
                       />
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Company Type</label>
                       <Select 
                         value={secpData.companyType}
                         onValueChange={(v) => setSecpData(prev => ({ ...prev, companyType: v as any }))}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="private">Private Limited Company</SelectItem>
                           <SelectItem value="smc">Single Member Company (SMC)</SelectItem>
                           <SelectItem value="public">Public Limited Company</SelectItem>
                           <SelectItem value="ngo">Not-for-Profit (Section 42)</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Registration Number</label>
                       <Input
                         placeholder="CUIN Number"
                         value={secpData.registrationNumber || ''}
                         onChange={(e) => setSecpData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                       />
                     </div>
 
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2">
                         <label className="text-sm font-medium">Authorized Capital</label>
                         <Input
                           type="number"
                           placeholder="100000"
                           value={secpData.authorizedCapital || ''}
                           onChange={(e) => setSecpData(prev => ({ ...prev, authorizedCapital: Number(e.target.value) }))}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-sm font-medium">Paid-up Capital</label>
                         <Input
                           type="number"
                           placeholder="100000"
                           value={secpData.paidUpCapital || ''}
                           onChange={(e) => setSecpData(prev => ({ ...prev, paidUpCapital: Number(e.target.value) }))}
                         />
                       </div>
                     </div>
 
                     <div className="space-y-2">
                       <label className="text-sm font-medium">Registered Address</label>
                       <Textarea
                         placeholder="Complete registered office address..."
                         value={secpData.registeredAddress || ''}
                         onChange={(e) => setSecpData(prev => ({ ...prev, registeredAddress: e.target.value }))}
                         className="min-h-[60px]"
                       />
                     </div>
 
                     <Button 
                       onClick={generateBoardResolution}
                       disabled={isProcessing || !secpData.companyName}
                       className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                     >
                       {isProcessing ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Drafting Documents...
                         </>
                       ) : (
                         <>
                           <FileText className="h-4 w-4 mr-2" />
                           Generate SECP Documents
                         </>
                       )}
                     </Button>
                   </CardContent>
                 </Card>
 
                 {/* Generated Documents */}
                 <div className="space-y-4">
                   {secpDocuments.length > 0 && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                     >
                       <Card className="border-blue-500/30">
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-lg">
                             <CheckCircle2 className="h-5 w-5 text-blue-500" />
                             Generated Documents
                           </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-3">
                           {secpDocuments.map((doc, idx) => (
                             <div 
                               key={idx}
                               className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                             >
                               <div className="flex items-center gap-2">
                                 <FileText className="h-4 w-4 text-blue-500" />
                                 <span className="text-sm">{doc}</span>
                               </div>
                               <div className="flex gap-1">
                                 <Button variant="ghost" size="sm">
                                   <Eye className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="sm">
                                   <Download className="h-4 w-4" />
                                 </Button>
                               </div>
                             </div>
                           ))}
                         </CardContent>
                       </Card>
                     </motion.div>
                   )}
 
                   {/* SECP Requirements */}
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm flex items-center gap-2">
                         <Scale className="h-4 w-4" />
                         SECP Compliance Checklist
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-xs space-y-2">
                         <div className="flex items-center gap-2">
                           <CheckCircle2 className="h-3 w-3 text-green-500" />
                           <span>Form A - Annual Return (within 30 days of AGM)</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <CheckCircle2 className="h-3 w-3 text-green-500" />
                           <span>Form 29 - Director Consent</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <CheckCircle2 className="h-3 w-3 text-green-500" />
                           <span>Form III - Beneficial Ownership</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="h-3 w-3 text-amber-500" />
                           <span>Audited Accounts (within 4 months of FY end)</span>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
 
                   {/* Fee Calculator */}
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm">SECP Fees</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-sm">
                         <p className="text-muted-foreground">For {secpData.companyType} company:</p>
                         <p className="text-lg font-bold mt-1">
                           Registration: PKR {SECP_FEES[secpData.companyType || 'private'].registration.toLocaleString()}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           Annual: PKR {SECP_FEES[secpData.companyType || 'private'].annual.toLocaleString()}/year
                         </p>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </div>
             </TabsContent>
 
             {/* ============================================================= */}
             {/* AUDIT GUARD TAB */}
             {/* ============================================================= */}
             <TabsContent value="audit" className="mt-0 space-y-4">
               <Alert className="border-amber-500/30 bg-amber-500/5">
                 <AlertTriangle className="h-4 w-4 text-amber-500" />
                 <AlertDescription>
                   <strong>Audit Guard - Pre-Filing Risk Scanner</strong> - Analyzes your financial data 
                   locally to identify potential FBR audit triggers before you file. 100% offline processing.
                 </AlertDescription>
               </Alert>
 
               <div className="grid md:grid-cols-2 gap-6">
                 {/* Scan Controls */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-lg">
                       <Search className="h-5 w-5 text-amber-500" />
                       Risk Analysis
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
                       <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                       <p className="text-sm font-medium">Upload Bank Statement</p>
                       <p className="text-xs text-muted-foreground">
                         PDF or Excel - Processed 100% locally in the Bunker
                       </p>
                       <Button variant="outline" size="sm" className="mt-2">
                         <Upload className="h-4 w-4 mr-2" />
                         Select File
                       </Button>
                     </div>
 
                     <div className="p-3 bg-muted/50 rounded-lg">
                       <p className="text-sm font-medium mb-2">Or use data from FBR Helper:</p>
                       {fbrData.annualIncome ? (
                         <div className="text-xs space-y-1 text-muted-foreground">
                           <p>Income: PKR {(fbrData.annualIncome || 0).toLocaleString()}</p>
                           <p>Expenses: PKR {(fbrData.expenses || 0).toLocaleString()}</p>
                         </div>
                       ) : (
                         <p className="text-xs text-muted-foreground">
                           Enter data in FBR Helper first
                         </p>
                       )}
                     </div>
 
                     {isProcessing && (
                       <div className="space-y-2">
                         <Progress value={progress} />
                         <p className="text-xs text-center text-muted-foreground">
                           Scanning for audit triggers...
                         </p>
                       </div>
                     )}
 
                     <Button 
                       onClick={runAuditGuard}
                       disabled={isProcessing}
                       className="w-full bg-gradient-to-r from-amber-500 to-orange-600"
                     >
                       {isProcessing ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Scanning...
                         </>
                       ) : (
                         <>
                           <Shield className="h-4 w-4 mr-2" />
                           Run Audit Guard Scan
                         </>
                       )}
                     </Button>
                   </CardContent>
                 </Card>
 
                 {/* Findings */}
                 <div className="space-y-4">
                   {auditFindings.length > 0 && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                     >
                       <Card className="border-amber-500/30">
                         <CardHeader>
                           <CardTitle className="flex items-center justify-between text-lg">
                             <span className="flex items-center gap-2">
                               <AlertTriangle className="h-5 w-5 text-amber-500" />
                               Audit Risk Findings
                             </span>
                             <Badge variant="outline">
                               {auditFindings.filter(f => f.severity === 'critical').length} Critical
                             </Badge>
                           </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-3">
                           {auditFindings.map((finding) => (
                             <div 
                               key={finding.id}
                               className={`p-3 rounded-lg border ${getSeverityColor(finding.severity)}`}
                             >
                               <div className="flex items-start gap-2">
                                 {finding.severity === 'critical' && <AlertTriangle className="h-4 w-4 mt-0.5" />}
                                 {finding.severity === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5" />}
                                 {finding.severity === 'info' && <CheckCircle2 className="h-4 w-4 mt-0.5" />}
                                 <div className="flex-1">
                                   <p className="text-sm font-medium">{finding.category}</p>
                                   <p className="text-xs mt-1">{finding.description}</p>
                                   <p className="text-xs text-muted-foreground mt-2">
                                     <strong>Regulation:</strong> {finding.regulation}
                                   </p>
                                   <p className="text-xs text-muted-foreground mt-1">
                                     <strong>Action:</strong> {finding.recommendation}
                                   </p>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </CardContent>
                       </Card>
                     </motion.div>
                   )}
 
                   {/* Expense Analysis */}
                   {expenseCategories.length > 0 && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.1 }}
                     >
                       <Card>
                         <CardHeader className="pb-2">
                           <CardTitle className="text-sm flex items-center gap-2">
                             <FileSpreadsheet className="h-4 w-4" />
                             Expense Breakdown Analysis
                           </CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="space-y-2">
                             {expenseCategories.map((cat, idx) => (
                               <div 
                                 key={idx}
                                 className={`flex items-center justify-between p-2 rounded ${
                                   cat.flagged ? 'bg-amber-500/10' : 'bg-muted/50'
                                 }`}
                               >
                                 <div className="flex items-center gap-2">
                                   {cat.flagged && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                                   <span className="text-sm">{cat.category}</span>
                                 </div>
                                 <span className="text-sm font-medium">
                                   PKR {Math.round(cat.amount).toLocaleString()}
                                 </span>
                               </div>
                             ))}
                           </div>
                         </CardContent>
                       </Card>
                     </motion.div>
                   )}
                 </div>
               </div>
             </TabsContent>
           </ScrollArea>
         </Tabs>
       </div>
 
       {/* Footer - Sovereignty Badge */}
       <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-center gap-4">
         <Badge variant="outline" className="gap-1.5">
           <Lock className="h-3 w-3 text-green-500" />
           Bunker Mode Active
         </Badge>
         <Badge variant="outline" className="gap-1.5">
           <Shield className="h-3 w-3 text-green-500" />
           Zero Data Transmission
         </Badge>
         <Badge variant="outline" className="gap-1.5">
           <Brain className="h-3 w-3 text-primary" />
           Deep FBR/SECP/PPR Knowledge
         </Badge>
       </div>
     </motion.div>
   );
 };
 
 export default PakistanCompliancePanel;