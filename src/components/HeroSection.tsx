import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Zap, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-grid overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${heroImg})` }}
      ></div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl float"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-xl float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-accent/20 rounded-full blur-xl float" style={{ animationDelay: '4s' }}></div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-card/50 backdrop-blur-sm border border-border rounded-full px-6 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by Advanced AI</span>
            <div className="w-2 h-2 bg-success rounded-full pulse-dot"></div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-8xl font-bold mb-6 leading-tight">
            The World's Smartest{" "}
            <span className="gradient-text">Offline+Online AI</span>{" "}
            Chatbot for Creators, Coders & CEOs
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
            Revolutionary AI assistant that works everywhere. Generate code, automate tasks,
            and boost productivity with the most advanced offline-capable chatbot ever built.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <Button
              size="lg"
              className="btn-glow text-lg px-8 py-6 group"
              onClick={() => navigate('/chatbot')}
            >
              <MessageCircle className="mr-3 h-6 w-6" />
              Chat Now - Free
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Zap className="mr-3 h-6 w-6" />
              View Features
            </Button>
          </div>

          {/* Real-time Social Proof with Psychology */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-muted-foreground">
            <div className="flex items-center space-x-2 status-online">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full border-2 border-background neon-glow"></div>
                <div className="w-8 h-8 bg-secondary rounded-full border-2 border-background neon-glow"></div>
                <div className="w-8 h-8 bg-accent rounded-full border-2 border-background neon-glow"></div>
              </div>
              <span className="text-sm counter-glow">47,892+ Active Users Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="drop-shadow-lg">⭐</span>
                ))}
              </div>
              <span className="text-sm counter-glow">4.9/5 from 12,483 reviews</span>
            </div>
            <div className="flex items-center space-x-2 urgency-blink">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <span className="text-sm font-medium text-destructive">Only 47 Lifetime deals left!</span>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 pt-8 border-t border-border/30">
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <div className="trust-badge px-4 py-2 bg-card/30 rounded-lg border border-border/50">
                <span className="text-xs font-medium">🔒 Privacy-First</span>
              </div>
              <div className="trust-badge px-4 py-2 bg-card/30 rounded-lg border border-border/50">
                <span className="text-xs font-medium">⚡ Offline Mode</span>
              </div>
              <div className="trust-badge px-4 py-2 bg-card/30 rounded-lg border border-border/50">
                <span className="text-xs font-medium">🚀 Product Hunt #1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
