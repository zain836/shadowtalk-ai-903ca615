import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, CreditCard, Shield, Zap, Code, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const FAQPage = () => {
  const faqCategories = [
    {
      icon: Zap,
      title: "General",
      questions: [
        { q: "What is ShadowTalk AI?", a: "ShadowTalk AI is an advanced AI assistant platform designed for developers, creators, and teams. It offers intelligent conversations, multi-model support, offline capabilities, and enterprise features to boost productivity." },
        { q: "How does the AI work?", a: "ShadowTalk AI leverages multiple large language models (LLMs) including Google Gemini, OpenAI GPT, and local models for offline use. You can switch between models based on your needs for speed, accuracy, or privacy." },
        { q: "Is my data safe with ShadowTalk AI?", a: "Yes, we take data security seriously. All conversations are encrypted, and we offer offline mode for complete privacy. Enterprise users get additional security features including SSO and audit logs." },
        { q: "Can I use ShadowTalk AI offline?", a: "Yes! Our offline mode uses local AI models that run entirely on your device. No internet connection required, and your data never leaves your computer." }
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Pricing",
      questions: [
        { q: "What plans are available?", a: "We offer Free, Pro, Premium, and Elite plans. Each tier provides increasing features, message limits, and capabilities. Visit our pricing page for detailed comparisons." },
        { q: "How does the free trial work?", a: "New users get access to our Free plan which includes basic features and limited messages per day. No credit card required to start." },
        { q: "Can I cancel my subscription anytime?", a: "Absolutely! You can cancel your subscription at any time from your account settings. You'll retain access to paid features until the end of your billing period." },
        { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund." }
      ]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      questions: [
        { q: "How is my data protected?", a: "We use end-to-end encryption for all communications, secure cloud infrastructure, and follow industry best practices. We're SOC 2 certified and GDPR compliant." },
        { q: "Can I delete my data?", a: "Yes, you can delete your conversations, account data, and all associated information at any time from your profile settings." },
        { q: "Do you train on user data?", a: "No, we do not use your conversations to train our AI models. Your data remains private and is only used to provide the service to you." },
        { q: "What about offline mode privacy?", a: "In offline mode, all AI processing happens locally on your device. No data is transmitted to any server, providing complete privacy." }
      ]
    },
    {
      icon: Code,
      title: "Technical & API",
      questions: [
        { q: "Is there an API available?", a: "Yes! Pro and higher plans include API access. You can integrate ShadowTalk AI into your applications, automate workflows, and build custom solutions." },
        { q: "What programming languages are supported?", a: "Our API is REST-based and can be used with any programming language. We provide SDKs for JavaScript, Python, and more." },
        { q: "Are there rate limits?", a: "Yes, rate limits depend on your plan. Free users have stricter limits, while Premium and Elite users get higher quotas. Check our API documentation for details." },
        { q: "Can I use custom AI models?", a: "Enterprise users can integrate custom fine-tuned models. Contact our sales team for more information on enterprise customization options." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
              <HelpCircle className="h-3 w-3 mr-1" /> FAQ
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Frequently Asked <span className="gradient-text">Questions</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Find answers to common questions about ShadowTalk AI
          </motion.p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl space-y-10">
          {faqCategories.map((category, catIndex) => (
            <motion.div
              key={catIndex}
              custom={catIndex}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{category.title}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`${catIndex}-${index}`}
                    className="card-glass px-6 border-border/30 data-[state=open]:border-primary/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline hover:text-primary transition-colors py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className="glass-subtle rounded-2xl p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 w-fit mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is ready to help.
            </p>
            <Button className="btn-glow" asChild>
              <Link to="/contact">
                Contact Support <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
