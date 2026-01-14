import { useState } from "react";
import { X, Copy, Check, Play, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CodeCanvasProps {
  code: string;
  language: string;
  onClose: () => void;
  onUpdate?: (code: string) => void;
}

export const CodeCanvas = ({ code, language, onClose, onUpdate }: CodeCanvasProps) => {
  const [editedCode, setEditedCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedCode);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    if (language === 'javascript' || language === 'js') {
      try {
        // Create a sandboxed eval
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: any[]) => logs.push(args.map(a => JSON.stringify(a)).join(' ')),
          error: (...args: any[]) => logs.push(`Error: ${args.map(a => JSON.stringify(a)).join(' ')}`),
          warn: (...args: any[]) => logs.push(`Warning: ${args.map(a => JSON.stringify(a)).join(' ')}`),
        };
        
        const fn = new Function('console', editedCode);
        fn(mockConsole);
        
        setOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)');
      } catch (error) {
        setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      toast({
        title: "Not supported",
        description: `Running ${language} code is not supported in the browser`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`fixed ${isExpanded ? 'inset-4' : 'right-4 bottom-4 w-[600px] h-[500px]'} bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Code Canvas</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          {(language === 'javascript' || language === 'js') && (
            <Button variant="ghost" size="sm" onClick={handleRun} className="h-7 px-2 gap-1">
              <Play className="h-3 w-3" />
              Run
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 px-2">
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <textarea
          value={editedCode}
          onChange={(e) => {
            setEditedCode(e.target.value);
            onUpdate?.(e.target.value);
          }}
          className="flex-1 p-4 font-mono text-sm bg-background text-foreground resize-none focus:outline-none"
          spellCheck={false}
        />
        
        {/* Output */}
        {output && (
          <div className="border-t border-border p-3 bg-muted/30 max-h-32 overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Output</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setOutput(null)}
                className="h-5 px-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
