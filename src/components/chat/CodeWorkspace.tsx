import { useState, useCallback, lazy, Suspense, useRef, useEffect } from "react";
import {
  Play, Copy, Check, RotateCcw, Maximize2, Minimize2,
  Terminal, X, Code, Download, Loader2, Bug, Eye, 
  PanelLeft, PanelRight, Trash2, Save, FileCode, Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Editor = lazy(() => import('@monaco-editor/react'));

interface CodeWorkspaceProps {
  initialCode: string;
  language: string;
  onClose: () => void;
  onSave?: (code: string) => void;
}

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

const languageMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  html: "html",
  css: "css",
  jsx: "javascript",
  tsx: "typescript",
  json: "json",
};

const fileExtensions: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  html: 'html',
  css: 'css',
  json: 'json',
};

export const CodeWorkspace = ({
  initialCode,
  language,
  onClose,
  onSave
}: CodeWorkspaceProps) => {
  const [code, setCode] = useState(initialCode);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'console' | 'preview'>('console');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const normalizedLang = languageMap[language.toLowerCase()] || language.toLowerCase();

  const addLog = useCallback((type: ConsoleLog['type'], message: string) => {
    setConsoleLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
    setExecutionTime(null);
  }, []);

  const executeJavaScript = useCallback((codeToRun: string) => {
    clearConsole();
    const startTime = performance.now();

    const mockConsole = {
      log: (...args: unknown[]) => {
        addLog('log', args.map(a => {
          if (typeof a === 'object') return JSON.stringify(a, null, 2);
          return String(a);
        }).join(' '));
      },
      error: (...args: unknown[]) => {
        addLog('error', args.map(a => String(a)).join(' '));
      },
      warn: (...args: unknown[]) => {
        addLog('warn', args.map(a => String(a)).join(' '));
      },
      info: (...args: unknown[]) => {
        addLog('info', args.map(a => String(a)).join(' '));
      },
      clear: () => clearConsole(),
      table: (data: unknown) => {
        addLog('log', JSON.stringify(data, null, 2));
      },
    };

    try {
      const fn = new Function('console', 'setTimeout', 'setInterval', codeToRun);
      
      const mockSetTimeout = (callback: () => void, delay: number) => {
        addLog('info', `⏱️ setTimeout (${delay}ms)`);
        setTimeout(() => {
          try {
            callback();
          } catch (e) {
            addLog('error', e instanceof Error ? e.message : String(e));
          }
        }, Math.min(delay, 5000));
        return 0;
      };

      const mockSetInterval = () => {
        addLog('warn', 'setInterval disabled in sandbox');
        return 0;
      };

      const result = fn(mockConsole, mockSetTimeout, mockSetInterval);
      
      if (result !== undefined) {
        addLog('log', `→ ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
      }

      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
    } catch (error) {
      addLog('error', error instanceof Error ? error.message : 'Unknown error');
      setExecutionTime(performance.now() - startTime);
    }
  }, [addLog, clearConsole]);

  const executeHTML = useCallback((htmlCode: string) => {
    clearConsole();
    addLog('info', '📄 Rendering HTML preview...');
    
    // Create a complete HTML document if needed
    let fullHtml = htmlCode;
    if (!htmlCode.includes('<html') && !htmlCode.includes('<!DOCTYPE')) {
      fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; margin: 0; }
  </style>
</head>
<body>
${htmlCode}
</body>
</html>`;
    }
    
    setPreviewHtml(fullHtml);
    setActivePanel('preview');
    addLog('log', '✅ HTML rendered successfully');
  }, [addLog, clearConsole]);

  const executeCSS = useCallback((cssCode: string) => {
    clearConsole();
    addLog('info', '🎨 Validating CSS...');
    
    // Create a preview with the CSS applied
    const previewContent = `
<!DOCTYPE html>
<html>
<head>
  <style>${cssCode}</style>
</head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>Your styles are applied to this preview.</p>
    <button>Sample Button</button>
    <div class="box" style="width:100px;height:100px;background:#ddd;margin:10px 0;"></div>
    <ul><li>List Item 1</li><li>List Item 2</li></ul>
  </div>
</body>
</html>`;
    
    setPreviewHtml(previewContent);
    setActivePanel('preview');
    addLog('log', '✅ CSS applied to preview');
  }, [addLog, clearConsole]);

  const handleRun = useCallback(() => {
    setIsRunning(true);

    setTimeout(() => {
      switch (normalizedLang) {
        case 'javascript':
        case 'typescript':
          executeJavaScript(code);
          break;
        case 'html':
          executeHTML(code);
          break;
        case 'css':
          executeCSS(code);
          break;
        case 'python':
          clearConsole();
          addLog('warn', '🐍 Python execution requires a backend');
          addLog('info', 'Simulating basic print statements...');
          const printMatches = code.match(/print\s*\(\s*["']([^"']+)["']\s*\)/g);
          if (printMatches) {
            printMatches.forEach(match => {
              const content = match.match(/["']([^"']+)["']/)?.[1];
              if (content) addLog('log', content);
            });
          }
          break;
        default:
          clearConsole();
          addLog('warn', `⚠️ Execution for ${language} is not supported`);
          addLog('info', '💡 Copy the code and run in your local environment');
      }
      setIsRunning(false);
    }, 100);
  }, [code, normalizedLang, language, executeJavaScript, executeHTML, executeCSS, addLog, clearConsole]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    clearConsole();
    setPreviewHtml('');
    toast({ title: "Reset to original" });
  };

  const handleDownload = () => {
    const ext = fileExtensions[normalizedLang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!" });
  };

  const handleSave = () => {
    onSave?.(code);
    toast({ title: "Code saved!" });
  };

  const toggleBreakpoint = (lineNumber: number) => {
    setBreakpoints(prev => 
      prev.includes(lineNumber) 
        ? prev.filter(l => l !== lineNumber)
        : [...prev, lineNumber]
    );
  };

  const getLogIcon = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '›';
    }
  };

  const getLogClass = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'error': return 'text-destructive bg-destructive/10';
      case 'warn': return 'text-yellow-500 bg-yellow-500/10';
      case 'info': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-foreground';
    }
  };

  return (
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'inset-4'} bg-background border border-border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-3">
          <FileCode className="h-5 w-5 text-primary" />
          <span className="font-semibold">Code Workspace</span>
          <Badge variant="outline" className="uppercase text-xs">
            {language}
          </Badge>
          {executionTime !== null && (
            <Badge variant="secondary" className="text-xs">
              ⚡ {executionTime.toFixed(1)}ms
            </Badge>
          )}
          {debugMode && (
            <Badge variant="destructive" className="text-xs">
              <Bug className="h-3 w-3 mr-1" />
              Debug Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1.5 h-8"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="sm" onClick={() => setDebugMode(!debugMode)} className="h-8 px-2">
            <Bug className={`h-4 w-4 ${debugMode ? 'text-destructive' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 px-2">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 px-2">
            <Save className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="sm" onClick={() => setShowLeftPanel(!showLeftPanel)} className="h-8 px-2">
            {showLeftPanel ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 px-2">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={showLeftPanel ? 55 : 100} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Editor</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {code.split('\n').length} lines
                </span>
              </div>
              <div className="flex-1">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full bg-background">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
                  </div>
                }>
                  <Editor
                    height="100%"
                    language={normalizedLang}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                      padding: { top: 12, bottom: 12 },
                      renderWhitespace: 'selection',
                      bracketPairColorization: { enabled: true },
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on',
                      glyphMargin: debugMode,
                      folding: true,
                      foldingHighlight: true,
                      showFoldingControls: 'always',
                    }}
                    onMount={(editor) => {
                      if (debugMode) {
                        editor.onMouseDown((e) => {
                          if (e.target.type === 2) { // Glyph margin
                            const lineNumber = e.target.position?.lineNumber;
                            if (lineNumber) toggleBreakpoint(lineNumber);
                          }
                        });
                      }
                    }}
                  />
                </Suspense>
              </div>
            </div>
          </ResizablePanel>

          {showLeftPanel && (
            <>
              <ResizableHandle withHandle />
              
              {/* Output/Preview Panel */}
              <ResizablePanel defaultSize={45} minSize={25}>
                <div className="h-full flex flex-col">
                  <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as 'console' | 'preview')} className="h-full flex flex-col">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                      <TabsList className="h-7">
                        <TabsTrigger value="console" className="text-xs gap-1 h-6 px-2">
                          <Terminal className="h-3 w-3" />
                          Console
                          {consoleLogs.length > 0 && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                              {consoleLogs.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs gap-1 h-6 px-2">
                          <Eye className="h-3 w-3" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearConsole}
                        className="h-6 px-2 ml-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <TabsContent value="console" className="flex-1 m-0 overflow-hidden">
                      <ScrollArea className="h-full bg-zinc-950">
                        <div className="p-3 font-mono text-sm space-y-1">
                          {consoleLogs.length === 0 ? (
                            <div className="text-muted-foreground text-center py-12">
                              <Terminal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">Console output will appear here</p>
                              <p className="text-xs mt-1 opacity-70">Click "Run" to execute code</p>
                            </div>
                          ) : (
                            consoleLogs.map((log, i) => (
                              <div
                                key={i}
                                className={`flex items-start gap-2 px-2 py-1 rounded text-xs ${getLogClass(log.type)}`}
                              >
                                <span className="shrink-0">{getLogIcon(log.type)}</span>
                                <pre className="whitespace-pre-wrap break-all flex-1">{log.message}</pre>
                                <span className="text-[10px] opacity-50 shrink-0">
                                  {log.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                      {previewHtml ? (
                        <iframe
                          ref={iframeRef}
                          srcDoc={previewHtml}
                          className="w-full h-full bg-white"
                          sandbox="allow-scripts"
                          title="Preview"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted/20">
                          <div className="text-center text-muted-foreground">
                            <Layout className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Live preview will appear here</p>
                            <p className="text-xs mt-1 opacity-70">Run HTML/CSS code to see preview</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{normalizedLang.toUpperCase()}</span>
          <span>•</span>
          <span>Ln {code.split('\n').length}, Col {code.split('\n').pop()?.length || 0}</span>
          {breakpoints.length > 0 && (
            <>
              <span>•</span>
              <span className="text-destructive">{breakpoints.length} breakpoint(s)</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>•</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};

export default CodeWorkspace;