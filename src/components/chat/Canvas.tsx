import { useState, useEffect, useCallback, useRef } from "react";
import { 
  X, Maximize2, Minimize2, Copy, Check, Download, Undo2, Redo2, 
  Type, Code2, FileText, Save, Wand2, MessageSquare, ChevronDown,
  Bold, Italic, List, ListOrdered, Link, Image, Quote, Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight, Table, Sparkles, Play, Eye, EyeOff,
  PanelLeftClose, PanelLeft, RotateCcw, Palette, Zap, Settings, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CanvasProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  initialType?: "document" | "code";
  initialLanguage?: string;
  onSave?: (content: string, type: "document" | "code") => void;
  onAIAssist?: (prompt: string, content: string) => Promise<string>;
}

interface HistoryState {
  content: string;
  timestamp: number;
}

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", ext: "js" },
  { id: "typescript", name: "TypeScript", ext: "ts" },
  { id: "python", name: "Python", ext: "py" },
  { id: "html", name: "HTML", ext: "html" },
  { id: "css", name: "CSS", ext: "css" },
  { id: "json", name: "JSON", ext: "json" },
  { id: "markdown", name: "Markdown", ext: "md" },
  { id: "sql", name: "SQL", ext: "sql" },
  { id: "rust", name: "Rust", ext: "rs" },
  { id: "go", name: "Go", ext: "go" },
];

const AI_ACTIONS = [
  { id: "improve", label: "Improve writing", icon: Sparkles },
  { id: "fix", label: "Fix grammar", icon: Wand2 },
  { id: "shorten", label: "Make shorter", icon: Type },
  { id: "expand", label: "Expand content", icon: FileText },
  { id: "simplify", label: "Simplify language", icon: AlignLeft },
  { id: "professional", label: "Make professional", icon: Quote },
];

const CODE_AI_ACTIONS = [
  { id: "optimize", label: "Optimize code", icon: Zap },
  { id: "explain", label: "Add comments", icon: MessageSquare },
  { id: "debug", label: "Find bugs", icon: Settings },
  { id: "refactor", label: "Refactor", icon: RotateCcw },
  { id: "test", label: "Generate tests", icon: Play },
  { id: "typescript", label: "Convert to TypeScript", icon: Code2 },
];

export const Canvas = ({
  isOpen,
  onClose,
  initialContent = "",
  initialType = "document",
  initialLanguage = "javascript",
  onSave,
  onAIAssist,
}: CanvasProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  // Core state
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState<"document" | "code">(initialType);
  const [language, setLanguage] = useState(initialLanguage);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMiniChat, setShowMiniChat] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ content: initialContent, timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // AI state
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedText, setSelectedText] = useState({ start: 0, end: 0, text: "" });
  
  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  useEffect(() => {
    setContent(initialContent);
    setType(initialType);
    setLanguage(initialLanguage);
    setHistory([{ content: initialContent, timestamp: Date.now() }]);
    setHistoryIndex(0);
  }, [initialContent, initialType, initialLanguage]);

  // Add to history with debounce
  const addToHistory = useCallback((newContent: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ content: newContent, timestamp: Date.now() });
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Debounce history updates
    const timeoutId = setTimeout(() => addToHistory(newContent), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setContent(history[historyIndex - 1].content);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setContent(history[historyIndex + 1].content);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = type === "code" 
      ? LANGUAGES.find(l => l.id === language)?.ext || "txt"
      : "md";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canvas-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSave?.(content, type);
    toast({ title: "Saved successfully" });
  };

  const handleTextSelection = () => {
    const editor = editorRef.current;
    if (editor) {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const text = content.substring(start, end);
      setSelectedText({ start, end, text });
    }
  };

  const handleAIAction = async (actionId: string) => {
    if (!onAIAssist) {
      toast({ title: "AI assist not available", variant: "destructive" });
      return;
    }

    setIsAIProcessing(true);
    try {
      const textToProcess = selectedText.text || content;
      const prompt = type === "code" 
        ? `${actionId} this ${language} code:\n\n${textToProcess}`
        : `${actionId} this text:\n\n${textToProcess}`;
      
      const result = await onAIAssist(prompt, textToProcess);
      
      if (selectedText.text) {
        // Replace selected text
        const newContent = content.substring(0, selectedText.start) + result + content.substring(selectedText.end);
        handleContentChange(newContent);
      } else {
        handleContentChange(result);
      }
      
      toast({ title: "AI applied successfully" });
    } catch (error) {
      toast({ title: "AI assist failed", variant: "destructive" });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleCustomAIPrompt = async () => {
    if (!aiPrompt.trim() || !onAIAssist) return;
    
    setIsAIProcessing(true);
    try {
      const textToProcess = selectedText.text || content;
      const result = await onAIAssist(`${aiPrompt}\n\nContent:\n${textToProcess}`, textToProcess);
      
      if (selectedText.text) {
        const newContent = content.substring(0, selectedText.start) + result + content.substring(selectedText.end);
        handleContentChange(newContent);
      } else {
        handleContentChange(result);
      }
      
      setAiPrompt("");
      toast({ title: "AI applied successfully" });
    } catch (error) {
      toast({ title: "AI assist failed", variant: "destructive" });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    handleContentChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  // Markdown toolbar actions
  const markdownActions = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ") },
    { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: Code2, label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: Table, label: "Table", action: () => insertMarkdown("\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n") },
  ];

  if (!isOpen) return null;

  const currentActions = type === "code" ? CODE_AI_ACTIONS : AI_ACTIONS;

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "fixed z-50 bg-background border border-border rounded-lg shadow-2xl flex flex-col transition-all duration-300",
          isExpanded 
            ? "inset-4" 
            : "right-4 top-16 bottom-4 w-[600px] max-w-[calc(100vw-2rem)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Tabs value={type} onValueChange={(v) => setType(v as "document" | "code")}>
              <TabsList className="h-8">
                <TabsTrigger value="document" className="h-7 px-3 text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Document
                </TabsTrigger>
                <TabsTrigger value="code" className="h-7 px-3 text-xs gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  Code
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {type === "code" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                    {LANGUAGES.find(l => l.id === language)?.name || "Select"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {LANGUAGES.map(lang => (
                    <DropdownMenuItem 
                      key={lang.id} 
                      onClick={() => setLanguage(lang.id)}
                      className={cn(language === lang.id && "bg-accent")}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleUndo} disabled={historyIndex <= 0} className="h-7 w-7 p-0">
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="h-7 w-7 p-0">
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-4 bg-border mx-1" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 w-7 p-0">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleSave} className="h-7 w-7 p-0">
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-4 bg-border mx-1" />
            
            {type === "document" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPreview(!showPreview)} 
                    className={cn("h-7 w-7 p-0", showPreview && "bg-accent")}
                  >
                    {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Preview</TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMiniChat(!showMiniChat)} 
                  className={cn("h-7 w-7 p-0", showMiniChat && "bg-accent")}
                >
                  {showMiniChat ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle AI Panel</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 w-7 p-0">
                  {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isExpanded ? "Minimize" : "Maximize"}</TooltipContent>
            </Tooltip>
            
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Toolbar for Documents */}
        {type === "document" && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/10 flex-wrap">
            {markdownActions.map((action, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={action.action} className="h-7 w-7 p-0">
                    <action.icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{action.label}</TooltipContent>
              </Tooltip>
            ))}
            
            <div className="w-px h-4 bg-border mx-2" />
            
            {/* AI Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1.5" disabled={isAIProcessing}>
                  <Sparkles className={cn("h-3.5 w-3.5", isAIProcessing && "animate-pulse")} />
                  AI Assist
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {currentActions.map(action => (
                  <DropdownMenuItem key={action.id} onClick={() => handleAIAction(action.id)}>
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className={cn(
            "flex-1 flex flex-col",
            showPreview && type === "document" && "w-1/2"
          )}>
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleTextSelection}
              className={cn(
                "flex-1 p-4 resize-none focus:outline-none bg-background",
                type === "code" ? "font-mono text-sm" : "text-sm leading-relaxed"
              )}
              placeholder={type === "code" ? "// Start coding..." : "Start writing..."}
              spellCheck={type === "document"}
            />
            
            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border text-xs text-muted-foreground bg-muted/10">
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                {type === "code" && <span className="uppercase">{language}</span>}
              </div>
              <div className="flex items-center gap-2">
                {selectedText.text && <span>{selectedText.text.length} selected</span>}
                <span>Ln {content.substring(0, editorRef.current?.selectionStart || 0).split('\n').length}</span>
              </div>
            </div>
          </div>

          {/* Preview (Document only) */}
          {showPreview && type === "document" && (
            <div className="w-1/2 border-l border-border overflow-auto p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {/* Basic markdown preview - in production use react-markdown */}
                <div className="whitespace-pre-wrap">
                  {content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-3 mb-2">{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-2 mb-1">{line.slice(4)}</h3>;
                    if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.slice(2)}</li>;
                    if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground">{line.slice(2)}</blockquote>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="my-1">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Mini AI Chat Panel */}
          {showMiniChat && (
            <div className="w-64 border-l border-border flex flex-col bg-muted/5">
              <div className="p-3 border-b border-border">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI Assistant
                </h4>
              </div>
              
              <div className="flex-1 overflow-auto p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {selectedText.text 
                    ? `Selected: "${selectedText.text.substring(0, 50)}${selectedText.text.length > 50 ? '...' : ''}"`
                    : "Select text or use AI actions on the full content."
                  }
                </p>
                
                <div className="space-y-1">
                  {currentActions.map(action => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAIAction(action.id)}
                      disabled={isAIProcessing}
                      className="w-full justify-start h-8 text-xs gap-2"
                    >
                      <action.icon className="h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Custom instruction..."
                    className="flex-1 text-xs px-2 py-1.5 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomAIPrompt()}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleCustomAIPrompt}
                    disabled={!aiPrompt.trim() || isAIProcessing}
                    className="h-7 px-2"
                  >
                    <Wand2 className={cn("h-3.5 w-3.5", isAIProcessing && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Canvas;
