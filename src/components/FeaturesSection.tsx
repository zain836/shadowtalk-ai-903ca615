import { Code, Wifi, Brain, Shield, Zap, Download, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Smart Conversations",
      description: "Advanced AI that understands context and provides intelligent responses to any question.",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      span: "md:col-span-2",
    },
    {
      icon: Code,
      title: "Code Generator",
      description: "Generate, debug, and optimize code in any programming language.",
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      span: "",
    },
    {
      icon: Zap,
      title: "Smart Scripts",
      description: "Automate repetitive tasks with AI-powered script generation.",
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
      span: "",
    },
    {
      icon: Wifi,
      title: "Offline Mode",
      description: "Continue working without internet. Your AI assistant is always available, anywhere.",
      gradient: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      span: "md:col-span-2",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Conversations are encrypted end-to-end. Zero data harvesting.",
      gradient: "from-success/20 to-success/5",
      iconColor: "text-success",
      span: "",
    },
    {
      icon: Download,
      title: "Export Everything",
      description: "Download chats, code, and scripts in multiple formats.",
      gradient: "from-destructive/20 to-destructive/5",
      iconColor: "text-destructive",
      span: "",
    },
  ];

  return (
    <section id="features" className="py-28 bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-grid-dense opacity-40"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-8"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">On-Device AI OS</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Sovereign Intelligence.{" "}
            <span className="gradient-text">One Platform.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            From on-device inference to autonomous agents — zero cloud dependency, zero marginal cost, 100% yours.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`bento-item group cursor-pointer ${feature.span}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-muted/60 group-hover:bg-muted transition-colors`}>
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
        >
          {[
            { value: "47.8K+", label: "Active Users", sub: "+892 this hour", subColor: "text-success" },
            { value: "2.4M+", label: "AI Tasks Done", sub: "Real-time processing", subColor: "text-primary" },
            { value: "99.97%", label: "Uptime", sub: "Enterprise grade", subColor: "text-accent" },
            { value: "<2s", label: "Response Time", sub: "Lightning fast", subColor: "text-warning" },
          ].map((stat, i) => (
            <div key={i} className="text-center glass-subtle rounded-xl p-5">
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className={`text-xs ${stat.subColor} mt-1 font-medium`}>{stat.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <div className="mt-16 flex items-center justify-center gap-4 flex-wrap">
          {[
            "🏆 Product Hunt #1",
            "⭐ GitHub 15K+ Stars",
            "🔒 SOC 2 Certified",
            "💎 Y Combinator",
          ].map((badge, i) => (
            <div key={i} className="glass-subtle rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors trust-badge">
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;