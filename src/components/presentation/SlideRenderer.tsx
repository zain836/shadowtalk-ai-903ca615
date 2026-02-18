import { Slide, ThemeKey, THEMES } from "@/components/presentation/types";
import { Image } from "lucide-react";

interface SlideRendererProps {
  slide: Slide;
  theme: ThemeKey;
  scale?: number;
}

const SlideRenderer = ({ slide, theme, scale = 1 }: SlideRendererProps) => {
  const t = THEMES[theme];
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

  // Decorative corner shape
  const CornerAccent = () => (
    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07]" style={{
      background: t.accentGradient,
      borderRadius: "0 0 0 100%",
    }} />
  );

  // Bottom accent bar
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
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold" style={{ background: t.accentGradient, opacity: 0.85 }}>
                    {i + 1}
                  </div>
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

      case "two_column":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 gap-5 flex-1">
              {["left", "right"].map((side) => {
                const col = (c as any)[side];
                if (!col) return null;
                return (
                  <div key={side} className="p-5 rounded-2xl border" style={{ backgroundColor: t.secondaryBg, borderColor: t.accent + '12' }}>
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                      <span style={{ color: t.accent }}>{col.heading}</span>
                    </h3>
                    <ul className="space-y-2">
                      {(col.points || []).map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed">
                          <span className="w-1 h-1 rounded-full mt-2 shrink-0 opacity-40" style={{ backgroundColor: t.accent }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <BottomBar />
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full p-16 text-center relative" style={{ backgroundColor: t.secondaryBg }}>
            <div className="absolute top-8 left-12 text-[120px] leading-none opacity-[0.06] font-serif" style={{ color: t.accent }}>"</div>
            <div className="absolute bottom-8 right-12 text-[120px] leading-none opacity-[0.06] font-serif rotate-180" style={{ color: t.accent }}>"</div>
            <p className="text-[22px] italic max-w-2xl leading-relaxed mb-8 relative z-10 font-light">{(c as any).quote}</p>
            <div className="relative z-10">
              <div className="w-12 h-0.5 mx-auto mb-4" style={{ background: t.accentGradient }} />
              <p className="text-base font-bold" style={{ color: t.accent }}>{(c as any).author}</p>
              {(c as any).role && <p className="text-[11px] opacity-50 mt-1">{(c as any).role}</p>}
            </div>
            <BottomBar />
          </div>
        );

      case "timeline":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex-1 relative flex items-center px-4">
              <div className="absolute top-1/2 left-4 right-4 h-[2px] opacity-15" style={{ backgroundColor: t.accent }} />
              <div className="flex items-start gap-2 w-full justify-between relative z-10">
                {((c as any).events || []).map((e: any, i: number) => (
                  <div key={i} className="flex-1 text-center px-1">
                    <div className="text-lg font-black mb-2" style={{ color: t.accent }}>{e.year}</div>
                    <div className="w-4 h-4 rounded-full mx-auto mb-3 border-[3px] shadow-md" style={{ backgroundColor: t.bg, borderColor: t.accent }} />
                    <div className="font-bold text-[11px] mb-1">{e.title}</div>
                    <div className="text-[10px] opacity-50 leading-relaxed">{e.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <BottomBar />
          </div>
        );

      case "comparison":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 gap-5 flex-1">
              {((c as any).items || []).map((item: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl border" style={{ backgroundColor: t.secondaryBg, borderColor: t.accent + '12' }}>
                  <h3 className="text-lg font-black mb-3 text-center py-2 rounded-xl" style={{ background: t.accentGradient, color: '#fff' }}>{item.name}</h3>
                  {item.pros && (
                    <div className="mb-2.5">
                      <span className="text-[9px] font-black text-green-600 uppercase tracking-[0.15em]">Advantages</span>
                      <ul className="mt-1 space-y-1">{item.pros.map((p: string, j: number) => <li key={j} className="text-[11px] flex items-start gap-1.5 leading-relaxed"><span className="text-green-500 mt-0.5 font-bold">✓</span> {p}</li>)}</ul>
                    </div>
                  )}
                  {item.cons && (
                    <div>
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.15em]">Limitations</span>
                      <ul className="mt-1 space-y-1">{item.cons.map((cc: string, j: number) => <li key={j} className="text-[11px] flex items-start gap-1.5 leading-relaxed"><span className="text-red-400 mt-0.5 font-bold">✗</span> {cc}</li>)}</ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <BottomBar />
          </div>
        );

      case "image_text":
        return (
          <div className="flex h-full relative">
            <div className="w-[55%] p-10 flex flex-col justify-center">
              <SlideHeader title={slide.title} />
              {(c as any).heading && <h3 className="text-base font-semibold mb-3 ml-4">{(c as any).heading}</h3>}
              <p className="text-[12px] leading-relaxed opacity-70 mb-4 ml-4">{(c as any).text}</p>
              {(c as any).keyPoints && (
                <ul className="space-y-2 ml-4">
                  {(c as any).keyPoints.map((kp: string, i: number) => (
                    <li key={i} className="text-[12px] flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold" style={{ background: t.accentGradient }}>{i + 1}</div>
                      {kp}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="w-[45%] flex items-center justify-center p-6 relative" style={{ backgroundColor: t.secondaryBg }}>
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${t.accent}, transparent 70%)` }} />
              <div className="w-full h-full rounded-2xl flex items-center justify-center border border-dashed opacity-30" style={{ borderColor: t.accent }}>
                <div className="text-center">
                  <Image className="w-10 h-10 mx-auto mb-2 opacity-40" style={{ color: t.accent }} />
                  <p className="text-[10px] opacity-40 max-w-[180px]">{(c as any).imagePrompt || "Visual content"}</p>
                </div>
              </div>
            </div>
            <BottomBar />
          </div>
        );

      case "funnel":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex-1 flex flex-col justify-center items-center gap-1.5 px-8">
              {((c as any).stages || []).map((stage: any, i: number, arr: any[]) => {
                const widthPct = 95 - (i * (55 / arr.length));
                const opacity = 1 - (i * 0.1);
                return (
                  <div key={i} className="flex items-center gap-4" style={{ width: `${widthPct}%` }}>
                    <div className="flex-1 py-3 px-5 rounded-xl text-center relative overflow-hidden" style={{ background: t.accentGradient, opacity }}>
                      <div className="relative z-10">
                        <div className="text-sm font-bold text-white">{stage.name}</div>
                        {stage.value && <div className="text-[11px] text-white/70 mt-0.5">{stage.value}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <BottomBar />
          </div>
        );

      case "swot": {
        const quadrants = [
          { key: "strengths", label: "Strengths", color: "#16A34A", icon: "S" },
          { key: "weaknesses", label: "Weaknesses", color: "#DC2626", icon: "W" },
          { key: "opportunities", label: "Opportunities", color: "#2563EB", icon: "O" },
          { key: "threats", label: "Threats", color: "#D97706", icon: "T" },
        ];
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-2 gap-3 flex-1">
              {quadrants.map(({ key, label, color, icon }) => (
                <div key={key} className="p-3.5 rounded-2xl border relative overflow-hidden" style={{ borderColor: color + '25', backgroundColor: color + '08' }}>
                  <div className="absolute top-2 right-3 text-[32px] font-black opacity-[0.06]" style={{ color }}>{icon}</div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.15em] mb-2" style={{ color }}>{label}</h4>
                  <ul className="space-y-1">
                    {((c as any)[key] || []).map((item: string, i: number) => (
                      <li key={i} className="text-[11px] leading-relaxed flex items-start gap-1.5">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <BottomBar />
          </div>
        );
      }

      case "roadmap":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex gap-3 flex-1 items-stretch">
              {((c as any).phases || []).map((phase: any, i: number) => {
                const sc: Record<string, string> = { done: "#16A34A", active: "#2563EB", upcoming: "#94A3B8" };
                const color = sc[phase.status] || t.accent;
                return (
                  <div key={i} className="flex-1 p-3.5 rounded-2xl border-t-[3px] flex flex-col" style={{ backgroundColor: t.secondaryBg, borderTopColor: color }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-[12px] font-black">{phase.name}</h4>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: color + '18', color }}>{phase.status}</span>
                    </div>
                    <p className="text-[9px] opacity-40 mb-2 font-medium">{phase.timeline}</p>
                    <ul className="space-y-1 flex-1">
                      {(phase.items || []).map((item: string, j: number) => (
                        <li key={j} className="text-[10px] flex items-start gap-1.5 leading-relaxed">
                          <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <BottomBar />
          </div>
        );

      case "kpi_dashboard":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="grid grid-cols-3 gap-3 flex-1 items-center">
              {((c as any).kpis || []).map((kpi: any, i: number) => {
                const sc: Record<string, string> = { on_track: "#16A34A", at_risk: "#D97706", behind: "#DC2626" };
                const color = sc[kpi.status] || t.accent;
                return (
                  <div key={i} className="p-4 rounded-2xl border-l-[3px] relative" style={{ backgroundColor: t.secondaryBg, borderLeftColor: color }}>
                    <p className="text-[9px] opacity-40 uppercase tracking-[0.1em] font-bold mb-1">{kpi.name}</p>
                    <div className="text-[28px] font-black mb-0.5 tracking-tight" style={{ color: t.accent }}>{kpi.value}</div>
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] opacity-40">Target: {kpi.target}</p>
                      {kpi.trend && <p className="text-[10px] font-bold" style={{ color }}>{kpi.trend}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <BottomBar />
          </div>
        );

      case "process":
        return (
          <div className="flex flex-col h-full p-10 relative">
            <CornerAccent />
            <SlideHeader title={slide.title} subtitle={slide.subtitle} />
            <div className="flex gap-2 flex-1 items-center px-2">
              {((c as any).steps || []).map((step: any, i: number, arr: any[]) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm mb-3 shadow-lg" style={{ background: t.accentGradient }}>
                      {step.number || i + 1}
                    </div>
                    <h4 className="text-[11px] font-bold mb-1">{step.title}</h4>
                    <p className="text-[9px] opacity-50 leading-relaxed px-1">{step.description}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <div className="w-4 h-[2px] opacity-20" style={{ backgroundColor: t.accent }} />
                      <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-transparent opacity-20" style={{ borderLeftColor: t.accent }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <BottomBar />
          </div>
        );

      case "closing":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center relative" style={{ background: t.accentGradient }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)" }} />
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
              {(c as any).cta && (
                <div className="px-10 py-3 rounded-full text-base font-bold border-2 border-white/30 text-white backdrop-blur-sm bg-white/10">
                  {(c as any).cta}
                </div>
              )}
              {(c as any).contact && <p className="mt-6 text-sm opacity-50 text-white">{(c as any).contact}</p>}
            </div>
          </div>
        );

      default: // content
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
