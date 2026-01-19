import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Wrench, 
  Target, 
  Layers, 
  Award, 
  Users, 
  Rocket, 
  Code, 
  Wifi, 
  WifiOff,
  Quote,
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp
} from "lucide-react";
import zainImage from "@/assets/zain-ahmed.png";
import { useState, useEffect } from "react";

const AboutPage = () => {
  const [nodeCount, setNodeCount] = useState(23);

  // Simulate live node counter (you can update this with real data)
  useEffect(() => {
    const interval = setInterval(() => {
      // Small random fluctuation for realism
      setNodeCount(prev => {
        const change = Math.random() > 0.7 ? 1 : 0;
        return prev + change;
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Section */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[3/4] max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
                <img 
                  src={zainImage} 
                  alt="Zain Ahmed - CEO & Founder of ShadowTalk AI"
                  className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-border"
                />
                {/* Live Node Counter Badge */}
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-mono font-bold">Current Nodes: {nodeCount}</span>
                </div>
              </div>
            </div>

            {/* Text Section */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">The Architect</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Behind the <span className="gradient-text">Bot</span>
              </h1>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Karachi, Pakistan
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  17 Years Old
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Architect
                </Badge>
              </div>

              <p className="text-xl text-muted-foreground leading-relaxed">
                I am <span className="text-foreground font-semibold">Zain Ahmed</span>, a 17-year-old AI Architect based in Karachi. 
                While others use AI to generate text, I build AI to guarantee <span className="text-primary font-semibold">Sovereignty</span>.
              </p>

              <blockquote className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground bg-muted/50 rounded-r-lg">
                <Quote className="h-4 w-4 inline mr-2 text-primary" />
                "People play with balls; I play with AIs. My goal isn't just to code—it's to architect the infrastructure for the next generation of Pakistani builders."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <Separator className="max-w-4xl mx-auto" />

      {/* The Why Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">The "Why"</h2>
                  <p className="text-sm text-muted-foreground">The Sovereign Mission</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                I believe the future of intelligence shouldn't depend on a constant internet connection or a foreign cloud server. 
                My mission is to build <span className="text-primary font-semibold">"Intelligence without Internet"</span>—giving 
                every student and business in Pakistan the power of AI on their own terms.
              </p>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <WifiOff className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Offline-First Philosophy</h3>
                  <p className="text-sm text-muted-foreground">Building sovereign AI that works anywhere, anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The Stack Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Layers className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">The Stack</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">How I Play</h2>
            <p className="text-muted-foreground">I don't just "prompt"—I engineer.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Infrastructure</h3>
                <p className="text-sm text-muted-foreground">
                  Built and scaled using <span className="text-primary">Lovable Pro</span> for rapid deployment and clean, private code architecture.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <WifiOff className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Offline Core</h3>
                <p className="text-sm text-muted-foreground">
                  Developed <span className="text-primary">ShadowTalk</span>, a sovereign engine utilizing local inference to run LLMs in Airplane Mode.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Growth Engine</h3>
                <p className="text-sm text-muted-foreground">
                  Architected <span className="text-primary">SocialSync</span>, an AI automation hub that achieved 23 customers in its first 24 hours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Proof Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Award className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">The Proof</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Traction & Mentorship</h2>
            <p className="text-muted-foreground">I believe in "Proof of Work" over "Proof of Degree."</p>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">User Growth</h3>
                    <p className="text-muted-foreground">
                      SocialSync is currently powering <span className="text-primary font-bold">23+ businesses</span>, 
                      providing a <span className="text-green-500 font-semibold">+12% engagement spike</span> through autonomous AI distribution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg shrink-0">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Mentorship</h3>
                    <p className="text-muted-foreground">
                      My work is recognized and supported by <span className="text-foreground font-semibold">Sir Zia Khan</span> (Governor Sindh IT Initiative), 
                      aligning my projects with the national vision for a tech-independent Pakistan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg shrink-0">
                    <Code className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Self-Funded</h3>
                    <p className="text-muted-foreground">
                      Proudly bootstrapped and seed-funded through grit and results, proving that 
                      <span className="text-foreground font-semibold"> a 17-year-old with $50 and a dream</span> can outpace corporate inertia.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Project Credits */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-8">Project Credits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 text-primary">ShadowTalk AI</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A sovereign AI chatbot with offline capabilities, multi-model support, and enterprise features.
                </p>
                <Badge>Founder & Lead Developer</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 text-primary">SocialSync</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered social media automation hub serving 23+ businesses.
                </p>
                <Badge>Architect & Creator</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <Wifi className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Building the Future of AI in Pakistan</h2>
            <p className="text-muted-foreground mb-6">
              Join me on this journey to democratize artificial intelligence and build sovereign technology solutions.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Available for collaborations and partnerships</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
