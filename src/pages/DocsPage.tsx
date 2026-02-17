import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const DocSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4 gradient-text">{title}</h2>
    {children}
  </section>
);

const DocCard = ({ icon: Icon, title, description, badge }: { icon: any; title: string; description: string; badge?: string }) => (
  <Card className="card-hover">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
);

const CodeExample = ({ title, code, language = "bash" }: { title: string; code: string; language?: string }) => (
  <div className="rounded-xl border border-border overflow-hidden mb-4">
    <div className="bg-muted px-4 py-2 text-sm font-medium border-b border-border flex items-center justify-between">
      <span>{title}</span>
      <Badge variant="outline" className="text-xs">{language}</Badge>
    </div>
    <pre className="p-4 overflow-x-auto text-sm bg-card">
      <code className="text-foreground">{code}</code>
    </pre>
  </div>
);

const FeatureComparison = () => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-4">Feature</th>
          <th className="text-center p-4">Free</th>
          <th className="text-center p-4">Pro</th>
          <th className="text-center p-4">Elite</th>
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
          <tr key={i} className="border-b border-border hover:bg-muted/50">
            <td className="p-4 font-medium">{row.feature}</td>
            <td className="text-center p-4">
              {typeof row.free === 'boolean' ? (
                row.free ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />
              ) : row.free}
            </td>
            <td className="text-center p-4">
              {typeof row.pro === 'boolean' ? (
                row.pro ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />
              ) : row.pro}
            </td>
            <td className="text-center p-4">
              {typeof row.elite === 'boolean' ? (
                row.elite ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />
              ) : row.elite}
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
    { icon: Brain, title: "Proactive AI Intelligence", description: "Real AI-generated contextual suggestions based on your behavior — no mock data", badge: "New" },
    { icon: Compass, title: "ShadowBrowser", description: "Built-in AI-powered browser with Browse Together mode", badge: "Free" },
    { icon: Eye, title: "Browse Together", description: "AI assists while you browse - summaries, insights, Q&A", badge: "Free" },
    { icon: MessageSquare, title: "AI Chat", description: "Engage in natural conversations with advanced AI models — powered by real Gemini AI", badge: "Free" },
    { icon: Image, title: "Image Generation", description: "Create stunning images from text descriptions", badge: "Pro" },
    { icon: Mic, title: "Voice Input", description: "Speak to the AI using voice recognition", badge: "Free" },
    { icon: Code, title: "Code Generation", description: "Generate and debug code in multiple languages", badge: "Pro" },
    { icon: Brain, title: "Model Fine-Tuning", description: "Train personalized AI responses", badge: "Elite" },
    { icon: Palette, title: "White-Label", description: "Customize branding and appearance", badge: "Elite" },
    { icon: Users, title: "Collaborative Rooms", description: "Chat with AI together in real-time", badge: "Pro" },
    { icon: Shield, title: "Stealth Mode", description: "Encrypted vault for sensitive data", badge: "Elite" },
  ];

  const quickStartSteps = [
    { step: 1, title: "Create an Account", description: "Sign up with your email or social login to get started. No credit card required for the free tier.", icon: Users },
    { step: 2, title: "Start Chatting", description: "Open the chatbot and start typing your questions or prompts. The AI will respond in real-time with helpful answers.", icon: MessageSquare },
    { step: 3, title: "Explore Features", description: "Try different modes, voice input, and file uploads for enhanced interactions. Each mode is optimized for specific tasks.", icon: Zap },
    { step: 4, title: "Upgrade for More", description: "Unlock advanced features with Pro or Elite plans. Get image generation, collaborative rooms, and more.", icon: Crown },
  ];

  const apiEndpoints = [
    { method: "POST", endpoint: "/v1/chat", description: "Send a message and receive AI response", example: `{
  "messages": [{"role": "user", "content": "Hello!"}],
  "model": "gemini-2.5-flash",
  "personality": "friendly"
}` },
    { method: "POST", endpoint: "/v1/images/generate", description: "Generate an image from text prompt", example: `{
  "prompt": "A sunset over mountains",
  "size": "1024x1024"
}` },
    { method: "GET", endpoint: "/v1/conversations", description: "List user conversations", example: null },
    { method: "POST", endpoint: "/v1/rooms", description: "Create a collaborative room", example: `{
  "name": "Team Brainstorm",
  "is_public": true
}` },
    { method: "GET", endpoint: "/v1/rooms/:id/messages", description: "Get messages from a room", example: null },
    { method: "POST", endpoint: "/v1/transcribe", description: "Transcribe audio to text", example: `{
  "audio": "base64_encoded_audio",
  "language": "en"
}` },
  ];

  const chatModes = [
    { name: "General", icon: MessageSquare, description: "All-purpose assistant for any topic. Great for questions, explanations, and general help.", color: "from-blue-500 to-cyan-500" },
    { name: "Code", icon: Code, description: "Programming and debugging assistance. Supports 50+ languages with syntax highlighting and code execution.", color: "from-green-500 to-emerald-500" },
    { name: "Creative", icon: Sparkles, description: "Writing, storytelling, and content creation. Perfect for blogs, stories, and marketing copy.", color: "from-purple-500 to-pink-500" },
    { name: "Translate", icon: Globe, description: "Multi-language translation support. Translate between 100+ languages with context awareness.", color: "from-amber-500 to-orange-500" },
    { name: "Summarize", icon: FileText, description: "Condense long texts into key points. Great for articles, documents, and meeting notes.", color: "from-red-500 to-rose-500" },
    { name: "Image", icon: Image, description: "Generate images from descriptions. Create art, illustrations, and visual content with AI.", color: "from-indigo-500 to-violet-500" },
    { name: "Debug", icon: Terminal, description: "Find and fix bugs in your code. Analyzes errors and suggests solutions.", color: "from-teal-500 to-cyan-500" },
    { name: "Brainstorm", icon: Lightbulb, description: "Generate ideas and explore concepts. Perfect for creative projects and problem-solving.", color: "from-yellow-500 to-amber-500" },
    { name: "Explain", icon: HelpCircle, description: "Break down complex topics simply. Learn anything with easy-to-understand explanations.", color: "from-cyan-500 to-blue-500" },
    { name: "Music", icon: Volume2, description: "Get music recommendations and discover new artists based on your preferences.", color: "from-pink-500 to-rose-500" },
  ];

  const troubleshooting = [
    { 
      issue: "Messages not sending", 
      solutions: [
        "Check your internet connection",
        "Refresh the page and try again",
        "Clear your browser cache",
        "Make sure you're logged in",
        "Check if you've exceeded your daily message limit"
      ]
    },
    { 
      issue: "Voice input not working", 
      solutions: [
        "Allow microphone permissions in your browser",
        "Check if your microphone is working in other apps",
        "Try using Chrome or Edge for best compatibility",
        "Ensure you're in a quiet environment",
        "Check your system audio settings"
      ]
    },
    { 
      issue: "Images not generating", 
      solutions: [
        "Ensure you have a Pro or Elite subscription",
        "Check your daily image generation limit",
        "Try a simpler prompt",
        "Avoid prohibited content in prompts",
        "Wait a few seconds and try again"
      ]
    },
    { 
      issue: "Collaborative room issues", 
      solutions: [
        "Ensure all participants have Pro or Elite plans",
        "Check if the room hasn't reached max participants",
        "Verify the room link is correct",
        "Try refreshing the page",
        "Check if you've been banned from the room"
      ]
    },
    { 
      issue: "PWA installation problems", 
      solutions: [
        "Make sure you're using a supported browser",
        "On iOS, use Safari to install",
        "Clear browser data and try again",
        "Check for browser updates",
        "Try incognito mode first"
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/20">Documentation</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              ShadowTalk AI Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Comprehensive guides, tutorials, and reference documentation to help you get the most out of ShadowTalk AI
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="pl-10 rounded-xl"
              />
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/chatbot')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Try Chatbot
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/changelog')}>
                <History className="h-4 w-4 mr-2" />
                Changelog
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4 mr-2" />
                Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 max-w-3xl mx-auto gap-1">
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
                  Get up and running with ShadowTalk AI in just a few minutes. Follow these simple steps to start your AI-powered journey.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  {quickStartSteps.map(item => (
                    <Card key={item.step} className="card-hover relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-1">Step {item.step}</Badge>
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="mt-2">{item.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </DocSection>

              <DocSection title="System Requirements">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-primary" />
                        <CardTitle>Desktop</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Chrome 80+, Firefox 75+, Safari 14+, Edge 80+</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>4GB RAM minimum, 8GB recommended</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Stable internet connection (5+ Mbps)</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>JavaScript enabled</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <CardTitle>Mobile</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>iOS 14+ (Safari), Android 8+ (Chrome)</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>PWA installation supported</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>4G/5G or WiFi connection</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Microphone for voice features</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </DocSection>

              <DocSection title="Installation">
                <p className="text-muted-foreground mb-6">
                  ShadowTalk AI is a Progressive Web App (PWA) that can be installed on any device for a native app-like experience.
                </p>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Desktop (Chrome)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2 text-sm">
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">1.</span>
                          Visit shadowtalk.ai
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">2.</span>
                          Click the install icon in the address bar
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">3.</span>
                          Click "Install" in the prompt
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">4.</span>
                          Launch from your desktop or start menu
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        iOS (Safari)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2 text-sm">
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">1.</span>
                          Open Safari and visit shadowtalk.ai
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">2.</span>
                          Tap the Share button (square with arrow)
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">3.</span>
                          Scroll down and tap "Add to Home Screen"
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">4.</span>
                          Tap "Add" to confirm
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Android (Chrome)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2 text-sm">
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">1.</span>
                          Open Chrome and visit shadowtalk.ai
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">2.</span>
                          Tap the banner or menu (three dots)
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">3.</span>
                          Select "Install App" or "Add to Home Screen"
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">4.</span>
                          Confirm installation
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </DocSection>

              <DocSection title="Plan Comparison">
                <p className="text-muted-foreground mb-6">
                  Choose the plan that best fits your needs. All plans include core AI chat functionality.
                </p>
                <Card>
                  <CardContent className="pt-6">
                    <FeatureComparison />
                  </CardContent>
                </Card>
              </DocSection>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="space-y-8">
              <DocSection title="Core Features">
                <p className="text-muted-foreground mb-6">
                  ShadowTalk AI comes packed with powerful features designed to enhance your productivity and creativity.
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {features.map((feature, i) => (
                    <DocCard key={i} {...feature} />
                  ))}
                </div>
              </DocSection>

              <DocSection title="AI Personalities">
                <p className="text-muted-foreground mb-6">
                  Choose from four distinct AI personalities to match your interaction style.
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Friendly 😊</CardTitle>
                      <CardDescription>
                        Warm, approachable, and conversational. Great for casual chats and learning new things.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Professional 💼</CardTitle>
                      <CardDescription>
                        Formal, precise, and business-oriented. Perfect for work-related tasks and documentation.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Creative 🎨</CardTitle>
                      <CardDescription>
                        Imaginative, playful, and expressive. Ideal for brainstorming and creative projects.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sarcastic 😏</CardTitle>
                      <CardDescription>
                        Witty, humorous, and playfully sarcastic. For those who enjoy a bit of dry humor.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </DocSection>

              <DocSection title="Collaborative Rooms">
                <p className="text-muted-foreground mb-6">
                  Work together with your team in real-time collaborative chat rooms.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Creating a Room</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2 text-sm">
                        <li>1. Navigate to the Rooms page</li>
                        <li>2. Click "Create Room"</li>
                        <li>3. Enter a name and description</li>
                        <li>4. Choose public or private visibility</li>
                        <li>5. Share the invite link with participants</li>
                      </ol>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Room Moderation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Room creators have access to moderation tools:
                      </p>
                      <ul className="space-y-1 text-sm">
                        <li>• Kick or ban participants</li>
                        <li>• Clear individual or all messages</li>
                        <li>• View participant history</li>
                        <li>• Manage room settings</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </DocSection>

              <DocSection title="Keyboard Shortcuts">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        { action: "Send message", shortcut: "Enter" },
                        { action: "New line", shortcut: "Shift + Enter" },
                        { action: "Voice input", shortcut: "Ctrl + M" },
                        { action: "Toggle sidebar", shortcut: "Ctrl + B" },
                        { action: "New conversation", shortcut: "Ctrl + N" },
                        { action: "Search messages", shortcut: "Ctrl + F" },
                        { action: "Copy last response", shortcut: "Ctrl + Shift + C" },
                        { action: "Regenerate response", shortcut: "Ctrl + R" },
                        { action: "Stop generation", shortcut: "Escape" },
                        { action: "Open ShadowBrowser", shortcut: "Ctrl + Shift + B" },
                        { action: "Shadow Cowork", shortcut: "Shift + W" },
                        { action: "ShadowTalk Live", shortcut: "Shift + L" },
                        { action: "Offline Tools", shortcut: "Shift + O" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                          <span className="text-sm">{item.action}</span>
                          <Badge variant="outline" className="font-mono text-xs">{item.shortcut}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </DocSection>

              <DocSection title="ShadowBrowser">
                <p className="text-muted-foreground mb-6">
                  ShadowBrowser is a built-in AI-powered web browser that lets you browse the web with AI assistance.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Compass className="h-5 w-5 text-primary" />
                        <CardTitle>Browser Features</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Multi-tab browsing with smart tab management
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Bookmarks and browsing history
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          AI-powered web search
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          One-click page analysis
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Send content to main chat
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        <CardTitle>Browse Together Mode</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          AI automatically analyzes pages you visit
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Get key insights and summaries
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Ask questions about any webpage
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Related content suggestions
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Quick actions: Summarize, Key Points, Find Similar
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">How to Use ShadowBrowser</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="font-bold text-primary shrink-0">1.</span>
                        <span>Open ShadowBrowser using <Badge variant="outline" className="font-mono text-xs">Ctrl + Shift + B</Badge> or from the menu</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold text-primary shrink-0">2.</span>
                        <span>Enter a URL or search query in the address bar</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold text-primary shrink-0">3.</span>
                        <span>Enable "Browse Together" mode to have AI assist while you browse</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold text-primary shrink-0">4.</span>
                        <span>Ask questions about the page in the sidebar chat</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold text-primary shrink-0">5.</span>
                        <span>Use quick actions to summarize, extract key points, or find similar content</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </DocSection>

              <DocSection title="Proactive AI Intelligence">
                <p className="text-muted-foreground mb-6">
                  ShadowTalk AI uses real AI-powered behavioral intelligence to proactively assist you — no mock or hardcoded responses.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        <CardTitle>How It Works</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          29+ behavioral triggers monitor your activity in real-time
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Contextual data (page, mood, scroll depth, visit count) sent to AI
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Gemini Flash Lite generates personalized, relevant suggestions
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Smart 2-minute cache prevents redundant AI calls
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle>Trigger Examples</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Idle detection — AI suggests actions when you pause
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Deep scroll — contextual tips as you explore content
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Cognitive load estimation — simplifies suggestions when overwhelmed
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Return visitor — personalized welcome based on history
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </DocSection>
            </TabsContent>

            {/* Chat Modes */}
            <TabsContent value="modes" className="space-y-8">
              <DocSection title="Specialized Chat Modes">
                <p className="text-muted-foreground mb-6">
                  ShadowTalk AI offers 10 specialized chat modes, each optimized for specific tasks. Select the right mode to get the best results.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {chatModes.map((mode, i) => (
                    <Card key={i} className="card-hover overflow-hidden">
                      <div className={`h-1 bg-gradient-to-r ${mode.color}`} />
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                            <mode.icon className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-lg">{mode.name}</CardTitle>
                        </div>
                        <CardDescription className="mt-2">{mode.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </DocSection>

              <DocSection title="Mode Best Practices">
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="code" className="border rounded-xl px-4">
                    <AccordionTrigger>Code Mode Tips</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Specify the programming language for better results</li>
                        <li>• Include context about your project structure</li>
                        <li>• Use the Code Canvas for interactive editing</li>
                        <li>• Ask for explanations along with code solutions</li>
                        <li>• Request unit tests for generated code</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="image" className="border rounded-xl px-4">
                    <AccordionTrigger>Image Generation Tips</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Be specific about style (photorealistic, cartoon, watercolor, etc.)</li>
                        <li>• Include details about lighting and mood</li>
                        <li>• Mention aspect ratio if important</li>
                        <li>• Use negative prompts to exclude unwanted elements</li>
                        <li>• Daily limit: 100 images</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="translate" className="border rounded-xl px-4">
                    <AccordionTrigger>Translation Tips</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Specify source and target languages</li>
                        <li>• Provide context for better accuracy</li>
                        <li>• Ask for formal or informal translations</li>
                        <li>• Request pronunciation guides when needed</li>
                        <li>• Supports 100+ languages</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="summarize" className="border rounded-xl px-4">
                    <AccordionTrigger>Summarization Tips</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Specify desired length (bullet points, paragraph, one-liner)</li>
                        <li>• Ask for key takeaways or action items</li>
                        <li>• Upload documents for longer content</li>
                        <li>• Request summaries for specific audiences</li>
                        <li>• Great for meeting notes and articles</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </DocSection>
            </TabsContent>

            {/* API Reference */}
            <TabsContent value="api" className="space-y-8">
              <DocSection title="API Reference">
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                    Elite Plan Required
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-6">
                  Access ShadowTalk AI programmatically through our REST API. Build custom integrations, automate workflows, or embed AI capabilities in your applications.
                </p>
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>All API requests require a Bearer token in the Authorization header</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      title="Request Headers"
                      language="http"
                      code={`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                    />
                    <p className="text-sm text-muted-foreground">
                      Generate your API key from the Settings page in your Elite account.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Base URL</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="px-3 py-2 rounded-lg bg-muted text-sm">https://api.shadowtalk.ai/v1</code>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'} className="font-mono">
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono text-primary">{endpoint.endpoint}</code>
                        </div>
                        <CardDescription>{endpoint.description}</CardDescription>
                      </CardHeader>
                      {endpoint.example && (
                        <CardContent>
                          <CodeExample
                            title="Request Body"
                            language="json"
                            code={endpoint.example}
                          />
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                <DocSection title="Complete Example">
                  <CodeExample
                    title="Chat Completion Request"
                    language="curl"
                    code={`curl -X POST https://api.shadowtalk.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "max_tokens": 1000,
    "stream": true
  }'`}
                  />

                  <CodeExample
                    title="Response (Streaming)"
                    language="json"
                    code={`data: {"choices":[{"delta":{"content":"Quantum"}}]}
data: {"choices":[{"delta":{"content":" computing"}}]}
data: {"choices":[{"delta":{"content":" uses"}}]}
...
data: [DONE]`}
                  />
                </DocSection>

                <DocSection title="Rate Limits">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 rounded-lg bg-muted">
                          <span>Chat requests</span>
                          <span className="font-mono">1000/minute</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-muted">
                          <span>Image generation</span>
                          <span className="font-mono">100/day</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-muted">
                          <span>File uploads</span>
                          <span className="font-mono">500MB max</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DocSection>
              </DocSection>
            </TabsContent>

            {/* Troubleshooting */}
            <TabsContent value="troubleshooting" className="space-y-8">
              <DocSection title="Troubleshooting Guide">
                <p className="text-muted-foreground mb-6">
                  Having issues? Find solutions to common problems below.
                </p>
                
                <Accordion type="single" collapsible className="space-y-2">
                  {troubleshooting.map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border rounded-xl px-4">
                      <AccordionTrigger className="text-left">{item.issue}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {item.solutions.map((solution, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </DocSection>

              <DocSection title="Network Requirements">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-green-500" />
                        <CardTitle>Online Mode</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Minimum 5 Mbps connection</li>
                        <li>• WebSocket support required</li>
                        <li>• Ports 443 (HTTPS) must be open</li>
                        <li>• Low latency recommended for voice</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <WifiOff className="h-5 w-5 text-amber-500" />
                        <CardTitle>Offline Mode (Elite)</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Full offline login with cached credentials</li>
                        <li>• In-browser AI (WebLLM) for responses</li>
                        <li>• Cached conversations available</li>
                        <li>• Auto-sync when back online</li>
                        <li>• PWA installation required</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </DocSection>

              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Still Need Help?</h3>
                  <p className="text-muted-foreground mb-4">
                    Our support team is available to assist you
                  </p>
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button variant="outline" className="rounded-xl" onClick={() => navigate('/chatbot')}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask AI Assistant
                    </Button>
                    <Button className="btn-glow rounded-xl">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-8">
              <DocSection title="Frequently Asked Questions">
                <Accordion type="single" collapsible className="space-y-2">
                  {[
                    { 
                      q: "How do I get started with ShadowTalk AI?", 
                      a: "Sign up for a free account using your email or social login. No credit card required for the free tier. Once signed up, you can immediately start chatting with our AI assistant. Explore different modes and features to find what works best for you." 
                    },
                    { 
                      q: "What AI models does ShadowTalk use?", 
                      a: "We primarily use Google's Gemini models (gemini-2.5-pro and gemini-2.5-flash) for text and multimodal capabilities. For image generation, we use gemini-2.5-flash-image-preview. These models offer state-of-the-art performance in reasoning, creativity, and understanding." 
                    },
                    { 
                      q: "Is my data secure and private?", 
                      a: "Absolutely! We use industry-standard encryption for all data in transit and at rest. Your conversations are private and we never share them with third parties. Elite users get additional security features including the Stealth Vault for encrypted local storage." 
                    },
                    { 
                      q: "Can I use ShadowTalk offline?", 
                      a: "Elite plan users can access full offline mode with WebLLM - an in-browser AI that runs directly on your device. Your login credentials are securely cached (hashed with bcrypt) for offline authentication. Conversations are stored locally and auto-sync when back online. Install the PWA for the best offline experience." 
                    },
                    { 
                      q: "How do collaborative rooms work?", 
                      a: "Collaborative rooms allow multiple users to interact with the AI together in real-time. Create a room, share the invite link, and all participants can send messages and see AI responses instantly. Room creators have moderation tools to manage participants." 
                    },
                    { 
                      q: "What's included in each subscription tier?", 
                      a: "Free: 50 messages/day, basic chat, voice input. Pro: Unlimited messages, image generation, code canvas, collaborative rooms, chat export. Elite: All Pro features plus offline mode, stealth vault, model fine-tuning, white-label branding, and API access." 
                    },
                    { 
                      q: "Can I cancel my subscription anytime?", 
                      a: "Yes, you can cancel your subscription at any time from the subscription management portal. You'll continue to have access to paid features until the end of your billing period. No questions asked, no hidden fees." 
                    },
                    { 
                      q: "How do I contact support?", 
                      a: "Free users can access our community forums and documentation. Pro users get priority email support with 24-hour response time. Elite users receive dedicated 24/7 support via phone, email, and live chat." 
                    },
                    { 
                      q: "What file types can I upload?", 
                      a: "We support images (PNG, JPG, GIF, WebP), documents (PDF, DOC, DOCX, TXT), and code files. Free users can upload files up to 5MB, Pro users up to 50MB, and Elite users up to 500MB." 
                    },
                    { 
                      q: "How does model fine-tuning work?", 
                      a: "Elite users can customize AI responses by providing training examples and adjusting parameters like temperature and response style. Your custom model is private and only affects your conversations. This is great for domain-specific applications." 
                    },
                  ].map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
                      <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </DocSection>

              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
                  <p className="text-muted-foreground mb-4">
                    Experience the power of AI-powered conversations
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" className="rounded-xl" onClick={() => navigate('/pricing')}>
                      View Pricing
                    </Button>
                    <Button className="btn-glow rounded-xl" onClick={() => navigate('/chatbot')}>
                      Start Chatting Free
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DocsPage;
