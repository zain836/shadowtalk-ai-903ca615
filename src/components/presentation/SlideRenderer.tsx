import { useRef, useMemo } from "react";
import DOMPurify from "dompurify";
import { Slide, ThemeKey, THEMES } from "@/components/presentation/types";
import { Image } from "lucide-react";

interface SlideRendererProps {
  slide: Slide;
  theme: ThemeKey;
  scale?: number;
}

const SlideRenderer = ({ slide, theme, scale = 1 }: SlideRendererProps) => {
  const t = THEMES[theme];
  const containerRef = useRef<HTMLDivElement>(null);

  // Always compute sanitized HTML (hooks must be unconditional)
  const sanitizedHtml = useMemo(() => {
    if (!slide.html) return null;
    return DOMPurify.sanitize(slide.html, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
        'img', 'a', 'blockquote', 'code', 'pre', 'sup', 'sub',
      ],
      ALLOWED_ATTR: [
        'style', 'width', 'height', 'viewBox', 'd', 'fill', 'stroke',
        'stroke-width', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
        'points', 'transform', 'opacity', 'src', 'alt', 'colspan', 'rowspan',
        'xmlns',
      ],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
    });
  }, [slide.html]);

  // Render custom HTML slide if available
  if (sanitizedHtml) {
    return (
      <div
        style={{
          width: 960 * scale,
          height: 540 * scale,
          overflow: "hidden",
          position: "relative",
          borderRadius: scale < 0.5 ? 4 : 8,
          boxShadow: scale >= 0.5 ? "0 25px 50px -12px rgba(0,0,0,0.25)" : "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
      >
        <div
          ref={containerRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: 960,
            height: 540,
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        <div
          style={{
            position: "absolute",
            bottom: scale >= 0.5 ? 10 : 4,
            right: scale >= 0.5 ? 16 : 6,
            fontSize: scale >= 0.5 ? 9 : 6,
            opacity: 0.15,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: t.text,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          ShadowTalk AI
        </div>
      </div>
    );
  }

  // === LEGACY FALLBACK: Template-based rendering for slides without html field ===
  const c = slide.content || {};

  const baseStyle: React.CSSProperties = {
    width: 960,
    height: 540,
    backgroundColor: t.bg,
    color: t.text,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    overflow: "hidden",
    position: "relative",
  };

  const CornerAccent = () => (
    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07]" style={{ background: t.accentGradient, borderRadius: "0 0 0 100%" }} />
  );

  const BottomBar = () => (
    <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: t.accentGradient }} />
  );

  const SlideHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-8 rounded-full" style={{ background: t.accentGradient }} />
        <h2 className="text-[28px] font-extrabold leading-tight tracking-tight" style={{ color: t.accent }}>{title}</h2>
      </div>
      {subtitle && <p className="text-sm opacity-50 ml-4 italic">{subtitle}</p>}
    </div>
  );

  const renderContent = () => {
    switch (slide.layout) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center relative" style={{ background: t.accentGradient }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)" }} />
            <div className="relative z-10 px-16">
              <div className="w-20 h-0.5 bg-white/40 mx-auto mb-10" />
              <h1 className="text-[44px] font-black mb-5 leading-[1.1] tracking-tight text-white">{slide.title}</h1>
              {slide.subtitle && <p className="text-xl opacity-90 mb-6 text-white/90 font-light">{slide.subtitle}</p>}
              {(c as any).tagline && <p className="text-base mt-4 opacity-70 max-w-2xl mx-auto leading-relaxed text-white/80 italic">{(c as any).tagline}</p>}
              <div className="flex items-center justify-center gap-8 mt-12 opacity-60">
                {(c as any).presenter && <span className="text-sm text-white font-medium">{(c as any).presenter}</span>}
                {(c as any).presenter && (c as any).date && <span className="text-white/40">|</span>}
                {(c as any).date && <span className="text-sm text-white/80">{(c as any).date}</span>}
              </div>
            </div>
          </div>
        );

      case "bullets":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            {(c as any).heading && <h3 className="text-base font-semibold mb-4 opacity-60 ml-4">{(c as any).heading}</h3>}
            <ul className="space-y-2.5 flex-1 ml-4">
              {((c as any).bullets || []).map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold" style={{ background: t.accentGradient, opacity: 0.85 }}>{i + 1}</div>
                  <span className="flex-1">{b}</span>
                </li>
              ))}
            </ul>
            <BottomBar />
          </div>
        );

      case "stats":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-4 gap-4 flex-1 items-center px-2">
              {((c as any).stats || []).map((s: any, i: number) => (
                <div key={i} className="text-center p-5 rounded-2xl border relative overflow-hidden" style={{ backgroundColor: t.secondaryBg, borderColor: t.accent + '18' }}>
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: t.accentGradient, opacity: 0.6 }} />
                  <div className="text-[32px] font-black mb-1 tracking-tight" style={{ color: t.accent }}>{s.value}</div>
                  <div className="text-[11px] opacity-60 mb-2 font-medium">{s.label}</div>
                  {s.change && <div className="text-[10px] font-bold px-2.5 py-1 rounded-full inline-block" style={{ backgroundColor: t.accent + '12', color: t.accent }}>{s.change}</div>}
                </div>
              ))}
            </div>
            <BottomBar />
          </div>
        );

      case "closing":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center relative" style={{ background: t.accentGradient }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
            <div className="relative z-10 px-16">
              <h2 className="text-[38px] font-black mb-4 text-white tracking-tight">{slide.title}</h2>
              {(c as any).heading && <p className="text-lg mb-8 opacity-80 max-w-xl text-white/90 font-light">{(c as any).heading}</p>}
              {(c as any).nextSteps && (
                <div className="mb-8 text-left max-w-md mx-auto">
                  {(c as any).nextSteps.map((ns: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 mb-2.5">
                      <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">{i + 1}</span>
                      <span className="text-[13px] text-white/85">{ns}</span>
                    </div>
                  ))}
                </div>
              )}
              {(c as any).cta && <div className="px-10 py-3 rounded-full text-base font-bold border-2 border-white/30 text-white backdrop-blur-sm bg-white/10">{(c as any).cta}</div>}
              {(c as any).contact && <p className="mt-6 text-sm opacity-50 text-white">{(c as any).contact}</p>}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            {(c as any).heading && <h3 className="text-base font-semibold mb-4 opacity-70 ml-4">{(c as any).heading}</h3>}
            <div className="space-y-3 flex-1 ml-4">
              {((c as any).paragraphs || []).map((p: string, i: number) => (
                <p key={i} className="text-[13px] leading-[1.7]">{p}</p>
              ))}
            </div>
            <BottomBar />
          </div>
        );
    }
  };

  return (
    <div style={baseStyle} className="rounded-lg shadow-2xl">
      {renderContent()}
      <div className="absolute bottom-2.5 right-4 text-[9px] opacity-15 font-bold tracking-wider uppercase" style={{ color: t.text }}>ShadowTalk AI</div>
    </div>
  );
};

export default SlideRenderer;
