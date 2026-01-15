import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code, Play, ChevronDown, ChevronUp, FlaskConical, Maximize2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CodePlayground } from "./CodePlayground";

interface CodeBlockProps {
  code: string;
  language: string;
  onOpenCanvas?: (code: string, language: string) => void;
}

export const CodeBlock = ({ code, language, onOpenCanvas }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n").length;
  const isLong = lines > 20;

  // Map common language aliases
  const languageMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    yml: "yaml",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
  };

  const normalizedLang = languageMap[language.toLowerCase()] || language.toLowerCase();
  
  // Languages that support playground
  const playgroundSupported = ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'html', 'css'];
  const canUsePlayground = playgroundSupported.includes(normalizedLang);

  // Languages that support full workspace/IDE
  const workspaceSupported = ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'html', 'css', 'json'];
  const canUseWorkspace = workspaceSupported.includes(normalizedLang);

  // All code can be edited in canvas
  const canEditInCanvas = true;

  if (showPlayground) {
    return (
      <CodePlayground 
        initialCode={code} 
        language={language}
        embedded={true}
      />
    );
  }

  return (
    <div className="relative group/code rounded-lg overflow-hidden border border-border my-3">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/70 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {language}
          </span>
          <span className="text-xs text-muted-foreground">
            ({lines} lines)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isLong && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 px-2 text-xs"
            >
              {collapsed ? (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand
                </>
              ) : (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse
                </>
              )}
            </Button>
          )}
          {canUsePlayground && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlayground(true)}
              className="h-7 px-2 text-xs text-primary hover:text-primary"
            >
              <FlaskConical className="h-3 w-3 mr-1" />
              Quick Run
            </Button>
          )}
          {/* Edit in Canvas - Always available */}
          {canEditInCanvas && onOpenCanvas && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenCanvas(code, language)}
              className="h-7 px-2 text-xs bg-secondary/50 hover:bg-secondary text-secondary-foreground hover:text-secondary-foreground"
            >
              <PenLine className="h-3 w-3 mr-1" />
              Edit in Canvas
            </Button>
          )}
          {canUseWorkspace && onOpenCanvas && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenCanvas(code, language)}
              className="h-7 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Open IDE
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div 
        className={`overflow-x-auto ${collapsed ? "max-h-[200px] overflow-y-hidden" : ""}`}
        style={{ position: "relative" }}
      >
        <SyntaxHighlighter
          language={normalizedLang}
          style={oneDark}
          showLineNumbers
          wrapLines
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
            background: "hsl(var(--background))",
          }}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "hsl(var(--muted-foreground))",
            opacity: 0.5,
          }}
        >
          {code}
        </SyntaxHighlighter>
        
        {/* Collapsed gradient overlay */}
        {collapsed && isLong && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none"
          />
        )}
      </div>
    </div>
  );
};
