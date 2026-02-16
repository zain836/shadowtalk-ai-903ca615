import { Button } from "@/components/ui/button";
import { Wifi, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AboutCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring" }}
          className="glass-subtle rounded-2xl p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />

          <div className="relative z-10">
            <motion.div whileHover={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
              <Wifi className="h-10 w-10 text-primary mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Building the Future of AI in Pakistan</h2>
            <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
              Join the journey to democratize artificial intelligence and build sovereign technology for the next billion users.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Button className="btn-glow gap-2" onClick={() => navigate("/chatbot")}>
                Try ShadowTalk AI <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-2 border-border/60" onClick={() => navigate("/contact")}>
                <MessageCircle className="h-4 w-4" /> Get in Touch
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <span>Available for collaborations and partnerships</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutCTA;
