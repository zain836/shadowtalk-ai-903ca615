import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-background"></div>
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.06]"
        style={{ backgroundImage: `url(${heroImg})` }}
      ></div>
      
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[150px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[150px]"></div>

      <div className="container mx-auto px-4 text-center relative z-10 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2.5 mb-10"
          >
            <Shield className="h-4 w-4 text-destructive" />
            <span className="text-sm text-foreground/90 font-medium tracking-wide">The Anti-Spyware AI — Your Data Never Leaves Your Device</span>
            <div className="w-2 h-2 bg-success rounded-full connectivity-pulse"></div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold mb-8 leading-[1.05] tracking-tight"
          >
            <span className="gradient-text">The On-Device AI</span>{" "}
            <br className="hidden md:block" />
            Operating System
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Sovereign Intelligence for creators, coders & CEOs. Runs <strong className="text-foreground font-medium">100% on your device</strong> — no cloud dependency, no data harvesting. 50% more features at <strong className="text-foreground font-medium">75% less cost</strong> than ChatGPT.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
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

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground"
          >
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 bg-primary/80 rounded-full border-2 border-background"></div>
                <div className="w-7 h-7 bg-secondary/80 rounded-full border-2 border-background"></div>
                <div className="w-7 h-7 bg-accent/80 rounded-full border-2 border-background"></div>
              </div>
              <span className="text-sm font-medium">47,892+ Active Users</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-1.5">
              <div className="flex text-warning text-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <span className="text-sm font-medium">4.9/5 from 12,483 reviews</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-2 urgency-blink">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
              <span className="text-sm font-medium text-destructive">Only 47 Lifetime deals left</span>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-16 flex items-center justify-center gap-3"
          >
            {["🛡️ Anti-Spyware AI", "⚡ Zero Cloud Dependency", "🧠 $102B Edge AI Market", "🚀 Product Hunt #1"].map((badge, i) => (
              <div key={i} className="glass-subtle rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground">
                {badge}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;