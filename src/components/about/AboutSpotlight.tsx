import { motion, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import zainImage from "@/assets/zain-ahmed.png";

const AboutSpotlight = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 400, y: 200 });
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 14);
    rotateX.set(-y * 14);
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1200 }}
          className="relative rounded-3xl border border-primary/20 overflow-hidden about-spotlight-card"
        >
          <div
            className="about-spotlight-glow pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300"
            style={{
              background: `radial-gradient(520px circle at ${spot.x}px ${spot.y}px, hsl(var(--primary) / 0.2), transparent 50%)`,
            }}
          />

          <div className="grid lg:grid-cols-2 gap-0 relative z-10">
            <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center order-2 lg:order-1">
              <div className="flex items-center gap-1 text-warning mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + s * 0.06, type: "spring" }}
                  >
                    <Star className="h-4 w-4 fill-warning text-warning" />
                  </motion.div>
                ))}
              </div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Meet the mind behind <span className="gradient-text">ShadowTalk</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Zain Ahmed doesn't ask if AI is coming — he ships the stack so you own it. Investors, mentors, and
                builders who've seen this page leave with one thought:{" "}
                <span className="text-foreground font-medium">I need to follow this kid's trajectory.</span>
              </p>

              <ul className="space-y-3 mb-8 text-sm">
                {[
                  "Founded ShadowTalk AI at 16 — full product, not a weekend hack",
                  "SocialSync: 23+ businesses in 24 hours after launch",
                  "Recognized by leaders aligned with Pakistan's tech sovereignty",
                  "Building offline LLM infrastructure most teams call 'future work'",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">→</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Button className="btn-glow gap-2 group" onClick={() => navigate("/chatbot")}>
                  Experience his product
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="border-border/60" onClick={() => navigate("/contact")}>
                  Collaborate with Zain
                </Button>
              </div>
            </div>

            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative order-1 lg:order-2 min-h-[320px] lg:min-h-[480px] about-spotlight-image-wrap"
            >
              <img
                src={zainImage}
                alt="Zain Ahmed"
                className="absolute inset-0 w-full h-full object-cover object-top lg:object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent lg:bg-gradient-to-l lg:from-background lg:via-background/30 lg:to-transparent" />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-56 glass-strong rounded-xl p-4 shadow-xl"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                <p className="font-bold text-sm">Building the future — publicly</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-success connectivity-pulse" />
                  <span className="text-xs text-success font-medium">Accepting ambitious partners</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSpotlight;
