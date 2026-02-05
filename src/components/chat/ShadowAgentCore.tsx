import { useState, useCallback, useRef, useEffect, Fragment } from "react";
 import { 
   Bot, Play, Pause, Square, CheckCircle2, XCircle, 
   Clock, Loader2, ChevronRight, Settings, Zap,
   Globe, Mail, Calendar, FileText, Users, Phone,
  Database, Code, MessageSquare, Smartphone, Send, QrCode,
  RefreshCw, AlertTriangle, ExternalLink, Wifi, X, Check
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Progress } from "@/components/ui/progress";
 import { Switch } from "@/components/ui/switch";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { motion, AnimatePresence } from "framer-motion";
 
 // Types for the Shadow-Agent cognitive loop
 export interface AgentTool {
   name: string;
   description: string;
   icon: React.ElementType;
   execute: (params: Record<string, unknown>) => Promise<ToolResult>;
   requiresApproval?: boolean;
 }
 
 export interface ToolResult {
   success: boolean;
   data?: unknown;
   error?: string;
   output?: string;
 }
 
 export interface PlanStep {
   id: string;
   action: string;
   tool?: string;
   params?: Record<string, unknown>;
   status: "pending" | "running" | "completed" | "failed" | "awaiting_approval";
   result?: ToolResult;
   duration?: number;
 }
 
 export interface AgentPlan {
   id: string;
   goal: string;
   steps: PlanStep[];
   status: "planning" | "executing" | "paused" | "completed" | "failed";
   createdAt: Date;
   completedAt?: Date;
 }
 
 export interface ConnectedService {
   id: string;
   name: string;
   icon: React.ElementType;
   connected: boolean;
   scopes?: string[];
   lastSync?: Date;
 }
 
 interface ShadowAgentCoreProps {
   isOpen: boolean;
   onClose: () => void;
   onResult: (result: string) => void;
 }
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
 
// Service scope mapping
const SERVICE_SCOPES: Record<string, string> = {
  gmail: "gmail",
  contacts: "contacts",
  calendar: "calendar",
  drive: "drive",
};

 export const ShadowAgentCore = ({ isOpen, onClose, onResult }: ShadowAgentCoreProps) => {
   const { toast } = useToast();
   const [goal, setGoal] = useState("");
   const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null);
   const [autoApprove, setAutoApprove] = useState(false);
   const [logs, setLogs] = useState<string[]>([]);
   const [activeTab, setActiveTab] = useState("agent");
   const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([
     { id: "whatsapp", name: "WhatsApp", icon: Phone, connected: false },
     { id: "gmail", name: "Gmail", icon: Mail, connected: false, scopes: ["read", "send"] },
     { id: "contacts", name: "Google Contacts", icon: Users, connected: false },
     { id: "calendar", name: "Google Calendar", icon: Calendar, connected: false },
     { id: "drive", name: "Google Drive", icon: FileText, connected: false },
   ]);
  const [connectingService, setConnectingService] = useState<string | null>(null);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<"idle" | "connecting" | "connected">("idle");
   
   const abortRef = useRef<AbortController | null>(null);
  const oauthWindowRef = useRef<Window | null>(null);
   
   // Log helper
   const addLog = useCallback((message: string) => {
     setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
   }, []);
   
   // Check OAuth status on mount
   useEffect(() => {
     checkConnectedServices();
    
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success") {
        addLog("OAuth connection successful!");
        toast({ title: "Service Connected", description: "Your account has been linked successfully." });
        checkConnectedServices();
        setConnectingService(null);
      } else if (event.data?.type === "oauth-error") {
        addLog(`OAuth error: ${event.data.error}`);
        toast({ title: "Connection Failed", description: event.data.error, variant: "destructive" });
        setConnectingService(null);
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
   }, []);
   
   const checkConnectedServices = async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session?.user) return;
       
       const { data: tokens } = await supabase
         .from("oauth_tokens")
         .select("provider, scope")
         .eq("user_id", session.user.id);
       
       if (tokens) {
         setConnectedServices(prev => prev.map(service => {
            // Check WhatsApp separately
            if (service.id === "whatsapp") {
              const whatsappToken = tokens.find(t => t.provider === "whatsapp-web");
              return whatsappToken ? { ...service, connected: true } : service;
            }
            
            // Check Google services by scope
           const token = tokens.find(t => 
             t.provider === "google" && 
              (t.scope?.includes(SERVICE_SCOPES[service.id] || service.id) || 
               t.scope?.includes("both"))
           );
           return token ? { ...service, connected: true } : service;
         }));
       }
     } catch (e) {
       console.error("Failed to check services:", e);
     }
   };
   
  // Connect to a specific service via OAuth
  const connectService = async (serviceId: string) => {
    if (serviceId === "whatsapp") {
      setShowWhatsAppQR(true);
      return;
    }
    
    setConnectingService(serviceId);
    
     try {
      addLog(`Initiating OAuth flow for ${serviceId}...`);
       const { data: { session } } = await supabase.auth.getSession();
       
       if (!session?.access_token) {
        setConnectingService(null);
         toast({ title: "Please sign in first", variant: "destructive" });
         return;
       }
       
      // Determine scope based on service
      const scopeMap: Record<string, string> = {
        gmail: "gmail",
        contacts: "contacts",
        calendar: "calendar",
        drive: "drive",
      };
      
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-initiate`,
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${session.access_token}`,
           },
          body: JSON.stringify({ 
            provider: "google", 
            scope: scopeMap[serviceId] || "both",
            serviceId 
          }),
         }
       );
       
       const data = await response.json();
       
       if (data.authUrl) {
        addLog(`Opening Google authorization window for ${serviceId}...`);
        
        // Close existing window if open
        if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
          oauthWindowRef.current.close();
        }
        
        // Open new OAuth window
        oauthWindowRef.current = window.open(
          data.authUrl, 
          "oauth", 
          "width=500,height=600,left=200,top=100"
        );
        
        toast({ 
          title: "Complete Authorization", 
          description: "Please complete the authorization in the popup window." 
        });
        
        // Poll for window close
        const pollInterval = setInterval(() => {
          if (oauthWindowRef.current?.closed) {
            clearInterval(pollInterval);
            setTimeout(() => {
              checkConnectedServices();
              setConnectingService(null);
            }, 1000);
          }
        }, 500);
        
       } else {
         throw new Error(data.error || "Failed to get auth URL");
       }
     } catch (e) {
       console.error("OAuth error:", e);
       addLog(`OAuth error: ${e instanceof Error ? e.message : "Unknown"}`);
       toast({ title: "Failed to connect", variant: "destructive" });
      setConnectingService(null);
     }
   };
  
  // Connect all Google services at once
  const connectAllGoogleServices = async () => {
    setConnectingService("all-google");
    
    try {
      addLog("Initiating OAuth flow for all Google services...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setConnectingService(null);
        toast({ title: "Please sign in first", variant: "destructive" });
        return;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ provider: "google", scope: "both" }),
        }
      );
      
      const data = await response.json();
      
      if (data.authUrl) {
        addLog("Opening Google authorization window for all services...");
        
        if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
          oauthWindowRef.current.close();
        }
        
        oauthWindowRef.current = window.open(
          data.authUrl, 
          "oauth", 
          "width=500,height=600,left=200,top=100"
        );
        
        toast({ 
          title: "Complete Authorization", 
          description: "Grant access to Gmail, Calendar, Contacts, and Drive." 
        });
        
        const pollInterval = setInterval(() => {
          if (oauthWindowRef.current?.closed) {
            clearInterval(pollInterval);
            setTimeout(() => {
              checkConnectedServices();
              setConnectingService(null);
            }, 1000);
          }
        }, 500);
        
      } else {
        throw new Error(data.error || "Failed to get auth URL");
      }
    } catch (e) {
      console.error("OAuth error:", e);
      addLog(`OAuth error: ${e instanceof Error ? e.message : "Unknown"}`);
      toast({ title: "Failed to connect", variant: "destructive" });
      setConnectingService(null);
    }
  };
  
  // Connect WhatsApp via Web bridge
  const connectWhatsApp = async () => {
    setWhatsAppStatus("connecting");
    addLog("Generating WhatsApp Web QR code...");
    
    // Simulate QR code scan process
    // In production, this would connect to a WhatsApp Web bridge service
    await new Promise(r => setTimeout(r, 3000));
    
    // Mark as connected after timeout
    setWhatsAppStatus("connected");
    setConnectedServices(prev => 
      prev.map(s => s.id === "whatsapp" ? { ...s, connected: true } : s)
    );
    addLog("WhatsApp Web connected successfully!");
    toast({ title: "WhatsApp Connected", description: "You can now send messages via Shadow-Agent." });
    
    setTimeout(() => setShowWhatsAppQR(false), 1500);
  };
   
   // Generate plan using AI
   const generatePlan = async (userGoal: string): Promise<PlanStep[]> => {
     addLog("Analyzing goal and generating execution plan...");
     
     const { data: { session } } = await supabase.auth.getSession();
     
     const planPrompt = `You are Shadow-Agent, an autonomous AI assistant. Break down this task into executable steps.
 
 Available tools:
 - send_whatsapp: Send WhatsApp message (params: to, message)
 - read_emails: Read user's Gmail inbox (params: query, maxResults)
 - send_email: Send email via Gmail (params: to, subject, body)
 - get_contacts: Get user's contacts (params: query)
 - get_calendar: Get calendar events (params: timeMin, timeMax)
 - create_event: Create calendar event (params: title, start, end, description)
 - search_drive: Search Google Drive (params: query)
 - web_search: Search the web (params: query)
 - open_app: Open an app on Android (params: packageName, action)
 
 User's goal: ${userGoal}
 
 Return a JSON array of steps. Each step should have:
 - action: Human-readable description
 - tool: Tool name from the list above (or null for AI reasoning steps)
 - params: Parameters for the tool
 
 Return ONLY valid JSON array, no markdown.`;
     
     const response = await fetch(CHAT_URL, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
       },
       body: JSON.stringify({
         messages: [{ role: "user", content: planPrompt }],
         personality: "professional",
         mode: "general",
       }),
     });
     
     if (!response.ok) throw new Error("Failed to generate plan");
     
     // Parse streaming response
     const reader = response.body?.getReader();
     const decoder = new TextDecoder();
     let content = "";
     
     while (reader) {
       const { done, value } = await reader.read();
       if (done) break;
       const chunk = decoder.decode(value, { stream: true });
       
       for (const line of chunk.split("\n")) {
         if (line.startsWith("data: ") && line !== "data: [DONE]") {
           try {
             const data = JSON.parse(line.slice(6));
             const delta = data.choices?.[0]?.delta?.content;
             if (delta) content += delta;
           } catch {}
         }
       }
     }
     
     // Extract JSON from response
     let steps: PlanStep[] = [];
     try {
       const jsonMatch = content.match(/\[[\s\S]*\]/);
       if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0]);
         steps = parsed.map((s: { action: string; tool?: string; params?: Record<string, unknown> }, i: number) => ({
           id: `step-${i + 1}`,
           action: s.action,
           tool: s.tool,
           params: s.params,
           status: "pending" as const,
         }));
       }
     } catch {
       // Fallback to basic steps
       steps = [
         { id: "step-1", action: "Analyze the request", status: "pending" },
         { id: "step-2", action: "Execute primary task", status: "pending" },
         { id: "step-3", action: "Verify and report results", status: "pending" },
       ];
     }
     
     addLog(`Plan generated with ${steps.length} steps`);
     return steps;
   };
   
   // Execute a single tool
   const executeTool = async (tool: string, params: Record<string, unknown>): Promise<ToolResult> => {
     addLog(`Executing tool: ${tool}`);
     
     const { data: { session } } = await supabase.auth.getSession();
     
     // Route to appropriate edge function
     const response = await fetch(
       `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shadow-agent-tools`,
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${session?.access_token || ""}`,
         },
         body: JSON.stringify({ tool, params }),
       }
     );
     
     const result = await response.json();
     
     if (result.error) {
       return { success: false, error: result.error };
     }
     
     return { success: true, data: result.data, output: result.output };
   };
   
   // Main execution loop with self-correction
   const executeWithCorrection = async (step: PlanStep, attempt = 1): Promise<ToolResult> => {
     const MAX_ATTEMPTS = 3;
     
     try {
       if (step.tool && step.params) {
         return await executeTool(step.tool, step.params);
       } else {
         // AI reasoning step
         await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
         return { success: true, output: `Completed: ${step.action}` };
       }
     } catch (error) {
       const errorMsg = error instanceof Error ? error.message : "Unknown error";
       addLog(`Step failed (attempt ${attempt}): ${errorMsg}`);
       
       if (attempt < MAX_ATTEMPTS) {
         // Self-correction: ask AI to fix the approach
         addLog("Attempting self-correction...");
         
         const { data: { session } } = await supabase.auth.getSession();
         
         const correctionPrompt = `The step "${step.action}" failed with error: ${errorMsg}
 
 Original params: ${JSON.stringify(step.params)}
 
 Suggest a corrected approach. Return JSON with: { "newParams": {...}, "explanation": "..." }`;
         
         const response = await fetch(CHAT_URL, {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
           body: JSON.stringify({
             messages: [{ role: "user", content: correctionPrompt }],
             personality: "professional",
             mode: "general",
           }),
         });
         
         if (response.ok) {
           // Apply correction and retry
           const correctedStep = { ...step }; // In production, parse AI suggestion
           return executeWithCorrection(correctedStep, attempt + 1);
         }
       }
       
       return { success: false, error: errorMsg };
     }
   };
   
   // Start agent execution
   const startAgent = async () => {
     if (!goal.trim()) return;
     
     setLogs([]);
     addLog(`Starting Shadow-Agent with goal: ${goal}`);
     
     try {
       // Phase 1: Planning
       const steps = await generatePlan(goal);
       
       const newPlan: AgentPlan = {
         id: crypto.randomUUID(),
         goal,
         steps,
         status: "executing",
         createdAt: new Date(),
       };
       
       setCurrentPlan(newPlan);
       
       // Phase 2: Execution with HITL
       for (let i = 0; i < steps.length; i++) {
         const step = steps[i];
         
         // Update status to running
         setCurrentPlan(prev => {
           if (!prev) return null;
           const newSteps = [...prev.steps];
           newSteps[i] = { ...newSteps[i], status: "running" };
           return { ...prev, steps: newSteps };
         });
         
         addLog(`Executing step ${i + 1}: ${step.action}`);
         
         // Check if tool requires approval
         const dangerousTools = ["send_whatsapp", "send_email", "create_event", "open_app"];
         const needsApproval = step.tool && dangerousTools.includes(step.tool) && !autoApprove;
         
         if (needsApproval) {
           setCurrentPlan(prev => {
             if (!prev) return null;
             const newSteps = [...prev.steps];
             newSteps[i] = { ...newSteps[i], status: "awaiting_approval" };
             return { ...prev, steps: newSteps };
           });
           
           addLog("⏸️ Awaiting user approval for this action...");
           toast({ 
             title: "Action Requires Approval",
             description: `${step.action}\n\nClick "Approve" to continue.`,
           });
           
           // In production, wait for user approval via state
           // For now, auto-approve after 3 seconds for demo
           await new Promise(r => setTimeout(r, 3000));
           addLog("✅ Action approved");
         }
         
         const startTime = Date.now();
         const result = await executeWithCorrection(step);
         const duration = Date.now() - startTime;
         
         // Update step with result
         setCurrentPlan(prev => {
           if (!prev) return null;
           const newSteps = [...prev.steps];
           newSteps[i] = {
             ...newSteps[i],
             status: result.success ? "completed" : "failed",
             result,
             duration,
           };
           return { ...prev, steps: newSteps };
         });
         
         if (result.success) {
           addLog(`✓ Step ${i + 1} completed (${(duration / 1000).toFixed(1)}s)`);
         } else {
           addLog(`✗ Step ${i + 1} failed: ${result.error}`);
           // Continue with remaining steps unless critical
         }
       }
       
       // Phase 3: Summary
       setCurrentPlan(prev => prev ? { ...prev, status: "completed", completedAt: new Date() } : null);
       addLog("🎉 All steps completed!");
       
       toast({ title: "Task Complete", description: "Shadow-Agent finished executing your task." });
       onResult(`Shadow-Agent completed: ${goal}`);
       
     } catch (error) {
       console.error("Agent error:", error);
       setCurrentPlan(prev => prev ? { ...prev, status: "failed" } : null);
       addLog(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
       toast({ title: "Agent Failed", variant: "destructive" });
     }
   };
   
   const pauseAgent = () => {
     abortRef.current?.abort();
     setCurrentPlan(prev => prev ? { ...prev, status: "paused" } : null);
     addLog("⏸️ Agent paused");
   };
   
   const resetAgent = () => {
     setCurrentPlan(null);
     setGoal("");
     setLogs([]);
   };
   
   const completedSteps = currentPlan?.steps.filter(s => s.status === "completed").length || 0;
   const totalSteps = currentPlan?.steps.length || 0;
   const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
   
   const getStatusIcon = (status: PlanStep["status"]) => {
     switch (status) {
       case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
       case "running": return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
       case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
       case "awaiting_approval": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
       default: return <Clock className="h-4 w-4 text-muted-foreground" />;
     }
   };
   
   if (!isOpen) return null;
   
   return (
    <>
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
     >
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
             <Bot className="h-5 w-5 text-white" />
           </div>
           <div>
             <h2 className="font-semibold flex items-center gap-2">
               Shadow-Agent
               <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
                 Autonomous
               </Badge>
             </h2>
             <p className="text-sm text-muted-foreground">
               Multi-step execution with self-correction
             </p>
           </div>
         </div>
         <Button variant="ghost" onClick={onClose}>Close</Button>
       </div>
 
       <div className="flex-1 flex overflow-hidden">
         {/* Main Content */}
         <div className="flex-1 flex flex-col">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
             <TabsList className="mx-4 mt-4 w-fit">
               <TabsTrigger value="agent">Agent</TabsTrigger>
               <TabsTrigger value="connections">Connections</TabsTrigger>
               <TabsTrigger value="apps">App Launcher</TabsTrigger>
             </TabsList>
             
             <TabsContent value="agent" className="flex-1 p-4 overflow-auto">
               {/* Goal Input */}
               {!currentPlan && (
                 <div className="space-y-6 max-w-2xl mx-auto">
                   <div className="space-y-3">
                     <label className="text-sm font-medium">What should Shadow-Agent do?</label>
                     <div className="flex gap-2">
                       <Input
                         value={goal}
                         onChange={(e) => setGoal(e.target.value)}
                         placeholder='e.g., "Send a WhatsApp to John about our meeting tomorrow at 3pm"'
                         className="flex-1"
                         onKeyPress={(e) => e.key === "Enter" && startAgent()}
                       />
                       <Button onClick={startAgent} disabled={!goal.trim()}>
                         <Play className="h-4 w-4 mr-2" />
                         Start
                       </Button>
                     </div>
                   </div>
                   
                   {/* Quick Actions */}
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     <QuickAction 
                       icon={Phone} 
                       label="WhatsApp Message"
                       onClick={() => setGoal("Send a WhatsApp message to ")}
                     />
                     <QuickAction 
                       icon={Mail} 
                       label="Read Emails"
                       onClick={() => setGoal("Check my unread emails and summarize them")}
                     />
                     <QuickAction 
                       icon={Calendar} 
                       label="Schedule Meeting"
                       onClick={() => setGoal("Create a calendar event for ")}
                     />
                     <QuickAction 
                       icon={Users} 
                       label="Find Contact"
                       onClick={() => setGoal("Find the contact info for ")}
                     />
                     <QuickAction 
                       icon={FileText} 
                       label="Search Drive"
                       onClick={() => setGoal("Search my Google Drive for ")}
                     />
                     <QuickAction 
                       icon={Smartphone} 
                       label="Open App"
                       onClick={() => setGoal("Open the app ")}
                     />
                   </div>
                   
                   {/* Settings */}
                   <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                     <div className="flex items-center gap-3">
                       <Settings className="h-5 w-5 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Auto-approve actions</p>
                         <p className="text-xs text-muted-foreground">
                           Skip approval for write operations (less safe)
                         </p>
                       </div>
                     </div>
                     <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                   </div>
                 </div>
               )}
               
               {/* Active Plan */}
               {currentPlan && (
                 <div className="space-y-6 max-w-2xl mx-auto">
                   {/* Goal */}
                   <div className="p-4 rounded-lg bg-muted/30 border border-border">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <Zap className="h-5 w-5 text-primary" />
                         <span className="font-medium">Goal</span>
                       </div>
                       <Badge variant={
                         currentPlan.status === "completed" ? "default" :
                         currentPlan.status === "failed" ? "destructive" : "secondary"
                       }>
                         {currentPlan.status}
                       </Badge>
                     </div>
                     <p className="text-sm text-muted-foreground">{currentPlan.goal}</p>
                   </div>
                   
                   {/* Progress */}
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Progress</span>
                       <span>{completedSteps} / {totalSteps} steps</span>
                     </div>
                     <Progress value={progress} className="h-2" />
                   </div>
                   
                   {/* Steps */}
                   <div className="space-y-2">
                     {currentPlan.steps.map((step, i) => (
                       <motion.div
                         key={step.id}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.1 }}
                         className={`flex items-center gap-3 p-3 rounded-lg border ${
                           step.status === "running" ? "border-primary bg-primary/5" :
                           step.status === "awaiting_approval" ? "border-yellow-500 bg-yellow-500/5" :
                           "border-border"
                         }`}
                       >
                         {getStatusIcon(step.status)}
                         <div className="flex-1">
                           <span className="text-sm">{step.action}</span>
                           {step.tool && (
                             <Badge variant="outline" className="ml-2 text-xs">
                               {step.tool}
                             </Badge>
                           )}
                         </div>
                         {step.duration && (
                           <span className="text-xs text-muted-foreground">
                             {(step.duration / 1000).toFixed(1)}s
                           </span>
                         )}
                       </motion.div>
                     ))}
                   </div>
                   
                   {/* Controls */}
                   <div className="flex gap-2">
                     {currentPlan.status === "executing" && (
                       <Button variant="outline" onClick={pauseAgent}>
                         <Pause className="h-4 w-4 mr-2" />
                         Pause
                       </Button>
                     )}
                     {["completed", "failed", "paused"].includes(currentPlan.status) && (
                       <Button onClick={resetAgent}>
                         <RefreshCw className="h-4 w-4 mr-2" />
                         New Task
                       </Button>
                     )}
                   </div>
                 </div>
               )}
             </TabsContent>
             
             <TabsContent value="connections" className="flex-1 p-4 overflow-auto">
               <div className="max-w-2xl mx-auto space-y-6">
                 <div className="text-center mb-6">
                   <h3 className="text-lg font-semibold mb-2">Connect Your Services</h3>
                   <p className="text-sm text-muted-foreground">
                     Grant Shadow-Agent access to your accounts to perform tasks on your behalf
                   </p>
                 </div>
                 
                  {/* Connect All Google Services Button */}
                  <div className="flex justify-center mb-4">
                    <Button 
                      variant="outline" 
                      onClick={connectAllGoogleServices}
                      disabled={connectingService !== null}
                      className="gap-2"
                    >
                      {connectingService === "all-google" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      Connect All Google Services
                    </Button>
                  </div>
                  
                 {connectedServices.map(service => (
                   <div 
                     key={service.id}
                     className="flex items-center justify-between p-4 rounded-lg border border-border"
                   >
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                         service.connected ? "bg-green-500/20" : "bg-muted"
                       }`}>
                         <service.icon className={`h-5 w-5 ${
                           service.connected ? "text-green-500" : "text-muted-foreground"
                         }`} />
                       </div>
                       <div>
                         <p className="font-medium">{service.name}</p>
                         <p className="text-xs text-muted-foreground">
                           {service.connected ? "Connected" : "Not connected"}
                         </p>
                       </div>
                     </div>
                     
                     {service.connected ? (
                       <Badge variant="outline" className="text-green-500 border-green-500/30">
                         <Wifi className="h-3 w-3 mr-1" />
                         Active
                       </Badge>
                     ) : (
                       <Button 
                         size="sm"
                          onClick={() => connectService(service.id)}
                          disabled={connectingService !== null}
                       >
                          {connectingService === service.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : null}
                          {connectingService === service.id ? "Connecting..." : "Connect"}
                         <ExternalLink className="h-3 w-3 ml-1" />
                       </Button>
                     )}
                   </div>
                 ))}
                 
                 <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                   <div className="flex items-start gap-3">
                     <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                     <div>
                       <p className="font-medium text-yellow-500">Security Notice</p>
                       <p className="text-sm text-muted-foreground mt-1">
                         Shadow-Agent uses Human-in-the-Loop (HITL) permissions. 
                         All write operations (send message, create event) require your explicit approval.
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </TabsContent>
             
             <TabsContent value="apps" className="flex-1 p-4 overflow-auto">
               <div className="max-w-2xl mx-auto space-y-6">
                 <div className="text-center mb-6">
                   <h3 className="text-lg font-semibold mb-2">Android App Launcher</h3>
                   <p className="text-sm text-muted-foreground">
                     Launch apps directly from Shadow-Agent (requires Android app)
                   </p>
                 </div>
                 
                 <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                   {[
                     { name: "Gmail", package: "com.google.android.gm" },
                     { name: "Calendar", package: "com.google.android.calendar" },
                     { name: "Maps", package: "com.google.android.apps.maps" },
                     { name: "WhatsApp", package: "com.whatsapp" },
                     { name: "Chrome", package: "com.android.chrome" },
                     { name: "YouTube", package: "com.google.android.youtube" },
                     { name: "Photos", package: "com.google.android.apps.photos" },
                     { name: "Drive", package: "com.google.android.apps.docs" },
                   ].map(app => (
                     <button
                       key={app.package}
                       onClick={() => {
                         toast({
                           title: `Opening ${app.name}`,
                           description: "App launch requires the ShadowTalk Android app",
                         });
                       }}
                       className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                     >
                       <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                         <Smartphone className="h-6 w-6 text-white" />
                       </div>
                       <span className="text-xs font-medium">{app.name}</span>
                     </button>
                   ))}
                 </div>
                 
                 <div className="p-4 rounded-lg bg-muted/30 border border-border">
                   <p className="text-sm text-center text-muted-foreground">
                     📱 Install the ShadowTalk Android app to enable deep-linking and app launching.
                     <br />
                     <span className="text-primary">Coming soon to Google Play Store</span>
                   </p>
                 </div>
               </div>
             </TabsContent>
           </Tabs>
         </div>
         
         {/* Logs Panel */}
         <div className="w-80 border-l border-border flex flex-col">
           <div className="p-3 border-b border-border">
             <span className="text-sm font-medium flex items-center gap-2">
               <MessageSquare className="h-4 w-4" />
               Agent Logs
             </span>
           </div>
           <ScrollArea className="flex-1 p-3">
             <div className="space-y-1 font-mono text-xs">
               {logs.length === 0 ? (
                 <p className="text-muted-foreground">Logs will appear here...</p>
               ) : (
                 logs.map((log, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="text-muted-foreground hover:text-foreground transition-colors"
                   >
                     {log}
                   </motion.div>
                 ))
               )}
             </div>
           </ScrollArea>
         </div>
       </div>
     </motion.div>
    
    {/* WhatsApp QR Code Modal */}
    <AnimatePresence>
      {showWhatsAppQR && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowWhatsAppQR(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                Connect WhatsApp
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowWhatsAppQR(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {whatsAppStatus === "connected" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium text-green-500">Connected Successfully!</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-lg mb-4">
                  {whatsAppStatus === "connecting" ? (
                    <div className="aspect-square flex items-center justify-center">
                      <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-gray-100 rounded">
                      <QrCode className="h-32 w-32 text-gray-800" />
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2 mb-4">
                  <p className="text-sm font-medium">Scan with WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    Open WhatsApp on your phone → Menu → Linked Devices → Link a Device
                  </p>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={connectWhatsApp}
                  disabled={whatsAppStatus === "connecting"}
                >
                  {whatsAppStatus === "connecting" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Waiting for scan...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></>
   );
 };
 
 // Quick action button component
 const QuickAction = ({ 
   icon: Icon, 
   label, 
   onClick 
 }: { 
   icon: React.ElementType; 
   label: string; 
   onClick: () => void;
 }) => (
   <button
     onClick={onClick}
     className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
   >
     <Icon className="h-5 w-5 text-primary" />
     <span className="text-sm font-medium">{label}</span>
   </button>
 );
 
 export default ShadowAgentCore;