 import { useState } from "react";
 import { 
   FileText, Mail, Newspaper, FileCode, Download, 
   Copy, Loader2, Sparkles, X, Check
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { motion, AnimatePresence } from "framer-motion";
 import jsPDF from "jspdf";
 
 interface DocumentGeneratorProps {
   isOpen: boolean;
   onClose: () => void;
   onDocumentGenerated?: (content: string, type: string) => void;
   initialPrompt?: string;
   autoGenerate?: boolean;
 }
 
 type DocumentType = "article" | "email" | "report" | "proposal" | "blog" | "resume" | "letter";
 
 const DOCUMENT_TYPES: { type: DocumentType; icon: typeof FileText; label: string; description: string }[] = [
   { type: "article", icon: Newspaper, label: "Article", description: "News or blog article" },
   { type: "email", icon: Mail, label: "Email", description: "Professional email" },
   { type: "report", icon: FileText, label: "Report", description: "Business report" },
   { type: "proposal", icon: FileCode, label: "Proposal", description: "Project proposal" },
   { type: "blog", icon: Newspaper, label: "Blog Post", description: "Blog content" },
   { type: "resume", icon: FileText, label: "Resume", description: "CV/Resume" },
   { type: "letter", icon: Mail, label: "Letter", description: "Formal letter" },
 ];
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
 
 export const DocumentGenerator = ({ 
   isOpen, 
   onClose, 
   onDocumentGenerated,
   initialPrompt,
   autoGenerate 
 }: DocumentGeneratorProps) => {
   const { toast } = useToast();
   const [docType, setDocType] = useState<DocumentType>("article");
   const [topic, setTopic] = useState(initialPrompt || "");
   const [additionalContext, setAdditionalContext] = useState("");
   const [generatedContent, setGeneratedContent] = useState("");
   const [isGenerating, setIsGenerating] = useState(false);
   const [copied, setCopied] = useState(false);
 
   const getSystemPrompt = (type: DocumentType) => {
     const prompts: Record<DocumentType, string> = {
       article: "You are a professional journalist. Write a well-structured article with headline, intro, body paragraphs, and conclusion. Use engaging language and include relevant facts.",
       email: "You are a professional email writer. Write a clear, concise, and professional email. Include subject line, greeting, body, and signature.",
       report: "You are a business analyst. Write a formal business report with executive summary, findings, analysis, and recommendations. Use professional language.",
       proposal: "You are a proposal writer. Write a compelling project proposal with objectives, methodology, timeline, budget considerations, and expected outcomes.",
       blog: "You are a content creator. Write an engaging blog post with a catchy title, introduction hook, informative sections, and a call-to-action.",
       resume: "You are a career coach. Create a professional resume/CV with contact info, summary, experience, education, and skills sections. Use action verbs.",
       letter: "You are a professional writer. Write a formal letter with proper formatting, clear purpose, professional tone, and appropriate closing.",
     };
     return prompts[type];
   };
 
   const generateDocument = async () => {
     if (!topic.trim()) {
       toast({ title: "Please enter a topic", variant: "destructive" });
       return;
     }
 
     setIsGenerating(true);
     setGeneratedContent("");
 
     try {
       const { data: { session } } = await supabase.auth.getSession();
       
       const systemPrompt = getSystemPrompt(docType);
       const userPrompt = `Create a ${docType} about: ${topic}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""}`;
 
       const response = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
         },
         body: JSON.stringify({
           messages: [
             { role: "system", content: systemPrompt },
             { role: "user", content: userPrompt }
           ],
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
               if (text) {
                 content += text;
                 setGeneratedContent(content);
               }
             } catch {}
           }
         }
       }
 
       toast({ title: "Document Generated", description: `Your ${docType} is ready!` });
       onDocumentGenerated?.(content, docType);
 
     } catch (error) {
       console.error("Document generation error:", error);
       toast({ 
         title: "Generation Failed", 
         description: "Could not generate document. Please try again.",
         variant: "destructive" 
       });
     } finally {
       setIsGenerating(false);
     }
   };
 
   const copyToClipboard = async () => {
     await navigator.clipboard.writeText(generatedContent);
     setCopied(true);
     toast({ title: "Copied to clipboard" });
     setTimeout(() => setCopied(false), 2000);
   };
 
   const downloadAsPDF = () => {
     const pdf = new jsPDF();
     const pageWidth = pdf.internal.pageSize.getWidth();
     const margin = 20;
     const maxWidth = pageWidth - margin * 2;
     
     pdf.setFontSize(12);
     const lines = pdf.splitTextToSize(generatedContent, maxWidth);
     
     let y = margin;
     const lineHeight = 7;
     
     for (const line of lines) {
       if (y > pdf.internal.pageSize.getHeight() - margin) {
         pdf.addPage();
         y = margin;
       }
       pdf.text(line, margin, y);
       y += lineHeight;
     }
     
     pdf.save(`${docType}-${Date.now()}.pdf`);
     toast({ title: "PDF Downloaded" });
   };
 
   const downloadAsText = () => {
     const blob = new Blob([generatedContent], { type: "text/plain" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `${docType}-${Date.now()}.txt`;
     a.click();
     URL.revokeObjectURL(url);
     toast({ title: "Text File Downloaded" });
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
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
             <FileText className="h-5 w-5 text-primary" />
           </div>
           <div>
             <h2 className="font-semibold flex items-center gap-2">
               Document Generator
               <Badge variant="secondary" className="text-xs">AI Powered</Badge>
             </h2>
             <p className="text-sm text-muted-foreground">
               Create professional documents, articles, emails & more
             </p>
           </div>
         </div>
         <Button variant="ghost" size="icon" onClick={onClose}>
           <X className="h-5 w-5" />
         </Button>
       </div>
 
       <div className="flex-1 flex overflow-hidden">
         {/* Left Panel - Configuration */}
         <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto">
           <div className="space-y-2">
             <label className="text-sm font-medium">Document Type</label>
             <div className="grid grid-cols-2 gap-2">
               {DOCUMENT_TYPES.map((doc) => (
                 <button
                   key={doc.type}
                   onClick={() => setDocType(doc.type)}
                   className={`p-3 rounded-lg border text-left transition-all ${
                     docType === doc.type 
                       ? "border-primary bg-primary/10" 
                       : "border-border hover:border-primary/50"
                   }`}
                 >
                   <doc.icon className={`h-4 w-4 mb-1 ${docType === doc.type ? "text-primary" : "text-muted-foreground"}`} />
                   <p className="text-xs font-medium">{doc.label}</p>
                 </button>
               ))}
             </div>
           </div>
 
           <div className="space-y-2">
             <label className="text-sm font-medium">Topic / Subject</label>
             <Input
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               placeholder="What should the document be about?"
               className="w-full"
             />
           </div>
 
           <div className="space-y-2">
             <label className="text-sm font-medium">Additional Context (Optional)</label>
             <Textarea
               value={additionalContext}
               onChange={(e) => setAdditionalContext(e.target.value)}
               placeholder="Any specific requirements, tone, audience..."
               className="min-h-[100px]"
             />
           </div>
 
           <Button 
             onClick={generateDocument} 
             disabled={isGenerating || !topic.trim()}
             className="w-full"
           >
             {isGenerating ? (
               <>
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Generating...
               </>
             ) : (
               <>
                 <Sparkles className="h-4 w-4 mr-2" />
                 Generate {DOCUMENT_TYPES.find(d => d.type === docType)?.label}
               </>
             )}
           </Button>
         </div>
 
         {/* Right Panel - Output */}
         <div className="flex-1 flex flex-col">
           <div className="flex items-center justify-between p-4 border-b border-border">
             <h3 className="font-medium">Generated Content</h3>
             {generatedContent && (
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={copyToClipboard}>
                   {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                 </Button>
                 <Button variant="outline" size="sm" onClick={downloadAsText}>
                   <Download className="h-4 w-4 mr-1" />
                   .txt
                 </Button>
                 <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                   <Download className="h-4 w-4 mr-1" />
                   PDF
                 </Button>
               </div>
             )}
           </div>
 
           <ScrollArea className="flex-1 p-4">
             {generatedContent ? (
               <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                 {generatedContent}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                 <FileText className="h-12 w-12 mb-4 opacity-50" />
                 <p>Your generated document will appear here</p>
                 <p className="text-sm">Select a type and enter a topic to begin</p>
               </div>
             )}
           </ScrollArea>
         </div>
       </div>
     </motion.div>
   );
 };
 
 export default DocumentGenerator;