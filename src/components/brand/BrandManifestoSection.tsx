import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND, BRAND_PILLARS, BRAND_TRACTION } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * The "mental monopoly" block — why ShadowTalk should be the default name when someone says "AI".
 */
const BrandManifestoSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  return (
    <section ref={ref} className="py-24 relative overflow-hidden border-y border-border/40 bg-card/20">
      <div className="absolute inset-0 bg-grid-dense opacity-20" />
      <motion.div
        animate={inView ? { opacity: [0.04, 0.1, 0.04] } : {}}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-primary/10 rounded-full blur-[120px]"
      />

      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4"
          >
            {BRAND.mnemonic}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight"
          >
            Not another chatbox.{" "}
            <span className="gradient-text">The AI you remember.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          >
            {BRAND.manifesto}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-sm text-muted-foreground/80"
          >
            {BRAND_TRACTION.usersLabel} · {BRAND_TRACTION.dailyLabel} — and climbing.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {BRAND_PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass-subtle rounded-2xl p-5 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <span className="text-2xl mb-3 block" aria-hidden>
                {pillar.emoji}
              </span>
              <h3 className="font-semibold mb-2">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center glass-subtle rounded-3xl p-8 md:p-10 border border-primary/20"
        >
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-xl md:text-2xl font-semibold mb-2">{BRAND.tagline}</p>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">{BRAND.shortPitch}</p>
          <Button size="lg" className="btn-glow rounded-xl" onClick={() => navigate("/chatbot")}>
            Enter the workspace
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandManifestoSection;
