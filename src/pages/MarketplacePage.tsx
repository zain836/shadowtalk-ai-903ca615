import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Download, Users, Bot, FileText, TrendingUp, Shield, Zap, Code } from "lucide-react";
import { useState } from "react";

const agents = [
  {
    id: "1",
    name: "Tax Filing Agent (PK)",
    description: "Automates FBR tax filing, NTN registration, and SECP compliance for Pakistani businesses.",
    category: "strategy",
    author: "ShadowTalk Team",
    downloads: 2847,
    rating: 4.8,
    price: "Free",
    tags: ["Pakistan", "Tax", "Compliance"],
    icon: FileText,
    verified: true,
  },
  {
    id: "2",
    name: "Board Meeting Prep Suite",
    description: "Generates encrypted board decks, financial summaries, and action items from meeting transcripts.",
    category: "strategy",
    author: "ShadowTalk Team",
    downloads: 1203,
    rating: 4.9,
    price: "Pro",
    tags: ["CEO", "Meetings", "Reports"],
    icon: TrendingUp,
    verified: true,
  },
  {
    id: "3",
    name: "Security Audit Scanner",
    description: "Deep-scan codebases for vulnerabilities, generate OWASP reports, and suggest remediation.",
    category: "scripts",
    author: "ShadowTalk Team",
    downloads: 5621,
    rating: 4.7,
    price: "Free",
    tags: ["Security", "DevOps", "OWASP"],
    icon: Shield,
    verified: true,
  },
  {
    id: "4",
    name: "SEO Content Pipeline",
    description: "Research keywords, generate optimized articles, and schedule publishing across platforms.",
    category: "scripts",
    author: "CreatorLabs",
    downloads: 3189,
    rating: 4.6,
    price: "Free",
    tags: ["SEO", "Content", "Marketing"],
    icon: Zap,
    verified: false,
  },
  {
    id: "5",
    name: "Full-Stack API Builder",
    description: "Generates deployment-ready REST APIs with auth, validation, and database schemas.",
    category: "scripts",
    author: "ShadowTalk Team",
    downloads: 4502,
    rating: 4.9,
    price: "Free",
    tags: ["Backend", "API", "Node.js"],
    icon: Code,
    verified: true,
  },
  {
    id: "6",
    name: "Competitor Intelligence Agent",
    description: "Monitors competitor websites, pricing changes, and product launches with daily reports.",
    category: "strategy",
    author: "MarketEdge",
    downloads: 982,
    rating: 4.5,
    price: "Pro",
    tags: ["Research", "Competitive", "Intelligence"],
    icon: Bot,
    verified: false,
  },
];

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            Marketplace
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Agent & Script <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse community-built agents, smart scripts, and strategy templates. Creators earn 80% of revenue.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents, scripts, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mx-auto flex w-fit">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="strategy">Strategy Agents</TabsTrigger>
            <TabsTrigger value="scripts">Smart Scripts</TabsTrigger>
          </TabsList>

          {["all", "strategy", "scripts"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {filteredAgents
                  .filter((a) => tab === "all" || a.category === tab)
                  .map((agent) => (
                    <Card key={agent.id} className="hover:border-primary/30 transition-colors group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <agent.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {agent.name}
                                {agent.verified && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Verified</Badge>
                                )}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">by {agent.author}</p>
                            </div>
                          </div>
                          <Badge variant={agent.price === "Free" ? "outline" : "default"} className="text-xs">
                            {agent.price}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {agent.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" /> {agent.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" /> {agent.downloads.toLocaleString()}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                            Install
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Creator CTA */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Build for the Marketplace</h3>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              Create agents and scripts, publish them to the marketplace, and earn 80% of every sale. Join the creator economy.
            </p>
            <Button>Start Building</Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default MarketplacePage;
