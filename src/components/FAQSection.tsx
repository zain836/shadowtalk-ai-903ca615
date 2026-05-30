import { HelpCircle, Mail, MessageCircle, Loader2 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";
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
    <section id="faq" ref={sectionRef} className="py-28 bg-muted/10 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 bg-grid-dense opacity-20" />
      <motion.div
        animate={isInView ? { x: [0, 30, 0], opacity: [0.03, 0.06, 0.03] } : {}}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Left side - header */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-8"
            >
              <HelpCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground font-medium">Help Center</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
            >
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-muted-foreground mb-8 leading-relaxed"
            >
              Everything you need to know about ShadowTalk AI. Can't find what you're looking for?
            </motion.p>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="glass-subtle rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-semibold">Still have questions?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team responds within 2 hours.
              </p>
              <div className="flex flex-col gap-2">
                <Button size="sm" className="btn-glow justify-start gap-2" asChild>
                  <a href="mailto:shadowtalk68@gmail.com">
                    <Mail className="h-4 w-4" />
                    Email Support
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Live Chat
                </Button>
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
                  viewport={{ once: true, margin: "-30px" }}
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
