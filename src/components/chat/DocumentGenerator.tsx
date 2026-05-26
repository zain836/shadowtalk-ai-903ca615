import { useState, useEffect, useRef } from "react";
import {
  FileText, Download, Copy, Loader2, Sparkles, X, Check,
  RefreshCw, Wand2, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import {
  KIMI_DOCUMENT_TYPES,
  KIMI_LENGTHS,
  streamKimiDocument,
  downloadAsWordDoc,
  inferDocumentTypeFromMessage,
  type KimiDocumentType,
  type KimiToneType,
  type KimiLengthType,
} from "@/lib/kimiDocumentGeneration";

export interface DocumentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentGenerated?: (content: string, type: string) => void;
  initialPrompt?: string;
  autoGenerate?: boolean;
  initialDocType?: KimiDocumentType;
}

const TONES: { value: KimiToneType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "creative", label: "Creative" },
];

const REVISE_ACTIONS = [
  { value: "make_formal", label: "More formal" },
  { value: "make_casual", label: "More casual" },
  { value: "expand", label: "Expand" },
  { value: "shorten", label: "Shorten" },
  { value: "add_toc", label: "Add TOC" },
  { value: "fix_grammar", label: "Fix grammar" },
] as const;

export const DocumentGenerator = ({
  isOpen,
  onClose,
  onDocumentGenerated,
  initialPrompt,
  autoGenerate,
  initialDocType,
}: DocumentGeneratorProps) => {
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [docType, setDocType] = useState<KimiDocumentType>(initialDocType || "article");
  const [tone, setTone] = useState<KimiToneType>("professional");
  const [length, setLength] = useState<KimiLengthType>("medium");
  const [topic, setTopic] = useState(initialPrompt || "");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (initialPrompt) {
      setTopic(initialPrompt);
      const inferred = inferDocumentTypeFromMessage(initialPrompt);
      if (inferred) setDocType(inferred);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialDocType) setDocType(initialDocType);
  }, [initialDocType]);

  useEffect(() => {
    setWordCount(generatedContent ? generatedContent.split(/\s+/).filter(Boolean).length : 0);
  }, [generatedContent]);

  useEffect(() => {
    if (autoGenerate && topic.trim() && isOpen && !isGenerating && !generatedContent) {
      generateDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, topic, isOpen]);

  const generateDocument = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const content = await streamKimiDocument({
        topic,
        docType,
        tone,
        length,
        additionalContext,
        accessToken: session?.access_token,
        signal: abortRef.current.signal,
        onChunk: setGeneratedContent,
      });

      const label = KIMI_DOCUMENT_TYPES.find((d) => d.type === docType)?.label ?? "Document";
      toast({ title: "Document ready", description: `Your ${label} is ready to export.` });
      onDocumentGenerated?.(content, docType);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("Document generation error:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate document. Try again or use a shorter length.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reviseDocument = async (action: string) => {
    if (!generatedContent.trim()) return;
    setIsRevising(true);
    setPreviousContent(generatedContent);
    try {
      const { data, error } = await supabase.functions.invoke("document-ai", {
        body: { action, content: generatedContent },
      });
      if (error) throw error;
      if (data?.result) {
        setGeneratedContent(data.result);
        toast({ title: "Document updated" });
        onDocumentGenerated?.(data.result, docType);
      }
    } catch {
      toast({ title: "Revision failed", variant: "destructive" });
      setGeneratedContent(previousContent);
    } finally {
      setIsRevising(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([generatedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docType}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    for (const line of generatedContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        for (const w of pdf.splitTextToSize(trimmed.replace(/^# /, ""), maxWidth)) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 9;
        }
      } else if (trimmed.startsWith("## ")) {
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        for (const w of pdf.splitTextToSize(trimmed.replace(/^## /, ""), maxWidth)) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 7.5;
        }
      } else if (trimmed === "") {
        y += 3;
      } else {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const clean = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
        for (const w of pdf.splitTextToSize(clean, maxWidth)) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 6;
        }
      }
      y += 1;
    }
    pdf.save(`${docType}-${Date.now()}.pdf`);
    toast({ title: "PDF downloaded" });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/98 backdrop-blur-sm z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              Document Studio
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Kimi-class</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Long-form docs · Word · PDF · Markdown</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedContent && (
            <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words</span>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
            <Select value={docType} onValueChange={(v) => setDocType(v as KimiDocumentType)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIMI_DOCUMENT_TYPES.map((d) => (
                  <SelectItem key={d.type} value={d.type} className="text-xs">{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tone</label>
              <Select value={tone} onValueChange={(v) => setTone(v as KimiToneType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Length</label>
              <Select value={length} onValueChange={(v) => setLength(v as KimiLengthType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIMI_LENGTHS.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label} ({l.words})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe the document you need..."
              className="text-sm h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requirements</label>
            <Textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Audience, citations, sections, tone..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <Button onClick={generateDocument} disabled={isGenerating || !topic.trim()} className="w-full h-9 text-sm">
            {isGenerating ? (
              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Writing...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-2" />Generate</>
            )}
          </Button>

          {generatedContent && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Revise (Kimi-style)</p>
              <div className="flex flex-wrap gap-1">
                {REVISE_ACTIONS.map((a) => (
                  <Button
                    key={a.value}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    disabled={isRevising}
                    onClick={() => reviseDocument(a.value)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs rounded-md ${activeTab === "preview" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1 text-xs rounded-md ${activeTab === "raw" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
              >
                Markdown
              </button>
            </div>
            {generatedContent && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-7 text-xs px-2">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsMarkdown} className="h-7 text-xs px-2">
                  <Download className="h-3 w-3 mr-1" />.md
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadAsWordDoc(generatedContent, `${docType}-${Date.now()}`)} className="h-7 text-xs px-2">
                  <FileDown className="h-3 w-3 mr-1" />Word
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsPDF} className="h-7 text-xs px-2">
                  <Download className="h-3 w-3 mr-1" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={generateDocument} disabled={isGenerating} className="h-7 text-xs px-2">
                  <RefreshCw className="h-3 w-3 mr-1" />Regenerate
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-6">
              {generatedContent ? (
                activeTab === "preview" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-table:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/50 p-4 rounded-lg border">{generatedContent}</pre>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground text-center">
                  <FileText className="h-12 w-12 opacity-30 mb-4" />
                  <p className="font-medium text-sm">Describe your document — Kimi-style output appears here</p>
                  <p className="text-xs mt-1 max-w-sm">Up to ~10,000 words · TOC · tables · export to Word or PDF</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentGenerator;
