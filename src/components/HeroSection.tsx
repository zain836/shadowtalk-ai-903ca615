import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bot, Zap, ArrowRight, Search, Workflow, Target } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CommandPaletteContext } from "@/App";
import { BRAND, BRAND_HOOKS, LANDING_COPY } from "@/lib/brand";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { formatTractionDaily, formatTractionUsers } from "@/lib/formatMetrics";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";
import RotatingHookText from "@/components/landing/RotatingHookText";

const floatingOrbAnim = {
  y: [0, -20, 0],
  scale: [1, 1.05, 1],
};

const floatingOrbSlowAnim = {
  y: [0, 15, 0],
  x: [0, -10, 0],
  scale: [1, 1.08, 1],
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { open: openCommandPalette } = useContext(CommandPaletteContext);
  const [showDemo, setShowDemo] = useState(false);
  const metrics = usePlatformMetrics();
  const {
    variants,
    hoverLift,
    enableParallax,
    parallaxRange,
    scrollOpacityRange,
    isMobile,
    orbTransition,
  } = useLandingMotion();

  useEffect(() => {
    const dismissed = localStorage.getItem("shadowtalk-demo-dismissed");
    if (!dismissed) setShowDemo(true);
  }, []);

  const handleDismissDemo = () => {
    localStorage.setItem("shadowtalk-demo-dismissed", "true");
    setShowDemo(false);
  };

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], scrollOpacityRange);
  const heroY = useTransform(scrollY, [0, 400], parallaxRange);

  const orbSizePrimary = isMobile ? "w-[280px] h-[280px] blur-[80px]" : "w-[500px] h-[500px] blur-[150px]";
  const orbSizeSecondary = isMobile ? "w-[220px] h-[220px] blur-[70px]" : "w-[400px] h-[400px] blur-[150px]";
  const orbSizeCenter = isMobile ? "w-[320px] h-[160px] blur-[80px]" : "w-[600px] h-[300px] blur-[150px]";

  return (
    <section className="shadowtalk-hero neural-bg relative min-h-[100dvh] min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-20 z-[2]" aria-hidden />

      <LandingAmbientOrb
        className={`absolute top-1/4 left-1/4 ${orbSizePrimary} bg-primary/20 rounded-full z-[2]`}
        animate={floatingOrbAnim}
        duration={6}
      />
      <LandingAmbientOrb
        className={`absolute bottom-1/4 right-1/4 ${orbSizeSecondary} bg-secondary/15 rounded-full z-[2]`}
        animate={floatingOrbSlowAnim}
        duration={8}
      />
      <LandingAmbientOrb
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${orbSizeCenter} bg-accent/10 rounded-full z-[2]`}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        duration={5}
      />

      <motion.div
        style={enableParallax ? { opacity: heroOpacity, y: heroY } : undefined}
        className="container mx-auto px-4 sm:px-6 text-center relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16"
      >
        <motion.div
          variants={variants.staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <motion.div
            variants={variants.fadeSlideUp}
            className="inline-flex items-center flex-wrap justify-center gap-2 glass-subtle rounded-full px-4 py-2 sm:px-5 sm:py-2.5 mb-8 sm:mb-10 max-w-[95vw]"
          >
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm text-foreground/90 font-medium tracking-wide text-center">
              {BRAND.heroBadge}
            </span>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={orbTransition(2)}
              className="w-2 h-2 bg-success rounded-full shrink-0"
            />
          </motion.div>

          <motion.h1
            variants={variants.fadeSlideUp}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 leading-[1.08] tracking-tight px-1"
          >
            <motion.span className="gradient-text inline-block" whileHover={hoverLift}>
              {BRAND.heroHeadline[0]}
            </motion.span>{" "}
            <br className="hidden sm:block" />
            <motion.span
              className="gradient-text inline-block"
              initial={{ opacity: 0, x: isMobile ? 0 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.65 }}
            >
              {BRAND.heroHeadline[1]}
            </motion.span>
          </motion.h1>

          <motion.p
            variants={variants.fadeSlideUp}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed px-2"
          >
            {BRAND.heroSubtitle}
          </motion.p>

          <motion.div variants={variants.fadeSlideUp} className="mb-8 sm:mb-10 min-h-[2rem] flex justify-center px-2">
            <RotatingHookText hooks={BRAND_HOOKS} className="text-sm sm:text-base font-medium" />
          </motion.div>

          <motion.div
            variants={variants.fadeSlideUp}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14 w-full max-w-md sm:max-w-none mx-auto"
          >
            <motion.div whileHover={hoverLift} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="btn-glow text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group rounded-xl w-full sm:w-auto"
                onClick={() => navigate("/chatbot")}
              >
                <MessageCircle className="mr-2 sm:mr-3 h-5 w-5" />
                Enter ShadowTalk — Free
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div whileHover={hoverLift} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/60 rounded-xl w-full sm:w-auto"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Zap className="mr-2 sm:mr-3 h-5 w-5" />
                See what ships
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={variants.scaleFadeIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-muted-foreground"
          >
            <div className="flex items-center space-x-2">
              <Workflow className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Multi-Step Agents</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">30+ Tools</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Mission Control</span>
            </div>
          </motion.div>

          <motion.p
            variants={variants.scaleFadeIn}
            className="mt-6 text-xs sm:text-sm text-muted-foreground/90"
          >
            {metrics.isLoading
              ? "Loading live metrics…"
              : `${formatTractionUsers(metrics.totalUsers)} · ${formatTractionDaily(metrics.dailyActiveUsers)}`}
          </motion.p>

          <motion.div
            variants={variants.scaleFadeIn}
            className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-2"
          >
            {["🤖 Agentic missions", "⚡ Tool orchestration", "🎯 Mission Control", "🛡️ Privacy when you need it"].map(
              (badge, i) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  whileHover={hoverLift}
                  className="glass-subtle rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-medium text-muted-foreground"
                >
                  {badge}
                </motion.div>
              ),
            )}
          </motion.div>

          <motion.p variants={variants.fadeSlideUp} className="mt-8 text-xs text-muted-foreground/70 max-w-md mx-auto">
            {LANDING_COPY.founder.line}
          </motion.p>
        </motion.div>

        <AnimatePresence>
          {showDemo && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.94 }}
              transition={{ delay: 1.2, duration: 0.45, type: "spring", stiffness: 280 }}
              className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 sm:gap-3 max-w-[calc(100vw-2rem)]"
            >
              <motion.button
                onClick={() => {
                  openCommandPalette();
                  handleDismissDemo();
                }}
                className="group flex items-center gap-2 sm:gap-3 bg-primary text-primary-foreground px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-lg shadow-primary/25"
                whileHover={hoverLift}
                whileTap={{ scale: 0.97 }}
                animate={isMobile ? undefined : { y: [0, -6, 0] }}
                transition={isMobile ? undefined : { y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
              >
                <Search className="h-5 w-5 shrink-0" />
                <span className="font-semibold text-sm">Explore ShadowTalk</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-primary-foreground/20 text-primary-foreground/90 text-xs px-2 py-0.5 rounded-md font-mono">
                  ⌘K
                </kbd>
              </motion.button>
              <motion.button
                onClick={handleDismissDemo}
                className="text-muted-foreground hover:text-foreground bg-muted/80 backdrop-blur-sm rounded-full p-1.5"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                title="Dismiss"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default HeroSection;
