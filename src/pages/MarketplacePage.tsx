import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Download, Users, Bot, FileText, TrendingUp, Shield, Zap, Code, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarketplace } from "@/hooks/useMarketplace";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Bot, FileText, TrendingUp, Shield, Zap, Code,
};

const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { agents, installedIds, loading, installingId, installAgent, uninstallAgent } = useMarketplace();

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            ["all", "strategy", "scripts"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {filteredAgents
                    .filter((a) => tab === "all" || a.category === tab)
                    .map((agent) => {
                      const IconComp = iconMap[agent.icon] || Bot;
                      const isInstalled = installedIds.has(agent.id);
                      const isLoading = installingId === agent.id;

                      return (
                        <Card key={agent.id} className="hover:border-primary/30 transition-colors group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <IconComp className="h-5 w-5 text-primary" />
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
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] cursor-pointer hover:bg-primary/10"
                                  onClick={() => setSearchQuery(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" /> {Number(agent.rating).toFixed(1)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" /> {agent.downloads.toLocaleString()}
                                </span>
                              </div>
                              {isInstalled ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs"
                                  disabled={isLoading}
                                  onClick={() => uninstallAgent(agent.id)}
                                >
                                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                                  Installed
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  disabled={isLoading}
                                  onClick={() => installAgent(agent.id)}
                                >
                                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                  Install
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  {filteredAgents.filter((a) => tab === "all" || a.category === tab).length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No agents found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </TabsContent>
            ))
          )}
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
