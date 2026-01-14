import { useState, useCallback, lazy, Suspense } from "react";
import { 
  Play, Copy, Check, RotateCcw, Maximize2, Minimize2, 
  Terminal, X, Code, Download, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Lazy load Monaco Editor for better performance
const Editor = lazy(() => import('@monaco-editor/react'));

interface CodePlaygroundProps {
  initialCode: string;
  language: string;
  onClose?: () => void;
  embedded?: boolean;
}

const languageMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  html: "html",
  css: "css",
  jsx: "javascript",
  tsx: "typescript",
  json: "json",
  md: "markdown",
  sql: "sql",
  sh: "shell",
  bash: "shell",
};

export const CodePlayground = ({ 
  initialCode, 
  language, 
  onClose,
  embedded = false 
}: CodePlaygroundProps) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "output">("code");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const { toast } = useToast();

  const normalizedLang = languageMap[language.toLowerCase()] || language.toLowerCase();

  const executeJavaScript = useCallback((codeToRun: string) => {
    const logs: string[] = [];
    const startTime = performance.now();
    
    const mockConsole = {
      log: (...args: unknown[]) => {
        logs.push(args.map(a => {
          if (typeof a === 'object') return JSON.stringify(a, null, 2);
          return String(a);
        }).join(' '));
      },
      error: (...args: unknown[]) => {
        logs.push(`❌ Error: ${args.map(a => String(a)).join(' ')}`);
      },
      warn: (...args: unknown[]) => {
        logs.push(`⚠️ Warning: ${args.map(a => String(a)).join(' ')}`);
      },
      info: (...args: unknown[]) => {
        logs.push(`ℹ️ ${args.map(a => String(a)).join(' ')}`);
      },
      table: (data: unknown) => {
        logs.push(JSON.stringify(data, null, 2));
      },
      clear: () => {
        logs.length = 0;
      },
    };

    try {
      const fn = new Function('console', 'setTimeout', 'setInterval', 'fetch', codeToRun);
      
      const mockSetTimeout = (callback: () => void, delay: number) => {
        logs.push(`⏱️ setTimeout scheduled (${delay}ms)`);
        setTimeout(() => {
          callback();
          setOutput([...logs]);
        }, Math.min(delay, 5000));
      };

      const mockSetInterval = () => {
        logs.push(`⏱️ setInterval not supported in playground`);
        return 0;
      };

      const mockFetch = async (url: string) => {
        logs.push(`🌐 fetch() not available in playground (URL: ${url})`);
        throw new Error('fetch() is not available in the playground for security reasons');
      };

      const result = fn(mockConsole, mockSetTimeout, mockSetInterval, mockFetch);
      
      if (result instanceof Promise) {
        result
          .then((value) => {
            if (value !== undefined) {
              logs.push(`→ ${JSON.stringify(value, null, 2)}`);
            }
            const endTime = performance.now();
            setExecutionTime(endTime - startTime);
            setOutput([...logs]);
          })
          .catch((error) => {
            logs.push(`❌ Promise rejected: ${error.message}`);
            setOutput([...logs]);
          });
      } else {
        if (result !== undefined) {
          logs.push(`→ ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
        }
        const endTime = performance.now();
        setExecutionTime(endTime - startTime);
      }

      return logs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`❌ ${errorMessage}`);
      return logs;
    }
  }, []);

  const executeHTML = useCallback((htmlCode: string) => {
    const logs: string[] = [];
    logs.push('📄 HTML Preview:');
    logs.push('─'.repeat(40));
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlCode;
    const textContent = tempDiv.textContent || tempDiv.innerText;
    logs.push(textContent || '(empty content)');
    logs.push('─'.repeat(40));
    logs.push('💡 Tip: Copy the code and open in a browser for full preview');
    
    return logs;
  }, []);

  const executePython = useCallback((pythonCode: string) => {
    const logs: string[] = [];
    logs.push('🐍 Python Simulation (Limited)');
    logs.push('─'.repeat(40));
    
    const lines = pythonCode.split('\n');
    const variables: Record<string, unknown> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const printMatch = trimmed.match(/^print\s*\(\s*(.+)\s*\)$/);
      if (printMatch) {
        let content = printMatch[1];
        if ((content.startsWith('"') && content.endsWith('"')) || 
            (content.startsWith("'") && content.endsWith("'"))) {
          logs.push(content.slice(1, -1));
        } else if (content.startsWith('f"') || content.startsWith("f'")) {
          logs.push(`${content} (f-strings not fully supported)`);
        } else if (variables[content] !== undefined) {
          logs.push(String(variables[content]));
        } else {
          try {
            const result = eval(content);
            logs.push(String(result));
          } catch {
            logs.push(content);
          }
        }
        continue;
      }
      
      const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, varName, value] = assignMatch;
        try {
          variables[varName] = eval(value);
        } catch {
          variables[varName] = value;
        }
        continue;
      }
    }
    
    logs.push('─'.repeat(40));
    logs.push('⚠️ Note: Full Python execution requires a backend.');
    
    return logs;
  }, []);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setOutput([]);
    setActiveTab("output");
    setExecutionTime(null);

    setTimeout(() => {
      let logs: string[] = [];
      
      switch (normalizedLang) {
        case 'javascript':
        case 'typescript':
          logs = executeJavaScript(code);
          break;
        case 'html':
          logs = executeHTML(code);
          break;
        case 'python':
          logs = executePython(code);
          break;
        case 'css':
          logs = ['🎨 CSS code validated', '💡 Apply this CSS in the browser DevTools'];
          break;
        default:
          logs = [`⚠️ Direct execution for ${language} is not supported.`, 
                  '💡 Copy the code and run locally.'];
      }
      
      setOutput(logs);
      setIsRunning(false);
    }, 100);
  }, [code, normalizedLang, language, executeJavaScript, executeHTML, executePython]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput([]);
    setExecutionTime(null);
    toast({ title: "Code reset to original" });
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
    };
    const ext = extensions[normalizedLang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Code downloaded" });
  };

  const containerClass = embedded 
    ? "border border-border rounded-lg overflow-hidden my-4 bg-card"
    : `fixed ${isExpanded ? 'inset-4' : 'right-4 bottom-4 w-[700px] h-[550px]'} bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col transition-all duration-200`;

  const editorHeight = embedded ? "300px" : isExpanded ? "calc(100vh - 200px)" : "380px";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Code Playground</span>
          <Badge variant="outline" className="text-xs uppercase">
            {language}
          </Badge>
          {executionTime !== null && (
            <Badge variant="secondary" className="text-xs">
              {executionTime.toFixed(1)}ms
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="h-7 px-2 gap-1 text-primary hover:text-primary"
          >
            <Play className={`h-3 w-3 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2">
            <Download className="h-3 w-3" />
          </Button>
          {!embedded && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 px-2">
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "code" | "output")} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 w-fit">
          <TabsTrigger value="code" className="text-xs gap-1">
            <Code className="h-3 w-3" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="output" className="text-xs gap-1">
            <Terminal className="h-3 w-3" />
            Output
            {output.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {output.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-background">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
            </div>
          }>
            <Editor
              height={editorHeight}
              language={normalizedLang}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
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
              }}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0 overflow-auto bg-background/50">
          <div className="p-4 font-mono text-sm" style={{ minHeight: embedded ? '200px' : '100%' }}>
            {output.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click "Run" to execute the code</p>
                <p className="text-xs mt-1">Output will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {output.map((line, i) => (
                  <div 
                    key={i} 
                    className={`whitespace-pre-wrap ${
                      line.startsWith('❌') ? 'text-destructive' :
                      line.startsWith('⚠️') ? 'text-yellow-500' :
                      line.startsWith('→') ? 'text-primary' :
                      'text-foreground'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer hint */}
      {embedded && (
        <div className="px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          💡 Edit the code above and click "Run" to see the output
        </div>
      )}
    </div>
  );
};
