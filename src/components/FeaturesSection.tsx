import { Code, Wifi, Brain, Shield, Zap, Download, ArrowUpRight, Bot, Target } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";
import LandingStagger from "@/components/landing/LandingStagger";

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      type: "spring" as const,
      stiffness: 200,
    },
  }),
};

const FeaturesSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { hoverLift, variants, viewport, isMobile } = useLandingMotion();

  const features = [
    {
      icon: Bot,
      title: "Agentic Task Runner",
      href: "/missioncontrol",
      description: "Give a goal — ShadowTalk plans steps, runs tools, and delivers results with human-in-the-loop approval when you want it.",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      span: "sm:col-span-2 md:col-span-2",
    },
    {
      icon: Target,
      title: "Mission Control",
      href: "/missioncontrol",
      description: "Launch autonomous missions that research, draft, and execute multi-step workflows while you focus on what matters.",
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      span: "",
    },
    {
      icon: Zap,
      title: "30+ Tool Orchestration",
      href: "/chatbot",
      description: "Natural language triggers code, research, calendar, vault, and more — no manual tool-switching.",
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
      span: "",
    },
    {
      icon: Brain,
      title: "Multi-Model AI Chat",
      href: "/chatbot",
      description: "Gemini, GPT-class models, and specialized modes in one workspace — context-aware conversations for any task.",
      gradient: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      span: "sm:col-span-2 md:col-span-2",
    },
    {
      icon: Code,
      title: "Code Generator",
      href: "/workspace",
      description: "Generate, debug, and optimize code in any programming language with an in-browser IDE.",
      gradient: "from-destructive/20 to-destructive/5",
      iconColor: "text-destructive",
      span: "",
    },
    {
      icon: Shield,
      title: "Privacy-Aware by Design",
      href: "/vault",
      description: "Encrypted vault, privacy score, and optional on-device Gemma inference when you need data to stay local.",
      gradient: "from-success/20 to-success/5",
      iconColor: "text-success",
      span: "",
    },
    {
      icon: Wifi,
      title: "Optional On-Device AI",
      href: "/profile?tab=preferences",
      description: "Opt in to download Gemma and run offline via WebGPU on Chrome/Edge — your choice, not a requirement.",
      gradient: "from-primary/10 to-secondary/5",
      iconColor: "text-primary",
      span: "",
    },
    {
      icon: Download,
      title: "Export Everything",
      href: "/chatbot",
      description: "Download chats, code, agent outputs, and scripts in multiple formats.",
      gradient: "from-muted/30 to-muted/10",
      iconColor: "text-muted-foreground",
      span: "",
    },
  ];

  return (
    <section id="features" ref={sectionRef} className="py-16 sm:py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-40" />
      <LandingAmbientOrb
        className={`absolute top-0 left-1/2 -translate-x-1/2 ${
          isMobile ? "w-[400px] h-[200px] blur-[80px]" : "w-[800px] h-[400px] blur-[120px]"
        } bg-primary/5 rounded-full`}
        animate={isInView ? { scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] } : undefined}
        duration={8}
      />

      <div className="container mx-auto px-4 relative z-10">
        <LandingSectionHeader
          badge={LANDING_COPY.features.badge}
          badgeIcon={Zap}
          title={
            <>
              {LANDING_COPY.features.title[0]}{" "}
              <span className="gradient-text">{LANDING_COPY.features.title[1]}</span>
            </>
          }
          subtitle={LANDING_COPY.features.subtitle}
          className="mb-12 sm:mb-20"
        />

        {/* Bento Grid - responsive with no overlap on mobile */}
        <LandingStagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto px-1">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={variants.cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={hoverLift}
              role="button"
              tabIndex={0}
              onClick={() => feature.href && navigate(feature.href)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && feature.href) {
                  e.preventDefault();
                  navigate(feature.href);
                }
              }}
              className={`bento-item group cursor-pointer ${feature.span}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-muted/60 group-hover:bg-muted transition-colors"
                  >
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -5, y: 5 }}
                    whileHover={{ opacity: 1, x: 0, y: 0 }}
                  >
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </motion.div>
                </div>
                <motion.h3
                  className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors tracking-tight"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewport}
                  transition={{ delay: 0.05 }}
                >
                  {feature.title}
                </motion.h3>
                <motion.p
                  className="text-sm text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewport}
                  transition={{ delay: 0.1 }}
                >
                  {feature.description}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </LandingStagger>

        <LandingStagger className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-20 max-w-4xl mx-auto">
          {[
            { value: "30+", label: "Integrated Tools", sub: "Natural-language triggers", subColor: "text-primary" },
            { value: "24/7", label: "Mission Control", sub: "Autonomous workflows", subColor: "text-secondary" },
            { value: "HITL", label: "Human-in-the-Loop", sub: "Approve agent actions", subColor: "text-success" },
            { value: "Opt-in", label: "On-Device AI", sub: "Privacy when you need it", subColor: "text-warning" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={statVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={hoverLift}
              className="text-center glass-subtle rounded-xl p-5 cursor-default"
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className={`text-xs ${stat.subColor} mt-1 font-medium`}>{stat.sub}</div>
            </motion.div>
          ))}
        </LandingStagger>

        <LandingStagger className="mt-12 sm:mt-16 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          {[
            "🤖 Agentic Task Runner",
            "⚡ Tool Orchestration",
            "🎯 Mission Control",
            "🛡️ Privacy-Aware Controls",
          ].map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08 }}
              whileHover={hoverLift}
              className="glass-subtle rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors trust-badge cursor-default"
            >
              {badge}
            </motion.div>
          ))}
        </LandingStagger>
      </div>
    </section>
  );
};

export default FeaturesSection;
