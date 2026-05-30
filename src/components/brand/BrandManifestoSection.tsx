import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAND, BRAND_PILLARS, LANDING_COPY } from "@/lib/brand";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { formatTractionDaily, formatTractionUsers } from "@/lib/formatMetrics";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";

const BrandManifestoSection = () => {
  const navigate = useNavigate();
  const metrics = usePlatformMetrics();
  const { variants, viewport, hoverLift, shouldAnimateAmbient, isMobile } = useLandingMotion();

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden border-y border-border/40 bg-card/20">
      <div className="absolute inset-0 bg-grid-dense opacity-20" />
      <LandingAmbientOrb
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isMobile ? "w-[480px] h-[220px] blur-[80px]" : "w-[900px] h-[400px] blur-[120px]"
        } bg-primary/10 rounded-full`}
        animate={shouldAnimateAmbient ? { opacity: [0.04, 0.1, 0.04] } : undefined}
        duration={12}
      />

      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <motion.p
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary mb-4"
          >
            {LANDING_COPY.manifesto.kicker}
          </motion.p>
          <motion.h2
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-5 sm:mb-6 leading-tight"
          >
            {LANDING_COPY.manifesto.title[0]}{" "}
            <span className="gradient-text">{LANDING_COPY.manifesto.title[1]}</span>
          </motion.h2>
          <motion.p
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            {LANDING_COPY.manifesto.body}
          </motion.p>
          <motion.p
            variants={variants.fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="mt-4 text-sm text-muted-foreground/80"
          >
            {LANDING_COPY.manifesto.traction} ·{" "}
            {metrics.isLoading
              ? "…"
              : `${formatTractionUsers(metrics.totalUsers)} · ${formatTractionDaily(metrics.dailyActiveUsers)}`}
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-12">
          {BRAND_PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              custom={i}
              variants={variants.cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={hoverLift}
              className="glass-subtle rounded-2xl p-4 sm:p-5 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <span className="text-2xl mb-3 block" aria-hidden>
                {pillar.emoji}
              </span>
              <h3 className="font-semibold mb-2">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={variants.scaleFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          whileHover={hoverLift}
          className="text-center glass-subtle rounded-3xl p-6 sm:p-8 md:p-10 border border-primary/20"
        >
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-lg sm:text-xl md:text-2xl font-semibold mb-2">{BRAND.tagline}</p>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm sm:text-base">{BRAND.shortPitch}</p>
          <Button size="lg" className="btn-glow rounded-xl w-full sm:w-auto" onClick={() => navigate("/chatbot")}>
            Enter the workspace
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandManifestoSection;
