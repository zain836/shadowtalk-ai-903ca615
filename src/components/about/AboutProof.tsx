import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Code, ArrowUpRight, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

const proofCards = [
  { icon: Users, title: "User Growth", desc: "SocialSync powering 23+ businesses with +12% engagement spike through autonomous AI distribution.", borderColor: "border-l-primary", bg: "bg-primary/10", iconColor: "text-primary" },
  { icon: Award, title: "Mentorship", desc: "Recognized by Sir Zia Khan (Governor Sindh IT Initiative), aligning with the national vision for tech-independent Pakistan.", borderColor: "border-l-accent", bg: "bg-accent/10", iconColor: "text-accent" },
  { icon: Code, title: "Self-Funded", desc: "Bootstrapped and seed-funded through grit — a 17-year-old with $50 and a dream outpacing corporate inertia.", borderColor: "border-l-success", bg: "bg-success/10", iconColor: "text-success" },
  { icon: GraduationCap, title: "Open Source Advocate", desc: "Contributing to the AI ecosystem through open-source tools and educational content for aspiring developers.", borderColor: "border-l-secondary", bg: "bg-secondary/10", iconColor: "text-secondary" },
];

const AboutProof = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6"
          >
            <Award className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground font-medium">The Proof</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Traction & Mentorship
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-muted-foreground">
            "Proof of Work" over "Proof of Degree."
          </motion.p>
        </div>

        <div className="space-y-4">
          {proofCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              whileHover={{ x: 6, transition: { type: "spring", stiffness: 400 } }}
            >
              <Card className={`border-l-4 ${card.borderColor} border-border/50 hover:border-border transition-all hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.1)] group`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${card.bg} rounded-xl shrink-0`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutProof;
