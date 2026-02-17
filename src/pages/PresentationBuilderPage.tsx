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

  const renderContent = () => {
    switch (slide.layout) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full p-16 text-center" style={{ background: t.accentGradient }}>
            <h1 className="text-5xl font-bold mb-6" style={{ color: "#FFFFFF" }}>{slide.title}</h1>
            {slide.subtitle && <p className="text-2xl opacity-90" style={{ color: "#FFFFFF" }}>{slide.subtitle}</p>}
            {(content as { tagline?: string }).tagline && (
              <p className="text-lg mt-8 opacity-75" style={{ color: "#FFFFFF" }}>{(content as { tagline: string }).tagline}</p>
            )}
          </div>
        );

      case "bullets":
        return (
          <div className="flex flex-col h-full p-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
            <div className="h-1 w-20 rounded mb-8" style={{ background: t.accentGradient }} />
            {(content as { heading?: string }).heading && <h3 className="text-xl font-semibold mb-6">{(content as { heading: string }).heading}</h3>}
            <ul className="space-y-4 flex-1">
              {((content as { bullets?: string[] }).bullets || []).map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-lg">
                  <span className="w-2 h-2 rounded-full mt-2.5 shrink-0" style={{ backgroundColor: t.accent }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        );

      case "stats":
        return (
          <div className="flex flex-col h-full p-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
            <div className="h-1 w-20 rounded mb-8" style={{ background: t.accentGradient }} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1 items-center">
              {((content as { stats?: Array<{value: string; label: string}> }).stats || []).map((s, i) => (
                <div key={i} className="text-center p-6 rounded-xl" style={{ backgroundColor: t.secondaryBg }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: t.accent }}>{s.value}</div>
                  <div className="text-sm opacity-70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "two_column":
        return (
          <div className="flex flex-col h-full p-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
            <div className="h-1 w-20 rounded mb-8" style={{ background: t.accentGradient }} />
            <div className="grid grid-cols-2 gap-8 flex-1">
              {["left", "right"].map((side) => {
                const col = (content as Record<string, { heading?: string; points?: string[] }>)[side];
                if (!col) return null;
                return (
                  <div key={side} className="p-6 rounded-xl" style={{ backgroundColor: t.secondaryBg }}>
                    <h3 className="text-xl font-semibold mb-4" style={{ color: t.accent }}>{col.heading}</h3>
                    <ul className="space-y-3">
                      {(col.points || []).map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
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
            <div className="text-7xl mb-6" style={{ color: t.accent }}>"</div>
            <p className="text-2xl italic max-w-2xl leading-relaxed">{(content as { quote?: string }).quote}</p>
            <p className="text-lg mt-8 font-semibold" style={{ color: t.accent }}>— {(content as { author?: string }).author}</p>
          </div>
        );

      case "timeline":
        return (
          <div className="flex flex-col h-full p-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
            <div className="h-1 w-20 rounded mb-8" style={{ background: t.accentGradient }} />
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
              {((content as { events?: Array<{year: string; title: string; description: string}> }).events || []).map((e, i) => (
                <div key={i} className="flex-1 text-center p-4">
                  <div className="text-2xl font-bold mb-2" style={{ color: t.accent }}>{e.year}</div>
                  <div className="w-3 h-3 rounded-full mx-auto mb-3" style={{ backgroundColor: t.accent }} />
                  <div className="font-semibold mb-1 text-sm">{e.title}</div>
                  <div className="text-xs opacity-70">{e.description}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "comparison":
        return (
          <div className="flex flex-col h-full p-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
            <div className="h-1 w-20 rounded mb-6" style={{ background: t.accentGradient }} />
            <div className="grid grid-cols-2 gap-6 flex-1">
              {((content as { items?: Array<{name: string; pros?: string[]; cons?: string[]}> }).items || []).map((item, i) => (
                <div key={i} className="p-5 rounded-xl" style={{ backgroundColor: t.secondaryBg }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: t.accent }}>{item.name}</h3>
                  {item.pros && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-green-600">PROS</span>
                      <ul className="mt-1 space-y-1">{item.pros.map((p, j) => <li key={j} className="text-xs">✓ {p}</li>)}</ul>
                    </div>
                  )}
                  {item.cons && (
                    <div>
                      <span className="text-xs font-semibold text-red-500">CONS</span>
                      <ul className="mt-1 space-y-1">{item.cons.map((c, j) => <li key={j} className="text-xs">✗ {c}</li>)}</ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "closing":
        return (
          <div className="flex flex-col items-center justify-center h-full p-16 text-center" style={{ background: t.accentGradient }}>
            <h2 className="text-4xl font-bold mb-6" style={{ color: "#FFFFFF" }}>{slide.title}</h2>
            {(content as { heading?: string }).heading && <p className="text-xl mb-8 opacity-90" style={{ color: "#FFFFFF" }}>{(content as { heading: string }).heading}</p>}
            {(content as { cta?: string }).cta && (
              <div className="px-8 py-3 rounded-full text-lg font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>
                {(content as { cta: string }).cta}
              </div>
            )}
            {(content as { contact?: string }).contact && <p className="mt-6 text-sm opacity-75" style={{ color: "#FFFFFF" }}>{(content as { contact: string }).contact}</p>}
          </div>
        );

      default: // content
        return (
          <div className="flex flex-col h-full p-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: t.accent }}>{slide.title}</h2>
            <div className="h-1 w-20 rounded mb-8" style={{ background: t.accentGradient }} />
            {(content as { heading?: string }).heading && <h3 className="text-xl font-semibold mb-4">{(content as { heading: string }).heading}</h3>}
            <div className="space-y-4 flex-1">
              {((content as { paragraphs?: string[] }).paragraphs || []).map((p: string, i: number) => (
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
      <div className="absolute bottom-3 right-4 text-xs opacity-30" style={{ color: t.text }}>ShadowTalk AI</div>
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
