import { Users, MessageSquare, Star, Calendar, ArrowUpRight, Zap, Globe, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { buildCommunityHighlights, usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { useCommunityEvents } from "@/hooks/useCMSContent";

const CommunitySection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const metrics = usePlatformMetrics();
  const { events, isLoading: eventsLoading } = useCommunityEvents();

  const communityStats = useMemo(() => {
    const highlights = buildCommunityHighlights(metrics);
    const statIcons = [Users, MessageSquare, Star, Calendar];
    const gradients = [
      "from-primary/20 to-primary/5",
      "from-secondary/20 to-secondary/5",
      "from-accent/20 to-accent/5",
      "from-success/20 to-success/5",
    ];
    return highlights.map((item, i) => ({
      icon: statIcons[i] ?? Users,
      value: item.value,
      label: item.label,
      description: item.description,
      gradient: gradients[i],
    }));
  }, [metrics]);

  const benefits = [
    { icon: MessageSquare, title: "Share & Learn", desc: "Exchange ideas, get help, discover new AI use cases.", color: "text-primary", bg: "bg-primary/10" },
    { icon: Zap, title: "Early Access", desc: "First access to new features, beta programs, and exclusive content.", color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Globe, title: "Career Growth", desc: "Network with professionals, find job opportunities, showcase projects.", color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <section id="community" ref={sectionRef} className="py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-25" />
      <motion.div
        animate={isInView ? { scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[150px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-6"
          >
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground font-medium">Join Our Community</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            Connect with <span className="gradient-text">fellow builders</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Join a growing community of builders — stats below are pulled live from the platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          {communityStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400 } }}
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
                  <div className="text-2xl font-bold gradient-text mb-1">
                    {metrics.isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stat.value}
                  </div>
                  <div className="text-xs font-medium text-foreground/80">{stat.label}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-6"
            >
              Why Join?
            </motion.h3>
            <div className="space-y-4 mb-8">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ x: 4 }}
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
              <Button className="btn-glow" asChild>
                <a href="https://discord.gg/shadowtalkai" target="_blank" rel="noopener noreferrer">
                  Join Discord
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://twitter.com/shadowtalkai" target="_blank" rel="noopener noreferrer">
                  Follow on X
                </a>
              </Button>
            </div>
          </div>

          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-6"
            >
              Upcoming Events
            </motion.h3>
            <div className="space-y-3">
              {eventsLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!eventsLoading && events.length === 0 && (
                <p className="text-sm text-muted-foreground glass-subtle rounded-xl p-5">
                  No scheduled events right now. Admins can publish community events from the announcements panel.
                </p>
              )}
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4 }}
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
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
