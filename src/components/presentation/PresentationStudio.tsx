import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Presentation, X, Sparkles, ChevronLeft, ChevronRight, Download, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import SlideRenderer from "@/components/presentation/SlideRenderer";
import GenerationProgress, { GenerationPhase } from "@/components/presentation/GenerationProgress";
import { PresentationData, ThemeKey, THEMES, Slide } from "@/components/presentation/types";
import {
  generateKimiPresentation,
  KIMI_PRESENTATION_MODES,
  savePresentationToSession,
  type KimiPresentationMode,
} from "@/lib/kimiPresentation";

export interface PresentationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  autoGenerate?: boolean;
  initialMode?: KimiPresentationMode;
}

export const PresentationStudio = ({
  isOpen,
  onClose,
  initialTopic = "",
  autoGenerate = false,
  initialMode = "adaptive",
}: PresentationStudioProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(initialTopic);
  const [additionalContext, setAdditionalContext] = useState("");
  const [slideCount, setSlideCount] = useState("12");
  const [style, setStyle] = useState<ThemeKey>("corporate");
  const [mode, setMode] = useState<KimiPresentationMode>(initialMode);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (autoGenerate && topic.trim() && isOpen && !presentation && !isGenerating) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, topic, isOpen]);

  const generate = useCallback(async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setPhase("researching");
    const timers = [
      setTimeout(() => setPhase("structuring"), 4000),
      setTimeout(() => setPhase("designing"), 10000),
      setTimeout(() => setPhase("polishing"), 20000),
    ];
    try {
      const data = await generateKimiPresentation({
        topic,
        slideCount: parseInt(slideCount, 10) || 12,
        style,
        mode,
        additionalContext,
      });
      timers.forEach(clearTimeout);
      const slides = (data.slides || []).map((s: Slide, i: number) => ({
        ...s,
        id: s.id || `slide-${i}-${Date.now()}`,
      }));
      const deck = { ...data, slides };
      setPresentation(deck);
      setCurrentSlide(0);
      setPhase("done");
      savePresentationToSession(deck, style);
      const meta = data.metadata as Record<string, unknown> | undefined;
      if (meta?.themeAutoSwitched && meta.effectiveStyle && meta.effectiveStyle in THEMES) {
        setStyle(meta.effectiveStyle as ThemeKey);
      }
      toast({
        title: "Slides ready",
        description: `${slides.length} slides — Kimi Slides style (${mode})`,
      });
    } catch (e) {
      timers.forEach(clearTimeout);
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
      setPhase("idle");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setPhase("idle"), 800);
    }
  }, [topic, slideCount, style, mode, additionalContext, toast]);

  const openFullEditor = () => {
    if (presentation) savePresentationToSession(presentation, style);
    onClose();
    navigate("/presentations?load=session");
  };

  if (!isOpen) return null;

  const slide = presentation?.slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Presentation className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              Slide Studio
              <Badge variant="secondary" className="text-[10px]">Kimi K2.6</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Research · SmartArt · PPTX export</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Pitch deck, training, report..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as KimiPresentationMode)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIMI_PRESENTATION_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label} — {m.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slides</label>
              <Select value={slideCount} onValueChange={setSlideCount}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["8", "10", "12", "15", "20"].map((n) => (
                    <SelectItem key={n} value={n}>{n} slides</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme</label>
              <Select value={style} onValueChange={(v) => setStyle(v as ThemeKey)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <SelectItem key={key} value={key} className="text-xs">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Instructions</label>
            <Textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Audience, tone, must-include sections..."
              className="min-h-[72px] text-sm resize-none"
            />
          </div>
          <Button onClick={generate} disabled={isGenerating || !topic.trim()} className="w-full">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building slides...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Generate slides</>
            )}
          </Button>
          {presentation && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={openFullEditor}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Open full editor & PPTX
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto bg-muted/20">
          {isGenerating && phase !== "idle" && phase !== "done" ? (
            <GenerationProgress phase={phase} topic={topic} />
          ) : presentation && slide ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
              <div className="flex items-center gap-4 w-full justify-between">
                <Button variant="outline" size="icon" disabled={currentSlide === 0} onClick={() => setCurrentSlide((c) => c - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Slide {currentSlide + 1} / {presentation.slides.length} · {slide.layout}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentSlide >= presentation.slides.length - 1}
                  onClick={() => setCurrentSlide((c) => c + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <SlideRenderer slide={slide} theme={style} scale={0.85} />
              <p className="text-lg font-semibold text-center">{slide.title}</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground max-w-md">
              <Presentation className="h-14 w-14 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-sm">Kimi Slides–class decks</p>
              <p className="text-xs mt-2">
                Adaptive mode researches your topic and adds citations. Visual mode prioritizes designer layouts.
                Export editable PPTX from the full editor.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PresentationStudio;
