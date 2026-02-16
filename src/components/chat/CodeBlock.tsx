import { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ChevronDown, ChevronUp, PenLine, Globe, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language: string;
  onOpenCanvas?: (code: string, language: string) => void;
  onLaunchWebsite?: (code: string, language: string) => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "javascript", typescript: "typescript", python: "python",
  java: "java", cpp: "cpp", c: "c", csharp: "c#", go: "go",
  rust: "rust", ruby: "ruby", php: "php", swift: "swift",
  kotlin: "kotlin", html: "html", css: "css", scss: "scss",
  json: "json", yaml: "yaml", xml: "xml", sql: "sql",
  bash: "bash", shell: "shell", dockerfile: "dockerfile",
  graphql: "graphql", markdown: "markdown", jsx: "jsx", tsx: "tsx",
  text: "text",
};

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript", ts: "typescript", py: "python", rb: "ruby",
  yml: "yaml", sh: "bash", shell: "bash", zsh: "bash",
};

const isFullWebsite = (code: string, lang: string): boolean => {
  if (lang === 'html') {
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
  const displayLabel = LANGUAGE_LABELS[normalizedLang] || language.toLowerCase();
  const canLaunchWebsite = isFullWebsite(code, normalizedLang);
  const canRun = ['javascript', 'typescript', 'html', 'css', 'jsx', 'tsx'].includes(normalizedLang);

  const allLines = code.split("\n");
  const lineCount = allLines.length;
  const isLong = lineCount > 20;
  const displayCode = isLong && !expanded ? allLines.slice(0, 20).join("\n") : code;
  const hiddenLines = lineCount - 20;

  return (
    <div className="relative rounded-lg overflow-hidden my-3 max-w-full border border-border/50">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/80">
        <span className="text-[11px] font-mono text-muted-foreground/70 select-none">
          {displayLabel}
        </span>

        <div className="flex items-center gap-0.5">
          {canLaunchWebsite && onLaunchWebsite && (
            <button
              onClick={() => onLaunchWebsite(code, language)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Globe className="h-3 w-3" />
              Launch
            </button>
          )}
          {canRun && onOpenCanvas && (
            <button
              onClick={() => onOpenCanvas(code, language)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            >
              <Play className="h-3 w-3" />
              Run
            </button>
          )}
          {!canRun && onOpenCanvas && (
            <button
              onClick={() => onOpenCanvas(code, language)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            >
              <PenLine className="h-3 w-3" />
              Edit
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto bg-card">
        <SyntaxHighlighter
          language={normalizedLang}
          style={oneDark}
          showLineNumbers={lineCount > 1}
          wrapLines
          customStyle={{
            margin: 0,
            padding: lineCount > 1 ? "0.75rem 0.75rem 0.75rem 0" : "0.75rem",
            fontSize: "13px",
            lineHeight: "1.6",
            background: "transparent",
            border: "none",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }
          }}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "hsl(var(--muted-foreground) / 0.2)",
            fontSize: "11px",
            textAlign: "right" as const,
            userSelect: "none" as const,
          }}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>

      {/* Expand/collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border/40 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Show {hiddenLines} more lines</>
          )}
        </button>
      )}
    </div>
  );
};
