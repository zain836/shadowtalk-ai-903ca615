import { Card, CardContent } from "@/components/ui/card";
import { Target, WifiOff, Globe, Shield } from "lucide-react";
import { motion } from "framer-motion";

const AboutMission = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Card className="glass-subtle border-primary/20 overflow-hidden relative group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="p-3 bg-primary/10 rounded-xl"
                >
                  <Target className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">The "Why"</h2>
                  <p className="text-sm text-muted-foreground">The Sovereign Mission</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                I believe the future of intelligence shouldn't depend on a constant internet connection or a foreign cloud server.
                My mission: <span className="text-primary font-semibold">"Intelligence without Internet"</span> — giving every student and business the power of AI on their own terms.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: WifiOff, title: "Offline-First", desc: "Sovereign AI that works anywhere, anytime" },
                  { icon: Shield, title: "Privacy-Native", desc: "Your data never leaves your device" },
                  { icon: Globe, title: "Pakistan-Built", desc: "World-class tech from the Global South" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-subtle rounded-xl p-4 flex items-start gap-3 group/card hover:border-primary/20 transition-all"
                  >
                    <item.icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutMission;
