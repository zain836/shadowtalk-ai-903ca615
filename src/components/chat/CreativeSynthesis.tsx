import { useState, useEffect } from "react";
import {
  Sparkles, FileText, Code, Image, Loader2, X, Download, Copy,
  ChevronRight, Wand2, Layers, ArrowRight, Twitter, Mail,
  Presentation, BookOpen, Megaphone, Users, Target, Briefcase,
  Newspaper, PenTool, LayoutGrid, Zap, Globe, MessageSquare,
  RefreshCw, Check, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stringifyChatBody } from "@/lib/chatRequest";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type OutputFormatId =
  | "twitter_thread" | "linkedin_post" | "email_sequence" | "blog_article"
  | "pitch_deck" | "press_release" | "ad_copy" | "product_brief"
  | "investor_update" | "team_brief" | "customer_faq" | "executive_summary"
  | "landing_page" | "video_script" | "newsletter" | "case_study";

interface OutputFormat {
  id: OutputFormatId;
  label: string;
  icon: React.ElementType;
  category: "social" | "business" | "marketing" | "stakeholder";
  description: string;
}

interface GeneratedOutput {
  formatId: OutputFormatId;
  content: string;
  isGenerating: boolean;
  error?: string;
  wordCount?: number;
}

type WorkflowMode = "repurpose" | "fusion" | "idea2exec" | "stakeholder";

interface CreativeSynthesisProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (content: string) => void;
  initialPrompt?: string;
  autoGenerate?: boolean;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const OUTPUT_FORMATS: OutputFormat[] = [
  { id: "twitter_thread", label: "𝕏 Thread", icon: Twitter, category: "social", description: "Viral tweet thread with hooks" },
  { id: "linkedin_post", label: "LinkedIn Post", icon: Briefcase, category: "social", description: "Professional thought leadership" },
  { id: "email_sequence", label: "Email Sequence", icon: Mail, category: "marketing", description: "3-part email drip campaign" },
  { id: "blog_article", label: "Blog Article", icon: BookOpen, category: "marketing", description: "SEO-optimized long-form article" },
  { id: "pitch_deck", label: "Pitch Deck", icon: Presentation, category: "business", description: "Slide-by-slide pitch outline" },
  { id: "press_release", label: "Press Release", icon: Newspaper, category: "business", description: "AP-style media release" },
  { id: "ad_copy", label: "Ad Copy", icon: Megaphone, category: "marketing", description: "Multi-platform ad variations" },
  { id: "product_brief", label: "Product Brief", icon: FileText, category: "business", description: "PRD-style product specification" },
  { id: "investor_update", label: "Investor Update", icon: Target, category: "stakeholder", description: "Monthly investor memo" },
  { id: "team_brief", label: "Team Brief", icon: Users, category: "stakeholder", description: "Internal team alignment doc" },
  { id: "customer_faq", label: "Customer FAQ", icon: MessageSquare, category: "stakeholder", description: "Customer-facing Q&A document" },
  { id: "executive_summary", label: "Executive Summary", icon: Briefcase, category: "stakeholder", description: "C-suite one-pager" },
  { id: "landing_page", label: "Landing Page", icon: Globe, category: "marketing", description: "High-converting page copy" },
  { id: "video_script", label: "Video Script", icon: PenTool, category: "social", description: "60-sec video script with hooks" },
  { id: "newsletter", label: "Newsletter", icon: Mail, category: "marketing", description: "Subscriber newsletter edition" },
  { id: "case_study", label: "Case Study", icon: Layers, category: "business", description: "Problem-solution-result format" },
];

const WORKFLOW_MODES: { id: WorkflowMode; label: string; icon: React.ElementType; description: string; color: string }[] = [
  { id: "repurpose", label: "Content Repurposer", icon: RefreshCw, description: "One input → 10+ formats. Blog → tweets, emails, ads, scripts.", color: "from-pink-500 to-rose-600" },
  { id: "fusion", label: "Cross-Format Fusion", icon: Layers, description: "Combine text + data + notes into pitch decks, proposals, campaigns.", color: "from-violet-500 to-purple-600" },
  { id: "idea2exec", label: "Idea → Execution", icon: Zap, description: "Rough idea to complete, ready-to-ship deliverables with refinement.", color: "from-amber-500 to-orange-600" },
  { id: "stakeholder", label: "Multi-Stakeholder", icon: Users, description: "One strategy input → investor deck + team brief + customer FAQ.", color: "from-emerald-500 to-teal-600" },
];

const QUICK_TEMPLATES: { mode: WorkflowMode; label: string; prompt: string; formats: OutputFormatId[] }[] = [
  { mode: "repurpose", label: "Product Launch", prompt: "We're launching a new AI-powered analytics dashboard that helps teams reduce decision time by 60%. Key features: real-time insights, natural language queries, automated reporting.", formats: ["twitter_thread", "linkedin_post", "email_sequence", "blog_article", "press_release", "ad_copy"] },
  { mode: "stakeholder", label: "Quarterly Strategy", prompt: "Q1 results: Revenue up 34%, 2,400 new users, launched 3 features. Q2 goals: expand to EU market, hire 5 engineers, launch mobile app. Challenges: rising CAC, competitor funding.", formats: ["investor_update", "team_brief", "customer_faq", "executive_summary"] },
  { mode: "idea2exec", label: "SaaS Feature Idea", prompt: "Idea: Add a collaborative whiteboard feature to our project management tool so teams can brainstorm visually during sprint planning.", formats: ["product_brief", "landing_page", "blog_article", "email_sequence"] },
  { mode: "fusion", label: "Fundraising Campaign", prompt: "We need $2M seed funding. Traction: 10K MAU, $50K MRR, 40% MoM growth. Market: $15B TAM in workflow automation. Team: 3 ex-Google engineers, 1 ex-McKinsey.", formats: ["pitch_deck", "investor_update", "executive_summary", "linkedin_post"] },
];

// ──────────────────────────────────────────────
// Prompt builders
// ──────────────────────────────────────────────

const buildPrompt = (formatId: OutputFormatId, input: string, mode: WorkflowMode): string => {
  const modeContext: Record<WorkflowMode, string> = {
    repurpose: "You are repurposing the following source content into a different format. Maintain the core message and value while adapting tone, structure, and length to the target format.",
    fusion: "You are synthesizing multiple inputs into a cohesive, polished deliverable. Combine all provided information into a unified, professional output.",
    idea2exec: "You are transforming a rough idea or concept into a complete, ready-to-ship professional document. Fill in gaps with industry best practices and make it actionable.",
    stakeholder: "You are creating a document tailored for a specific audience/stakeholder from the same source material. Adjust depth, tone, and focus for the target reader.",
  };

  const formatPrompts: Record<OutputFormatId, string> = {
    twitter_thread: `Create a viral 𝕏/Twitter thread (8-12 tweets). Start with a strong hook. Use short punchy sentences. Include relevant emojis. End with a CTA. Number each tweet.`,
    linkedin_post: `Write a LinkedIn thought-leadership post (200-300 words). Professional but human tone. Start with a bold statement or question. Include line breaks for readability. End with a question to drive engagement.`,
    email_sequence: `Create a 3-email drip sequence:\n\n**Email 1 (Awareness):** Subject line + body introducing the topic\n**Email 2 (Value):** Subject line + body delivering key insights\n**Email 3 (Action):** Subject line + body with clear CTA\n\nInclude subject lines, preview text, and body for each.`,
    blog_article: `Write an SEO-optimized blog article (800-1200 words). Include:\n- Compelling H1 title with primary keyword\n- Meta description (155 chars)\n- Introduction with hook\n- 3-5 H2 sections with actionable content\n- Conclusion with CTA\n- 3 suggested internal link anchors`,
    pitch_deck: `Create a 10-slide pitch deck outline:\n\n1. **Title Slide** - One-liner + tagline\n2. **Problem** - Pain point with data\n3. **Solution** - Your approach\n4. **Product** - Key features/demo talking points\n5. **Market** - TAM/SAM/SOM\n6. **Business Model** - Revenue streams\n7. **Traction** - Metrics/milestones\n8. **Competition** - Differentiators\n9. **Team** - Key players\n10. **Ask** - Funding + use of funds\n\nFor each slide, provide headline, 3-4 bullet points, and speaker notes.`,
    press_release: `Write an AP-style press release:\n- Headline (under 10 words)\n- Subheadline\n- Dateline (City, Date)\n- Lead paragraph (who, what, when, where, why)\n- Supporting paragraphs with quotes\n- Boilerplate\n- Media contact info placeholder`,
    ad_copy: `Create ad copy variations:\n\n**Google Search Ads (3 variations):**\n- Headline 1 (30 chars) | Headline 2 (30 chars) | Headline 3 (30 chars)\n- Description 1 (90 chars) | Description 2 (90 chars)\n\n**Facebook/Instagram Ads (2 variations):**\n- Primary text, Headline, Description, CTA\n\n**LinkedIn Sponsored (1 variation):**\n- Intro text, Headline, Description`,
    product_brief: `Write a Product Requirements Document (PRD):\n\n## Overview\n## Problem Statement\n## Goals & Success Metrics\n## User Stories\n## Functional Requirements\n## Non-Functional Requirements\n## Timeline & Milestones\n## Risks & Mitigations\n## Open Questions`,
    investor_update: `Write a monthly investor update email:\n\n## Highlights\n- 3 key wins\n\n## Metrics\n| Metric | This Month | Last Month | Change |\n\n## Product Updates\n## Challenges & Learnings\n## Asks from Investors\n## Next Month Focus`,
    team_brief: `Write an internal team alignment document:\n\n## Context\n## What We're Doing & Why\n## Key Decisions Made\n## What This Means for Each Team\n## Timeline & Milestones\n## Questions & Discussion Points`,
    customer_faq: `Create a customer-facing FAQ document:\n\nGenerate 8-10 questions and answers that a customer would ask. Group by:\n\n## Getting Started\n## Features & Capabilities\n## Pricing & Plans\n## Support & Troubleshooting\n\nKeep answers clear, concise, and helpful.`,
    executive_summary: `Write a C-suite executive one-pager:\n\n## Situation\n## Complication\n## Resolution\n## Key Metrics\n## Recommended Actions\n## Timeline\n\nKeep it under 500 words. Use bullet points. Lead with impact.`,
    landing_page: `Write landing page copy:\n\n**Hero:** Headline (8 words max) + Subheadline + CTA button text\n**Social Proof:** Testimonial placeholder + metrics\n**Features:** 3 features with headline + description + icon suggestion\n**How It Works:** 3-step process\n**FAQ:** 4 questions\n**Final CTA:** Closing headline + button`,
    video_script: `Write a 60-second video script:\n\n**HOOK (0-5s):** [Attention-grabbing opening]\n**PROBLEM (5-15s):** [Relatable pain point]\n**SOLUTION (15-35s):** [Your offering + key benefits]\n**PROOF (35-45s):** [Social proof / results]\n**CTA (45-60s):** [Clear next step]\n\nInclude visual direction notes in [brackets].`,
    newsletter: `Write a newsletter edition:\n\n**Subject Line:** (+ 2 A/B alternatives)\n**Preview Text:**\n\n**Opening:** Personal, conversational hook\n**Main Story:** Key insight or update (300 words)\n**Quick Wins:** 3 actionable tips\n**Resource:** One recommended tool/article\n**CTA:** What to do next`,
    case_study: `Write a case study:\n\n## Client Overview\n## Challenge\n## Solution\n## Implementation\n## Results (with specific metrics)\n## Key Takeaways\n## Client Quote (placeholder)\n\nUse the Problem → Solution → Result framework.`,
  };

  return `${modeContext[mode]}\n\n${formatPrompts[formatId]}\n\nSource material:\n\n${input}`;
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export const CreativeSynthesis = ({ isOpen, onClose, onInsertToChat, initialPrompt, autoGenerate }: CreativeSynthesisProps) => {
  const { toast } = useToast();
  const [input, setInput] = useState(initialPrompt || "");
  const [activeMode, setActiveMode] = useState<WorkflowMode>("repurpose");
  const [selectedFormats, setSelectedFormats] = useState<OutputFormatId[]>(["twitter_thread", "linkedin_post", "email_sequence", "blog_article"]);
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (autoGenerate && initialPrompt && !isGenerating && outputs.length === 0 && !hasAutoGenerated) {
      setHasAutoGenerated(true);
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, initialPrompt, hasAutoGenerated]);

  // Auto-select formats based on mode
  useEffect(() => {
    const modeDefaults: Record<WorkflowMode, OutputFormatId[]> = {
      repurpose: ["twitter_thread", "linkedin_post", "email_sequence", "blog_article", "ad_copy", "video_script"],
      fusion: ["pitch_deck", "executive_summary", "blog_article", "linkedin_post"],
      idea2exec: ["product_brief", "landing_page", "blog_article", "email_sequence"],
      stakeholder: ["investor_update", "team_brief", "customer_faq", "executive_summary"],
    };
    setSelectedFormats(modeDefaults[activeMode]);
  }, [activeMode]);

  const toggleFormat = (id: OutputFormatId) => {
    setSelectedFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const generateSingle = async (formatId: OutputFormatId, session: any): Promise<GeneratedOutput> => {
    const prompt = buildPrompt(formatId, input, activeMode);
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: stringifyChatBody({
        messages: [{ role: "user", content: prompt }],
        personality: "professional",
        mode: "general",
      }),
    });

    if (!resp.ok) throw new Error(`Failed for ${formatId}`);

    const reader = resp.body?.getReader();
    const decoder = new TextDecoder();
    let content = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const c = data.choices?.[0]?.delta?.content;
            if (c) content += c;
          } catch {}
        }
      }
    }

    return { formatId, content, isGenerating: false, wordCount: content.split(/\s+/).length };
  };

  const generate = async () => {
    if (!input.trim() || selectedFormats.length === 0) return;
    setIsGenerating(true);
    setCompletedCount(0);
    setOutputs(selectedFormats.map(f => ({ formatId: f, content: "", isGenerating: true })));

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const promises = selectedFormats.map(async (formatId, i) => {
        try {
          const result = await generateSingle(formatId, session);
          setOutputs(prev => prev.map((o, idx) => idx === i ? result : o));
          setCompletedCount(prev => prev + 1);
          return result;
        } catch (err) {
          const errOutput: GeneratedOutput = { formatId, content: "", isGenerating: false, error: "Generation failed" };
          setOutputs(prev => prev.map((o, idx) => idx === i ? errOutput : o));
          setCompletedCount(prev => prev + 1);
          return errOutput;
        }
      });

      await Promise.all(promises);
      toast({ title: "✨ All formats generated!", description: `${selectedFormats.length} outputs ready` });
    } catch (err) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportAll = () => {
    const md = outputs
      .filter(o => o.content)
      .map(o => {
        const fmt = OUTPUT_FORMATS.find(f => f.id === o.formatId);
        return `\n\n---\n\n## ${fmt?.label || o.formatId}\n\n${o.content}`;
      })
      .join("");
    const full = `# Content Transformation Output\n\n**Source:** ${input.slice(0, 100)}...\n**Mode:** ${WORKFLOW_MODES.find(m => m.id === activeMode)?.label}\n**Generated:** ${new Date().toLocaleString()}\n**Formats:** ${outputs.length}${md}`;
    const blob = new Blob([full], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-transform-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📥 Exported all outputs" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "📋 Copied" });
  };

  const getFormatsByCategory = (cat: string) => OUTPUT_FORMATS.filter(f => f.category === cat);
  const filteredOutputs = activeTab === "all" ? outputs : outputs.filter(o => {
    const fmt = OUTPUT_FORMATS.find(f => f.id === o.formatId);
    return fmt?.category === activeTab;
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-pink-500/5 via-transparent to-purple-500/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            {isGenerating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1 rounded-xl border-2 border-transparent border-t-pink-500 border-r-purple-500"
              />
            )}
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Content Transformer
              <Badge className="text-xs bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-500 border-pink-500/30">
                INDUSTRY ENGINE
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              One input → every format your business needs
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Panel ── */}
        <div className="w-[420px] border-r border-border/50 flex flex-col">
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-5">
              {/* Workflow Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workflow Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKFLOW_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      disabled={isGenerating}
                      className={`relative p-3 rounded-xl border text-left transition-all ${
                        activeMode === mode.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center mb-2`}>
                        <mode.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-sm font-medium">{mode.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{mode.description}</div>
                      {activeMode === mode.id && (
                        <motion.div layoutId="mode-indicator" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeMode === "repurpose" ? "Source Content" :
                   activeMode === "fusion" ? "Combined Inputs" :
                   activeMode === "idea2exec" ? "Your Idea" :
                   "Strategy / Context"}
                </label>
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    activeMode === "repurpose"
                      ? "Paste your blog post, report, or any content to repurpose into multiple formats..."
                      : activeMode === "fusion"
                      ? "Combine your notes, data points, and ideas here. The engine will fuse them into polished deliverables..."
                      : activeMode === "idea2exec"
                      ? "Describe your rough idea or concept. The engine will flesh it out into complete, actionable documents..."
                      : "Enter your strategy, update, or key information. The engine will create versions for each stakeholder audience..."
                  }
                  className="min-h-[140px] text-sm"
                  disabled={isGenerating}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{input.split(/\s+/).filter(Boolean).length} words</span>
                  <span>More detail = better outputs</span>
                </div>
              </div>

              {/* Output Format Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output Formats</label>
                  <Badge variant="outline" className="text-[10px]">{selectedFormats.length} selected</Badge>
                </div>

                {(["social", "marketing", "business", "stakeholder"] as const).map(cat => {
                  const formats = getFormatsByCategory(cat);
                  const catLabel = { social: "Social & Video", marketing: "Marketing", business: "Business", stakeholder: "Stakeholder" }[cat];
                  return (
                    <div key={cat} className="space-y-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{catLabel}</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {formats.map(fmt => {
                          const selected = selectedFormats.includes(fmt.id);
                          return (
                            <button
                              key={fmt.id}
                              onClick={() => toggleFormat(fmt.id)}
                              disabled={isGenerating}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                                selected
                                  ? "border-primary/50 bg-primary/5"
                                  : "border-border/30 hover:border-primary/20"
                              }`}
                            >
                              <fmt.icon className={`h-3.5 w-3.5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`truncate ${selected ? "font-medium" : ""}`}>{fmt.label}</span>
                              {selected && <Check className="h-3 w-3 text-primary ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Start</label>
                <div className="space-y-1.5">
                  {QUICK_TEMPLATES.filter(t => t.mode === activeMode).map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(tpl.prompt); setSelectedFormats(tpl.formats); }}
                      disabled={isGenerating}
                      className="w-full p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/20 text-left transition-all"
                    >
                      <span className="text-xs font-medium">{tpl.label}</span>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{tpl.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Generate Button */}
          <div className="p-4 border-t border-border/50 space-y-2">
            <Button
              onClick={generate}
              disabled={!input.trim() || selectedFormats.length === 0 || isGenerating}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-[length:200%_100%] hover:animate-[gradient-shift_2s_ease_infinite] text-white font-semibold shadow-lg shadow-pink-500/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transforming... ({completedCount}/{selectedFormats.length})
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate {selectedFormats.length} Formats
                </>
              )}
            </Button>
            {isGenerating && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  animate={{ width: `${(completedCount / selectedFormats.length) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel — Outputs ── */}
        <div className="flex-1 flex flex-col">
          {outputs.length > 0 ? (
            <>
              {/* Tab Filters + Export */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs px-3 h-7">All ({outputs.length})</TabsTrigger>
                    <TabsTrigger value="social" className="text-xs px-3 h-7">Social</TabsTrigger>
                    <TabsTrigger value="marketing" className="text-xs px-3 h-7">Marketing</TabsTrigger>
                    <TabsTrigger value="business" className="text-xs px-3 h-7">Business</TabsTrigger>
                    <TabsTrigger value="stakeholder" className="text-xs px-3 h-7">Stakeholder</TabsTrigger>
                  </TabsList>
                </Tabs>
                {outputs.some(o => o.content) && (
                  <Button variant="outline" size="sm" onClick={exportAll} className="h-8 text-xs">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export All
                  </Button>
                )}
              </div>

              {/* Output Cards */}
              <ScrollArea className="flex-1">
                <div className="p-5 grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredOutputs.map((output, i) => {
                      const fmt = OUTPUT_FORMATS.find(f => f.id === output.formatId);
                      if (!fmt) return null;
                      return (
                        <motion.div
                          key={output.formatId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
                        >
                          <Card className={`overflow-hidden ${output.isGenerating ? "border-primary/30" : ""}`}>
                            <CardHeader className="py-3 px-4 border-b border-border/30 bg-muted/20">
                              <CardTitle className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <fmt.icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <span className="font-semibold">{fmt.label}</span>
                                    <p className="text-[10px] text-muted-foreground font-normal">{fmt.description}</p>
                                  </div>
                                </span>
                                {!output.isGenerating && output.content && (
                                  <div className="flex items-center gap-1">
                                    {output.wordCount && (
                                      <Badge variant="outline" className="text-[10px] font-mono mr-1">{output.wordCount}w</Badge>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(output.content)}>
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onInsertToChat(output.content)}>
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              {output.isGenerating ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  <span className="ml-3 text-sm text-muted-foreground">Generating {fmt.label}...</span>
                                </div>
                              ) : output.error ? (
                                <div className="text-sm text-destructive py-4 text-center">{output.error}. Click generate to retry.</div>
                              ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-h2:text-sm prose-h2:font-semibold prose-table:text-xs prose-td:p-1.5 prose-th:p-1.5">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output.content}</ReactMarkdown>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                  <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -inset-2 rounded-2xl border border-primary/20"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">The Biggest Pain Point, Solved</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Every industry wastes hours manually reformatting content for different channels and audiences.
                Paste once, get everything — tweets, emails, pitch decks, press releases, FAQs, and more.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {[
                  { icon: RefreshCw, label: "1 Blog → 10 Formats" },
                  { icon: Users, label: "1 Strategy → 4 Audiences" },
                  { icon: Zap, label: "Idea → Ship-Ready Docs" },
                  { icon: Layers, label: "Notes → Pitch Deck" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/20">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
