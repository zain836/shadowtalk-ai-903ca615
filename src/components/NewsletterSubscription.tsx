import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Sparkles, Mail, ArrowRight, Zap } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

const emailSchema = z.string().email("Please enter a valid email address");

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;

const NewsletterSubscription = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useTransform(mouseX, (v) => `${v}px`);
  const glowY = useTransform(mouseY, (v) => `${v}px`);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { data: existingSubscriber } = await supabase
        .from("subscribers")
        .select("id, subscribed")
        .eq("email", email)
        .maybeSingle();

      if (existingSubscriber) {
        if (existingSubscriber.subscribed) {
          toast.info("You're already subscribed to our newsletter!");
        } else {
          await supabase
            .from("subscribers")
            .update({ subscribed: true, updated_at: new Date().toISOString() })
            .eq("id", existingSubscriber.id);
          toast.success("Welcome back! You've been re-subscribed.");
          setIsSubscribed(true);
        }
      } else {
        const { error } = await supabase
          .from("subscribers")
          .insert({ email, subscribed: true });
        if (error) throw error;
        toast.success("Thanks for subscribing! 🎉");
        setIsSubscribed(true);
      }
      setEmail("");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-border/50 p-[1px]"
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-60"
        style={{
          background: `radial-gradient(600px circle at ${glowX.get()}px ${glowY.get()}px, hsl(var(--primary) / 0.15), transparent 40%)`,
        }}
        animate={{
          background: [
            "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.2), hsl(var(--accent) / 0.15))",
            "linear-gradient(225deg, hsl(var(--accent) / 0.3), hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.15))",
            "linear-gradient(315deg, hsl(var(--secondary) / 0.3), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.15))",
            "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.2), hsl(var(--accent) / 0.15))",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner container */}
      <div className="relative rounded-2xl bg-card/80 backdrop-blur-xl p-8 md:p-10">
        {/* Floating ambient particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            animate={{
              x: [0, Math.random() * 80 - 40],
              y: [0, Math.random() * -60],
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeOut",
            }}
            style={{
              left: `${15 + i * 18}%`,
              top: `${60 + (i % 3) * 10}%`,
            }}
          />
        ))}

        {/* Top glow line */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          animate={{ width: isFocused ? "80%" : "40%" }}
          transition={spring}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Left: Content */}
          <div className="flex-1 text-center md:text-left">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={spring}
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide uppercase">
                Stay Ahead
              </span>
            </motion.div>

            <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              Get{" "}
              <span className="gradient-text">Intelligence</span>
              {" "}Delivered
            </h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-md">
              AI insights, product updates & exclusive features — straight to your inbox. No spam, ever.
            </p>
          </div>

          {/* Right: Form or Success */}
          <div className="w-full md:w-auto md:min-w-[380px]">
            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ ...spring, duration: 0.5 }}
                  className="flex flex-col items-center gap-3 py-4"
                >
                  <motion.div
                    className="relative"
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ ...spring, delay: 0.1 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/40"
                      animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">You're in! 🚀</p>
                    <p className="text-sm text-muted-foreground">Welcome to the future of AI.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubscribe}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <div
                    className={`relative flex items-center rounded-xl border transition-all duration-300 ${
                      isFocused
                        ? "border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                        : "border-border/60 hover:border-border"
                    } bg-background/60 backdrop-blur-sm`}
                  >
                    <Mail className="ml-4 w-5 h-5 text-muted-foreground/60 shrink-0" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      disabled={isLoading}
                      required
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base px-3 py-6 placeholder:text-muted-foreground/40"
                    />
                    <motion.div className="pr-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        size="sm"
                        className="rounded-lg px-5 py-5 font-semibold text-sm gap-2 shadow-[var(--shadow-button)]"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Subscribe
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {/* Trust indicators */}
                  <motion.div
                    className="flex items-center justify-center md:justify-start gap-4 mt-3 px-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Sparkles className="w-3 h-3" />
                      Free forever
                    </span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="text-xs text-muted-foreground/60">
                      Unsubscribe anytime
                    </span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="text-xs text-muted-foreground/60">
                      No spam
                    </span>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsletterSubscription;
