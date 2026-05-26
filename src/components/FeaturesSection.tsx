import { Code, Wifi, Brain, Shield, Zap, Download, ArrowUpRight, Bot, Target } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BRAND } from "@/lib/brand";

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
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Bot,
      title: "Agentic Task Runner",
      description: "Give a goal — ShadowTalk plans steps, runs tools, and delivers results with human-in-the-loop approval when you want it.",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      span: "sm:col-span-2 md:col-span-2",
    },
    {
      icon: Target,
      title: "Mission Control",
      description: "Launch autonomous missions that research, draft, and execute multi-step workflows while you focus on what matters.",
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      span: "",
    },
    {
      icon: Zap,
      title: "30+ Tool Orchestration",
      description: "Natural language triggers code, research, calendar, vault, and more — no manual tool-switching.",
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
      span: "",
    },
    {
      icon: Brain,
      title: "Multi-Model AI Chat",
      description: "Gemini, GPT-class models, and specialized modes in one workspace — context-aware conversations for any task.",
      gradient: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      span: "sm:col-span-2 md:col-span-2",
    },
    {
      icon: Code,
      title: "Code Generator",
      description: "Generate, debug, and optimize code in any programming language with an in-browser IDE.",
      gradient: "from-destructive/20 to-destructive/5",
      iconColor: "text-destructive",
      span: "",
    },
    {
      icon: Shield,
      title: "Privacy-Aware by Design",
      description: "Encrypted vault, privacy score, and optional on-device Gemma inference when you need data to stay local.",
      gradient: "from-success/20 to-success/5",
      iconColor: "text-success",
      span: "",
    },
    {
      icon: Wifi,
      title: "Optional On-Device AI",
      description: "Opt in to download Gemma and run offline via WebGPU on Chrome/Edge — your choice, not a requirement.",
      gradient: "from-primary/10 to-secondary/5",
      iconColor: "text-primary",
      span: "",
    },
    {
      icon: Download,
      title: "Export Everything",
      description: "Download chats, code, agent outputs, and scripts in multiple formats.",
      gradient: "from-muted/30 to-muted/10",
      iconColor: "text-muted-foreground",
      span: "",
    },
  ];

  return (
    <section id="features" ref={sectionRef} className="py-28 bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-grid-dense opacity-40"></div>
      <motion.div
        animate={isInView ? { scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="h-4 w-4 text-primary" />
            </motion.div>
            <span className="text-sm text-muted-foreground font-medium">Agentic AI Workspace</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Agents That Execute.{" "}
            <span className="gradient-text">One Platform.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            From multi-step task runners to mission control — ship real work, not just chat replies. Privacy-aware tools when you need them.
          </motion.p>
        </div>

        {/* Bento Grid - responsive with no overlap on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto px-1">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 20 },
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
                <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
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
              whileHover={{
                y: -5,
                scale: 1.05,
                transition: { type: "spring", stiffness: 400 },
              }}
              className="text-center glass-subtle rounded-xl p-5 cursor-default"
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className={`text-xs ${stat.subColor} mt-1 font-medium`}>{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex items-center justify-center gap-4 flex-wrap">
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
              whileHover={{
                scale: 1.1,
                y: -3,
                transition: { type: "spring", stiffness: 400 },
              }}
              className="glass-subtle rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors trust-badge cursor-default"
            >
              {badge}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
