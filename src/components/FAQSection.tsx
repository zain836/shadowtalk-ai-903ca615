import { HelpCircle, Mail, MessageCircle, ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
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

  const faqs = [
    {
      question: "What is agentic AI in ShadowTalk?",
      answer: "Agentic AI means you give a goal and ShadowTalk plans multi-step work, runs integrated tools (research, code, calendar, vault, and more), and reports back — with optional human approval before each action. Use the Agentic Task Runner or Mission Control from the chat workspace.",
      category: "General",
    },
    {
      question: "How does the AI chatbot work?",
      answer: "Chat uses cloud models (Gemini and others) by default for power and speed. You can also trigger 30+ tools from natural language, open the Agentic Task Runner, or switch to optional on-device Gemma when you've downloaded it in Settings.",
      category: "General",
    },
    {
      question: "Can I use it offline?",
      answer: "Yes, optionally. Download the Gemma on-device model in Settings → On-Device AI to run inference locally via WebGPU (best on Chrome/Edge). Cloud chat and agents need internet; local mode is opt-in for privacy-sensitive work.",
      category: "Features",
    },
    {
      question: "Is my data secure and private?",
      answer: "ShadowTalk is privacy-aware: encrypted Stealth Vault, privacy score tools, and optional on-device AI so sensitive work can stay local. Cloud features process data on secure infrastructure — you control when to use local vs cloud modes.",
      category: "Security",
    },
    {
      question: "What programming languages does it support?",
      answer: "Our AI supports all major programming languages including Python, JavaScript, Java, C++, Go, Rust, and many more. It can generate, debug, and optimize code in any language you work with.",
      category: "Features",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. There are no cancellation fees, and you'll continue to have access to your plan features until the end of your billing period.",
      category: "Billing",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied within the first 30 days, contact our support team for a full refund.",
      category: "Billing",
    },
    {
      question: "How do I upgrade or downgrade my plan?",
      answer: "You can change your plan anytime from your account settings. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.",
      category: "Billing",
    },
    {
      question: "Is there an API available?",
      answer: "Yes! Elite plan users get access to our REST API, allowing you to integrate our AI capabilities into your own applications and workflows.",
      category: "Features",
    },
  ];

  const categoryColors: Record<string, string> = {
    General: "bg-primary/10 text-primary",
    Features: "bg-secondary/10 text-secondary",
    Security: "bg-success/10 text-success",
    Billing: "bg-warning/10 text-warning",
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
