import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Presentation, Plus, Download, Wand2, ChevronLeft, ChevronRight, 
  Trash2, Copy, Type, BarChart3, Quote, Layout, 
  Clock, GitCompare, List, Image, Loader2, Maximize, Minimize,
  SlidersHorizontal, FileText, Eye, Search, ListTree, Palette, Sparkles
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
import SlideRenderer from "@/components/presentation/SlideRenderer";
import GenerationProgress, { GenerationPhase } from "@/components/presentation/GenerationProgress";
import { Slide, PresentationData, ThemeKey, THEMES } from "@/components/presentation/types";

// Re-export for backward compatibility
export type { Slide, ThemeKey };
export { THEMES };

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
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("idle");
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const generatePresentation = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setIsGenerating(true);
    setGenerationPhase("researching");

    // Simulate Manus-like phased progress
    const phaseTimers: ReturnType<typeof setTimeout>[] = [];
    phaseTimers.push(setTimeout(() => setGenerationPhase("structuring"), 3000));
    phaseTimers.push(setTimeout(() => setGenerationPhase("designing"), 7000));
    phaseTimers.push(setTimeout(() => setGenerationPhase("polishing"), 12000));

    try {
      const { data, error } = await supabase.functions.invoke("generate-presentation", {
        body: { topic, slideCount: parseInt(slideCount), style, additionalContext },
      });

      // Clear phase timers
      phaseTimers.forEach(clearTimeout);

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGenerationPhase("done");
      const slides = (data.slides || []).map((s: Slide, i: number) => ({ ...s, id: `slide-${i}-${Date.now()}` }));
      setPresentation({ ...data, slides });
      setCurrentSlide(0);
      setActiveTab("editor");
      toast.success(`Generated ${slides.length} research-backed slides!`);
    } catch (err) {
      phaseTimers.forEach(clearTimeout);
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setIsGenerating(false);
      setGenerationPhase("idle");
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
      pptx.layout = "LAYOUT_WIDE";

      for (const slide of presentation.slides) {
        const pptSlide = pptx.addSlide();
        const content = slide.content || {};
        const accentClean = t.accent.replace("#", "");
        const accentEndClean = t.accentEnd.replace("#", "");
        const textClean = t.text.replace("#", "");
        const bgClean = t.bg.replace("#", "");
        const secondaryClean = t.secondaryBg.replace("#", "");

        if (slide.layout === "title" || slide.layout === "closing") {
          pptSlide.background = { fill: accentClean };
          // Decorative shapes
          pptSlide.addShape(pptxgenjs.default.ShapeType.ellipse, { x: -1, y: -1, w: 4, h: 4, fill: { color: "FFFFFF", transparency: 92 } });
          pptSlide.addShape(pptxgenjs.default.ShapeType.ellipse, { x: 7.5, y: 3, w: 5, h: 5, fill: { color: "FFFFFF", transparency: 94 } });
          // Top line
          pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: 4, y: 1, w: 2, h: 0.04, fill: { color: "FFFFFF", transparency: 60 } });

          pptSlide.addText(slide.title, { x: 1, y: 1.5, w: 8, h: 1.6, fontSize: 36, bold: true, color: "FFFFFF", align: "center", fontFace: "Arial" });
          if (slide.subtitle) pptSlide.addText(slide.subtitle, { x: 1.5, y: 3.2, w: 7, h: 0.8, fontSize: 18, color: "FFFFFF", align: "center", transparency: 15 });

          if (slide.layout === "title") {
            const tagline = (content as any).tagline;
            if (tagline) pptSlide.addText(tagline, { x: 1.5, y: 4.1, w: 7, h: 0.6, fontSize: 13, color: "FFFFFF", align: "center", italic: true, transparency: 30 });
            const presenterDate = [(content as any).presenter, (content as any).date].filter(Boolean).join("  |  ");
            if (presenterDate) pptSlide.addText(presenterDate, { x: 2, y: 5, w: 6, h: 0.4, fontSize: 11, color: "FFFFFF", align: "center", transparency: 45 });
          } else {
            // Closing
            const heading = (content as any).heading;
            if (heading) pptSlide.addText(heading, { x: 1.5, y: 3.2, w: 7, h: 0.6, fontSize: 16, color: "FFFFFF", align: "center", transparency: 15 });
            const nextSteps = (content as any).nextSteps || [];
            nextSteps.forEach((ns: string, i: number) => {
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: 2.8, y: 4 + i * 0.5, w: 0.35, h: 0.3, fill: { color: "FFFFFF", transparency: 80 }, rectRadius: 0.05 });
              pptSlide.addText(`${i + 1}`, { x: 2.8, y: 4 + i * 0.5, w: 0.35, h: 0.3, fontSize: 9, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
              pptSlide.addText(ns, { x: 3.3, y: 4 + i * 0.5, w: 5, h: 0.3, fontSize: 12, color: "FFFFFF", transparency: 15 });
            });
            const cta = (content as any).cta;
            if (cta) {
              const yPos = 4 + nextSteps.length * 0.5 + 0.4;
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: 3, y: yPos, w: 4, h: 0.5, fill: { color: "FFFFFF", transparency: 85 }, rectRadius: 0.25, line: { color: "FFFFFF", width: 1.5, transparency: 70 } });
              pptSlide.addText(cta, { x: 3, y: yPos, w: 4, h: 0.5, fontSize: 13, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
            }
          }
        } else {
          pptSlide.background = { fill: bgClean };
          // Accent bar at bottom
          pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: 0, y: 7.3, w: 13.33, h: 0.12, fill: { color: accentClean } });
          // Corner accent
          pptSlide.addShape(pptxgenjs.default.ShapeType.ellipse, { x: 10.5, y: -0.8, w: 3.5, h: 3.5, fill: { color: accentClean, transparency: 94 } });
          // Title bar indicator
          pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: 0.5, y: 0.38, w: 0.08, h: 0.6, fill: { color: accentClean }, rectRadius: 0.04 });
          pptSlide.addText(slide.title, { x: 0.75, y: 0.3, w: 9, h: 0.7, fontSize: 24, bold: true, color: accentClean, fontFace: "Arial" });
          if (slide.subtitle) pptSlide.addText(slide.subtitle, { x: 0.75, y: 0.95, w: 9, h: 0.35, fontSize: 11, color: textClean, italic: true, transparency: 50 });

          const yStart = slide.subtitle ? 1.5 : 1.3;

          if (slide.layout === "bullets") {
            const bullets = (content as any).bullets || [];
            bullets.forEach((b: string, i: number) => {
              // Numbered badge
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: 0.7, y: yStart + i * 0.65, w: 0.35, h: 0.35, fill: { color: accentClean }, rectRadius: 0.05 });
              pptSlide.addText(`${i + 1}`, { x: 0.7, y: yStart + i * 0.65, w: 0.35, h: 0.35, fontSize: 10, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
              pptSlide.addText(b, { x: 1.2, y: yStart + i * 0.65, w: 8.5, h: 0.55, fontSize: 13, color: textClean });
            });
          } else if (slide.layout === "stats") {
            const stats = (content as any).stats || [];
            stats.forEach((s: any, i: number) => {
              const xPos = 0.5 + i * 3;
              // Card background
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xPos, y: yStart + 0.5, w: 2.7, h: 2.2, fill: { color: secondaryClean }, rectRadius: 0.15, line: { color: accentClean, width: 0.5, transparency: 85 } });
              // Top accent line
              pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: xPos, y: yStart + 0.5, w: 2.7, h: 0.06, fill: { color: accentClean, transparency: 40 } });
              pptSlide.addText(s.value, { x: xPos, y: yStart + 0.8, w: 2.7, h: 0.8, fontSize: 28, bold: true, color: accentClean, align: "center" });
              pptSlide.addText(s.label, { x: xPos + 0.15, y: yStart + 1.5, w: 2.4, h: 0.4, fontSize: 10, color: textClean, align: "center", transparency: 40 });
              if (s.change) {
                pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xPos + 0.6, y: yStart + 1.9, w: 1.5, h: 0.3, fill: { color: accentClean, transparency: 88 }, rectRadius: 0.15 });
                pptSlide.addText(s.change, { x: xPos + 0.6, y: yStart + 1.9, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: accentClean, align: "center", valign: "middle" });
              }
            });
          } else if (slide.layout === "quote") {
            // Giant quote marks
            pptSlide.addText('"', { x: 0.8, y: 1, w: 2, h: 2, fontSize: 120, color: accentClean, transparency: 90, fontFace: "Georgia" });
            pptSlide.addText((content as any).quote || "", { x: 1.5, y: 2, w: 7.5, h: 2.5, fontSize: 20, italic: true, color: textClean, align: "center" });
            pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: 4.5, y: 4.8, w: 1.5, h: 0.04, fill: { color: accentClean } });
            pptSlide.addText(`${(content as any).author || ""}`, { x: 2, y: 5, w: 6, h: 0.4, fontSize: 15, bold: true, color: accentClean, align: "center" });
            if ((content as any).role) pptSlide.addText((content as any).role, { x: 2, y: 5.4, w: 6, h: 0.3, fontSize: 11, color: textClean, align: "center", transparency: 50 });
          } else if (slide.layout === "two_column") {
            ["left", "right"].forEach((side, idx) => {
              const col = (content as any)[side];
              if (!col) return;
              const xOff = idx === 0 ? 0.5 : 5.5;
              // Card bg
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xOff, y: yStart, w: 4.5, h: 4.8, fill: { color: secondaryClean }, rectRadius: 0.15, line: { color: accentClean, width: 0.5, transparency: 88 } });
              pptSlide.addShape(pptxgenjs.default.ShapeType.ellipse, { x: xOff + 0.2, y: yStart + 0.2, w: 0.15, h: 0.15, fill: { color: accentClean } });
              pptSlide.addText(col.heading || "", { x: xOff + 0.5, y: yStart + 0.1, w: 3.8, h: 0.4, fontSize: 14, bold: true, color: accentClean });
              (col.points || []).forEach((p: string, j: number) => {
                pptSlide.addText(`• ${p}`, { x: xOff + 0.4, y: yStart + 0.7 + j * 0.6, w: 3.8, h: 0.5, fontSize: 11, color: textClean });
              });
            });
          } else if (slide.layout === "swot") {
            const quads = [
              { key: "strengths", label: "STRENGTHS", color: "16A34A", x: 0.5, y: yStart },
              { key: "weaknesses", label: "WEAKNESSES", color: "DC2626", x: 5.2, y: yStart },
              { key: "opportunities", label: "OPPORTUNITIES", color: "2563EB", x: 0.5, y: yStart + 2.8 },
              { key: "threats", label: "THREATS", color: "D97706", x: 5.2, y: yStart + 2.8 },
            ];
            quads.forEach(({ key, label, color, x, y }) => {
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x, y, w: 4.5, h: 2.5, fill: { color, transparency: 94 }, rectRadius: 0.15, line: { color, width: 0.8, transparency: 75 } });
              pptSlide.addText(label, { x: x + 0.2, y: y + 0.1, w: 3, h: 0.3, fontSize: 9, bold: true, color });
              ((content as any)[key] || []).forEach((item: string, i: number) => {
                pptSlide.addText(`• ${item}`, { x: x + 0.3, y: y + 0.5 + i * 0.45, w: 3.9, h: 0.4, fontSize: 10, color: textClean });
              });
            });
          } else if (slide.layout === "timeline") {
            const events = (content as any).events || [];
            // Timeline line
            pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: 0.8, y: yStart + 1.5, w: 9.5, h: 0.03, fill: { color: accentClean, transparency: 80 } });
            events.forEach((e: any, i: number) => {
              const xPos = 0.8 + (i * (9.5 / events.length));
              pptSlide.addShape(pptxgenjs.default.ShapeType.ellipse, { x: xPos + 0.3, y: yStart + 1.35, w: 0.3, h: 0.3, fill: { color: bgClean }, line: { color: accentClean, width: 2 } });
              pptSlide.addText(e.year, { x: xPos, y: yStart + 0.5, w: 1.5, h: 0.4, fontSize: 14, bold: true, color: accentClean, align: "center" });
              pptSlide.addText(e.title, { x: xPos, y: yStart + 1.8, w: 1.5, h: 0.3, fontSize: 10, bold: true, color: textClean, align: "center" });
              pptSlide.addText(e.description, { x: xPos - 0.1, y: yStart + 2.2, w: 1.7, h: 0.8, fontSize: 8, color: textClean, align: "center", transparency: 40 });
            });
          } else if (slide.layout === "kpi_dashboard") {
            const kpis = (content as any).kpis || [];
            const cols = 3;
            kpis.forEach((kpi: any, i: number) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const xPos = 0.5 + col * 3.5;
              const yPos = yStart + row * 2.5;
              const statusColors: Record<string, string> = { on_track: "16A34A", at_risk: "D97706", behind: "DC2626" };
              const sc = statusColors[kpi.status] || accentClean;
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xPos, y: yPos, w: 3.2, h: 2.2, fill: { color: secondaryClean }, rectRadius: 0.15 });
              pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: xPos, y: yPos, w: 0.06, h: 2.2, fill: { color: sc } });
              pptSlide.addText(kpi.name, { x: xPos + 0.2, y: yPos + 0.15, w: 2.8, h: 0.25, fontSize: 8, bold: true, color: textClean, transparency: 50 });
              pptSlide.addText(kpi.value, { x: xPos + 0.2, y: yPos + 0.5, w: 2.8, h: 0.7, fontSize: 24, bold: true, color: accentClean });
              pptSlide.addText(`Target: ${kpi.target}`, { x: xPos + 0.2, y: yPos + 1.3, w: 1.5, h: 0.25, fontSize: 8, color: textClean, transparency: 50 });
              if (kpi.trend) pptSlide.addText(kpi.trend, { x: xPos + 1.8, y: yPos + 1.3, w: 1.2, h: 0.25, fontSize: 9, bold: true, color: sc, align: "right" });
            });
          } else if (slide.layout === "roadmap") {
            const phases = (content as any).phases || [];
            const phaseWidth = (10 - 0.5 * (phases.length + 1)) / phases.length;
            phases.forEach((phase: any, i: number) => {
              const xPos = 0.5 + i * (phaseWidth + 0.5);
              const statusColors: Record<string, string> = { done: "16A34A", active: "2563EB", upcoming: "94A3B8" };
              const sc = statusColors[phase.status] || accentClean;
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xPos, y: yStart, w: phaseWidth, h: 5, fill: { color: secondaryClean }, rectRadius: 0.15 });
              pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: xPos, y: yStart, w: phaseWidth, h: 0.08, fill: { color: sc } });
              pptSlide.addText(phase.name, { x: xPos + 0.15, y: yStart + 0.2, w: phaseWidth - 0.3, h: 0.3, fontSize: 11, bold: true, color: textClean });
              pptSlide.addText(phase.timeline || "", { x: xPos + 0.15, y: yStart + 0.5, w: phaseWidth - 0.3, h: 0.2, fontSize: 8, color: textClean, transparency: 55 });
              (phase.items || []).forEach((item: string, j: number) => {
                pptSlide.addText(`• ${item}`, { x: xPos + 0.2, y: yStart + 0.9 + j * 0.45, w: phaseWidth - 0.4, h: 0.4, fontSize: 9, color: textClean });
              });
            });
          } else if (slide.layout === "process") {
            const steps = (content as any).steps || [];
            steps.forEach((step: any, i: number) => {
              const xPos = 0.4 + i * (10 / steps.length);
              const w = (10 / steps.length) - 0.4;
              // Circle number
              pptSlide.addShape(pptxgenjs.default.ShapeType.ellipse, { x: xPos + w / 2 - 0.25, y: yStart + 0.5, w: 0.5, h: 0.5, fill: { color: accentClean } });
              pptSlide.addText(`${step.number || i + 1}`, { x: xPos + w / 2 - 0.25, y: yStart + 0.5, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
              pptSlide.addText(step.title, { x: xPos, y: yStart + 1.2, w: w, h: 0.35, fontSize: 11, bold: true, color: textClean, align: "center" });
              pptSlide.addText(step.description, { x: xPos, y: yStart + 1.6, w: w, h: 1, fontSize: 9, color: textClean, align: "center", transparency: 40 });
              // Arrow
              if (i < steps.length - 1) {
                pptSlide.addShape(pptxgenjs.default.ShapeType.rect, { x: xPos + w - 0.05, y: yStart + 0.7, w: 0.4, h: 0.03, fill: { color: accentClean, transparency: 75 } });
              }
            });
          } else if (slide.layout === "funnel") {
            const stages = (content as any).stages || [];
            stages.forEach((stage: any, i: number) => {
              const indent = i * 0.5;
              const w = 10 - indent * 2;
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: 0.5 + indent, y: yStart + i * 0.9, w, h: 0.7, fill: { color: accentClean, transparency: 15 + i * 10 }, rectRadius: 0.1 });
              pptSlide.addText(`${stage.name}${stage.value ? ' — ' + stage.value : ''}`, { x: 0.5 + indent + 0.3, y: yStart + i * 0.9, w: w - 0.6, h: 0.7, fontSize: 13, bold: true, color: "FFFFFF", valign: "middle" });
            });
          } else if (slide.layout === "comparison") {
            const items = (content as any).items || [];
            items.forEach((item: any, i: number) => {
              const xPos = 0.5 + i * 5;
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xPos, y: yStart, w: 4.5, h: 5, fill: { color: secondaryClean }, rectRadius: 0.15 });
              // Header bar
              pptSlide.addShape(pptxgenjs.default.ShapeType.roundRect, { x: xPos + 0.2, y: yStart + 0.2, w: 4.1, h: 0.5, fill: { color: accentClean }, rectRadius: 0.1 });
              pptSlide.addText(item.name, { x: xPos + 0.2, y: yStart + 0.2, w: 4.1, h: 0.5, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
              if (item.pros) {
                pptSlide.addText("ADVANTAGES", { x: xPos + 0.3, y: yStart + 0.9, w: 3, h: 0.25, fontSize: 8, bold: true, color: "16A34A" });
                item.pros.forEach((p: string, j: number) => {
                  pptSlide.addText(`✓ ${p}`, { x: xPos + 0.4, y: yStart + 1.2 + j * 0.4, w: 3.8, h: 0.35, fontSize: 10, color: textClean });
                });
              }
              const prosLen = (item.pros || []).length;
              if (item.cons) {
                pptSlide.addText("LIMITATIONS", { x: xPos + 0.3, y: yStart + 1.3 + prosLen * 0.4, w: 3, h: 0.25, fontSize: 8, bold: true, color: "DC2626" });
                item.cons.forEach((cc: string, j: number) => {
                  pptSlide.addText(`✗ ${cc}`, { x: xPos + 0.4, y: yStart + 1.6 + prosLen * 0.4 + j * 0.4, w: 3.8, h: 0.35, fontSize: 10, color: textClean });
                });
              }
            });
          } else {
            // Content / default
            const heading = (content as any).heading;
            if (heading) pptSlide.addText(heading, { x: 0.75, y: yStart, w: 9, h: 0.4, fontSize: 16, bold: true, color: textClean, transparency: 20 });
            const paragraphs = (content as any).paragraphs || [];
            paragraphs.forEach((p: string, i: number) => {
              pptSlide.addText(p, { x: 0.75, y: yStart + 0.6 + i * 1, w: 9, h: 0.9, fontSize: 14, color: textClean });
            });
          }
        }

        if (slide.speakerNotes) pptSlide.addNotes(slide.speakerNotes);
      }

      // Add branding footer to all non-title slides
      const filename = `${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
      await pptx.writeFile({ fileName: filename });
      toast.success("Professional PPTX downloaded!");
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

          <TabsContent value="generate" className="m-0 h-full">
            <div className="flex items-center justify-center h-full p-8">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                  >
                    <GenerationProgress phase={generationPhase} topic={topic} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                  >
                    <Card className="w-full max-w-2xl p-8 space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                          <Wand2 className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">AI Presentation Builder</h2>
                        <p className="text-muted-foreground text-sm">Like Manus — we research, structure, design, and polish your deck</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                          <Search className="w-3 h-3" /> Research → <ListTree className="w-3 h-3" /> Structure → <Palette className="w-3 h-3" /> Design → <Sparkles className="w-3 h-3" /> Polish
                        </div>
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
                            placeholder="Key points, data, audience info, specific requirements..." 
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
                          <Wand2 className="w-5 h-5" /> Generate Research-Backed Presentation
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="m-0 h-full">
            {presentation && (
              <div className="flex h-full">
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

                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-muted/20 p-8 overflow-auto">
                    {currentSlideData && (
                      <div className="shadow-2xl rounded-xl overflow-hidden">
                        <SlideRenderer slide={currentSlideData} theme={style} scale={0.75} />
                      </div>
                    )}
                  </div>
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
