import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Wrench, Target, Layers, Award, Users, Rocket, Code, Wifi, WifiOff,
  Quote, MapPin, Calendar, Sparkles, TrendingUp, ArrowUpRight
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import zainImage from "@/assets/zain-ahmed.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const AboutPage = () => {
  const [nodeCount, setNodeCount] = useState(23);
  const stackRef = useRef(null);
  const stackInView = useInView(stackRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const stackCards = [
    { icon: Rocket, title: "Infrastructure", desc: "Built and scaled using Lovable Pro for rapid deployment and clean, private code architecture.", color: "from-primary/20 to-primary/5" },
    { icon: WifiOff, title: "Offline Core", desc: "Sovereign engine utilizing local inference to run LLMs in Airplane Mode.", color: "from-secondary/20 to-secondary/5" },
    { icon: TrendingUp, title: "Growth Engine", desc: "SocialSync AI automation hub — 23 customers in its first 24 hours.", color: "from-accent/20 to-accent/5" },
  ];

  const proofCards = [
    { icon: Users, title: "User Growth", desc: "SocialSync powering 23+ businesses with +12% engagement spike through autonomous AI distribution.", borderColor: "border-l-primary", bg: "bg-primary/10", iconColor: "text-primary" },
    { icon: Award, title: "Mentorship", desc: "Recognized by Sir Zia Khan (Governor Sindh IT Initiative), aligning with the national vision for tech-independent Pakistan.", borderColor: "border-l-accent", bg: "bg-accent/10", iconColor: "text-accent" },
    { icon: Code, title: "Self-Funded", desc: "Bootstrapped and seed-funded through grit — a 17-year-old with $50 and a dream outpacing corporate inertia.", borderColor: "border-l-success", bg: "bg-success/10", iconColor: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero */}
      <section className="pt-24 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <motion.div
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="absolute -bottom-4 -right-4 glass-strong rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="font-mono font-bold text-sm">Nodes: {nodeCount}</span>
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
              
              <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
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

      <Separator className="max-w-4xl mx-auto opacity-50" />

      {/* The Why */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Card className="glass-subtle border-primary/20 overflow-hidden relative group">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <CardContent className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-3 bg-primary/10 rounded-xl"
                  >
                    <Target className="h-6 w-6 text-primary" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold">The "Why"</h2>
                    <p className="text-sm text-muted-foreground">The Sovereign Mission</p>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  I believe the future of intelligence shouldn't depend on a constant internet connection or a foreign cloud server.
                  My mission: <span className="text-primary font-semibold">"Intelligence without Internet"</span> — giving every student and business the power of AI on their own terms.
                </p>
                <div className="flex items-center gap-4 glass-subtle rounded-xl p-4">
                  <WifiOff className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">Offline-First Philosophy</h3>
                    <p className="text-xs text-muted-foreground">Sovereign AI that works anywhere, anytime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stack */}
      <section ref={stackRef} className="py-20 px-4 bg-muted/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dense opacity-20" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6"
            >
              <Layers className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground font-medium">The Stack</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-bold mb-3 tracking-tight">
              How I Play
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-muted-foreground">
              I don't just "prompt" — I engineer.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {stackCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={stackInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                whileHover={{ y: -8, scale: 1.03, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_15px_50px_-15px_hsl(var(--primary)/0.15)] group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardContent className="p-6 text-center relative z-10">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                      transition={{ duration: 0.5 }}
                      className="p-4 bg-muted/60 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-muted transition-colors"
                    >
                      <card.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="font-bold mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6"
            >
              <Award className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground font-medium">The Proof</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-bold mb-3 tracking-tight">
              Traction & Mentorship
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-muted-foreground">
              "Proof of Work" over "Proof of Degree."
            </motion.p>
          </div>

          <div className="space-y-4">
            {proofCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                whileHover={{ x: 6, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className={`border-l-4 ${card.borderColor} border-border/50 hover:border-border transition-all hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.1)] group`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${card.bg} rounded-xl shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{card.title}</h3>
                        <p className="text-sm text-muted-foreground">{card.desc}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold mb-8 tracking-tight">
            Project Credits
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: "ShadowTalk AI", desc: "Sovereign AI chatbot with offline capabilities, multi-model support, enterprise features.", badge: "Founder & Lead Developer" },
              { title: "SocialSync", desc: "AI-powered social media automation hub serving 23+ businesses.", badge: "Architect & Creator" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className="border-border/50 hover:border-primary/20 transition-all hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.1)]">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-primary">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                    <Badge variant="outline" className="border-border/50">{p.badge}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: "spring" }}
            className="glass-subtle rounded-2xl p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <motion.div whileHover={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
              <Wifi className="h-10 w-10 text-primary mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Building the Future of AI in Pakistan</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Join the journey to democratize artificial intelligence and build sovereign technology.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <span>Available for collaborations and partnerships</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
