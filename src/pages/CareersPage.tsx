import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { 
  Briefcase, MapPin, Clock, Users, Zap, Heart, Globe, 
  Rocket, Code, Palette, Megaphone, ArrowRight, Sparkles, Send, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  portfolioUrl: string;
  resumeUrl: string;
}

const CareersPage = () => {
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ApplicationForm>({
    name: "", email: "", phone: "", coverLetter: "", portfolioUrl: "", resumeUrl: "",
  });

  const benefits = [
    { icon: Zap, title: "Cutting-Edge Tech", description: "Work with the latest AI and ML technologies" },
    { icon: Globe, title: "Remote-First", description: "Work from anywhere in the world" },
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive health coverage" },
    { icon: Rocket, title: "Growth", description: "Learning budget and career development" },
    { icon: Users, title: "Great Team", description: "Collaborate with talented individuals" },
    { icon: Clock, title: "Flexible Hours", description: "Work when you're most productive" },
  ];

  const openPositions = [
    { title: "Senior AI Engineer", department: "Engineering", location: "Remote", type: "Full-time", icon: Code, description: "Build and optimize our AI infrastructure and model integrations." },
    { title: "Full Stack Developer", department: "Engineering", location: "Remote / Karachi", type: "Full-time", icon: Code, description: "Develop features across our React frontend and backend services." },
    { title: "Product Designer", department: "Design", location: "Remote", type: "Full-time", icon: Palette, description: "Design beautiful, intuitive interfaces for our AI platform." },
    { title: "DevOps Engineer", department: "Engineering", location: "Remote", type: "Full-time", icon: Code, description: "Manage our cloud infrastructure and deployment pipelines." },
    { title: "Growth Marketer", department: "Marketing", location: "Remote", type: "Full-time", icon: Megaphone, description: "Drive user acquisition and growth strategies." },
    { title: "Technical Writer", department: "Product", location: "Remote", type: "Part-time", icon: Code, description: "Create documentation, tutorials, and API guides." },
  ];

  const values = [
    { title: "Innovation First", description: "We push boundaries and embrace new ideas. If it hasn't been done, we'll figure it out." },
    { title: "User Obsession", description: "Every decision starts with how it benefits our users. Their success is our success." },
    { title: "Sovereignty", description: "We believe in building technology that empowers users with control over their data." },
    { title: "Impact > Effort", description: "We focus on outcomes, not hours. Smart work beats hard work." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !selectedPosition) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-job-application", {
        body: { ...form, position: selectedPosition },
      });

      if (error) throw error;

      toast({ title: "Application submitted! 🎉", description: "We'll review your application and get back to you soon." });
      setSelectedPosition(null);
      setForm({ name: "", email: "", phone: "", coverLetter: "", portfolioUrl: "", resumeUrl: "" });
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Failed to submit", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px]" />
      </div>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
              <Briefcase className="h-3 w-3 mr-1" /> Careers
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Build the Future of <span className="gradient-text">AI</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Join us in democratizing artificial intelligence and building sovereign technology solutions for everyone.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button size="lg" className="btn-glow" asChild>
              <a href="#positions"><ArrowRight className="mr-2 h-4 w-4" /> View Open Positions</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Our Values</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">What drives us every day</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className="card-glass h-full group">
                  <CardContent className="p-6 relative z-10">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dense opacity-10" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
              <Heart className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground font-medium">Perks & Benefits</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Why Join Us?</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className="card-glass h-full group">
                  <CardContent className="p-6 flex items-start gap-4 relative z-10">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6">
              <Briefcase className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground font-medium">Open Positions</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Find your next opportunity</h2>
          </motion.div>
          <div className="space-y-4">
            {openPositions.map((position, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ x: 4, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className="card-glass group overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                          <position.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{position.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{position.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-border/50 text-xs"><Briefcase className="h-3 w-3 mr-1" />{position.department}</Badge>
                            <Badge variant="outline" className="border-border/50 text-xs"><MapPin className="h-3 w-3 mr-1" />{position.location}</Badge>
                            <Badge variant="outline" className="border-border/50 text-xs"><Clock className="h-3 w-3 mr-1" />{position.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                        onClick={() => setSelectedPosition(position.title)}
                      >
                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
            className="glass-subtle rounded-2xl p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Don't see a perfect fit?</h2>
            <p className="text-muted-foreground mb-6">We're always looking for talented individuals. Send us your resume and we'll keep you in mind.</p>
            <Button variant="outline" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30" asChild>
              <Link to="/contact">Send General Application</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={!!selectedPosition} onOpenChange={(open) => !open && setSelectedPosition(null)}>
        <DialogContent className="sm:max-w-lg glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Apply for {selectedPosition}
            </DialogTitle>
            <DialogDescription>Fill in your details below. We'll review and get back to you.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="John Doe" required value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-background/50 border-border/50 mt-1" maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="john@example.com" required value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-background/50 border-border/50 mt-1" maxLength={255}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="bg-background/50 border-border/50 mt-1" maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="portfolioUrl">Portfolio / LinkedIn URL</Label>
              <Input id="portfolioUrl" type="url" placeholder="https://linkedin.com/in/johndoe" value={form.portfolioUrl}
                onChange={(e) => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                className="bg-background/50 border-border/50 mt-1" maxLength={500}
              />
            </div>
            <div>
              <Label htmlFor="resumeUrl">Resume URL (Google Drive, Dropbox, etc.)</Label>
              <Input id="resumeUrl" type="url" placeholder="https://drive.google.com/..." value={form.resumeUrl}
                onChange={(e) => setForm(f => ({ ...f, resumeUrl: e.target.value }))}
                className="bg-background/50 border-border/50 mt-1" maxLength={500}
              />
            </div>
            <div>
              <Label htmlFor="coverLetter">Cover Letter / Why this role?</Label>
              <Textarea id="coverLetter" placeholder="Tell us about yourself and why you're interested in this role..."
                value={form.coverLetter} onChange={(e) => setForm(f => ({ ...f, coverLetter: e.target.value }))}
                className="bg-background/50 border-border/50 mt-1 min-h-[120px]" maxLength={2000}
              />
            </div>
            <Button type="submit" className="w-full btn-glow" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit Application</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CareersPage;
