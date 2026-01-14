import { useState } from "react";
import { ArrowLeft, Sparkles, Bug, Zap, Shield, Calendar, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: {
    type: "feature" | "improvement" | "bugfix" | "security";
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.5.0",
    date: "December 15, 2024",
    title: "Collaborative Rooms & PWA Support",
    description: "Major update bringing real-time collaboration and mobile app experience.",
    changes: [
      { type: "feature", text: "Collaborative chat rooms - interact with AI together in real-time" },
      { type: "feature", text: "Shareable room invitation links" },
      { type: "feature", text: "Full PWA support - install on any device" },
      { type: "feature", text: "Comprehensive documentation pages" },
      { type: "improvement", text: "Enhanced mobile responsiveness" },
      { type: "improvement", text: "Better offline mode indicators" },
    ],
  },
  {
    version: "2.4.0",
    date: "December 14, 2024",
    title: "Elite Features & Advanced Customization",
    description: "Premium features for power users and enterprises.",
    changes: [
      { type: "feature", text: "Model fine-tuning interface for Elite users" },
      { type: "feature", text: "White-label branding options" },
      { type: "feature", text: "Custom color themes and logo uploads" },
      { type: "improvement", text: "Enhanced subscription tier management" },
      { type: "security", text: "Improved API key handling" },
    ],
  },
  {
    version: "2.3.0",
    date: "December 13, 2024",
    title: "Advanced AI Capabilities",
    description: "Expanded AI features with multimodal support.",
    changes: [
      { type: "feature", text: "Image generation with DALL-E style capabilities" },
      { type: "feature", text: "Voice input with speech-to-text" },
      { type: "feature", text: "Text-to-speech for AI responses (Pro)" },
      { type: "feature", text: "Code canvas for interactive coding" },
      { type: "improvement", text: "Faster response streaming" },
      { type: "bugfix", text: "Fixed message editing on mobile devices" },
    ],
  },
  {
    version: "2.2.0",
    date: "December 12, 2024",
    title: "Specialized Chat Modes",
    description: "Tailored AI experiences for different use cases.",
    changes: [
      { type: "feature", text: "10 specialized chat modes (code, translate, summarize, etc.)" },
      { type: "feature", text: "AI personality selector (Friendly, Professional, Creative, Sarcastic)" },
      { type: "feature", text: "Conversation history with auto-save" },
      { type: "improvement", text: "Better code syntax highlighting" },
      { type: "bugfix", text: "Fixed conversation title generation" },
    ],
  },
  {
    version: "2.1.0",
    date: "December 11, 2024",
    title: "Pro Features & Payments",
    description: "Subscription system and premium features launch.",
    changes: [
      { type: "feature", text: "Stripe payment integration" },
      { type: "feature", text: "Pro, Elite subscription tiers" },
      { type: "feature", text: "Chat export functionality (Pro)" },
      { type: "feature", text: "File and image uploads" },
      { type: "security", text: "Enhanced row-level security policies" },
    ],
  },
  {
    version: "2.0.0",
    date: "December 10, 2024",
    title: "ShadowTalk AI Launch",
    description: "Initial release of the AI chatbot platform.",
    changes: [
      { type: "feature", text: "AI-powered chat with conversation memory" },
      { type: "feature", text: "Dark/light theme toggle" },
      { type: "feature", text: "User authentication system" },
      { type: "feature", text: "Responsive design for all devices" },
      { type: "security", text: "Secure data encryption" },
    ],
  },
];

const getChangeIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Sparkles className="h-4 w-4 text-primary" />;
    case "improvement":
      return <Zap className="h-4 w-4 text-yellow-500" />;
    case "bugfix":
      return <Bug className="h-4 w-4 text-red-500" />;
    case "security":
      return <Shield className="h-4 w-4 text-green-500" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
};

const getChangeBadge = (type: string) => {
  switch (type) {
    case "feature":
      return <Badge className="bg-primary/20 text-primary border-primary/30">New</Badge>;
    case "improvement":
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Improved</Badge>;
    case "bugfix":
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Fixed</Badge>;
    case "security":
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Security</Badge>;
    default:
      return null;
  }
};

const ChangelogPage = () => {
  const navigate = useNavigate();
  const [expandedVersions, setExpandedVersions] = useState<string[]>([changelog[0].version]);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Changelog</h1>
            <p className="text-sm text-muted-foreground">What's new in ShadowTalk AI</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-6">
            {changelog.map((entry, index) => (
              <Card
                key={entry.version}
                className="relative bg-card/50 border-border hover:border-primary/50 transition-colors"
              >
                {/* Timeline dot */}
                <div className="absolute left-8 top-6 w-3 h-3 rounded-full bg-primary border-4 border-background hidden md:block transform -translate-x-1/2" />

                <CardHeader
                  className="cursor-pointer md:ml-12"
                  onClick={() => toggleVersion(entry.version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        <Tag className="h-3 w-3 mr-1" />
                        v{entry.version}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {entry.date}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedVersions.includes(entry.version) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-2">{entry.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                </CardHeader>

                {expandedVersions.includes(entry.version) && (
                  <CardContent className="md:ml-12 pt-0">
                    <ul className="space-y-3">
                      {entry.changes.map((change, changeIndex) => (
                        <li
                          key={changeIndex}
                          className="flex items-start gap-3 text-sm"
                        >
                          {getChangeIcon(change.type)}
                          <span className="flex-1 text-foreground">{change.text}</span>
                          {getChangeBadge(change.type)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Subscribe to updates */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Follow our changelog to stay informed about the latest features and improvements.
            </p>
            <Button onClick={() => navigate("/chat")}>
              Try Latest Features
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChangelogPage;
