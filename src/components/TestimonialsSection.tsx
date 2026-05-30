import { Quote, Sparkles, MessageSquare, Heart, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";

const TestimonialsSection = () => {
  const { hoverLift, variants, viewport, isMobile } = useLandingMotion();

  const pillars = [
    {
      icon: Rocket,
      title: "Execution over prompts",
      body: "Early users don't come back for prettier replies — they stay because ShadowTalk runs missions, chains tools, and ships output they'd otherwise do by hand.",
    },
    {
      icon: MessageSquare,
      title: "Try it, then believe it",
      body: "No credit card on the free tier. Run research, agents, docs, and optional on-device AI — then decide if generic chat still deserves your tabs.",
    },
    {
      icon: Heart,
      title: "Founder on the line",
      body: "Beta feedback goes straight to the builder behind ShadowTalk. Praise and criticism both shape the next release — reach us anytime from Contact.",
    },
  ];

  return (
    <section className="py-16 sm:py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-30" />
      <LandingAmbientOrb
        className={`absolute bottom-0 left-1/3 ${
          isMobile ? "w-[400px] h-[220px] blur-[80px]" : "w-[700px] h-[400px] blur-[150px]"
        } bg-secondary/5 rounded-full`}
        duration={10}
      />

      <div className="container mx-auto px-4 relative z-10">
        <LandingSectionHeader
          badge={LANDING_COPY.testimonials.badge}
          badgeIcon={Sparkles}
          title={
            <>
              {LANDING_COPY.testimonials.title[0]}{" "}
              <span className="gradient-text">{LANDING_COPY.testimonials.title[1]}</span>
            </>
          }
          subtitle={LANDING_COPY.testimonials.subtitle}
          className="mb-10 sm:mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-10 sm:mb-12">
          {pillars.map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              variants={variants.cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={hoverLift}
            >
              <Card className="border-border/50 h-full">
                <CardContent className="p-5 sm:p-6">
                  <item.icon className="h-6 w-6 text-primary/70 mb-3" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={variants.fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-subtle rounded-2xl p-5 sm:p-6 text-center border border-border/50">
            <Quote className="h-6 w-6 text-primary/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              We don't publish star ratings we can't prove — and we never will. When verified users opt in, their
              words will live here. Until then, the product is the pitch.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="sm" variant="default" className="btn-glow">
                <Link to="/chatbot">Start free — feel the difference</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/contact">Share feedback</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
