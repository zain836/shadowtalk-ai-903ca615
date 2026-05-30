import { HelpCircle, Mail, MessageCircle, Loader2 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { LANDING_COPY } from "@/lib/brand";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import LandingAmbientOrb from "@/components/landing/LandingAmbientOrb";
import { useFAQItems } from "@/hooks/useCMSContent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const FAQSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { items: dbItems, isLoading } = useFAQItems();
  const { variants, viewport, isMobile, hoverLift } = useLandingMotion();

  const faqs = useMemo(
    () =>
      dbItems.map((item) => ({
        question: item.question,
        answer: item.answer,
        category:
          item.category?.charAt(0).toUpperCase() + (item.category?.slice(1) || "general"),
      })),
    [dbItems]
  );

  const categoryColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Features: "bg-secondary/10 text-secondary",
    Security: "bg-success/10 text-success",
    Billing: "bg-warning/10 text-warning",
    Technical: "bg-accent/10 text-accent",
    Privacy: "bg-success/10 text-success",
  };

  return (
    <section id="faq" ref={sectionRef} className="py-16 sm:py-28 bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-20" />
      <LandingAmbientOrb
        className={`absolute top-1/2 right-0 ${
          isMobile ? "w-[280px] h-[280px] blur-[80px]" : "w-[500px] h-[500px] blur-[150px]"
        } bg-accent/5 rounded-full`}
        animate={isInView ? { x: [0, 20, 0], opacity: [0.03, 0.06, 0.03] } : undefined}
        duration={12}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-5 gap-8 sm:gap-12 max-w-6xl mx-auto">
          <div className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start">
            <motion.div
              variants={variants.fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="inline-flex items-center space-x-2 glass-subtle rounded-full px-4 py-2 sm:px-5 sm:py-2 mb-6 sm:mb-8"
            >
              <HelpCircle className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">{LANDING_COPY.faq.badge}</span>
            </motion.div>

            <motion.h2
              variants={variants.fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-6 tracking-tight leading-tight"
            >
              {LANDING_COPY.faq.title[0]}{" "}
              <span className="gradient-text">{LANDING_COPY.faq.title[1]}</span>
            </motion.h2>

            <motion.p
              variants={variants.fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base"
            >
              {LANDING_COPY.faq.subtitle}
            </motion.p>

            {/* Contact CTA */}
            <motion.div
              variants={variants.scaleFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={hoverLift}
              className="glass-subtle rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <h3 className="font-semibold">Still have questions?</h3>
              <p className="text-sm text-muted-foreground">
                We aim to reply within one business day. Premium and Elite plans get priority queue handling.
              </p>
              <div className="flex flex-col gap-2">
                <motion.div whileHover={hoverLift} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="btn-glow justify-start gap-2 w-full" asChild>
                    <a href="mailto:shadowtalk68@gmail.com">
                      <Mail className="h-4 w-4" />
                      Email Support
                    </a>
                  </Button>
                </motion.div>
                <motion.div whileHover={hoverLift} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="sm" className="justify-start gap-2 w-full">
                    <MessageCircle className="h-4 w-4" />
                    Live Chat
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right side - FAQ accordion */}
          <div className="lg:col-span-3">
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && faqs.length === 0 && (
              <p className="text-sm text-muted-foreground glass-subtle rounded-xl p-6">
                FAQs are managed in the admin CMS. Visit the full{" "}
                <a href="/faq" className="text-primary underline">FAQ page</a> or contact support.
              </p>
            )}
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  variants={faqVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewport}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="glass-subtle rounded-xl px-6 border-border/50 hover:border-primary/20 transition-colors data-[state=open]:border-primary/30 data-[state=open]:shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.15)]"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5 gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${categoryColors[faq.category]}`}>
                          {faq.category}
                        </span>
                        <span className="font-semibold text-sm">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-sm pl-[70px]">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
