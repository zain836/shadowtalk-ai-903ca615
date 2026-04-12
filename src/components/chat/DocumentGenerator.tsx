import { useState, useEffect } from "react";
import {
  FileText, Mail, Newspaper, FileCode, Download,
  Copy, Loader2, Sparkles, X, Check, BookOpen,
  Briefcase, GraduationCap, FileSignature, Pen
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

interface DocumentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentGenerated?: (content: string, type: string) => void;
  initialPrompt?: string;
  autoGenerate?: boolean;
}

type DocumentType = "article" | "email" | "report" | "proposal" | "blog" | "resume" | "letter" | "book_extract" | "case_study" | "whitepaper" | "sop" | "creative_story";
type ToneType = "professional" | "casual" | "academic" | "persuasive" | "creative";
type LengthType = "short" | "medium" | "long" | "comprehensive";

const DOCUMENT_TYPES: { type: DocumentType; icon: typeof FileText; label: string }[] = [
  { type: "article", icon: Newspaper, label: "Article" },
  { type: "email", icon: Mail, label: "Email" },
  { type: "report", icon: FileText, label: "Report" },
  { type: "proposal", icon: FileCode, label: "Proposal" },
  { type: "blog", icon: Pen, label: "Blog Post" },
  { type: "resume", icon: GraduationCap, label: "Resume/CV" },
  { type: "letter", icon: FileSignature, label: "Formal Letter" },
  { type: "book_extract", icon: BookOpen, label: "Book Extract" },
  { type: "case_study", icon: Briefcase, label: "Case Study" },
  { type: "whitepaper", icon: FileText, label: "Whitepaper" },
  { type: "sop", icon: FileCode, label: "SOP / Guide" },
  { type: "creative_story", icon: BookOpen, label: "Creative Story" },
];

const TONES: { value: ToneType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "creative", label: "Creative" },
];

const LENGTHS: { value: LengthType; label: string; words: string }[] = [
  { value: "short", label: "Short", words: "~300 words" },
  { value: "medium", label: "Medium", words: "~800 words" },
  { value: "long", label: "Long", words: "~1500 words" },
  { value: "comprehensive", label: "Comprehensive", words: "~2500+ words" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const getSystemPrompt = (type: DocumentType, tone: ToneType, length: LengthType) => {
  const lengthGuide: Record<LengthType, string> = {
    short: "Keep it concise — approximately 300 words.",
    medium: "Write a moderately detailed piece — approximately 800 words.",
    long: "Write a thorough, detailed piece — approximately 1500 words.",
    comprehensive: "Write an exhaustive, deeply detailed piece — 2500+ words with multiple sections.",
  };

  const toneGuide: Record<ToneType, string> = {
    professional: "Use a professional, authoritative tone. Be precise and data-driven.",
    casual: "Use a conversational, approachable tone. Be relatable and engaging.",
    academic: "Use an academic, scholarly tone. Include citations-style references and formal structure.",
    persuasive: "Use a persuasive, compelling tone. Build strong arguments with evidence.",
    creative: "Use a creative, vivid tone. Employ literary devices and engaging storytelling.",
  };

  const typePrompts: Record<DocumentType, string> = {
    article: `You are an award-winning journalist. Write a publication-ready article with:
- A compelling headline (# Heading)
- A strong lead paragraph that hooks the reader
- Well-structured body with subheadings (## Subheading)
- Pull quotes using blockquotes (> quote)
- Data points in **bold** for emphasis
- A powerful conclusion`,

    email: `You are an expert business communicator. Write a polished professional email with:
- **Subject:** line at the top
- Proper salutation
- Clear, scannable body with bullet points where appropriate
- Professional sign-off
- Format the subject line and key action items in **bold**`,

    report: `You are a senior business analyst at a top consulting firm. Write a formal business report with:
# Report Title
## Executive Summary
> Key takeaway in a blockquote

## Key Findings
Use tables where data is presented:
| Metric | Value | Change |
|--------|-------|--------|

## Analysis
## Recommendations
## Conclusion
Use numbered lists for recommendations and bullet points for supporting data.`,

    proposal: `You are a senior consultant. Write a compelling project proposal with:
# Project Proposal: [Title]
## Overview & Objectives
## Scope of Work
## Methodology
## Timeline
Use a table for milestones:
| Phase | Duration | Deliverables |
|-------|----------|--------------|
## Budget Considerations
## Expected Outcomes & ROI
## Next Steps`,

    blog: `You are a top-tier content strategist. Write an SEO-optimized blog post with:
# Catchy, keyword-rich title
A hook opening that creates curiosity.
## Subheadings that tell a story
- Bullet points for scanability
- **Bold key phrases**
> Quotable insights in blockquotes
## Conclusion with clear CTA`,

    resume: `You are an executive career coach. Create a professional resume with:
# [Name]
**[Title/Tagline]**

📧 email@example.com | 📱 +1-XXX-XXX-XXXX | 🔗 LinkedIn

---

## Professional Summary
> A compelling 2-3 sentence summary

## Experience
### [Job Title] — [Company] *(Date Range)*
- Achievement with **quantified results**
- Use action verbs and metrics

## Education
### [Degree] — [University] *(Year)*

## Skills
Use a clean list or table format.`,

    letter: `You are a professional correspondence writer. Write a formal letter with:
**[Your Name]**
[Address]
[Date]

**[Recipient Name]**
[Recipient Address]

**Re: [Subject]**

Dear [Name],

[Body with clear paragraphs]

Sincerely,
[Signature]`,

    book_extract: `You are a bestselling author. Write an immersive book chapter with:
# Chapter [N]: [Title]

*[Optional epigraph in italics]*

Opening that immediately places the reader in the scene. Use:
- Vivid sensory descriptions
- Natural dialogue with proper formatting
- Internal character thoughts in *italics*
- Scene breaks with ---
- A cliffhanger or reflective ending`,

    case_study: `You are a business strategy consultant. Write a professional case study with:
# Case Study: [Title]
## Client Overview
## The Challenge
> Key problem statement

## Our Approach
## Solution Implementation
Use a timeline table if applicable.
## Results & Impact
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
## Key Takeaways
## Testimonial
> "Client quote here" — Name, Title`,

    whitepaper: `You are an industry thought leader. Write an authoritative whitepaper with:
# [Title]
**Published by [Organization] | [Date]**

## Abstract
> Brief summary of the paper

## Table of Contents
## Introduction
## Background & Context
## Analysis
Include data tables and statistics.
## Findings
## Recommendations
## Conclusion
## References`,

    sop: `You are an operations excellence consultant. Write a clear Standard Operating Procedure with:
# SOP: [Title]
**Version:** 1.0 | **Effective Date:** [Date] | **Owner:** [Role]

---

## Purpose
## Scope
## Definitions
| Term | Definition |
|------|-----------|
## Procedure
### Step 1: [Action]
Detailed instructions with sub-steps.
### Step 2: [Action]
## Quality Checks
- [ ] Checklist items
## Revision History`,

    creative_story: `You are a literary fiction author. Write an engaging short story with:
# [Story Title]
*by [Author]*

---

Rich narrative prose with:
- Compelling characters with distinct voices
- Vivid setting descriptions
- Rising tension and conflict
- Natural dialogue
- *Internal thoughts in italics*
- Scene transitions with ---
- A satisfying or thought-provoking ending`,
  };

  return `${typePrompts[type]}

${toneGuide[tone]}
${lengthGuide[length]}

CRITICAL FORMATTING RULES:
- Use proper Markdown throughout (# ## ### for headings, **bold**, *italic*, > blockquotes, - lists, tables, ---)
- Structure the document with clear visual hierarchy
- Include relevant data, examples, and specifics — never be generic
- Make every sentence purposeful — no filler content
- Output ONLY the document content in Markdown. No meta-commentary.`;
};

export const DocumentGenerator = ({
  isOpen,
  onClose,
  onDocumentGenerated,
  initialPrompt,
  autoGenerate
}: DocumentGeneratorProps) => {
  const { toast } = useToast();
  const [docType, setDocType] = useState<DocumentType>("article");
  const [tone, setTone] = useState<ToneType>("professional");
  const [length, setLength] = useState<LengthType>("medium");
  const [topic, setTopic] = useState(initialPrompt || "");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (initialPrompt) setTopic(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (generatedContent) {
      setWordCount(generatedContent.split(/\s+/).filter(Boolean).length);
    } else {
      setWordCount(0);
    }
  }, [generatedContent]);

  useEffect(() => {
    if (autoGenerate && topic.trim() && !isGenerating && !generatedContent) {
      generateDocument();
    }
  }, [autoGenerate, topic]);

  const generateDocument = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const systemPrompt = getSystemPrompt(docType, tone, length);
      const userPrompt = `Create a ${DOCUMENT_TYPES.find(d => d.type === docType)?.label} about: ${topic}${additionalContext ? `\n\nAdditional requirements:\n${additionalContext}` : ""}`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          personality: "professional",
          mode: "general"
        })
      });

      if (!response.ok) throw new Error("Generation failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.choices?.[0]?.delta?.content;
              if (text) {
                content += text;
                setGeneratedContent(content);
              }
            } catch {}
          }
        }
      }

      toast({ title: "Document Generated", description: `Your ${DOCUMENT_TYPES.find(d => d.type === docType)?.label} is ready!` });
      onDocumentGenerated?.(content, docType);
    } catch (error) {
      console.error("Document generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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
    toast({ title: "Markdown Downloaded" });
  };

  const downloadAsPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const lines = generatedContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Headings
      if (trimmed.startsWith('# ')) {
        y += 4;
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        const wrapped = pdf.splitTextToSize(trimmed.replace(/^# /, ''), maxWidth);
        for (const w of wrapped) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 9;
        }
        y += 2;
      } else if (trimmed.startsWith('## ')) {
        y += 3;
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        const wrapped = pdf.splitTextToSize(trimmed.replace(/^## /, ''), maxWidth);
        for (const w of wrapped) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 7.5;
        }
        y += 2;
      } else if (trimmed.startsWith('### ')) {
        y += 2;
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        const wrapped = pdf.splitTextToSize(trimmed.replace(/^### /, ''), maxWidth);
        for (const w of wrapped) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 6.5;
        }
        y += 1;
      } else if (trimmed.startsWith('> ')) {
        // Blockquote
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "italic");
        pdf.setDrawColor(100, 100, 100);
        const text = trimmed.replace(/^> /, '');
        const wrapped = pdf.splitTextToSize(text, maxWidth - 10);
        for (const w of wrapped) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.line(margin, y - 3, margin, y + 3);
          pdf.text(w, margin + 6, y);
          y += 6;
        }
        y += 2;
      } else if (trimmed.startsWith('---')) {
        y += 2;
        if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 4;
      } else if (trimmed === '') {
        y += 3;
      } else {
        // Body text
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const cleanText = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
        const wrapped = pdf.splitTextToSize(cleanText, maxWidth);
        for (const w of wrapped) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(w, margin, y);
          y += 6;
        }
        y += 1;
      }
    }

    pdf.save(`${docType}-${Date.now()}.pdf`);
    toast({ title: "PDF Downloaded" });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/98 backdrop-blur-sm z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              Document Studio
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">AI</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Generate professional documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedContent && (
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 border-r border-border p-4 space-y-4 overflow-y-auto">
          {/* Document Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {DOCUMENT_TYPES.map((doc) => (
                <button
                  key={doc.type}
                  onClick={() => setDocType(doc.type)}
                  className={`p-2 rounded-md border text-left transition-all text-xs ${
                    docType === doc.type
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <doc.icon className="h-3.5 w-3.5 mb-0.5" />
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone & Length */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tone</label>
              <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Length</label>
              <Select value={length} onValueChange={(v) => setLength(v as LengthType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTHS.map(l => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">{l.label} ({l.words})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should the document be about?"
              className="text-sm h-9"
            />
          </div>

          {/* Context */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Context (Optional)</label>
            <Textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Target audience, key points, specific requirements..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <Button
            onClick={generateDocument}
            disabled={isGenerating || !topic.trim()}
            className="w-full h-9 text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Writing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "preview"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "raw"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Markdown
              </button>
            </div>
            {generatedContent && (
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-7 text-xs px-2">
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsMarkdown} className="h-7 text-xs px-2">
                  <Download className="h-3 w-3 mr-1" />
                  .md
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsPDF} className="h-7 text-xs px-2">
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-6">
              {generatedContent ? (
                activeTab === "preview" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-hr:border-border prose-strong:text-foreground prose-li:text-foreground/90">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {generatedContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/50 p-4 rounded-lg border border-border">
                    {generatedContent}
                  </pre>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium text-sm">Your document will appear here</p>
                  <p className="text-xs mt-1">Select a type, set your preferences, and generate</p>
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
