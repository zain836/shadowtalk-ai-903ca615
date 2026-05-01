import { Quote, Sparkles, MessageSquare, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * HONEST early-stage testimonials section.
 *
 * Per the "Claims to Reality Roadmap" (P0):
 * - Removed AI-generated avatars and fabricated quotes (Ryan Tanaka, Marcus Chen, Lena Vasquez, etc.)
 * - Removed "4.9/5 from 12,483 verified reviews" — we have not collected real reviews yet.
 * - Replaced with a transparent "building in public" call-out and an invitation to
 *   share real feedback. Will be repopulated with real, attributed testimonials
 *   (with explicit user permission) as we collect them.
 */
const TestimonialsSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-28 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-30" />
      <motion.div
        animate={isInView ? { scale: [1, 1.3, 1], opacity: [0.04, 0.08, 0.04] } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/3 w-[700px] h-[400px] bg-secondary/5 rounded-full blur-[150px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-6"
          >
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm text-muted-foreground font-medium">Early Access · Building in Public</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            Honest about where{" "}
            <span className="gradient-text">we are</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-muted-foreground"
          >
            ShadowTalk AI is in early access. We haven't collected enough verified user
            reviews to publish a star rating yet — and we'd rather show nothing than show
            numbers we can't prove.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <Quote className="h-6 w-6 text-primary/60 mb-3" />
              <h3 className="font-semibold mb-2">No fake testimonials</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We removed every AI-generated avatar and quote from this page. Real
                testimonials with real names will appear here once verified beta users
                opt in to share their experience.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <MessageSquare className="h-6 w-6 text-primary/60 mb-3" />
              <h3 className="font-semibold mb-2">Try it, then judge it</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The free tier needs no credit card. Use the offline AI, the deep
                research, the document generator — and decide for yourself instead of
                trusting a marketing quote.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <Heart className="h-6 w-6 text-primary/60 mb-3" />
              <h3 className="font-semibold mb-2">Tell us what's broken</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Beta users get a direct line to the founder. Honest feedback —
                positive or critical — shapes the next release. Reach us anytime
                from the contact page.
              </p>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-subtle rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Used ShadowTalk AI? We'd love a real, attributed testimonial — and we
              promise to never publish anything you didn't write.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="sm" variant="default">
                <Link to="/chatbot">Try the free tier</Link>
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
