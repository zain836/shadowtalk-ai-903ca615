import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Presentation, Plus, Download, Wand2, ChevronLeft, ChevronRight, 
  Trash2, Copy, GripVertical, Type, BarChart3, Quote, Layout, 
  Clock, GitCompare, List, Image, X, Loader2, Maximize, Minimize,
  SlidersHorizontal, Palette, FileText, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";

// Types
interface SlideContent {
  [key: string]: unknown;
}

interface Slide {
  id: string;
  layout: string;
  title: string;
  subtitle?: string;
  content: SlideContent;
  speakerNotes?: string;
  transition?: string;
}

interface PresentationData {
  title: string;
  slides: Slide[];
  metadata?: {
    estimatedDuration?: number;
    targetAudience?: string;
    keyTakeaways?: string[];
  };
}

type ThemeKey = 'corporate' | 'startup' | 'academic' | 'creative' | 'minimal' | 'dark_elegance';

const THEMES: Record<ThemeKey, { name: string; bg: string; accent: string; text: string; secondaryBg: string; accentGradient: string }> = {
  corporate: { name: "Corporate", bg: "#FFFFFF", accent: "#1E40AF", text: "#111827", secondaryBg: "#F3F4F6", accentGradient: "linear-gradient(135deg, #1E40AF, #3B82F6)" },
  startup: { name: "Startup", bg: "#0F172A", accent: "#8B5CF6", text: "#F8FAFC", secondaryBg: "#1E293B", accentGradient: "linear-gradient(135deg, #8B5CF6, #EC4899)" },
  academic: { name: "Academic", bg: "#FFFBEB", accent: "#92400E", text: "#1C1917", secondaryBg: "#FEF3C7", accentGradient: "linear-gradient(135deg, #92400E, #D97706)" },
  creative: { name: "Creative", bg: "#FDF2F8", accent: "#DB2777", text: "#1F2937", secondaryBg: "#FCE7F3", accentGradient: "linear-gradient(135deg, #DB2777, #F97316)" },
  minimal: { name: "Minimal", bg: "#FAFAFA", accent: "#18181B", text: "#18181B", secondaryBg: "#F4F4F5", accentGradient: "linear-gradient(135deg, #18181B, #52525B)" },
  dark_elegance: { name: "Dark Elegance", bg: "#09090B", accent: "#FBBF24", text: "#FAFAFA", secondaryBg: "#18181B", accentGradient: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
};

const LAYOUT_ICONS: Record<string, React.ReactNode> = {
  title: <Type className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  two_column: <Layout className="w-4 h-4" />,
  bullets: <List className="w-4 h-4" />,
  stats: <BarChart3 className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  timeline: <Clock className="w-4 h-4" />,
  comparison: <GitCompare className="w-4 h-4" />,
  image_text: <Image className="w-4 h-4" />,
  closing: <Presentation className="w-4 h-4" />,
  funnel: <BarChart3 className="w-4 h-4" />,
  swot: <Layout className="w-4 h-4" />,
  roadmap: <Clock className="w-4 h-4" />,
  kpi_dashboard: <BarChart3 className="w-4 h-4" />,
  process: <List className="w-4 h-4" />,
};

// Slide Renderer
const SlideRenderer = ({ slide, theme, scale = 1 }: { slide: Slide; theme: ThemeKey; scale?: number }) => {
  const t = THEMES[theme];
  const content = slide.content || {};

  const baseStyle: React.CSSProperties = {
    width: 960,
    height: 540,
    backgroundColor: t.bg,
    color: t.text,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    fontFamily: theme === 'corporate' ? '"Segoe UI", system-ui, sans-serif' : theme === 'startup' ? '"Inter", sans-serif' : '"Georgia", serif',
    overflow: "hidden",
    position: "relative",
  };

  const AccentBar = () => <div className="h-1 w-24 rounded-full mb-6" style={{ background: t.accentGradient }} />;

  const SlideHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-2">
      <h2 className="text-3xl font-bold leading-tight" style={{ color: t.accent }}>{title}</h2>
      {subtitle && <p className="text-base opacity-60 mt-1">{subtitle}</p>}
      <AccentBar />
    </div>
  );

  const renderContent = () => {
    switch (slide.layout) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full p-16 text-center" style={{ background: t.accentGradient }}>
            <div className="w-16 h-1 rounded-full bg-white/30 mb-8" />
            <h1 className="text-5xl font-bold mb-4 leading-tight" style={{ color: "#FFFFFF" }}>{slide.title}</h1>
            {slide.subtitle && <p className="text-2xl opacity-90 mb-6" style={{ color: "#FFFFFF" }}>{slide.subtitle}</p>}
            {(content as any).tagline && (
              <p className="text-lg mt-4 opacity-80 max-w-xl leading-relaxed" style={{ color: "#FFFFFF" }}>{(content as any).tagline}</p>
            )}
            <div className="flex items-center gap-6 mt-10 opacity-60">
              {(content as any).presenter && <span className="text-sm text-white">{(content as any).presenter}</span>}
              {(content as any).date && <span className="text-sm text-white">{(content as any).date}</span>}
            </div>
          </div>
        );

      case "bullets":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            {(content as any).heading && <h3 className="text-lg font-semibold mb-4 opacity-80">{(content as any).heading}</h3>}
            <ul className="space-y-3 flex-1">
              {((content as any).bullets || []).map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-base leading-relaxed">
                  <span className="w-2.5 h-2.5 rounded-full mt-2 shrink-0 shadow-sm" style={{ backgroundColor: t.accent }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case "stats":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 flex-1 items-center">
              {((content as any).stats || []).map((s: any, i: number) => (
                <div key={i} className="text-center p-5 rounded-xl border" style={{ backgroundColor: t.secondaryBg, borderColor: t.accent + '20' }}>
                  <div className="text-4xl font-bold mb-1" style={{ color: t.accent }}>{s.value}</div>
                  <div className="text-sm opacity-70 mb-2">{s.label}</div>
                  {s.change && <div className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: t.accent + '15', color: t.accent }}>{s.change}</div>}
                </div>
              ))}
            </div>
          </div>
        );

      case "two_column":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 gap-6 flex-1">
              {["left", "right"].map((side) => {
                const col = (content as any)[side];
                if (!col) return null;
                return (
                  <div key={side} className="p-5 rounded-xl border" style={{ backgroundColor: t.secondaryBg, borderColor: t.accent + '15' }}>
                    <h3 className="text-lg font-bold mb-3" style={{ color: t.accent }}>{col.heading}</h3>
                    <ul className="space-y-2.5">
                      {(col.points || []).map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: t.accent }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full p-16 text-center" style={{ backgroundColor: t.secondaryBg }}>
            <div className="text-8xl leading-none mb-4 opacity-20" style={{ color: t.accent }}>"</div>
            <p className="text-2xl italic max-w-2xl leading-relaxed mb-6">{(content as any).quote}</p>
            <div>
              <p className="text-lg font-bold" style={{ color: t.accent }}>— {(content as any).author}</p>
              {(content as any).role && <p className="text-sm opacity-60 mt-1">{(content as any).role}</p>}
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex-1 relative flex items-center">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 opacity-20" style={{ backgroundColor: t.accent }} />
              <div className="flex items-start gap-3 w-full justify-between">
                {((content as any).events || []).map((e: any, i: number) => (
                  <div key={i} className="flex-1 text-center relative px-2">
                    <div className="text-xl font-bold mb-2" style={{ color: t.accent }}>{e.year}</div>
                    <div className="w-4 h-4 rounded-full mx-auto mb-3 border-2 shadow-sm" style={{ backgroundColor: t.bg, borderColor: t.accent }} />
                    <div className="font-semibold text-sm mb-1">{e.title}</div>
                    <div className="text-xs opacity-60 leading-relaxed">{e.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "comparison":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 gap-5 flex-1">
              {((content as any).items || []).map((item: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border" style={{ backgroundColor: t.secondaryBg, borderColor: t.accent + '15' }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: t.accent }}>{item.name}</h3>
                  {item.pros && (
                    <div className="mb-3">
                      <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Strengths</span>
                      <ul className="mt-1.5 space-y-1.5">{item.pros.map((p: string, j: number) => <li key={j} className="text-xs flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span> {p}</li>)}</ul>
                    </div>
                  )}
                  {item.cons && (
                    <div>
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Weaknesses</span>
                      <ul className="mt-1.5 space-y-1.5">{item.cons.map((c: string, j: number) => <li key={j} className="text-xs flex items-start gap-1.5"><span className="text-red-400 mt-0.5">✗</span> {c}</li>)}</ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "image_text":
        return (
          <div className="flex h-full">
            <div className="w-1/2 p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
              <AccentBar />
              {(content as any).heading && <h3 className="text-lg font-semibold mb-3">{(content as any).heading}</h3>}
              <p className="text-sm leading-relaxed opacity-80 mb-4">{(content as any).text}</p>
              {(content as any).keyPoints && (
                <ul className="space-y-2">
                  {(content as any).keyPoints.map((kp: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: t.accent }} />
                      {kp}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: t.secondaryBg }}>
              <div className="w-full h-full rounded-xl flex items-center justify-center border border-dashed opacity-40" style={{ borderColor: t.accent }}>
                <div className="text-center">
                  <Image className="w-12 h-12 mx-auto mb-2" style={{ color: t.accent }} />
                  <p className="text-xs opacity-60">{(content as any).imagePrompt || "Visual placeholder"}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "funnel":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              {((content as any).stages || []).map((stage: any, i: number, arr: any[]) => {
                const widthPct = 100 - (i * (60 / arr.length));
                return (
                  <div key={i} className="flex items-center gap-4 w-full" style={{ maxWidth: `${widthPct}%` }}>
                    <div className="flex-1 py-3 px-5 rounded-lg text-center border" style={{ background: t.accentGradient, opacity: 1 - (i * 0.12) }}>
                      <div className="text-sm font-bold text-white">{stage.name}</div>
                      {stage.value && <div className="text-xs text-white/80 mt-0.5">{stage.value}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "swot":
        return (
          <div className="flex flex-col h-full p-10">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { key: "strengths", label: "Strengths", color: "#22C55E", bg: "#22C55E15" },
                { key: "weaknesses", label: "Weaknesses", color: "#EF4444", bg: "#EF444415" },
                { key: "opportunities", label: "Opportunities", color: "#3B82F6", bg: "#3B82F615" },
                { key: "threats", label: "Threats", color: "#F59E0B", bg: "#F59E0B15" },
              ].map(({ key, label, color, bg }) => (
                <div key={key} className="p-4 rounded-xl border" style={{ backgroundColor: bg, borderColor: color + '30' }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color }}>{label}</h4>
                  <ul className="space-y-1.5">
                    {((content as any)[key] || []).map((item: string, i: number) => (
                      <li key={i} className="text-xs leading-relaxed flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case "roadmap":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex gap-4 flex-1 items-stretch">
              {((content as any).phases || []).map((phase: any, i: number) => {
                const statusColors: Record<string, string> = { done: "#22C55E", active: "#3B82F6", upcoming: "#94A3B8" };
                const sc = statusColors[phase.status] || t.accent;
                return (
                  <div key={i} className="flex-1 p-4 rounded-xl border-t-4 flex flex-col" style={{ backgroundColor: t.secondaryBg, borderTopColor: sc }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold">{phase.name}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sc + '20', color: sc }}>{phase.status}</span>
                    </div>
                    <p className="text-[10px] opacity-50 mb-2">{phase.timeline}</p>
                    <ul className="space-y-1.5 flex-1">
                      {(phase.items || []).map((item: string, j: number) => (
                        <li key={j} className="text-xs flex items-start gap-1.5">
                          <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: sc }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "kpi_dashboard":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-3 gap-4 flex-1 items-center">
              {((content as any).kpis || []).map((kpi: any, i: number) => {
                const statusColors: Record<string, string> = { on_track: "#22C55E", at_risk: "#F59E0B", behind: "#EF4444" };
                const sc = statusColors[kpi.status] || t.accent;
                return (
                  <div key={i} className="p-4 rounded-xl border-l-4 text-center" style={{ backgroundColor: t.secondaryBg, borderLeftColor: sc }}>
                    <p className="text-xs opacity-50 uppercase tracking-wider mb-1">{kpi.name}</p>
                    <div className="text-3xl font-bold mb-1" style={{ color: t.accent }}>{kpi.value}</div>
                    <p className="text-[10px] opacity-50">Target: {kpi.target}</p>
                    {kpi.trend && <p className="text-xs font-semibold mt-1" style={{ color: sc }}>{kpi.trend}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "process":
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex gap-3 flex-1 items-center">
              {((content as any).steps || []).map((step: any, i: number, arr: any[]) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3 shadow-md" style={{ background: t.accentGradient }}>
                      {step.number || i + 1}
                    </div>
                    <h4 className="text-sm font-bold mb-1">{step.title}</h4>
                    <p className="text-xs opacity-60 leading-relaxed px-1">{step.description}</p>
                  </div>
                  {i < arr.length - 1 && <div className="w-8 h-0.5 shrink-0 opacity-30" style={{ backgroundColor: t.accent }} />}
                </div>
              ))}
            </div>
          </div>
        );

      case "closing":
        return (
          <div className="flex flex-col items-center justify-center h-full p-16 text-center" style={{ background: t.accentGradient }}>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#FFFFFF" }}>{slide.title}</h2>
            {(content as any).heading && <p className="text-xl mb-6 opacity-90 max-w-xl" style={{ color: "#FFFFFF" }}>{(content as any).heading}</p>}
            {(content as any).nextSteps && (
              <div className="mb-6 text-left max-w-md">
                {(content as any).nextSteps.map((ns: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-white/90">{ns}</span>
                  </div>
                ))}
              </div>
            )}
            {(content as any).cta && (
              <div className="px-8 py-3 rounded-full text-lg font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>
                {(content as any).cta}
              </div>
            )}
            {(content as any).contact && <p className="mt-6 text-sm opacity-60" style={{ color: "#FFFFFF" }}>{(content as any).contact}</p>}
          </div>
        );

      default: // content
        return (
          <div className="flex flex-col h-full p-12">
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            {(content as any).heading && <h3 className="text-lg font-semibold mb-4 opacity-80">{(content as any).heading}</h3>}
            <div className="space-y-4 flex-1">
              {((content as any).paragraphs || []).map((p: string, i: number) => (
                <p key={i} className="text-base leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={baseStyle} className="rounded-lg shadow-xl border border-border/20">
      {renderContent()}
      <div className="absolute bottom-3 right-4 text-xs opacity-20 font-medium" style={{ color: t.text }}>ShadowTalk AI</div>
    </div>
  );
};

const PresentationBuilderPage = () => {
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [slideCount, setSlideCount] = useState("10");
  const [style, setStyle] = useState<ThemeKey>("corporate");
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const generatePresentation = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-presentation", {
        body: { topic, slideCount: parseInt(slideCount), style, additionalContext },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Add IDs to slides
      const slides = (data.slides || []).map((s: Slide, i: number) => ({ ...s, id: `slide-${i}-${Date.now()}` }));
      setPresentation({ ...data, slides });
      setCurrentSlide(0);
      setActiveTab("editor");
      toast.success(`Generated ${slides.length} slides!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  }, [topic, slideCount, style, additionalContext]);

  const exportToPPTX = useCallback(async () => {
    if (!presentation) return;
    setIsExporting(true);
    try {
      const pptxgenjs = await import("pptxgenjs");
      const pptx = new pptxgenjs.default();
      const t = THEMES[style];

      pptx.author = "ShadowTalk AI";
      pptx.title = presentation.title;

      for (const slide of presentation.slides) {
        const pptSlide = pptx.addSlide();
        const content = slide.content || {};

        if (slide.layout === "title" || slide.layout === "closing") {
          pptSlide.background = { color: t.accent.replace("#", "") };
          pptSlide.addText(slide.title, { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 36, bold: true, color: "FFFFFF", align: "center" });
          if (slide.subtitle) pptSlide.addText(slide.subtitle, { x: 0.5, y: 3.2, w: 9, h: 1, fontSize: 20, color: "FFFFFF", align: "center" });
          const tagline = (content as { tagline?: string; cta?: string }).tagline || (content as { cta?: string }).cta;
          if (tagline) pptSlide.addText(tagline, { x: 1.5, y: 4.2, w: 7, h: 0.8, fontSize: 14, color: "FFFFFF", align: "center" });
        } else {
          pptSlide.background = { color: t.bg.replace("#", "") };
          pptSlide.addText(slide.title, { x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, bold: true, color: t.accent.replace("#", "") });
          pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: 0.5, y: 1.05, w: 1.5, h: 0.06, fill: { color: t.accent.replace("#", "") } });

          if (slide.layout === "bullets") {
            const bullets = (content as { bullets?: string[] }).bullets || [];
            bullets.forEach((b: string, i: number) => {
              pptSlide.addText(`• ${b}`, { x: 0.8, y: 1.4 + i * 0.6, w: 8.2, h: 0.5, fontSize: 16, color: t.text.replace("#", "") });
            });
          } else if (slide.layout === "stats") {
            const stats = (content as { stats?: Array<{value: string; label: string}> }).stats || [];
            stats.forEach((s, i) => {
              const col = i % 4;
              pptSlide.addText(s.value, { x: 0.5 + col * 2.3, y: 2, w: 2, h: 0.8, fontSize: 32, bold: true, color: t.accent.replace("#", ""), align: "center" });
              pptSlide.addText(s.label, { x: 0.5 + col * 2.3, y: 2.8, w: 2, h: 0.5, fontSize: 11, color: t.text.replace("#", ""), align: "center" });
            });
          } else if (slide.layout === "quote") {
            pptSlide.addText(`"${(content as { quote?: string }).quote}"`, { x: 1, y: 1.5, w: 8, h: 2, fontSize: 22, italic: true, color: t.text.replace("#", ""), align: "center" });
            pptSlide.addText(`— ${(content as { author?: string }).author}`, { x: 1, y: 3.8, w: 8, h: 0.5, fontSize: 16, bold: true, color: t.accent.replace("#", ""), align: "center" });
          } else if (slide.layout === "two_column") {
            ["left", "right"].forEach((side, idx) => {
              const col = (content as Record<string, { heading?: string; points?: string[] }>)[side];
              if (!col) return;
              const xOff = idx === 0 ? 0.5 : 5.2;
              pptSlide.addText(col.heading || "", { x: xOff, y: 1.4, w: 4.3, h: 0.5, fontSize: 18, bold: true, color: t.accent.replace("#", "") });
              (col.points || []).forEach((p: string, j: number) => {
                pptSlide.addText(`• ${p}`, { x: xOff + 0.2, y: 2.1 + j * 0.5, w: 4, h: 0.4, fontSize: 13, color: t.text.replace("#", "") });
              });
            });
          } else {
            const paragraphs = (content as { paragraphs?: string[] }).paragraphs || [];
            paragraphs.forEach((p: string, i: number) => {
              pptSlide.addText(p, { x: 0.5, y: 1.4 + i * 0.8, w: 9, h: 0.7, fontSize: 15, color: t.text.replace("#", "") });
            });
          }
        }

        if (slide.speakerNotes) pptSlide.addNotes(slide.speakerNotes);
      }

      const filename = `${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
      await pptx.writeFile({ fileName: filename });
      toast.success("PPTX downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [presentation, style]);

  const addSlide = useCallback((layout: string = "bullets") => {
    if (!presentation) return;
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      layout,
      title: "New Slide",
      content: layout === "bullets" ? { bullets: ["Point 1", "Point 2", "Point 3"] } : { paragraphs: ["Add your content here."] },
      speakerNotes: "",
    };
    const slides = [...presentation.slides];
    slides.splice(currentSlide + 1, 0, newSlide);
    setPresentation({ ...presentation, slides });
    setCurrentSlide(currentSlide + 1);
  }, [presentation, currentSlide]);

  const deleteSlide = useCallback((index: number) => {
    if (!presentation || presentation.slides.length <= 1) return;
    const slides = presentation.slides.filter((_, i) => i !== index);
    setPresentation({ ...presentation, slides });
    if (currentSlide >= slides.length) setCurrentSlide(slides.length - 1);
  }, [presentation, currentSlide]);

  const duplicateSlide = useCallback((index: number) => {
    if (!presentation) return;
    const slides = [...presentation.slides];
    const dup = { ...slides[index], id: `slide-dup-${Date.now()}` };
    slides.splice(index + 1, 0, dup);
    setPresentation({ ...presentation, slides });
  }, [presentation]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      fullscreenRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const currentSlideData = presentation?.slides[currentSlide];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-64px)]">
          {/* Top toolbar */}
          <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <Presentation className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">ShadowTalk Presentations</span>
              {presentation && <Badge variant="secondary" className="text-xs">{presentation.slides.length} slides</Badge>}
            </div>
            <TabsList className="h-8">
              <TabsTrigger value="generate" className="text-xs px-3 h-7">
                <Wand2 className="w-3 h-3 mr-1" /> Generate
              </TabsTrigger>
              <TabsTrigger value="editor" className="text-xs px-3 h-7" disabled={!presentation}>
                <SlidersHorizontal className="w-3 h-3 mr-1" /> Editor
              </TabsTrigger>
              <TabsTrigger value="present" className="text-xs px-3 h-7" disabled={!presentation}>
                <Eye className="w-3 h-3 mr-1" /> Present
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {presentation && (
                <>
                  <Button size="sm" variant="outline" onClick={() => addSlide()} className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Add Slide
                  </Button>
                  <Button size="sm" onClick={exportToPPTX} disabled={isExporting} className="h-7 text-xs gap-1">
                    {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Export PPTX
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Generate Tab */}
          <TabsContent value="generate" className="m-0 h-full">
            <div className="flex items-center justify-center h-full p-8">
              <Card className="w-full max-w-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Wand2 className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">AI Presentation Builder</h2>
                  <p className="text-muted-foreground">Describe your topic and let AI create stunning slides</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Topic / Title</label>
                    <Input 
                      placeholder="e.g. Q4 Revenue Growth Strategy for SaaS Startups" 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Additional Context (optional)</label>
                    <Textarea 
                      placeholder="Key points, data, audience info..." 
                      value={additionalContext} 
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Slides</label>
                      <Select value={slideCount} onValueChange={setSlideCount}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["5", "8", "10", "15", "20"].map(n => <SelectItem key={n} value={n}>{n} slides</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Theme</label>
                      <Select value={style} onValueChange={(v) => setStyle(v as ThemeKey)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(THEMES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.accent }} />
                                {v.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={generatePresentation} disabled={isGenerating} className="w-full h-12 text-base gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Generating Slides...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" /> Generate Presentation
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="m-0 h-full">
            {presentation && (
              <div className="flex h-full">
                {/* Sidebar thumbnails */}
                <div className="w-52 border-r border-border overflow-y-auto p-2 bg-muted/30 space-y-2">
                  {presentation.slides.map((slide, i) => (
                    <div
                      key={slide.id}
                      onClick={() => setCurrentSlide(i)}
                      className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        i === currentSlide ? "border-primary shadow-lg" : "border-transparent hover:border-primary/30"
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground absolute top-1 left-1 z-10 bg-background/80 px-1 rounded">{i + 1}</div>
                      <div className="w-48 h-[108px] overflow-hidden">
                        <SlideRenderer slide={slide} theme={style} scale={0.2} />
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="p-0.5 bg-background/80 rounded hover:bg-background">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} className="p-0.5 bg-background/80 rounded hover:bg-destructive/20">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addSlide()} className="w-full text-xs gap-1 h-8">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>

                {/* Main canvas */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-muted/20 p-8 overflow-auto">
                    {currentSlideData && (
                      <div className="shadow-2xl rounded-xl overflow-hidden">
                        <SlideRenderer slide={currentSlideData} theme={style} scale={0.75} />
                      </div>
                    )}
                  </div>
                  {/* Navigation */}
                  <div className="border-t border-border p-3 flex items-center justify-between bg-card/50">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {currentSlide + 1} / {presentation.slides.length}
                      </span>
                      {currentSlideData && (
                        <Badge variant="outline" className="text-xs gap-1">
                          {LAYOUT_ICONS[currentSlideData.layout]} {currentSlideData.layout}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentSlide(Math.min(presentation.slides.length - 1, currentSlide + 1))} disabled={currentSlide === presentation.slides.length - 1}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Speaker notes */}
                  {currentSlideData?.speakerNotes && (
                    <div className="border-t border-border p-3 bg-muted/20">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Speaker Notes</p>
                      <p className="text-sm">{currentSlideData.speakerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Present Tab (Fullscreen mode) */}
          <TabsContent value="present" className="m-0 h-full">
            {presentation && (
              <div ref={fullscreenRef} className="h-full bg-black flex flex-col items-center justify-center relative" onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === " ") setCurrentSlide(Math.min(presentation.slides.length - 1, currentSlide + 1));
                if (e.key === "ArrowLeft") setCurrentSlide(Math.max(0, currentSlide - 1));
                if (e.key === "Escape") setActiveTab("editor");
              }} tabIndex={0}>
                <AnimatePresence mode="wait">
                  {currentSlideData && (
                    <motion.div
                      key={currentSlideData.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SlideRenderer slide={currentSlideData} theme={style} scale={1.2} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 px-6 py-2 rounded-full backdrop-blur">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} className="text-white hover:text-white/80">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-white text-sm">{currentSlide + 1} / {presentation.slides.length}</span>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentSlide(Math.min(presentation.slides.length - 1, currentSlide + 1))} className="text-white hover:text-white/80">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:text-white/80">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PresentationBuilderPage;
