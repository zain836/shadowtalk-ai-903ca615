import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Powered by Advanced AI</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your Intelligent
            <span className="text-primary"> AI Assistant </span>
            for Everything
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of AI-powered conversations. Get instant answers, 
            generate content, and boost your productivity with ShadowTalk AI.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6"
              onClick={() => navigate('/chatbot')}
            >
              Start Chatting Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Globe className="h-5 w-5 text-primary" />
              <span>Works Offline</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
