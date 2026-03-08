import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Brain,
  Globe,
  Shield,
  Zap,
  AlertTriangle,
  Rocket,
  MessageSquare,
} from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  { icon: Brain, label: "AI-Powered Chat", description: "Multiple AI models at your fingertips" },
  { icon: Globe, label: "ShadowBrowser", description: "Browse the web with AI assistance" },
  { icon: Shield, label: "Stealth Vault", description: "End-to-end encrypted notes" },
  { icon: Zap, label: "Deep Research", description: "Comprehensive AI-powered research" },
  { icon: Rocket, label: "Video Tutorials", description: "Step-by-step onboarding guides" },
];

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <MessageSquare className="w-8 h-8 text-primary-foreground" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-2 border-dashed border-primary/30 rounded-3xl"
              />
            </motion.div>
          </div>

          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to ShadowTalk AI
          </DialogTitle>

          <DialogDescription className="text-center text-muted-foreground">
            Your intelligent AI companion for conversations, research, and productivity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature Showcase */}
          <div className="relative h-24 overflow-hidden rounded-xl bg-muted/50 p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4"
              >
                {(() => {
                  const Feature = features[currentFeature];
                  const Icon = Feature.icon;
                  return (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{Feature.label}</h4>
                        <p className="text-sm text-muted-foreground">{Feature.description}</p>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>

            {/* Feature Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {features.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentFeature(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentFeature ? "bg-primary w-4" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>


          {/* Quick Tips */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
              <Badge variant="outline" className="text-[10px] px-1.5">Ctrl+K</Badge>
              <span className="text-muted-foreground">Quick search</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
              <Badge variant="outline" className="text-[10px] px-1.5">Ctrl+B</Badge>
              <span className="text-muted-foreground">Browser</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full gap-2"
          >
            <Rocket className="w-4 h-4" />
            Get Started
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Esc</kbd> to close anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
