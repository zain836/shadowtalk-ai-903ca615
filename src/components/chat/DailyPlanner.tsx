import { stringifyChatBody } from "@/lib/chatRequest";
 import { useState, useEffect } from "react";
 import { 
   Calendar, Clock, Plus, Trash2, Check, AlertCircle,
   Sun, Moon, Coffee, Briefcase, Home, Dumbbell,
   Loader2, Sparkles, X, GripVertical, Save
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Switch } from "@/components/ui/switch";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { motion, AnimatePresence, Reorder } from "framer-motion";
 
 interface DailyPlannerProps {
   isOpen: boolean;
   onClose: () => void;
   onPlanGenerated?: (plan: string) => void;
 }
 
 interface Task {
   id: string;
   time: string;
   title: string;
   duration: number; // minutes
   category: "work" | "personal" | "health" | "break";
   completed: boolean;
   priority: "high" | "medium" | "low";
 }
 
 const CATEGORY_ICONS = {
   work: Briefcase,
   personal: Home,
   health: Dumbbell,
   break: Coffee,
 };
 
 const CATEGORY_COLORS = {
   work: "bg-blue-500/10 text-blue-500 border-blue-500/30",
   personal: "bg-purple-500/10 text-purple-500 border-purple-500/30",
   health: "bg-green-500/10 text-green-500 border-green-500/30",
   break: "bg-orange-500/10 text-orange-500 border-orange-500/30",
 };
 
 const PRIORITY_COLORS = {
   high: "bg-red-500",
   medium: "bg-yellow-500",
   low: "bg-green-500",
 };
 
 const STORAGE_KEY = "shadowtalk_daily_plan";
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
 
 export const DailyPlanner = ({ isOpen, onClose, onPlanGenerated }: DailyPlannerProps) => {
   const { toast } = useToast();
   const [tasks, setTasks] = useState<Task[]>([]);
   const [newTask, setNewTask] = useState("");
   const [isGenerating, setIsGenerating] = useState(false);
   const [showAIAssist, setShowAIAssist] = useState(false);
   const [aiPrompt, setAiPrompt] = useState("");
   const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
   }));
 
   // Load saved plan from localStorage
   useEffect(() => {
     const saved = localStorage.getItem(STORAGE_KEY);
     if (saved) {
       try {
         const { date, tasks: savedTasks } = JSON.parse(saved);
         const today = new Date().toDateString();
         if (date === today) {
           setTasks(savedTasks);
         }
       } catch {}
     }
   }, []);
 
   // Save plan to localStorage
   useEffect(() => {
     if (tasks.length > 0) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify({
         date: new Date().toDateString(),
         tasks
       }));
     }
   }, [tasks]);
 
   const addTask = () => {
     if (!newTask.trim()) return;
     
     const task: Task = {
       id: crypto.randomUUID(),
       time: "09:00",
       title: newTask,
       duration: 30,
       category: "work",
       completed: false,
       priority: "medium"
     };
     
     setTasks(prev => [...prev, task]);
     setNewTask("");
   };
 
   const updateTask = (id: string, updates: Partial<Task>) => {
     setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
   };
 
   const deleteTask = (id: string) => {
     setTasks(prev => prev.filter(t => t.id !== id));
   };
 
   const toggleComplete = (id: string) => {
     setTasks(prev => prev.map(t => 
       t.id === id ? { ...t, completed: !t.completed } : t
     ));
   };
 
   const generateAIPlan = async () => {
     if (!aiPrompt.trim()) {
       toast({ title: "Please describe your day", variant: "destructive" });
       return;
     }
 
     setIsGenerating(true);
 
     try {
       const { data: { session } } = await supabase.auth.getSession();
       
       const response = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
         },
         body: stringifyChatBody({
           messages: [{ 
             role: "user", 
             content: `Create a daily schedule for: ${aiPrompt}
 
 Return ONLY a JSON array of tasks with this exact format (no other text):
 [{"time":"09:00","title":"Task name","duration":30,"category":"work","priority":"medium"}]
 
 Categories: work, personal, health, break
 Priorities: high, medium, low
 Use 24-hour format for time. Duration in minutes.
 Include realistic breaks and transitions.`
           }],
           personality: "professional",
           mode: "general"
         })
       });
 
       if (!response.ok) throw new Error("Generation failed");
 
       const reader = response.body?.getReader();
       const decoder = new TextDecoder();
       let content = "";
 
       while (reader) {
         const { done, value } = await reader.read();
         if (done) break;
         
         const chunk = decoder.decode(value, { stream: true });
         const lines = chunk.split('\n');
         
         for (const line of lines) {
           if (line.startsWith('data: ') && line !== 'data: [DONE]') {
             try {
               const data = JSON.parse(line.slice(6));
               const text = data.choices?.[0]?.delta?.content;
               if (text) content += text;
             } catch {}
           }
         }
       }
 
       // Parse JSON from response
       const jsonMatch = content.match(/\[[\s\S]*\]/);
       if (jsonMatch) {
         const parsedTasks = JSON.parse(jsonMatch[0]);
         const newTasks: Task[] = parsedTasks.map((t: Partial<Task>) => ({
           id: crypto.randomUUID(),
           time: t.time || "09:00",
           title: t.title || "Task",
           duration: t.duration || 30,
           category: t.category || "work",
           completed: false,
           priority: t.priority || "medium"
         }));
         
         setTasks(newTasks);
         setShowAIAssist(false);
         setAiPrompt("");
         toast({ title: "Plan Generated", description: `Created ${newTasks.length} tasks for your day!` });
         
         // Send plan to chat
         const planText = newTasks.map(t => `${t.time} - ${t.title} (${t.duration}min)`).join('\n');
         onPlanGenerated?.(`📅 **Daily Plan Generated**\n\n${planText}`);
       }
 
     } catch (error) {
       console.error("Plan generation error:", error);
       toast({ 
         title: "Generation Failed", 
         description: "Could not generate plan. Please try again.",
         variant: "destructive" 
       });
     } finally {
       setIsGenerating(false);
     }
   };
 
   const getTimeOfDay = () => {
     const hour = new Date().getHours();
     if (hour < 12) return { icon: Sun, label: "Good Morning" };
     if (hour < 17) return { icon: Sun, label: "Good Afternoon" };
     return { icon: Moon, label: "Good Evening" };
   };
 
   const timeOfDay = getTimeOfDay();
   const completedCount = tasks.filter(t => t.completed).length;
   const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
 
   if (!isOpen) return null;
 
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
     >
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
             <Calendar className="h-5 w-5 text-primary" />
           </div>
           <div>
             <h2 className="font-semibold flex items-center gap-2">
               Daily Planner
               <Badge variant="secondary" className="text-xs">AI Powered</Badge>
             </h2>
             <p className="text-sm text-muted-foreground">{currentDate}</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setShowAIAssist(!showAIAssist)}>
             <Sparkles className="h-4 w-4 mr-2" />
             AI Plan
           </Button>
           <Button variant="ghost" size="icon" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       <div className="flex-1 flex overflow-hidden">
         {/* Left Panel - Greeting & Stats */}
         <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto">
           {/* Greeting */}
           <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
             <div className="flex items-center gap-2 mb-2">
               <timeOfDay.icon className="h-5 w-5 text-primary" />
               <span className="font-medium">{timeOfDay.label}</span>
             </div>
             <p className="text-sm text-muted-foreground">
               {tasks.length === 0 
                 ? "Ready to plan your day?" 
                 : `${completedCount} of ${tasks.length} tasks completed`}
             </p>
             {tasks.length > 0 && (
               <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-300"
                   style={{ width: `${progress}%` }}
                 />
               </div>
             )}
           </div>
 
           {/* AI Assist Panel */}
           <AnimatePresence>
             {showAIAssist && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="space-y-3 p-4 rounded-lg border border-border bg-muted/30"
               >
                 <p className="text-sm font-medium">Describe your ideal day:</p>
                 <Input
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   placeholder="e.g., Productive work day with exercise and breaks"
                   onKeyPress={(e) => e.key === 'Enter' && generateAIPlan()}
                 />
                 <Button 
                   onClick={generateAIPlan} 
                   disabled={isGenerating}
                   className="w-full"
                   size="sm"
                 >
                   {isGenerating ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Generating...
                     </>
                   ) : (
                     <>
                       <Sparkles className="h-4 w-4 mr-2" />
                       Generate Plan
                     </>
                   )}
                 </Button>
               </motion.div>
             )}
           </AnimatePresence>
 
           {/* Quick Add */}
           <div className="space-y-2">
             <label className="text-sm font-medium">Add Task</label>
             <div className="flex gap-2">
               <Input
                 value={newTask}
                 onChange={(e) => setNewTask(e.target.value)}
                 placeholder="Quick add a task..."
                 onKeyPress={(e) => e.key === 'Enter' && addTask()}
                 className="flex-1"
               />
               <Button size="icon" onClick={addTask}>
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
           </div>
 
           {/* Category Legend */}
           <div className="space-y-2">
             <label className="text-sm font-medium">Categories</label>
             <div className="grid grid-cols-2 gap-2">
               {(Object.entries(CATEGORY_ICONS) as [keyof typeof CATEGORY_ICONS, typeof Briefcase][]).map(([cat, Icon]) => (
                 <div key={cat} className={`flex items-center gap-2 p-2 rounded-lg border ${CATEGORY_COLORS[cat]}`}>
                   <Icon className="h-4 w-4" />
                   <span className="text-xs capitalize">{cat}</span>
                 </div>
               ))}
             </div>
           </div>
         </div>
 
         {/* Right Panel - Tasks */}
         <div className="flex-1 flex flex-col">
           <ScrollArea className="flex-1 p-4">
             {tasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                 <Calendar className="h-12 w-12 mb-4 opacity-50" />
                 <p>No tasks for today</p>
                 <p className="text-sm">Add tasks or use AI to generate a plan</p>
               </div>
             ) : (
               <Reorder.Group values={tasks} onReorder={setTasks} className="space-y-2">
                 {tasks.map((task) => {
                   const CategoryIcon = CATEGORY_ICONS[task.category];
                   return (
                     <Reorder.Item key={task.id} value={task}>
                       <motion.div
                         layout
                         className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                           task.completed 
                             ? "bg-muted/50 opacity-60" 
                             : "bg-card hover:border-primary/30"
                         }`}
                       >
                         <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                         
                         <button
                           onClick={() => toggleComplete(task.id)}
                           className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                             task.completed 
                               ? "bg-primary border-primary" 
                               : "border-muted-foreground hover:border-primary"
                           }`}
                         >
                           {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                         </button>
 
                         <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
 
                         <Input
                           value={task.time}
                           onChange={(e) => updateTask(task.id, { time: e.target.value })}
                           className="w-20 text-sm"
                         />
 
                         <Input
                           value={task.title}
                           onChange={(e) => updateTask(task.id, { title: e.target.value })}
                           className={`flex-1 ${task.completed ? "line-through" : ""}`}
                         />
 
                         <Badge variant="outline" className={CATEGORY_COLORS[task.category]}>
                           <CategoryIcon className="h-3 w-3 mr-1" />
                           {task.duration}m
                         </Badge>
 
                         <select
                           value={task.category}
                           onChange={(e) => updateTask(task.id, { category: e.target.value as Task["category"] })}
                           className="text-xs bg-transparent border rounded px-1 py-0.5"
                         >
                           <option value="work">Work</option>
                           <option value="personal">Personal</option>
                           <option value="health">Health</option>
                           <option value="break">Break</option>
                         </select>
 
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-destructive hover:text-destructive"
                           onClick={() => deleteTask(task.id)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </motion.div>
                     </Reorder.Item>
                   );
                 })}
               </Reorder.Group>
             )}
           </ScrollArea>
         </div>
       </div>
     </motion.div>
   );
 };
 
 export default DailyPlanner;