import { Button } from "@/components/ui/button";
import { Wifi, MessageCircle, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AboutCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[100px]"
      />

      <div className="container mx-auto max-w-2xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="glass-subtle rounded-2xl p-10 md:p-14 relative overflow-hidden border border-primary/25 about-cta-card"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex mb-6"
            >
              <Wifi className="h-12 w-12 text-primary" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
            >
              You felt it. Now <span className="gradient-text">act on it.</span>
            </motion.h2>

            <p className="text-muted-foreground mb-8 text-base max-w-md mx-auto leading-relaxed">
              Zain is building the AI stack Pakistan — and the world — deserves. Use ShadowTalk. Share the story. Or
              reach out and build something history will remember.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="btn-glow gap-2 w-full sm:w-auto" onClick={() => navigate("/chatbot")}>
                  <Zap className="h-4 w-4" />
                  Try ShadowTalk AI
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-border/60 w-full sm:w-auto"
                  onClick={() => navigate("/contact")}
                >
                  <MessageCircle className="h-4 w-4" />
                  Work with Zain
                </Button>
              </motion.div>
            </div>

            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <div className="w-1.5 h-1.5 bg-success rounded-full connectivity-pulse" />
              <span>Open for collaborations, press, and bold partnerships</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutCTA;
