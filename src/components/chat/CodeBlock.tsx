import { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ChevronDown, ChevronUp, Terminal, PenLine, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language: string;
  onOpenCanvas?: (code: string, language: string) => void;
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

export const CodeBlock = ({ code, language, onOpenCanvas }: CodeBlockProps) => {
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

  const allLines = code.split("\n");
  const lineCount = allLines.length;
  const isLong = lineCount > 20;
  const displayCode = isLong && !expanded ? allLines.slice(0, 20).join("\n") : code;
  const hiddenLines = lineCount - 20;

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/60 my-3 max-w-full bg-[#1e1e2e] shadow-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181825] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#cdd6f4]/50" />
          <span className="text-[11px] font-medium text-[#cdd6f4]/60 tracking-wide">
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenCanvas && (
            <button
              onClick={() => onOpenCanvas(code, language)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#cdd6f4]/50 hover:text-[#cdd6f4]/90 hover:bg-white/[0.06] transition-colors"
            >
              <PenLine className="h-3 w-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#cdd6f4]/50 hover:text-[#cdd6f4]/90 hover:bg-white/[0.06] transition-all duration-150"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="hidden sm:inline">Copy code</span>
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
            lineHeight: "1.6",
            background: "transparent",
            border: "none",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontVariantLigatures: "common-ligatures",
            }
          }}
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1.5em",
            color: "rgba(205, 214, 244, 0.2)",
            fontSize: "12px",
            textAlign: "right",
            userSelect: "none",
          }}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>

      {/* Expand/collapse for long code */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#181825] border-t border-white/[0.06] text-[11px] font-medium text-[#cdd6f4]/40 hover:text-[#cdd6f4]/70 transition-colors"
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
