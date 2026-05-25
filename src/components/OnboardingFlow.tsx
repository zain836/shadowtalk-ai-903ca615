import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Shield, Cpu, Sparkles, ArrowRight, Check, X, Rocket, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ONBOARDING_KEY = "shadowtalk-onboarded";

const steps = [
  {
    icon: Brain,
    title: "Agentic Task Runner",
    description: "Describe a goal — ShadowTalk plans steps, runs 30+ tools, and delivers results. Approve actions when you want human-in-the-loop control.",
    highlight: "Plan → Execute → Deliver",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Mission Control",
    description: "Set autonomous missions for research, drafting, and multi-step workflows. Track progress with real-time execution logs.",
    highlight: "24/7 Autonomous",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Privacy When You Need It",
    description: "Encrypted vault, privacy score, and optional on-device Gemma — not cloud-only, but your choice when sensitivity matters.",
    highlight: "Privacy-Aware",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Rocket,
    title: "You're Ready!",
    description: "Start chatting, launch the Agentic Task Runner, or open Mission Control. Use ⌘K anytime to navigate instantly.",
    highlight: "Let's Go",
    color: "from-primary to-purple-500",
  },
];

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const checkOnboarding = async () => {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (done) return;

      // Check backend too
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', 'onboarding_completed')
          .maybeSingle();
        if (data?.setting_value) {
          localStorage.setItem(ONBOARDING_KEY, "true");
          return;
        }
      }

      setShow(true);
    };
    checkOnboarding();
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);

    // Sync to backend
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('user_settings').upsert({
          user_id: user.id,
          setting_key: 'onboarding_completed',
          setting_value: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,setting_key' }).then(() => {});
      }
    });
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
      navigate("/chatbot");
    }
  };

  if (!show) return null;

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-md mx-4"
        >
          <div className="relative bg-card border border-border/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
            {/* Background glow */}
            <div className={`absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br ${current.color} opacity-10 rounded-full blur-3xl`} />

            {/* Close */}
            <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-5 w-5" />
            </button>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-medium">{step + 1} of {steps.length}</span>
                <span className="text-[11px] text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center mb-6`}
            >
              <current.icon className="h-8 w-8 text-white" />
            </motion.div>

            {/* Content */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                <Sparkles className="h-3 w-3" />
                {current.highlight}
              </div>
              <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">{current.description}</p>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-6" : i < step ? "bg-primary/40" : "bg-muted"}`} />
                ))}
              </div>
              <Button onClick={next} className="gap-2 btn-glow">
                {step < steps.length - 1 ? (
                  <>Next <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>Start Chatting <MessageCircle className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingFlow;
