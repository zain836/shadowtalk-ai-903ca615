import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, CreditCard, Shield, Zap, Code, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useFAQItems } from "@/hooks/useCMSContent";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const CATEGORY_ICONS: Record<string, any> = {
  general: Zap,
  billing: CreditCard,
  privacy: Shield,
  technical: Code,
};

const FAQPage = () => {
  const { items: dbItems, isLoading } = useFAQItems();

  // Group DB items by category, or use fallback
  const hasDbData = dbItems.length > 0;
  const groupedByCategory = hasDbData
    ? dbItems.reduce<Record<string, any[]>>((acc, item) => {
        const cat = item.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {})
    : null;

  const faqCategories = groupedByCategory
    ? Object.entries(groupedByCategory).map(([cat, items]) => ({
        icon: CATEGORY_ICONS[cat] || Zap,
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        questions: items.map((item: any) => ({ q: item.question, a: item.answer })),
      }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
              <HelpCircle className="h-3 w-3 mr-1" /> FAQ
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Frequently Asked <span className="gradient-text">Questions</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about ShadowTalk AI
          </motion.p>
        </div>
      </section>

      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl space-y-10">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : faqCategories.length === 0 ? (
            <p className="text-center text-muted-foreground glass-subtle rounded-xl p-8">
              No FAQ entries published yet. Check back soon or contact support.
            </p>
          ) : (
            faqCategories.map((category, catIndex) => (
              <motion.div key={catIndex} custom={catIndex} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
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
            ))
          )}
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} className="glass-subtle rounded-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 w-fit mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">Can't find what you're looking for? Our support team is ready to help.</p>
            <Button className="btn-glow" asChild>
              <Link to="/contact">Contact Support <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
