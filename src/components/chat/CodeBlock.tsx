import { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ChevronDown, ChevronUp, Terminal, PenLine, Globe, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language: string;
  onOpenCanvas?: (code: string, language: string) => void;
  onLaunchWebsite?: (code: string, language: string) => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", python: "Python",
  java: "Java", cpp: "C++", c: "C", csharp: "C#", go: "Go",
  rust: "Rust", ruby: "Ruby", php: "PHP", swift: "Swift",
  kotlin: "Kotlin", scala: "Scala", html: "HTML", css: "CSS",
  scss: "SCSS", less: "LESS", json: "JSON", yaml: "YAML",
  xml: "XML", sql: "SQL", bash: "Bash", shell: "Shell",
  powershell: "PowerShell", dockerfile: "Dockerfile", graphql: "GraphQL",
  markdown: "Markdown", jsx: "JSX", tsx: "TSX", text: "Plain Text",
};

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript", ts: "typescript", py: "python", rb: "ruby",
  yml: "yaml", sh: "bash", shell: "bash", zsh: "bash",
};

// Detect if code is a full website (has HTML structure with styles/scripts)
const isFullWebsite = (code: string, lang: string): boolean => {
  const normalized = lang.toLowerCase();
  if (normalized === 'html') {
    return (code.includes('<html') || code.includes('<!DOCTYPE')) && 
           (code.includes('<style') || code.includes('<script') || code.includes('<link'));
  }
  return false;
};

export const CodeBlock = ({ code, language, onOpenCanvas, onLaunchWebsite }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }, [code, toast]);

  const normalizedLang = LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();
  const displayLabel = LANGUAGE_LABELS[normalizedLang] || language.toUpperCase();
  const canLaunchWebsite = isFullWebsite(code, normalizedLang);
  const canRun = ['javascript', 'typescript', 'html', 'css', 'jsx', 'tsx'].includes(normalizedLang);

  const allLines = code.split("\n");
  const lineCount = allLines.length;
  const isLong = lineCount > 20;
  const displayCode = isLong && !expanded ? allLines.slice(0, 20).join("\n") : code;
  const hiddenLines = lineCount - 20;

  return (
    <div className="relative rounded-xl overflow-hidden my-3 max-w-full border border-border/60 shadow-[var(--shadow-card)]" 
         style={{ background: 'hsl(var(--card))' }}>
      
      {/* Header bar — glassmorphism */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40"
           style={{ background: 'hsl(var(--muted))' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
          </div>
          <div className="w-px h-3.5 bg-border/40 mx-0.5" />
          <Terminal className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide font-mono">
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Launch as Website */}
          {canLaunchWebsite && onLaunchWebsite && (
            <button
              onClick={() => onLaunchWebsite(code, language)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10 transition-all duration-150"
            >
              <Globe className="h-3 w-3" />
              <span>Launch Website</span>
            </button>
          )}
          
          {/* Open IDE */}
          {canRun && onOpenCanvas && (
            <button
              onClick={() => onOpenCanvas(code, language)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
            >
              <Play className="h-3 w-3" />
              <span className="hidden sm:inline">Open IDE</span>
            </button>
          )}

          {/* Edit in Canvas */}
          {!canRun && onOpenCanvas && (
            <button
              onClick={() => onOpenCanvas(code, language)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
            >
              <PenLine className="h-3 w-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={normalizedLang}
          style={oneDark}
          showLineNumbers
          wrapLines
          customStyle={{
            margin: 0,
            padding: "1rem 1rem 1rem 0",
            fontSize: "13px",
            lineHeight: "1.65",
            background: "transparent",
            border: "none",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontVariantLigatures: "common-ligatures",
            }
          }}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1.5em",
            color: "hsl(var(--muted-foreground) / 0.25)",
            fontSize: "12px",
            textAlign: "right" as const,
            userSelect: "none" as const,
          }}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>

      {/* Expand/collapse for long code */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-border/40 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          style={{ background: 'hsl(var(--muted) / 0.5)' }}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {hiddenLines} more lines
            </>
          )}
        </button>
      )}
    </div>
  );
};
