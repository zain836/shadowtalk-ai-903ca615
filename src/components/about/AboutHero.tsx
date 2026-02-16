import { Badge } from "@/components/ui/badge";
import { Wrench, MapPin, Calendar, Sparkles, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import zainImage from "@/assets/zain-ahmed.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const AboutHero = () => {
  const [nodeCount, setNodeCount] = useState(23);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-24 pb-20 px-4 relative overflow-hidden">
      {/* Ambient light effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 left-1/6 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]"
      />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="relative order-2 lg:order-1"
            style={{ perspective: "1200px" }}
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-accent/15 rounded-2xl blur-3xl" />
              <img
                src={zainImage}
                alt="Zain Ahmed - CEO & Founder of ShadowTalk AI"
                className="relative w-full h-full object-cover rounded-2xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.2)] border border-border/50"
              />

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -bottom-4 -right-4 glass-strong rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="font-mono font-bold text-sm">Nodes: {nodeCount}</span>
              </motion.div>

              {/* Top-left floating tag */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                className="absolute -top-3 -left-3 glass-strong rounded-lg px-3 py-1.5 shadow-lg"
              >
                <span className="text-xs font-semibold text-primary">🇵🇰 Made in Pakistan</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
            initial="hidden"
            animate="visible"
            className="order-1 lg:order-2 space-y-6"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass-subtle rounded-full px-4 py-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">The Architect</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Behind the <span className="gradient-text">Bot</span>
            </motion.h1>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1 border-border/50"><MapPin className="h-3 w-3" /> Karachi, Pakistan</Badge>
              <Badge variant="outline" className="flex items-center gap-1 border-border/50"><Calendar className="h-3 w-3" /> 17 Years Old</Badge>
              <Badge className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"><Sparkles className="h-3 w-3" /> AI Architect</Badge>
            </motion.div>

            <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed">
              I am <span className="text-foreground font-semibold">Zain Ahmed</span>, a 17-year-old AI Architect.
              While others use AI to generate text, I build AI to guarantee <span className="text-primary font-semibold">Sovereignty</span>.
            </motion.p>

            <motion.blockquote variants={fadeUp} className="glass-subtle rounded-xl p-5 border-l-4 border-primary italic text-muted-foreground">
              <Quote className="h-4 w-4 inline mr-2 text-primary" />
              "People play with balls; I play with AIs. My goal isn't just to code—it's to architect the infrastructure for the next generation of Pakistani builders."
            </motion.blockquote>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
