import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { 
  Play, Copy, Check, RotateCcw, Maximize2, Minimize2, 
  Terminal, X, Code, Download, Loader2, Eye, EyeOff,
  Split, Columns, ExternalLink, RefreshCw, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// =============================================================================
// LIVE CODE ARTIFACT - Claude Artifacts but BETTER
// =============================================================================
// Interactive code playground with live preview inline in chat
// Beats Claude's static artifacts with real-time execution
// =============================================================================

const Editor = lazy(() => import('@monaco-editor/react'));

interface LiveCodeArtifactProps {
  id: string;
  initialCode: string;
  language: string;
  title?: string;
  onClose?: () => void;
  embedded?: boolean;
  autoRun?: boolean;
}

const languageMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  py: "python",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  sql: "sql",
};

const getFileExtension = (lang: string): string => {
  const extensions: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py',
    html: 'html', css: 'css', json: 'json', markdown: 'md'
  };
  return extensions[lang] || 'txt';
};

export const LiveCodeArtifact = ({ 
  id,
  initialCode, 
  language, 
  title = "Code Artifact",
  onClose,
  embedded = true,
  autoRun = false
}: LiveCodeArtifactProps) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('split');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [livePreviewHtml, setLivePreviewHtml] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const normalizedLang = languageMap[language.toLowerCase()] || language.toLowerCase();
  const isPreviewable = ['html', 'javascript', 'typescript', 'css'].includes(normalizedLang);

  // Auto-run on mount if specified
  useEffect(() => {
    if (autoRun && isPreviewable) {
      handleRun();
    }
  }, [autoRun]);

  // Generate live preview for HTML/JS/CSS
  const generateLivePreview = useCallback((codeToPreview: string, lang: string) => {
    if (lang === 'html') {
      setLivePreviewHtml(codeToPreview);
    } else if (lang === 'css') {
      setLivePreviewHtml(`
        <!DOCTYPE html>
        <html>
          <head><style>${codeToPreview}</style></head>
          <body>
            <div class="preview-container">
              <h1>CSS Preview</h1>
              <p>Your styles are applied to this page.</p>
              <button>Sample Button</button>
              <div class="box">Sample Box</div>
            </div>
          </body>
        </html>
      `);
    } else if (['javascript', 'typescript'].includes(lang)) {
      // Create a sandboxed preview for JS
      setLivePreviewHtml(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: system-ui; padding: 20px; background: #1a1a2e; color: #eee; }
              .output { font-family: monospace; background: #16213e; padding: 10px; border-radius: 8px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="output" id="output"></div>
            <script>
              const output = document.getElementById('output');
              const originalConsole = { ...console };
              console.log = (...args) => {
                output.innerHTML += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
              };
              console.error = (...args) => {
                output.innerHTML += '<span style="color:#ff6b6b">❌ ' + args.join(' ') + '</span>\\n';
              };
              try {
                ${codeToPreview}
              } catch (e) {
                console.error(e.message);
              }
            </script>
          </body>
        </html>
      `);
    }
  }, []);

  // Execute code
  const handleRun = useCallback(() => {
    setIsRunning(true);
    setOutput([]);
    const startTime = performance.now();

    setTimeout(() => {
      const logs: string[] = [];
      
      if (['javascript', 'typescript'].includes(normalizedLang)) {
        // Execute JavaScript
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args: unknown[]) => logs.push(`❌ ${args.join(' ')}`),
          warn: (...args: unknown[]) => logs.push(`⚠️ ${args.join(' ')}`),
          info: (...args: unknown[]) => logs.push(`ℹ️ ${args.join(' ')}`),
        };

        try {
          const fn = new Function('console', code);
          const result = fn(mockConsole);
          if (result !== undefined) logs.push(`→ ${JSON.stringify(result, null, 2)}`);
        } catch (error) {
          logs.push(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (normalizedLang === 'html') {
        logs.push('📄 HTML rendered in preview');
      } else if (normalizedLang === 'css') {
        logs.push('🎨 CSS applied to preview');
      } else {
        logs.push(`⚠️ Direct execution for ${language} is not supported`);
        logs.push('💡 Copy the code and run locally');
      }

      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setOutput(logs);
      setIsRunning(false);
      
      // Update live preview
      if (isPreviewable) {
        generateLivePreview(code, normalizedLang);
      }
    }, 100);
  }, [code, normalizedLang, language, isPreviewable, generateLivePreview]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = getFileExtension(normalizedLang);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!" });
  };

  const openInNewTab = () => {
    if (normalizedLang === 'html') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(code);
        win.document.close();
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border shadow-lg overflow-hidden my-4",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border-primary/20",
        isExpanded && !embedded && "fixed inset-4 z-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <Badge variant="outline" className="text-xs uppercase font-mono">
            {language}
          </Badge>
          {executionTime !== null && (
            <Badge variant="secondary" className="text-xs font-mono">
              {executionTime.toFixed(1)}ms
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View mode toggles */}
          {isPreviewable && (
            <TooltipProvider>
              <div className="flex items-center border rounded-md mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('code')}
                      className="h-7 px-2 rounded-r-none"
                    >
                      <Code className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Code only</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('split')}
                      className="h-7 px-2 rounded-none border-x"
                    >
                      <Columns className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Split view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('preview')}
                      className="h-7 px-2 rounded-l-none"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview only</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}

          <Button variant="ghost" size="sm" onClick={handleRun} disabled={isRunning} className="h-7 px-2 gap-1">
            <Play className={cn("h-3 w-3", isRunning && "animate-pulse")} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCode(initialCode)} className="h-7 px-2">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2">
            <Download className="h-3 w-3" />
          </Button>
          {normalizedLang === 'html' && (
            <Button variant="ghost" size="sm" onClick={openInNewTab} className="h-7 px-2">
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          {!embedded && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 px-2">
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex",
        viewMode === 'split' ? 'flex-row' : 'flex-col',
        isExpanded ? 'h-[calc(100vh-120px)]' : 'h-[400px]'
      )}>
        {/* Editor */}
        <AnimatePresence mode="wait">
          {(viewMode === 'code' || viewMode === 'split') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "overflow-hidden",
                viewMode === 'split' ? 'w-1/2 border-r' : 'flex-1'
              )}
            >
              <Suspense fallback={
                <div className="flex items-center justify-center h-full bg-background">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }>
                <Editor
                  height="100%"
                  language={normalizedLang}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    padding: { top: 12, bottom: 12 },
                    bracketPairColorization: { enabled: true },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                  }}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview / Output */}
        <AnimatePresence mode="wait">
          {(viewMode === 'preview' || viewMode === 'split') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex flex-col",
                viewMode === 'split' ? 'w-1/2' : 'flex-1'
              )}
            >
              <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                <TabsList className="w-fit mx-3 mt-2">
                  <TabsTrigger value="preview" className="text-xs gap-1">
                    <Eye className="h-3 w-3" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="console" className="text-xs gap-1">
                    <Terminal className="h-3 w-3" />
                    Console
                    {output.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {output.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="flex-1 m-0 p-2">
                  {livePreviewHtml ? (
                    <iframe
                      srcDoc={livePreviewHtml}
                      className="w-full h-full rounded-lg border bg-white"
                      sandbox="allow-scripts"
                      title="Live Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Eye className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">Click "Run" to see preview</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="console" className="flex-1 m-0 overflow-auto bg-background/50">
                  <div className="p-4 font-mono text-sm">
                    {output.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">
                        <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Console output will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {output.map((line, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "whitespace-pre-wrap",
                              line.startsWith('❌') && 'text-destructive',
                              line.startsWith('⚠️') && 'text-yellow-500',
                              line.startsWith('→') && 'text-primary'
                            )}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Code className="h-3 w-3" />
          Live Code Artifact
        </span>
        <span>Edit code → Click Run → See instant results</span>
        <span className="ml-auto text-primary/70">Beats Claude's static artifacts ✨</span>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Extract code artifacts from AI response
// =============================================================================
export const extractCodeArtifacts = (content: string): { 
  cleanContent: string; 
  artifacts: Array<{ code: string; language: string; title: string }> 
} => {
  const artifacts: Array<{ code: string; language: string; title: string }> = [];
  let cleanContent = content;
  
  // Match code blocks with optional title comment
  const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\n)?([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const title = match[2] || `${language.toUpperCase()} Code`;
    const code = match[3].trim();
    
    // Only extract substantial code blocks
    if (code.split('\n').length >= 5 || code.length > 200) {
      artifacts.push({ code, language, title });
    }
  }
  
  return { cleanContent, artifacts };
};
