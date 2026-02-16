import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Send,
  Twitter,
  Linkedin,
  Github,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { ...formData, source: "Contact Page" },
      });
      if (error) throw error;
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again or email us directly at shadowtalk68@gmail.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "shadowtalk68@gmail.com",
      detail: "We respond within 24 hours"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Available in the app",
      detail: "Mon-Fri, 9am-6pm PKT"
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Karachi, Pakistan",
      detail: "Operating globally"
    },
    {
      icon: Clock,
      title: "Response Time",
      description: "< 24 hours",
      detail: "For priority support"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <MessageSquare className="h-3 w-3 mr-1" />
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Have a question or need help? We're here for you.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">{method.title}</h3>
                  <p className="text-primary font-medium">{method.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">{method.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" placeholder="Your name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" placeholder="your@email.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required maxLength={255} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                      <SelectTrigger><SelectValue placeholder="Select a topic" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                        <SelectItem value="Technical Support">Technical Support</SelectItem>
                        <SelectItem value="Billing Question">Billing Question</SelectItem>
                        <SelectItem value="Enterprise Sales">Enterprise Sales</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Press & Media">Press & Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" placeholder="How can we help you?" rows={5} value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })} required maxLength={2000} />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Let's Connect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you have a question about features, pricing, need a demo, or anything else, 
                  our team is ready to answer all your questions. We typically respond within 24 hours.
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="https://twitter.com/shadowtalkai" target="_blank" rel="noopener noreferrer"
                    className="p-3 bg-muted rounded-lg hover:bg-primary/10 transition-colors"><Twitter className="h-5 w-5" /></a>
                  <a href="https://linkedin.com/company/shadowtalkai" target="_blank" rel="noopener noreferrer"
                    className="p-3 bg-muted rounded-lg hover:bg-primary/10 transition-colors"><Linkedin className="h-5 w-5" /></a>
                  <a href="https://github.com/shadowtalkai" target="_blank" rel="noopener noreferrer"
                    className="p-3 bg-muted rounded-lg hover:bg-primary/10 transition-colors"><Github className="h-5 w-5" /></a>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-2">Enterprise Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Need dedicated support for your organization? Our enterprise team offers 
                    priority support, custom integrations, and dedicated account management.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="mailto:shadowtalk68@gmail.com?subject=Enterprise Support Inquiry">Contact Sales</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
