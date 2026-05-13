 import { useState, useRef, useEffect, useCallback } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   Bot, Send, Loader2, CheckCircle2, AlertCircle, Play, Pause,
   FileCode, Terminal, Wrench, Sparkles, Code, Database,
   Globe, Rocket, Package, GitBranch, Settings, Copy,
   ChevronDown, ChevronRight, Trash2, RefreshCw, Zap, 
   ExternalLink, Eye, EyeOff, Flame
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useToast } from "@/hooks/use-toast";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 import ReactMarkdown from "react-markdown";
 import remarkGfm from "remark-gfm";
 
 interface FileNode {
   name: string;
   type: "file" | "folder";
   path: string;
   content?: string;
   children?: FileNode[];
   expanded?: boolean;
   language?: string;
 }
 
 interface AgentAction {
   id: string;
   type: "analyze" | "create" | "modify" | "delete" | "install" | "configure" | "deploy" | "test";
   target: string;
   description: string;
   status: "pending" | "running" | "completed" | "failed";
   output?: string;
   code?: string;
 }
 
 interface AgentMessage {
   id: string;
   role: "user" | "agent" | "system";
   content: string;
   timestamp: Date;
   actions?: AgentAction[];
   thinking?: string;
 }
 
 interface AutonomousAgentProps {
   files: FileNode[];
   selectedFile: FileNode | null;
   fileContent: string;
   onCreateFile: (path: string, name: string, content: string) => void;
   onUpdateFile: (path: string, content: string) => void;
   onDeleteFile: (path: string) => void;
   onTerminalCommand: (command: string) => void;
   projectName: string;
 }
 
 // Firebase configuration template
 const FIREBASE_CONFIG_TEMPLATE = `// Firebase Configuration
 import { initializeApp } from 'firebase/app';
 import { getAuth } from 'firebase/auth';
 import { getFirestore } from 'firebase/firestore';
 import { getStorage } from 'firebase/storage';
 import { getFunctions } from 'firebase/functions';
 
 const firebaseConfig = {
   apiKey: process.env.VITE_FIREBASE_API_KEY,
   authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
   projectId: process.env.VITE_FIREBASE_PROJECT_ID,
   storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
   appId: process.env.VITE_FIREBASE_APP_ID
 };
 
 export const app = initializeApp(firebaseConfig);
 export const auth = getAuth(app);
 export const db = getFirestore(app);
 export const storage = getStorage(app);
 export const functions = getFunctions(app);
 `;
 
 // Project templates for different types
 const PROJECT_TEMPLATES: Record<string, { name: string; description: string; stack: string[] }> = {
   saas: {
     name: "SaaS Application",
     description: "Full-stack SaaS with auth, dashboard, billing",
     stack: ["React", "TypeScript", "Firebase", "Stripe", "Tailwind"]
   },
   ecommerce: {
     name: "E-Commerce Platform",
     description: "Online store with products, cart, checkout",
     stack: ["React", "TypeScript", "Firebase", "Stripe", "Tailwind"]
   },
   dashboard: {
     name: "Admin Dashboard",
     description: "Analytics dashboard with charts and data tables",
     stack: ["React", "TypeScript", "Firebase", "Recharts", "Tailwind"]
   },
   blog: {
     name: "Blog Platform",
     description: "Content management with markdown support",
     stack: ["React", "TypeScript", "Firebase", "MDX", "Tailwind"]
   },
   api: {
     name: "API Backend",
     description: "REST/GraphQL API with authentication",
     stack: ["Node.js", "Express", "Firebase", "TypeScript"]
   }
 };
 
 export const AutonomousAgent = ({
   files,
   selectedFile,
   fileContent,
   onCreateFile,
   onUpdateFile,
   onDeleteFile,
   onTerminalCommand,
   projectName
 }: AutonomousAgentProps) => {
   const { toast } = useToast();
   const scrollRef = useRef<HTMLDivElement>(null);
   
   // State
   const [messages, setMessages] = useState<AgentMessage[]>([
     {
       id: "welcome",
       role: "system",
       content: "👋 **Welcome to Shadow Agent** - Your autonomous coding assistant!\n\nI can help you:\n- 🏗️ Build complete websites, SaaS, and applications\n- 🔥 Set up Firebase backend with auth, database, storage\n- 🐛 Debug and fix issues in your code\n- 📦 Install dependencies and configure tooling\n- 🚀 Deploy production-ready applications\n\n**Just tell me what you want to build!**",
       timestamp: new Date()
     }
   ]);
   const [input, setInput] = useState("");
   const [isProcessing, setIsProcessing] = useState(false);
   const [currentActions, setCurrentActions] = useState<AgentAction[]>([]);
   const [showThinking, setShowThinking] = useState(true);
   const [activeTab, setActiveTab] = useState<"chat" | "actions" | "templates">("chat");
   const [thinkingText, setThinkingText] = useState("");
   
   // Auto-scroll on new messages
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages, thinkingText]);
   
   // Get all file contents for context
   const getAllFileContents = useCallback((): string => {
     const contents: string[] = [];
     
     const traverse = (nodes: FileNode[]) => {
       nodes.forEach(node => {
         if (node.type === "file" && node.content) {
           contents.push(`--- ${node.path} ---\n${node.content}\n`);
         }
         if (node.children) traverse(node.children);
       });
     };
     
     traverse(files);
     return contents.join("\n");
   }, [files]);
   
   // Get file structure as string
   const getFileStructure = useCallback((): string => {
     const structure: string[] = [];
     
     const traverse = (nodes: FileNode[], depth = 0) => {
       nodes.forEach(node => {
         const indent = "  ".repeat(depth);
         const icon = node.type === "folder" ? "📁" : "📄";
         structure.push(`${indent}${icon} ${node.name}`);
         if (node.children) traverse(node.children, depth + 1);
       });
     };
     
     traverse(files);
     return structure.join("\n");
   }, [files]);
   
   // Execute agent action
   const executeAction = async (action: AgentAction): Promise<string> => {
     switch (action.type) {
       case "create":
         if (action.code) {
           const pathParts = action.target.split("/");
           const fileName = pathParts.pop() || "file.ts";
           const folderPath = pathParts.join("/") || "/src";
           onCreateFile(folderPath, fileName, action.code);
           return `✓ Created ${action.target}`;
         }
         return "No code provided";
         
       case "modify":
         if (action.code) {
           onUpdateFile(action.target, action.code);
           return `✓ Updated ${action.target}`;
         }
         return "No code provided";
         
       case "delete":
         onDeleteFile(action.target);
         return `✓ Deleted ${action.target}`;
         
       case "install":
         onTerminalCommand(`npm install ${action.target}`);
         return `✓ Installing ${action.target}...`;
         
       case "configure":
         return `✓ Configured ${action.target}`;
         
       case "deploy":
         return `✓ Deployment initiated for ${action.target}`;
         
       case "test":
         onTerminalCommand("npm test");
         return `✓ Running tests...`;
         
       case "analyze":
         return `✓ Analysis complete for ${action.target}`;
         
       default:
         return "Unknown action";
     }
   };
   
   // Process user message
   const processMessage = async () => {
     if (!input.trim() || isProcessing) return;
     
     const userMessage: AgentMessage = {
       id: crypto.randomUUID(),
       role: "user",
       content: input,
       timestamp: new Date()
     };
     
     setMessages(prev => [...prev, userMessage]);
     setInput("");
     setIsProcessing(true);
     setThinkingText("Analyzing your request...");
     
     try {
       // Build context
       const fileStructure = getFileStructure();
       const currentFileContext = selectedFile 
         ? `\n\nCurrently viewing: ${selectedFile.path}\n\`\`\`${selectedFile.language || "text"}\n${fileContent}\n\`\`\``
         : "";
       
       const systemPrompt = `You are Shadow Agent, an expert autonomous coding assistant integrated into an IDE. You can build complete applications, websites, and SaaS products.
 
 **Your Capabilities:**
 - Build full-stack applications using React, TypeScript, and modern web technologies
 - Set up Firebase backend (Authentication, Firestore, Storage, Functions)
 - Create responsive UI with Tailwind CSS
 - Implement complete features: auth, dashboards, CRUD, payments, etc.
 - Debug and fix code issues
 - Install dependencies via npm
 - Write production-ready, clean, maintainable code
 
 **Current Project:** ${projectName}
 
 **File Structure:**
 ${fileStructure}
 ${currentFileContext}
 
 **Response Format:**
 When creating or modifying files, use this JSON format in your response:
 \`\`\`json
 {
   "thinking": "Your analysis of the task",
   "actions": [
     {
       "type": "create|modify|delete|install|configure",
       "target": "file path or package name",
       "description": "What this action does",
       "code": "// Full file content for create/modify actions"
     }
   ],
   "summary": "Brief summary of what was done"
 }
 \`\`\`
 
 **Firebase Integration:**
 Always use Firebase for backend. Include proper error handling, loading states, and TypeScript types.
 
 Be thorough and create complete, working code. Don't use placeholders - implement full functionality.`;
 
       // Call AI
        // Call AI - invoke returns data directly (not a Response object)
        const { data: rawData, error: streamError } = await supabase.functions.invoke('chat', {
          body: {
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.filter(m => m.role !== "system").map(m => ({
                role: m.role === "agent" ? "assistant" : m.role,
                content: m.content
              })),
              { role: "user", content: input }
            ]
          }
        });
        
        if (streamError) {
          throw new Error(streamError.message || "Failed to get AI response");
        }
        
        // Handle response - rawData might be a string (SSE), object, or Response-like
        let aiContent = "";
        
        // If rawData is a Response object, read it as text first
        let streamData = rawData;
        if (rawData && typeof rawData === 'object' && typeof rawData.text === 'function') {
          try {
            streamData = await rawData.text();
          } catch (e) {
            console.error('[AutonomousAgent] Failed to read response:', e);
            streamData = "";
          }
        }
        
        if (typeof streamData === "string" && streamData.length > 0) {
          // Parse SSE format
          const lines = streamData.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
                if (content) aiContent += content;
              } catch {
                // Skip invalid JSON
              }
            }
          }
          // If no SSE content was parsed, use the raw string
          if (!aiContent && streamData.trim()) {
            aiContent = streamData;
          }
        } else if (streamData?.choices?.[0]?.message?.content) {
          aiContent = streamData.choices[0].message.content;
        } else if (streamData?.text) {
          // Ensure text is a string, not a function
          aiContent = typeof streamData.text === 'string' ? streamData.text : "";
        } else if (streamData?.generatedText) {
          aiContent = streamData.generatedText;
        }
        
        if (!aiContent) {
          aiContent = "I couldn't process that request. Please try again.";
        }
       
       // Parse response for actions
       let parsedActions: AgentAction[] = [];
       let thinking = "";
       let summary = aiContent;
       
       try {
         // Try to extract JSON from response
         const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/);
         if (jsonMatch) {
           const parsed = JSON.parse(jsonMatch[1]);
           thinking = parsed.thinking || "";
           summary = parsed.summary || aiContent.replace(jsonMatch[0], "").trim();
           
           if (parsed.actions) {
             parsedActions = parsed.actions.map((a: any, idx: number) => ({
               id: `action-${idx}`,
               type: a.type,
               target: a.target,
               description: a.description,
               status: "pending" as const,
               code: a.code
             }));
           }
         }
       } catch (e) {
         // If parsing fails, just use the raw response
         console.log("Could not parse structured response");
       }
       
       // Show thinking
       if (thinking) {
         setThinkingText(thinking);
         await new Promise(r => setTimeout(r, 1000));
       }
       
       // Execute actions
       if (parsedActions.length > 0) {
         setCurrentActions(parsedActions);
         setThinkingText("Executing actions...");
         
         for (let i = 0; i < parsedActions.length; i++) {
           const action = parsedActions[i];
           
           // Update status to running
           setCurrentActions(prev => prev.map(a => 
             a.id === action.id ? { ...a, status: "running" as const } : a
           ));
           
           setThinkingText(`Executing: ${action.description}`);
           
           try {
             const output = await executeAction(action);
             
             // Update status to completed
             setCurrentActions(prev => prev.map(a => 
               a.id === action.id ? { ...a, status: "completed" as const, output } : a
             ));
             
             await new Promise(r => setTimeout(r, 300));
           } catch (e) {
             setCurrentActions(prev => prev.map(a => 
               a.id === action.id ? { ...a, status: "failed" as const, output: String(e) } : a
             ));
           }
         }
       }
       
       // Add agent response
       const agentMessage: AgentMessage = {
         id: crypto.randomUUID(),
         role: "agent",
         content: summary,
         timestamp: new Date(),
         actions: parsedActions,
         thinking
       };
       
       setMessages(prev => [...prev, agentMessage]);
       setCurrentActions([]);
       
     } catch (error) {
       console.error("Agent error:", error);
       setMessages(prev => [...prev, {
         id: crypto.randomUUID(),
         role: "agent",
         content: "Sorry, I encountered an error. Please try again.",
         timestamp: new Date()
       }]);
     } finally {
       setIsProcessing(false);
       setThinkingText("");
     }
   };
   
   // Quick actions
   const quickActions = [
     { label: "Build SaaS", prompt: "Build a complete SaaS application with user authentication, dashboard, and subscription billing using Firebase" },
     { label: "Add Auth", prompt: "Add Firebase authentication with email/password and Google sign-in to this project" },
     { label: "Create API", prompt: "Create a REST API with CRUD operations using Firebase Cloud Functions" },
     { label: "Fix Bugs", prompt: "Analyze my code and fix any bugs or issues you find" },
     { label: "Add Database", prompt: "Set up Firestore database with proper collections and security rules" },
     { label: "Deploy", prompt: "Help me deploy this application to Firebase Hosting" }
   ];
   
   // Use template
   const handleUseTemplate = (templateKey: string) => {
     const template = PROJECT_TEMPLATES[templateKey];
     if (template) {
       setInput(`Build a ${template.name}: ${template.description}. Use ${template.stack.join(", ")} as the tech stack. Set up Firebase as the backend and make it production-ready.`);
       setActiveTab("chat");
     }
   };
   
   return (
     <div className="h-full flex flex-col bg-muted/10">
       {/* Header */}
       <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
             <Bot className="h-4 w-4 text-white" />
           </div>
           <div>
             <h3 className="font-semibold text-sm">Shadow Agent</h3>
             <p className="text-[10px] text-muted-foreground">Autonomous Coding AI</p>
           </div>
         </div>
         
         <div className="flex items-center gap-1">
           <Badge variant="outline" className="gap-1 text-[10px]">
             <Flame className="h-3 w-3 text-orange-500" />
             Firebase
           </Badge>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setShowThinking(!showThinking)}
             className="h-7 w-7 p-0"
           >
             {showThinking ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
           </Button>
         </div>
       </div>
       
       {/* Tabs */}
       <div className="border-b border-border">
         <div className="flex">
           {[
             { id: "chat", label: "Chat", icon: Bot },
             { id: "actions", label: "Actions", icon: Zap },
             { id: "templates", label: "Templates", icon: Rocket }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "flex-1 py-2 flex items-center justify-center gap-1.5 text-xs transition-colors",
                 activeTab === tab.id 
                   ? "text-primary border-b-2 border-primary bg-accent/30" 
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <tab.icon className="h-3.5 w-3.5" />
               {tab.label}
             </button>
           ))}
         </div>
       </div>
       
       {/* Content */}
       <div className="flex-1 overflow-hidden">
         {activeTab === "chat" && (
           <div className="h-full flex flex-col">
             {/* Messages */}
             <ScrollArea className="flex-1 p-3" ref={scrollRef}>
               <div className="space-y-4">
                 {messages.map(msg => (
                   <div
                     key={msg.id}
                     className={cn(
                       "rounded-lg p-3 text-sm",
                       msg.role === "user" && "bg-primary/10 ml-8",
                       msg.role === "agent" && "bg-muted/50 mr-4",
                       msg.role === "system" && "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20"
                     )}
                   >
                     {msg.role === "agent" && msg.thinking && showThinking && (
                       <div className="mb-2 p-2 bg-muted rounded text-xs text-muted-foreground italic">
                         💭 {msg.thinking}
                       </div>
                     )}
                     
                     <div className="prose prose-sm dark:prose-invert max-w-none">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                         {typeof msg.content === 'string' ? msg.content : String(msg.content || '')}
                       </ReactMarkdown>
                     </div>
                     
                     {msg.actions && msg.actions.length > 0 && (
                       <div className="mt-3 space-y-1.5">
                         {msg.actions.map(action => (
                           <div
                             key={action.id}
                             className={cn(
                               "flex items-center gap-2 p-2 rounded text-xs",
                               action.status === "completed" && "bg-green-500/10 text-green-600",
                               action.status === "failed" && "bg-red-500/10 text-red-600",
                               action.status === "pending" && "bg-muted"
                             )}
                           >
                             {action.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                             {action.status === "failed" && <AlertCircle className="h-3.5 w-3.5" />}
                             {action.status === "pending" && <ChevronRight className="h-3.5 w-3.5" />}
                             <span className="flex-1">{action.description}</span>
                             <Badge variant="outline" className="text-[10px]">{action.type}</Badge>
                           </div>
                         ))}
                       </div>
                     )}
                     
                     <p className="text-[10px] text-muted-foreground mt-2">
                       {msg.timestamp.toLocaleTimeString()}
                     </p>
                   </div>
                 ))}
                 
                 {/* Processing indicator */}
                 {isProcessing && (
                   <div className="bg-muted/50 rounded-lg p-3 mr-4">
                     <div className="flex items-center gap-2 text-sm">
                       <Loader2 className="h-4 w-4 animate-spin text-primary" />
                       <span className="text-muted-foreground">{thinkingText || "Processing..."}</span>
                     </div>
                     
                     {currentActions.length > 0 && (
                       <div className="mt-3 space-y-1.5">
                         {currentActions.map(action => (
                           <div
                             key={action.id}
                             className={cn(
                               "flex items-center gap-2 p-2 rounded text-xs",
                               action.status === "running" && "bg-blue-500/10 text-blue-600",
                               action.status === "completed" && "bg-green-500/10 text-green-600",
                               action.status === "failed" && "bg-red-500/10 text-red-600",
                               action.status === "pending" && "bg-muted text-muted-foreground"
                             )}
                           >
                             {action.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                             {action.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                             {action.status === "failed" && <AlertCircle className="h-3.5 w-3.5" />}
                             {action.status === "pending" && <ChevronRight className="h-3.5 w-3.5" />}
                             <span className="flex-1">{action.description}</span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </ScrollArea>
             
             {/* Quick Actions */}
             <div className="px-3 py-2 border-t border-border flex gap-1.5 overflow-x-auto">
               {quickActions.map((action, idx) => (
                 <Button
                   key={idx}
                   variant="outline"
                   size="sm"
                   onClick={() => setInput(action.prompt)}
                   className="h-7 text-xs whitespace-nowrap shrink-0"
                 >
                   {action.label}
                 </Button>
               ))}
             </div>
             
             {/* Input */}
             <div className="p-3 border-t border-border">
               <div className="flex gap-2">
                 <Textarea
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter" && !e.shiftKey) {
                       e.preventDefault();
                       processMessage();
                     }
                   }}
                   placeholder="Describe what you want to build..."
                   className="min-h-[60px] resize-none text-sm"
                   disabled={isProcessing}
                 />
                 <Button
                   onClick={processMessage}
                   disabled={!input.trim() || isProcessing}
                   className="h-auto px-4"
                 >
                   {isProcessing ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Send className="h-4 w-4" />
                   )}
                 </Button>
               </div>
             </div>
           </div>
         )}
         
         {activeTab === "actions" && (
           <ScrollArea className="h-full p-4">
             <div className="space-y-4">
               <div className="text-center py-8 text-muted-foreground">
                 <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                 <p className="text-sm font-medium">Action History</p>
                 <p className="text-xs mt-1">Actions executed by the agent will appear here</p>
               </div>
               
               {messages
                 .filter(m => m.actions && m.actions.length > 0)
                 .map(msg => (
                   <div key={msg.id} className="space-y-2">
                     <p className="text-xs text-muted-foreground">
                       {msg.timestamp.toLocaleString()}
                     </p>
                     {msg.actions?.map(action => (
                       <div
                         key={action.id}
                         className="p-3 bg-muted/30 rounded-lg border border-border"
                       >
                         <div className="flex items-center gap-2 mb-2">
                           {action.status === "completed" && (
                             <CheckCircle2 className="h-4 w-4 text-green-500" />
                           )}
                           {action.status === "failed" && (
                             <AlertCircle className="h-4 w-4 text-red-500" />
                           )}
                           <span className="font-medium text-sm">{action.description}</span>
                           <Badge variant="outline" className="ml-auto text-[10px]">
                             {action.type}
                           </Badge>
                         </div>
                         <p className="text-xs text-muted-foreground">{action.target}</p>
                         {action.output && (
                           <p className="text-xs mt-2 text-green-600">{action.output}</p>
                         )}
                       </div>
                     ))}
                   </div>
                 ))}
             </div>
           </ScrollArea>
         )}
         
         {activeTab === "templates" && (
           <ScrollArea className="h-full p-4">
             <div className="space-y-3">
               <p className="text-sm font-medium mb-4">Project Templates</p>
               
               {Object.entries(PROJECT_TEMPLATES).map(([key, template]) => (
                 <button
                   key={key}
                   onClick={() => handleUseTemplate(key)}
                   className="w-full p-4 bg-muted/30 hover:bg-accent/50 rounded-lg border border-border text-left transition-colors"
                 >
                   <div className="flex items-center gap-3 mb-2">
                     {key === "saas" && <Rocket className="h-5 w-5 text-violet-500" />}
                     {key === "ecommerce" && <Globe className="h-5 w-5 text-blue-500" />}
                     {key === "dashboard" && <Database className="h-5 w-5 text-green-500" />}
                     {key === "blog" && <FileCode className="h-5 w-5 text-orange-500" />}
                     {key === "api" && <Code className="h-5 w-5 text-cyan-500" />}
                     <span className="font-medium">{template.name}</span>
                   </div>
                   <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                   <div className="flex flex-wrap gap-1">
                     {template.stack.map(tech => (
                       <Badge key={tech} variant="secondary" className="text-[10px]">
                         {tech}
                       </Badge>
                     ))}
                   </div>
                 </button>
               ))}
               
               {/* Firebase Setup Card */}
               <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg border border-orange-500/20">
                 <div className="flex items-center gap-2 mb-2">
                   <Flame className="h-5 w-5 text-orange-500" />
                   <span className="font-medium">Firebase Backend</span>
                 </div>
                 <p className="text-xs text-muted-foreground mb-3">
                   All projects use Firebase for authentication, database, storage, and hosting.
                 </p>
                 <div className="grid grid-cols-2 gap-2 text-xs">
                   <div className="flex items-center gap-1.5">
                     <CheckCircle2 className="h-3 w-3 text-green-500" />
                     <span>Authentication</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <CheckCircle2 className="h-3 w-3 text-green-500" />
                     <span>Firestore DB</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <CheckCircle2 className="h-3 w-3 text-green-500" />
                     <span>Cloud Storage</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <CheckCircle2 className="h-3 w-3 text-green-500" />
                     <span>Cloud Functions</span>
                   </div>
                 </div>
               </div>
             </div>
           </ScrollArea>
         )}
       </div>
     </div>
   );
 };