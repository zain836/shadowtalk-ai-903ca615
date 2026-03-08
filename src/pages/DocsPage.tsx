import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft, Book, Code, Zap, MessageSquare, Image, Mic, Shield, Brain,
  Palette, Users, Download, Search, ChevronRight, ExternalLink, Sparkles,
  Settings, Lock, Bell, Globe, Keyboard, FileText, HelpCircle, Lightbulb,
  Terminal, Database, Cloud, Smartphone, Monitor, Wifi, WifiOff, Volume2,
  Upload, Share2, History, Star, Crown, Check, X, Compass, Eye, TrendingUp,
  Link2, Bookmark
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const DocSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-bold mb-5 tracking-tight gradient-text">{title}</h2>
    {children}
  </section>
);

const DocCard = ({ icon: Icon, title, description, badge }: { icon: any; title: string; description: string; badge?: string }) => (
  <Card className="card-glass h-full group overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <CardHeader className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {badge && <Badge variant="outline" className="glass-subtle border-primary/20 text-xs">{badge}</Badge>}
      </div>
      <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
);

const CodeExample = ({ title, code, language = "bash" }: { title: string; code: string; language?: string }) => (
  <div className="rounded-xl overflow-hidden mb-4 card-glass">
    <div className="glass-subtle px-4 py-2.5 text-sm font-medium border-b border-border/30 flex items-center justify-between">
      <span className="text-foreground/80">{title}</span>
      <Badge variant="outline" className="text-xs border-border/30 font-mono">{language}</Badge>
    </div>
    <pre className="p-4 overflow-x-auto text-sm">
      <code className="text-muted-foreground">{code}</code>
    </pre>
  </div>
);

const FeatureComparison = () => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border/30">
          <th className="text-left p-4 text-foreground/80">Feature</th>
          <th className="text-center p-4 text-foreground/80">Free</th>
          <th className="text-center p-4 text-primary font-bold">Pro</th>
          <th className="text-center p-4 text-secondary font-bold">Elite</th>
        </tr>
      </thead>
      <tbody>
        {[
          { feature: "Daily Messages", free: "50", pro: "Unlimited", elite: "Unlimited" },
          { feature: "AI Chat", free: true, pro: true, elite: true },
          { feature: "ShadowBrowser", free: true, pro: true, elite: true },
          { feature: "Browse Together", free: true, pro: true, elite: true },
          { feature: "Voice Input", free: true, pro: true, elite: true },
          { feature: "Voice Output (TTS)", free: false, pro: true, elite: true },
          { feature: "Image Generation", free: false, pro: true, elite: true },
          { feature: "Code Canvas", free: false, pro: true, elite: true },
          { feature: "Deep Research", free: false, pro: true, elite: true },
          { feature: "Chat Export", free: false, pro: true, elite: true },
          { feature: "Collaborative Rooms", free: false, pro: true, elite: true },
          { feature: "File Uploads", free: "5MB", pro: "50MB", elite: "500MB" },
          { feature: "Offline Mode", free: false, pro: false, elite: true },
          { feature: "Stealth Vault", free: false, pro: false, elite: true },
          { feature: "Model Fine-Tuning", free: false, pro: false, elite: true },
          { feature: "White-Label Branding", free: false, pro: false, elite: true },
          { feature: "API Access", free: false, pro: false, elite: true },
          { feature: "Priority Support", free: false, pro: true, elite: "24/7" },
        ].map((row, i) => (
          <tr key={i} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
            <td className="p-4 font-medium text-foreground/90">{row.feature}</td>
            <td className="text-center p-4">
              {typeof row.free === 'boolean' ? (
                row.free ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
              ) : <span className="text-muted-foreground">{row.free}</span>}
            </td>
            <td className="text-center p-4">
              {typeof row.pro === 'boolean' ? (
                row.pro ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
              ) : <span className="text-primary font-medium">{row.pro}</span>}
            </td>
            <td className="text-center p-4">
              {typeof row.elite === 'boolean' ? (
                row.elite ? <Check className="h-5 w-5 text-secondary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
              ) : <span className="text-secondary font-medium">{row.elite}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DocsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const features = [
    { icon: Brain, title: "Multi-Model AI Engine", description: "Powered by Gemini & GPT-5 with adaptive model routing for optimal responses", badge: "Core" },
    { icon: Compass, title: "ShadowBrowser", description: "Built-in AI-powered browser with Browse Together mode for real-time assistance", badge: "Free" },
    { icon: Eye, title: "Browse Together", description: "AI assists while you browse — summaries, insights, and contextual Q&A", badge: "Free" },
    { icon: MessageSquare, title: "AI Chat", description: "Natural conversations with context memory, personality modes, and streaming responses", badge: "Free" },
    { icon: Shield, title: "Cyber Command Center", description: "Full security operations suite — threat intel, OSINT, pentest copilot, bug bounty tracker", badge: "New" },
    { icon: Mic, title: "Voice Input & TTS", description: "Speak to AI with voice recognition and ElevenLabs text-to-speech output", badge: "Free" },
    { icon: Code, title: "Code Generation", description: "Generate, debug, and explain code in multiple languages with Code Canvas", badge: "Pro" },
    { icon: Brain, title: "AI Memory System", description: "Persistent memory that learns your preferences and business context over time", badge: "Core" },
    { icon: Palette, title: "White-Label Branding", description: "Full workspace customization — logos, colors, fonts, and custom domains", badge: "Elite" },
    { icon: Users, title: "Collaborative Rooms", description: "Real-time multi-user AI chat rooms with document collaboration", badge: "Pro" },
    { icon: Lock, title: "Stealth Vault", description: "AES-256-GCM encrypted storage for sensitive data — never leaves your device", badge: "Elite" },
  ];

  const quickStartSteps = [
    { step: 1, title: "Create an Account", description: "Sign up with email. No credit card required for the free tier.", icon: Users },
    { step: 2, title: "Start Chatting", description: "Open the chatbot and start typing. AI responds in real-time with streaming.", icon: MessageSquare },
    { step: 3, title: "Explore Tools", description: "Try Cyber Command Center, ShadowBrowser, voice input, and mission control.", icon: Zap },
    { step: 4, title: "Upgrade for More", description: "Unlock image generation, collaborative rooms, stealth vault, and API access.", icon: Crown },
  ];

  const apiEndpoints = [
    { method: "POST", endpoint: "/functions/v1/chat", description: "Send a message and receive streaming AI response", example: `{\n  "messages": [{"role": "user", "content": "Hello!"}],\n  "personality": "friendly"\n}` },
    { method: "POST", endpoint: "/functions/v1/cyber-ai-copilot", description: "Security-focused AI assistant with specialized modes", example: `{\n  "messages": [{"role": "user", "content": "Analyze CVE-2026-0217"}],\n  "mode": "exploit"\n}` },
    { method: "POST", endpoint: "/functions/v1/website-security-scan", description: "Scan a website for security headers and vulnerabilities", example: `{\n  "url": "https://example.com",\n  "scanDepth": "standard"\n}` },
    { method: "POST", endpoint: "/functions/v1/web-search", description: "AI-powered web search with summarization", example: `{\n  "query": "latest CVE vulnerabilities 2026"\n}` },
    { method: "POST", endpoint: "/functions/v1/generate-blog", description: "Generate AI-written blog posts", example: null },
  ];

  const chatModes = [
    { name: "General", icon: MessageSquare, description: "All-purpose assistant for any topic.", color: "from-primary to-primary/60" },
    { name: "Code", icon: Code, description: "Programming and debugging assistance.", color: "from-secondary to-secondary/60" },
    { name: "Creative", icon: Sparkles, description: "Writing, storytelling, and content creation.", color: "from-accent to-accent/60" },
    { name: "Translate", icon: Globe, description: "Multi-language translation support.", color: "from-primary to-secondary" },
    { name: "Summarize", icon: FileText, description: "Condense long texts into key points.", color: "from-secondary to-accent" },
    { name: "Image", icon: Image, description: "Generate images from descriptions.", color: "from-accent to-primary" },
    { name: "Debug", icon: Terminal, description: "Find and fix bugs in your code.", color: "from-primary to-primary/60" },
    { name: "Brainstorm", icon: Lightbulb, description: "Generate ideas and explore concepts.", color: "from-secondary to-secondary/60" },
    { name: "Explain", icon: HelpCircle, description: "Break down complex topics simply.", color: "from-primary to-secondary" },
    { name: "Music", icon: Volume2, description: "Get music recommendations.", color: "from-accent to-accent/60" },
  ];

  const troubleshooting = [
    { issue: "Messages not sending", solutions: ["Check your internet connection", "Refresh the page and try again", "Clear your browser cache", "Make sure you're logged in", "Check if you've exceeded your daily message limit"] },
    { issue: "Voice input not working", solutions: ["Allow microphone permissions in your browser", "Check if your microphone is working in other apps", "Try using Chrome or Edge for best compatibility", "Ensure you're in a quiet environment", "Check your system audio settings"] },
    { issue: "Images not generating", solutions: ["Ensure you have a Pro or Elite subscription", "Check your daily image generation limit", "Try a simpler prompt", "Avoid prohibited content in prompts", "Wait a few seconds and try again"] },
    { issue: "Collaborative room issues", solutions: ["Ensure all participants have Pro or Elite plans", "Check if the room hasn't reached max participants", "Verify the room link is correct", "Try refreshing the page", "Check if you've been banned from the room"] },
    { issue: "PWA installation problems", solutions: ["Make sure you're using a supported browser", "On iOS, use Safari to install", "Clear browser data and try again", "Check for browser updates", "Try incognito mode first"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>
      
      <main className="pt-20 relative z-10">
        {/* Hero Section */}
        <section className="py-16 px-4 border-b border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-15" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
                <Book className="h-3 w-3 mr-1" /> Documentation
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
            >
              ShadowTalk AI <span className="gradient-text">Documentation</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Comprehensive guides, tutorials, and reference documentation
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="pl-10 rounded-xl glass-subtle border-border/30 focus:border-primary/50"
                />
              </div>
            </motion.div>
            
            {/* Quick Links */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" className="rounded-full glass-subtle border-border/30 hover:border-primary/40" onClick={() => navigate('/chatbot')}>
                <MessageSquare className="h-4 w-4 mr-2" /> Try Chatbot
              </Button>
              <Button variant="outline" size="sm" className="rounded-full glass-subtle border-border/30 hover:border-primary/40" onClick={() => navigate('/changelog')}>
                <History className="h-4 w-4 mr-2" /> Changelog
              </Button>
              <Button variant="outline" size="sm" className="rounded-full glass-subtle border-border/30 hover:border-primary/40" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4 mr-2" /> Pricing
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 max-w-3xl mx-auto gap-1 glass-subtle border-border/30 p-1">
              <TabsTrigger value="getting-started">Get Started</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="modes">Chat Modes</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="troubleshooting">Help</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* Getting Started */}
            <TabsContent value="getting-started" className="space-y-8">
              <DocSection title="Quick Start Guide">
                <p className="text-muted-foreground mb-6">
                  Get up and running with ShadowTalk AI in just a few minutes.
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  {quickStartSteps.map((item, i) => (
                    <motion.div key={item.step} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
                    >
                      <Card className="card-glass h-full group overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <Badge variant="outline" className="mb-1 glass-subtle border-primary/20 text-xs">Step {item.step}</Badge>
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.title}</CardTitle>
                            </div>
                          </div>
                          <CardDescription className="mt-2">{item.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="System Requirements">
                <div className="grid gap-5 md:grid-cols-2">
                  {[
                    { icon: Monitor, title: "Desktop", items: ["Chrome 80+, Firefox 75+, Safari 14+, Edge 80+", "4GB RAM minimum, 8GB recommended", "Stable internet connection (5+ Mbps)", "JavaScript enabled"] },
                    { icon: Smartphone, title: "Mobile", items: ["iOS 14+ (Safari), Android 8+ (Chrome)", "PWA installation supported", "4G/5G or WiFi connection", "Microphone for voice features"] },
                  ].map((platform, idx) => (
                    <motion.div key={idx} custom={idx} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Card className="card-glass h-full overflow-hidden">
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <platform.icon className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{platform.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <ul className="space-y-2">
                            {platform.items.map((item, j) => (
                              <li key={j} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="Installation">
                <p className="text-muted-foreground mb-6">
                  ShadowTalk AI is a Progressive Web App (PWA) — install on any device for a native experience.
                </p>
                <div className="grid gap-5 md:grid-cols-3">
                  {[
                    { icon: Monitor, title: "Desktop (Chrome)", steps: ["Visit shadowtalk-ai.com", "Click the install icon in the address bar", "Click \"Install\" in the prompt", "Launch from your desktop"] },
                    { icon: Smartphone, title: "iOS (Safari)", steps: ["Open Safari and visit shadowtalk-ai.com", "Tap the Share button", "Scroll down and tap \"Add to Home Screen\"", "Tap \"Add\" to confirm"] },
                    { icon: Smartphone, title: "Android (Chrome)", steps: ["Open Chrome and visit shadowtalk-ai.com", "Tap the banner or menu (three dots)", "Select \"Install App\"", "Confirm installation"] },
                  ].map((platform, idx) => (
                    <motion.div key={idx} custom={idx} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Card className="card-glass h-full overflow-hidden">
                        <CardHeader className="relative z-10">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <platform.icon className="h-5 w-5 text-primary" />
                            {platform.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <ol className="space-y-2.5 text-sm">
                            {platform.steps.map((step, j) => (
                              <li key={j} className="flex gap-3">
                                <span className="font-bold text-primary shrink-0">{j + 1}.</span>
                                <span className="text-muted-foreground">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="Plan Comparison">
                <p className="text-muted-foreground mb-6">Choose the plan that best fits your needs.</p>
                <Card className="card-glass overflow-hidden">
                  <CardContent className="pt-6 relative z-10">
                    <FeatureComparison />
                  </CardContent>
                </Card>
              </DocSection>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="space-y-8">
              <DocSection title="Core Features">
                <p className="text-muted-foreground mb-6">Powerful features designed to enhance your productivity and creativity.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {features.map((feature, i) => (
                    <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                      whileHover={{ y: -6, transition: { type: "spring", stiffness: 400 } }}
                    >
                      <DocCard {...feature} />
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="AI Personalities">
                <p className="text-muted-foreground mb-6">Choose from four distinct AI personalities.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { title: "Friendly 😊", description: "Warm, approachable, and conversational." },
                    { title: "Professional 💼", description: "Formal, precise, and business-oriented." },
                    { title: "Creative 🎨", description: "Imaginative, playful, and expressive." },
                    { title: "Sarcastic 😏", description: "Witty, humorous, and playfully sarcastic." },
                  ].map((p, i) => (
                    <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
                    >
                      <Card className="card-glass h-full group overflow-hidden">
                        <CardHeader className="relative z-10">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{p.title}</CardTitle>
                          <CardDescription>{p.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="Keyboard Shortcuts">
                <Card className="card-glass overflow-hidden">
                  <CardContent className="pt-6 relative z-10">
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        { action: "Send message", shortcut: "Enter" },
                        { action: "New line", shortcut: "Shift + Enter" },
                        { action: "Voice input", shortcut: "Ctrl + M" },
                        { action: "Toggle sidebar", shortcut: "Ctrl + B" },
                        { action: "New conversation", shortcut: "Ctrl + N" },
                        { action: "Search messages", shortcut: "Ctrl + F" },
                        { action: "Open ShadowBrowser", shortcut: "Ctrl + Shift + B" },
                        { action: "Shadow Cowork", shortcut: "Shift + W" },
                        { action: "ShadowTalk Live", shortcut: "Shift + L" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                          <span className="text-sm text-foreground/80">{item.action}</span>
                          <Badge variant="outline" className="font-mono text-xs border-border/30">{item.shortcut}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </DocSection>

              <DocSection title="ShadowBrowser">
                <p className="text-muted-foreground mb-6">Built-in AI-powered web browser with real-time assistance.</p>
                <div className="grid gap-5 md:grid-cols-2">
                  {[
                    { icon: Compass, title: "Browser Features", items: ["Multi-tab browsing with smart tab management", "Bookmarks and browsing history", "AI-powered web search", "One-click page analysis", "Send content to main chat"] },
                    { icon: Eye, title: "Browse Together Mode", items: ["AI automatically analyzes pages you visit", "Get key insights and summaries", "Ask questions about any webpage", "Related content suggestions", "Quick actions: Summarize, Key Points, Find Similar"] },
                  ].map((section, idx) => (
                    <motion.div key={idx} custom={idx} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Card className="card-glass h-full overflow-hidden">
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <section.icon className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{section.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <ul className="space-y-2 text-sm">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="Proactive AI Intelligence">
                <p className="text-muted-foreground mb-6">Real AI-powered behavioral intelligence — no mock or hardcoded responses.</p>
                <div className="grid gap-5 md:grid-cols-2">
                  {[
                    { icon: Brain, title: "How It Works", items: ["29+ behavioral triggers monitor your activity in real-time", "Contextual data (page, mood, scroll depth, visit count) sent to AI", "Gemini Flash Lite generates personalized, relevant suggestions", "Smart 2-minute cache prevents redundant AI calls"] },
                    { icon: TrendingUp, title: "Trigger Examples", items: ["Idle detection — AI suggests actions when you pause", "Deep scroll — contextual tips as you explore content", "Cognitive load estimation — simplifies when overwhelmed", "Return visitor — personalized welcome based on history"] },
                  ].map((section, idx) => (
                    <motion.div key={idx} custom={idx} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Card className="card-glass h-full overflow-hidden">
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <section.icon className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle>{section.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <ul className="space-y-2 text-sm">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>
            </TabsContent>

            {/* Chat Modes */}
            <TabsContent value="modes" className="space-y-8">
              <DocSection title="Specialized Chat Modes">
                <p className="text-muted-foreground mb-6">10 specialized modes, each optimized for specific tasks.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {chatModes.map((mode, i) => (
                    <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
                    >
                      <Card className="card-glass overflow-hidden group">
                        <div className={`h-1 bg-gradient-to-r ${mode.color}`} />
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                              <mode.icon className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{mode.name}</CardTitle>
                          </div>
                          <CardDescription className="mt-2">{mode.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <DocSection title="Mode Best Practices">
                <Accordion type="single" collapsible className="space-y-3">
                  {[
                    { value: "code", title: "Code Mode Tips", tips: ["Specify the programming language for better results", "Include context about your project structure", "Use the Code Canvas for interactive editing", "Ask for explanations along with code solutions", "Request unit tests for generated code"] },
                    { value: "image", title: "Image Generation Tips", tips: ["Be specific about style (photorealistic, cartoon, watercolor, etc.)", "Include details about lighting and mood", "Mention aspect ratio if important", "Use negative prompts to exclude unwanted elements", "Daily limit: 100 images"] },
                    { value: "translate", title: "Translation Tips", tips: ["Specify source and target languages", "Provide context for better accuracy", "Ask for formal or informal translations", "Request pronunciation guides when needed", "Supports 100+ languages"] },
                    { value: "summarize", title: "Summarization Tips", tips: ["Specify desired length (bullet points, paragraph, one-liner)", "Ask for key takeaways or action items", "Upload documents for longer content", "Request summaries for specific audiences", "Great for meeting notes and articles"] },
                  ].map((section) => (
                    <AccordionItem key={section.value} value={section.value} className="card-glass px-5 border-border/30">
                      <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">{section.title}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm">
                          {section.tips.map((tip, j) => (
                            <li key={j} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-muted-foreground">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </DocSection>
            </TabsContent>

            {/* API Reference */}
            <TabsContent value="api" className="space-y-8">
              <DocSection title="API Reference">
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">Elite Plan Required</Badge>
                </div>
                <p className="text-muted-foreground mb-6">
                  Access ShadowTalk AI programmatically through our REST API.
                </p>
                
                <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Card className="card-glass mb-6 overflow-hidden">
                    <CardHeader className="relative z-10">
                      <CardTitle>Authentication</CardTitle>
                      <CardDescription>All API requests require a Bearer token</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CodeExample title="Request Headers" language="http" code={`Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json`} />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Card className="card-glass mb-6 overflow-hidden">
                    <CardHeader className="relative z-10"><CardTitle>Base URL</CardTitle></CardHeader>
                    <CardContent className="relative z-10">
                      <code className="px-4 py-2.5 rounded-xl glass-subtle text-primary text-sm font-mono inline-block">https://{'{project-id}'}.supabase.co</code>
                      <p className="text-xs text-muted-foreground mt-2">Contact support for API key provisioning (Elite plan)</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, i) => (
                    <motion.div key={i} custom={i + 2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Card className="card-glass overflow-hidden">
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-3">
                            <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'} className="font-mono">{endpoint.method}</Badge>
                            <code className="text-sm font-mono text-primary">{endpoint.endpoint}</code>
                          </div>
                          <CardDescription>{endpoint.description}</CardDescription>
                        </CardHeader>
                        {endpoint.example && (
                          <CardContent className="relative z-10">
                            <CodeExample title="Request Body" language="json" code={endpoint.example} />
                          </CardContent>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>
            </TabsContent>

            {/* Troubleshooting */}
            <TabsContent value="troubleshooting" className="space-y-8">
              <DocSection title="Troubleshooting Guide">
                <p className="text-muted-foreground mb-6">Having issues? Find solutions to common problems below.</p>
                <Accordion type="single" collapsible className="space-y-3">
                  {troubleshooting.map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="card-glass px-5 border-border/30">
                      <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors">{item.issue}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {item.solutions.map((solution, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </DocSection>

              <DocSection title="Network Requirements">
                <div className="grid gap-5 md:grid-cols-2">
                  {[
                    { icon: Wifi, title: "Online Mode", color: "text-primary", items: ["Minimum 5 Mbps connection", "WebSocket support required", "Ports 443 (HTTPS) must be open", "Low latency recommended for voice"] },
                    { icon: WifiOff, title: "Offline Mode (Elite)", color: "text-secondary", items: ["Full offline login with cached credentials", "In-browser AI (WebLLM) for responses", "Cached conversations available", "Auto-sync when back online", "PWA installation required"] },
                  ].map((section, idx) => (
                    <motion.div key={idx} custom={idx} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      <Card className="card-glass h-full overflow-hidden">
                        <CardHeader className="relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <section.icon className={`h-5 w-5 ${section.color}`} />
                            </div>
                            <CardTitle>{section.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <ul className="space-y-2 text-sm">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </DocSection>

              <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}>
                <div className="glass-subtle rounded-2xl p-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 w-fit mx-auto mb-4">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">Still Need Help?</h3>
                  <p className="text-muted-foreground mb-6">Our support team is available to assist you</p>
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button variant="outline" className="rounded-xl glass-subtle border-border/30 hover:border-primary/40" onClick={() => navigate('/chatbot')}>
                      <MessageSquare className="h-4 w-4 mr-2" /> Ask AI Assistant
                    </Button>
                    <Button className="btn-glow rounded-xl">
                      <ExternalLink className="h-4 w-4 mr-2" /> Contact Support
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-8">
              <DocSection title="Frequently Asked Questions">
                <Accordion type="single" collapsible className="space-y-3">
                  {[
                    { q: "How do I get started with ShadowTalk AI?", a: "Sign up for a free account using your email or social login. No credit card required for the free tier. Once signed up, you can immediately start chatting with our AI assistant." },
                    { q: "What AI models does ShadowTalk use?", a: "We primarily use Google's Gemini models (gemini-2.5-pro and gemini-2.5-flash) for text and multimodal capabilities. For image generation, we use gemini-2.5-flash-image-preview." },
                    { q: "Is my data secure and private?", a: "Absolutely. We use end-to-end encryption, and our offline mode processes everything locally. We don't train on your data and offer a Stealth Vault for sensitive conversations." },
                    { q: "Can I use ShadowTalk in my own application?", a: "Yes! Our API allows you to integrate ShadowTalk AI into your applications. Available on Elite plans with comprehensive documentation and SDKs." },
                    { q: "What makes ShadowTalk different from other AI chatbots?", a: "We offer unique features like offline AI, ShadowBrowser, real-time proactive intelligence, collaborative rooms, and a privacy-first approach with local AI processing." },
                    { q: "How does offline mode work?", a: "We use WebLLM technology to run AI models directly in your browser. No internet needed, and your data never leaves your device. Available on Elite plans." },
                    { q: "Can I collaborate with my team?", a: "Yes! Our collaborative rooms feature lets multiple users interact with AI together in real-time. Available on Pro and Elite plans." },
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="card-glass px-5 border-border/30">
                      <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors font-medium">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </DocSection>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DocsPage;
