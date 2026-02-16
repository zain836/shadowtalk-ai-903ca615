import { useState } from "react";
import { X, Copy, Check, Play, Maximize2, Minimize2, Download } from "lucide-react";
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

  const handleDownload = () => {
    const ext = language === "javascript" || language === "js" ? "js" : language === "typescript" || language === "ts" ? "ts" : language === "python" ? "py" : language === "html" ? "html" : language === "css" ? "css" : "txt";
    const blob = new Blob([editedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    if (language === "javascript" || language === "js") {
      try {
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map((a) => JSON.stringify(a)).join(" ")),
          error: (...args: unknown[]) => logs.push(`Error: ${args.map((a) => JSON.stringify(a)).join(" ")}`),
          warn: (...args: unknown[]) => logs.push(`Warning: ${args.map((a) => JSON.stringify(a)).join(" ")}`),
        };
        const fn = new Function("console", editedCode);
        fn(mockConsole);
        setOutput(logs.length > 0 ? logs.join("\n") : "Code executed successfully (no output)");
      } catch (error) {
        setOutput(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } else {
      toast({ title: "Not supported", description: `Running ${language} code is not supported in the browser`, variant: "destructive" });
    }
  };

  const langLabel = language === "js" ? "JavaScript" : language === "ts" ? "TypeScript" : language === "python" ? "Python" : language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className={`fixed ${isExpanded ? "inset-4" : "right-4 bottom-4 w-[640px] h-[520px]"} z-50 flex flex-col transition-all duration-300 rounded-xl overflow-hidden border border-border/50 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] backdrop-blur-xl bg-card/95`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-destructive/80 hover:bg-destructive transition-colors" />
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-3 h-3 rounded-full bg-accent/80 hover:bg-accent transition-colors" />
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-3 h-3 rounded-full bg-primary/60 hover:bg-primary/80 transition-colors" />
          </div>
          <span className="text-sm font-medium text-foreground">Code Canvas</span>
          <span className="text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-mono">{langLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {(language === "javascript" || language === "js") && (
            <Button variant="ghost" size="sm" onClick={handleRun} className="h-7 px-2.5 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary">
              <Play className="h-3 w-3" /> Run
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2 hover:bg-primary/10 hover:text-primary">
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 hover:bg-primary/10 hover:text-primary">
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 px-2 hover:bg-primary/10 hover:text-primary">
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Line numbers + Code Editor */}
      <div className="flex-1 overflow-hidden flex">
        <div className="w-10 shrink-0 bg-muted/20 border-r border-border/30 pt-4 overflow-hidden select-none">
          {editedCode.split("\n").map((_, i) => (
            <div key={i} className="text-[11px] text-muted-foreground/40 text-right pr-2 leading-[1.6rem] font-mono">{i + 1}</div>
          ))}
        </div>
        <textarea
          value={editedCode}
          onChange={(e) => {
            setEditedCode(e.target.value);
            onUpdate?.(e.target.value);
          }}
          className="flex-1 p-4 font-mono text-sm bg-transparent text-foreground resize-none focus:outline-none leading-[1.6rem] selection:bg-primary/20"
          spellCheck={false}
        />
      </div>

      {/* Output */}
      {output && (
        <div className="border-t border-border/50 bg-muted/20 max-h-40 overflow-auto">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/30">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
            <Button variant="ghost" size="sm" onClick={() => setOutput(null)} className="h-5 px-1 hover:bg-destructive/10">
              <X className="h-3 w-3" />
            </Button>
          </div>
          <pre className="px-4 py-3 text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{output}</pre>
        </div>
      )}
    </div>
  );
};
