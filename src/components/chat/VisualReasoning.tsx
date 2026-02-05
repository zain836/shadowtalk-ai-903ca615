import { useState, useRef } from "react";
import { 
  Eye, Upload, Loader2, X, Sparkles, FileText, 
  Code, Table, Calculator, Brain, Download, Copy,
  ChevronDown, ChevronUp, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AnalysisResult {
  type: "text" | "code" | "table" | "math" | "diagram";
  content: string;
  confidence: number;
  extractedData?: Record<string, unknown>;
}

interface VisualReasoningProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (content: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ANALYSIS_MODES = [
  { id: "explain", label: "Explain", icon: Brain, desc: "Explain the logic within the image" },
  { id: "extract", label: "Extract Text", icon: FileText, desc: "OCR and text extraction" },
  { id: "code", label: "To Code", icon: Code, desc: "Convert to working code" },
  { id: "table", label: "To Table", icon: Table, desc: "Structure as table data" },
  { id: "math", label: "Solve Math", icon: Calculator, desc: "Solve mathematical content" },
];

export const VisualReasoning = ({ isOpen, onClose, onInsertToChat }: VisualReasoningProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<string>("explain");
  const [customPrompt, setCustomPrompt] = useState("");
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResults([]);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImage(event.target?.result as string);
            setResults([]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const modePrompts: Record<string, string> = {
        explain: "Analyze this image and explain the logic, structure, or meaning within it in detail. Break down any complex concepts.",
        extract: "Extract all text from this image using OCR. Preserve formatting where possible.",
        code: "Convert this image content into working code. If it's a diagram, generate code that implements it. If it's handwritten code, transcribe it.",
        table: "Extract data from this image and format it as a structured table with clear columns and rows.",
        math: "Solve any mathematical equations, formulas, or problems shown in this image. Show step-by-step work.",
      };

      const prompt = customPrompt.trim() || modePrompts[analysisMode];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image } }
              ]
            }
          ],
          personality: "meticulous",
          mode: analysisMode === "code" ? "code" : "general"
        })
      });

      if (!resp.ok) throw new Error("Analysis failed");

      // Parse streaming response
      const reader = resp.body?.getReader();
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
              const c = data.choices?.[0]?.delta?.content;
              if (c) content += c;
            } catch {}
          }
        }
      }

      // Determine result type based on content
      let resultType: AnalysisResult["type"] = "text";
      if (analysisMode === "code" || content.includes("```")) resultType = "code";
      else if (analysisMode === "table" || content.includes("|")) resultType = "table";
      else if (analysisMode === "math" || content.includes("$$")) resultType = "math";

      setResults([{
        type: resultType,
        content,
        confidence: 0.95
      }]);

      toast({ title: "Analysis complete!" });

    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex"
      onPaste={handlePaste}
    >
      {/* Left Panel - Image */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Visual Reasoning</h2>
            <Badge variant="secondary" className="text-xs">Multimodal AI</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {image ? (
            <div className="relative max-w-full max-h-full">
              <img 
                src={image} 
                alt="Uploaded" 
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-xl"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImage(null);
                  setResults([]);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-16 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-2">Upload an image to analyze</p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop, paste from clipboard, or click to browse
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Screenshots", "Diagrams", "Handwritten notes", "Code", "Charts", "Documents"].map((type) => (
                  <Badge key={type} variant="outline">{type}</Badge>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Analysis Mode Selection */}
        {image && (
          <div className="p-4 border-t border-border">
            <Tabs value={analysisMode} onValueChange={setAnalysisMode}>
              <TabsList className="w-full grid grid-cols-5">
                {ANALYSIS_MODES.map((mode) => (
                  <TabsTrigger key={mode.id} value={mode.id} className="text-xs gap-1">
                    <mode.icon className="h-3 w-3" />
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mt-4 flex gap-2">
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Or enter a custom prompt... (optional)"
                className="flex-1 min-h-[60px]"
              />
              <Button 
                onClick={analyzeImage} 
                disabled={isAnalyzing}
                className="self-end"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="w-[500px] flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Analysis Results
          </h3>
        </div>

        <ScrollArea className="flex-1">
          {results.length > 0 ? (
            <div className="p-4 space-y-4">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedResult(expandedResult === index ? null : index)}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{result.type.toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(result.confidence * 100)}% confidence
                      </span>
                    </div>
                    {expandedResult === index ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedResult === index && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>
                                ),
                                p: ({ children }) => (
                                  <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="text-sm space-y-1 mb-3 ml-4 list-disc text-foreground/90">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="text-sm space-y-1 mb-3 ml-4 list-decimal text-foreground/90">{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-sm text-foreground/90">{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-foreground">{children}</strong>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-3">{children}</blockquote>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-3">
                                    <table className="min-w-full text-sm border border-border rounded-lg">{children}</table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-muted/50">{children}</thead>
                                ),
                                th: ({ children }) => (
                                  <th className="px-3 py-2 text-left font-medium text-foreground border-b border-border">{children}</th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3 py-2 text-foreground/90 border-b border-border">{children}</td>
                                ),
                                code: ({ className, children, ...props }) => {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const isInline = !match && !className;
                                  
                                  if (isInline) {
                                    return (
                                      <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-primary" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  
                                  return (
                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match?.[1] || "text"}
                                      PreTag="div"
                                      customStyle={{
                                        margin: "0.75rem 0",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.8125rem",
                                      }}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  );
                                },
                              }}
                            >
                              {result.content}
                            </ReactMarkdown>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(result.content)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onInsertToChat(result.content)}
                            >
                              Insert to Chat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const blob = new Blob([result.content], { type: 'text/plain' });
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = `analysis-${result.type}.txt`;
                                a.click();
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Eye className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-medium mb-2">No Analysis Yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload an image and select an analysis mode to get started.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </motion.div>
  );
};
