import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Sparkles, ArrowRight, Zap, Target,
  TrendingUp, Search, Shield, FileText, BarChart3,
  Brain, Globe, Users, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useIndustry } from "@/hooks/useIndustry";
import { IndustrySelector } from "@/components/industry/IndustrySelector";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const CommandCenterPage = () => {
  const { selectedIndustry, selectIndustry, allIndustries } = useIndustry();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectIndustry = (id: string) => {
    if (id === "") {
      selectIndustry("");
    } else {
      selectIndustry(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Industry Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered intelligence tailored to your industry
            </p>
          </div>
          <Button
            onClick={() => setSelectorOpen(true)}
            variant={selectedIndustry ? "outline" : "default"}
            className="gap-2"
          >
            {selectedIndustry ? (
              <>
                {(() => {
                  const Icon = selectedIndustry.icon;
                  return <Icon className={cn("h-4 w-4", selectedIndustry.color)} />;
                })()}
                {selectedIndustry.name}
                <ChevronRight className="h-3 w-3" />
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Select Your Industry
              </>
            )}
          </Button>
        </motion.div>

        {/* No industry selected state */}
        {!selectedIndustry ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="h-16 w-16 text-primary/40 mb-4" />
                <h2 className="text-xl font-bold mb-2">Choose Your Industry</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  ShadowTalk AI transforms into a domain expert for your industry.
                  Select your sector to unlock adaptive AI, custom dashboards, and specialized tools.
                </p>
                <Button onClick={() => setSelectorOpen(true)} size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Industry cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allIndustries.slice(0, 6).map((industry, i) => {
                const Icon = industry.icon;
                return (
                  <motion.div
                    key={industry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary/30 transition-all group"
                      onClick={() => {
                        handleSelectIndustry(industry.id);
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("p-2 rounded-lg bg-muted", industry.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="font-semibold">{industry.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{industry.description}</p>
                        <div className="flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          Activate <ArrowRight className="h-3 w-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Industry selected — show dashboard */
          <motion.div
            key={selectedIndustry.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Industry banner */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {(() => {
                    const Icon = selectedIndustry.icon;
                    return (
                      <div className={cn("p-3 rounded-xl bg-primary/10", selectedIndustry.color)}>
                        <Icon className="h-7 w-7" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-lg font-bold">{selectedIndustry.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedIndustry.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <Zap className="h-3 w-3 text-primary" />
                  AI Adapted
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedIndustry.quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => navigate(`/chatbot?q=${encodeURIComponent(action)}`)}
                  >
                    <Target className="h-3 w-3 text-primary" />
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mission Templates for this industry */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {selectedIndustry.name} Mission Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedIndustry.missionTemplates.map((template, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => navigate(`/missioncontrol?goal=${encodeURIComponent(template.prompt)}`)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted shrink-0">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{template.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {template.prompt}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Dashboard Widgets */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Intelligence Dashboard
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: TrendingUp, label: "Trend Analysis", desc: "Real-time industry trends", href: "/analytics" },
                  { icon: Search, label: "Deep Research", desc: "Multi-source intelligence", href: "/research" },
                  { icon: Shield, label: "Risk Monitor", desc: "Threat & compliance alerts", href: "/security-audit" },
                  { icon: BarChart3, label: "Performance", desc: "KPI tracking & benchmarks", href: "/data-insights" },
                ].map((widget, i) => (
                  <motion.div
                    key={widget.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <Card className="hover:border-primary/20 transition-all cursor-pointer"
                      onClick={() => navigate(widget.href)}
                    >
                      <CardContent className="p-4 text-center">
                        <widget.icon className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                        <p className="font-medium text-sm">{widget.label}</p>
                        <p className="text-[10px] text-muted-foreground">{widget.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA to chat */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">AI is now specialized for {selectedIndustry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Every chat response is tailored to your industry context
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate("/chatbot")} className="gap-2">
                  Start Chat <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <IndustrySelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleSelectIndustry}
        currentIndustryId={selectedIndustry?.id}
      />
    </div>
  );
};

export default CommandCenterPage;
