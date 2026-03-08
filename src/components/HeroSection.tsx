import React, { useMemo, useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Zap, ArrowRight, Search } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import heroImg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";
import { CommandPaletteContext } from "@/App";

const floatingOrbAnim = {
  y: [0, -20, 0],
  scale: [1, 1.05, 1],
  transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
};

const floatingOrbSlowAnim = {
  y: [0, 15, 0],
  x: [0, -10, 0],
  scale: [1, 1.08, 1],
  transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const scaleFadeIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { open: openCommandPalette } = useContext(CommandPaletteContext);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('shadowtalk-demo-dismissed');
    if (!dismissed) setShowDemo(true);
  }, []);

  const handleDismissDemo = () => {
    localStorage.setItem('shadowtalk-demo-dismissed', 'true');
    setShowDemo(false);
  };
  const [liveStats, setLiveStats] = useState({ users: 0, reviews: 0, rating: 0, dealsLeft: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, feedbackRes, dealsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('feedback').select('rating').not('rating', 'is', null),
        supabase.from('manual_payments').select('id', { count: 'exact', head: true }).eq('plan_type', 'lifetime').eq('status', 'verified'),
      ]);
      
      const userCount = profilesRes.count || 0;
      const reviews = feedbackRes.data || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length 
        : 0;
      const lifetimeSold = dealsRes.count || 0;
      
      setLiveStats({
        users: userCount,
        reviews: reviews.length,
        rating: Math.round(avgRating * 10) / 10,
        dealsLeft: Math.max(50 - lifetimeSold, 0),
      });
    };
    fetchStats();
  }, []);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);
  const bgScale = useTransform(scrollY, [0, 600], [1, 1.15]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-background"></div>
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <motion.div
        style={{ scale: bgScale }}
        className="absolute inset-0 bg-cover bg-center opacity-[0.06]"
        initial={false}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }} />
      </motion.div>
      
      {/* Animated ambient gradient orbs */}
      <motion.div
        animate={floatingOrbAnim}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]"
      />
      <motion.div
        animate={floatingOrbSlowAnim}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.5, 0.8, 0.5] 
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[150px]"
      />

      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="container mx-auto px-4 text-center relative z-10 pt-20"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={fadeSlideUp}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2.5 mb-10"
          >
            <Shield className="h-4 w-4 text-destructive" />
            <span className="text-sm text-foreground/90 font-medium tracking-wide">The Anti-Spyware AI — Your Data Never Leaves Your Device</span>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 bg-success rounded-full"
            />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={fadeSlideUp}
            className="text-5xl md:text-8xl font-bold mb-8 leading-[1.05] tracking-tight"
          >
            <motion.span
              className="gradient-text inline-block"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              The On-Device AI
            </motion.span>{" "}
            <br className="hidden md:block" />
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Operating System
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeSlideUp}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Sovereign Intelligence for creators, coders & CEOs. Runs <strong className="text-foreground font-medium">100% on your device</strong> — no cloud dependency, no data harvesting. 50% more features at <strong className="text-foreground font-medium">75% less cost</strong> than ChatGPT.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeSlideUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="lg"
                className="btn-glow text-lg px-8 py-6 group rounded-xl"
                onClick={() => navigate('/chatbot')}
              >
                <MessageCircle className="mr-3 h-5 w-5" />
                Chat Now — Free
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-border/60 hover:border-primary/30 hover:bg-muted/20 rounded-xl transition-all duration-300"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Zap className="mr-3 h-5 w-5" />
                View Features
              </Button>
            </motion.div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={scaleFadeIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground"
          >
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1, type: "spring", stiffness: 500 }}
                    className={`w-7 h-7 rounded-full border-2 border-background ${
                      i === 0 ? 'bg-primary/80' : i === 1 ? 'bg-secondary/80' : 'bg-accent/80'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{liveStats.users.toLocaleString()}+ Active Users</span>
            </motion.div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-1.5">
              <div className="flex text-warning text-sm">
                {[...Array(5)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 + i * 0.08, type: "spring", stiffness: 500 }}
                  >
                    ★
                  </motion.span>
                ))}
              </div>
              <span className="text-sm font-medium">{liveStats.rating}/5 from {liveStats.reviews.toLocaleString()} reviews</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2"
            >
              <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
              <span className="text-sm font-medium text-destructive">Only {liveStats.dealsLeft} Lifetime deals left</span>
            </motion.div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={scaleFadeIn}
            className="mt-16 flex items-center justify-center gap-3"
          >
            {["🛡️ Anti-Spyware AI", "⚡ Zero Cloud Dependency", "🧠 Edge AI Powered", "🚀 Built for Privacy"].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
                whileHover={{
                  scale: 1.08,
                  y: -3,
                  transition: { type: "spring", stiffness: 400 },
                }}
                className="glass-subtle rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground cursor-default"
              >
                {badge}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

          {/* Demo Button - First Visit Only */}
          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ delay: 1.5, duration: 0.5, type: "spring", stiffness: 300 }}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-3"
              >
                <motion.button
                  onClick={() => { openCommandPalette(); handleDismissDemo(); }}
                  className="group flex items-center gap-3 bg-primary text-primary-foreground px-5 py-3.5 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
                >
                  <Search className="h-5 w-5" />
                  <span className="font-semibold text-sm">Explore ShadowTalk</span>
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-primary-foreground/20 text-primary-foreground/90 text-xs px-2 py-0.5 rounded-md font-mono">
                    ⌘K
                  </kbd>
                </motion.button>
                <motion.button
                  onClick={handleDismissDemo}
                  className="text-muted-foreground hover:text-foreground bg-muted/80 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Dismiss"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default HeroSection;
