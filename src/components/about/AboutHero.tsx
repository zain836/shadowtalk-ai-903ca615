import { Badge } from "@/components/ui/badge";
import { Wrench, MapPin, Calendar, Sparkles, Quote } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import zainImage from "@/assets/zain-ahmed.png";
import { fadeUp, fadeUpStagger } from "./aboutMotion";

const HERO_LINES = [
  "I am Zain Ahmed — 17, from Karachi, building sovereign AI.",
  "While others rent intelligence, I architect freedom.",
  "ShadowTalk is proof that Pakistan ships world-class tech.",
];

const AboutHero = () => {
  const [nodeCount, setNodeCount] = useState(23);
  const [lineIndex, setLineIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 22 });
  const orbX = useTransform(springX, [0, 1], ["-12%", "12%"]);
  const orbY = useTransform(springY, [0, 1], ["-8%", "8%"]);
  const imgRotateY = useTransform(springX, [0, 1], [-6, 6]);
  const imgRotateX = useTransform(springY, [0, 1], [4, -4]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeCount((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const full = HERO_LINES[lineIndex];
    const typingSpeed = isDeleting ? 28 : 42;
    const timeout = setTimeout(() => {
      if (!isDeleting && displayText === full) {
        setTimeout(() => setIsDeleting(true), 2200);
        return;
      }
      if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setLineIndex((i) => (i + 1) % HERO_LINES.length);
        return;
      }
      setDisplayText(
        isDeleting ? full.slice(0, displayText.length - 1) : full.slice(0, displayText.length + 1),
      );
    }, typingSpeed);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, lineIndex]);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={onMouseMove}
      className="pt-24 pb-20 md:pb-28 px-4 relative overflow-hidden about-hero-section min-h-[90vh] flex items-center"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 about-hero-grain pointer-events-none opacity-[0.35]" />

      <motion.div
        style={{ x: orbX, y: orbY }}
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 left-1/6 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[120px]"
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          style={{
            left: `${8 + (i * 7) % 85}%`,
            top: `${10 + (i * 11) % 80}%`,
          }}
          animate={{
            y: [0, -30 - (i % 3) * 15, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + (i % 4),
            repeat: Infinity,
            delay: i * 0.35,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative order-2 lg:order-1"
            style={{ perspective: "1200px" }}
          >
            <motion.div
              style={{ rotateY: imgRotateY, rotateX: imgRotateX, transformStyle: "preserve-3d" }}
              className="relative aspect-[3/4] max-w-md mx-auto"
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-4 bg-gradient-to-br from-primary/25 via-accent/15 to-transparent rounded-3xl blur-2xl"
              />
              <img
                src={zainImage}
                alt="Zain Ahmed - CEO & Founder of ShadowTalk AI"
                className="relative w-full h-full object-cover rounded-2xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.35)] border border-primary/20 about-hero-image-ring"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -bottom-4 -right-4 glass-strong rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-success rounded-full connectivity-pulse" />
                <span className="font-mono font-bold text-sm">Nodes: {nodeCount}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                className="absolute -top-3 -left-3 glass-strong rounded-lg px-3 py-1.5 shadow-lg"
              >
                <span className="text-xs font-semibold text-primary">🇵🇰 Made in Pakistan</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-1/2 -right-2 translate-x-full hidden md:block glass-subtle rounded-lg px-3 py-2 text-xs font-medium max-w-[140px] border border-primary/20"
              >
                The architect behind your AI sovereignty
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUpStagger}
            initial="hidden"
            animate="visible"
            className="order-1 lg:order-2 space-y-6"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass-subtle rounded-full px-4 py-2 about-hero-badge">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                The Architect · Live
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05]">
              Meet <span className="gradient-text text-glow-pulse">Zain Ahmed</span>
              <br />
              <span className="text-foreground/90 text-3xl md:text-4xl lg:text-5xl font-semibold">
                before the world catches up.
              </span>
            </motion.h1>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1 border-border/50">
                <MapPin className="h-3 w-3" /> Karachi, Pakistan
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 border-border/50">
                <Calendar className="h-3 w-3" /> 17 Years Old
              </Badge>
              <Badge className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 urgency-blink">
                <Sparkles className="h-3 w-3" /> AI Architect
              </Badge>
            </motion.div>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground leading-relaxed min-h-[4.5rem]">
              <span className="text-primary font-mono text-sm block mb-2 uppercase tracking-widest">Now typing</span>
              <span className="text-foreground">{displayText}</span>
              <span className="typing-cursor" />
            </motion.p>

            <motion.blockquote
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="glass-subtle rounded-xl p-5 border-l-4 border-primary italic text-muted-foreground relative overflow-hidden group"
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              <Quote className="h-4 w-4 inline mr-2 text-primary relative z-10" />
              <span className="relative z-10">
                "People play with balls; I play with AIs. My goal isn't just to code—it's to architect the
                infrastructure for the next generation of Pakistani builders."
              </span>
            </motion.blockquote>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
