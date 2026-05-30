import { Users, MessageSquare, Star, Activity, Calendar, ArrowUpRight, Zap, Globe } from "lucide-react";
import { COMMUNITY_HIGHLIGHTS } from "@/lib/productClaims";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";

const statVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: "spring" as const,
      stiffness: 200,
    },
  }),
};

const CommunitySection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { hoverLift, variants, viewport, isMobile } = useLandingMotion();

  const statIcons = [Users, Activity, Star, MessageSquare];
  const communityStats = COMMUNITY_HIGHLIGHTS.map((item, i) => ({
    icon: statIcons[i] ?? Users,
    value: item.value,
    label: item.label,
    description: item.description,
    gradient: [
      "from-primary/20 to-primary/5",
      "from-secondary/20 to-secondary/5",
      "from-accent/20 to-accent/5",
      "from-success/20 to-success/5",
    ][i],
  }));

  const events = [
    { date: "Feb 20", title: "AI Automation Workshop", type: "Workshop", participants: 200, live: true },
    { date: "Feb 25", title: "Developer Q&A Session", type: "Live Q&A", participants: 500, live: false },
    { date: "Mar 01", title: "Spring Coding Challenge", type: "Challenge", participants: 1000, live: false },
  ];

  const benefits = [
    { icon: MessageSquare, title: "Share & Learn", desc: "Exchange ideas, get help, discover new AI use cases.", color: "text-primary", bg: "bg-primary/10" },
    { icon: Zap, title: "Early Access", desc: "First access to new features, beta programs, and exclusive content.", color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Globe, title: "Career Growth", desc: "Network with professionals, find job opportunities, showcase projects.", color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <section id="community" ref={sectionRef} className="py-16 sm:py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-25" />
      <LandingAmbientOrb
        className={`absolute top-1/4 right-1/4 ${
          isMobile ? "w-[360px] h-[220px] blur-[80px]" : "w-[600px] h-[400px] blur-[150px]"
        } bg-accent/5 rounded-full`}
        animate={isInView ? { scale: [1, 1.15, 1], opacity: [0.03, 0.07, 0.03] } : undefined}
        duration={10}
      />

      <div className="container mx-auto px-4 relative z-10">
        <LandingSectionHeader
          badge={LANDING_COPY.community.badge}
          badgeIcon={Users}
          title={
            <>
              {LANDING_COPY.community.title[0]}{" "}
              <span className="gradient-text">{LANDING_COPY.community.title[1]}</span>
            </>
          }
          subtitle={LANDING_COPY.community.subtitle}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          {communityStats.map((stat, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={variants.cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={hoverLift}
            >
              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.15)] group overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="p-5 text-center relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 group-hover:bg-muted mb-3 transition-colors"
                  >
                    <stat.icon className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div className="text-2xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-xs font-medium text-foreground/80">{stat.label}</div>
                  {"description" in stat && (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{stat.description}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Benefits */}
          <div>
            <motion.h3
              variants={variants.fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-2xl font-bold mb-6"
            >
              Why Join?
            </motion.h3>
            <div className="space-y-4 mb-8">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={variants.cardReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewport}
                  whileHover={hoverLift}
                  className="flex items-start gap-4 glass-subtle rounded-xl p-4 group cursor-default"
                >
                  <div className={`w-10 h-10 ${b.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <b.icon className={`h-5 w-5 ${b.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground shrink-0 transition-all mt-1" />
                </motion.div>
              ))}
            </div>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button className="btn-glow" asChild>
                  <a href="https://discord.gg/shadowtalkai" target="_blank" rel="noopener noreferrer">
                    Join Discord
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" asChild>
                  <a href="https://twitter.com/shadowtalkai" target="_blank" rel="noopener noreferrer">
                    Follow on X
                  </a>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Events */}
          <div>
            <motion.h3
              variants={variants.fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-2xl font-bold mb-6"
            >
              Upcoming Events
            </motion.h3>
            <div className="space-y-3">
              {events.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={hoverLift}
                >
                  <Card className="border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.15)] group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="glass-subtle rounded-xl p-3 text-center min-w-[60px]">
                          <div className="text-xs font-bold text-primary">{event.date}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            {event.live && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.participants}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {event.type}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
