import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Globe,
  Building2,
  Scale,
  TrendingUp,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Search,
  Loader2,
  CheckCircle
} from "lucide-react";

interface ResearchData {
  competitors: Array<{ name: string; marketShare: number; pricing: string }>;
  regulations: string[];
  marketTrends: string[];
  costs: Array<{ item: string; cost: number }>;
  opportunities: string[];
  threats: string[];
  sources: Array<{ title: string; url: string }>;
}

interface ResearchPanelProps {
  research: ResearchData | null;
  isLoading: boolean;
  businessName: string;
  location: string;
}

export const ResearchPanel = ({ research, isLoading, businessName, location }: ResearchPanelProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Card className="border-2 border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-500 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Researching Market Intelligence</h3>
                <p className="text-muted-foreground text-sm">
                  Gathering real-time data for {businessName} in {location}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!research) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Research Data Yet</h3>
          <p className="text-muted-foreground">
            Enter your business details and generate a strategy to see market research.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Research Complete Banner */}
      <Card className="border-2 border-green-500/20 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Market Research Complete</h3>
              <p className="text-sm text-muted-foreground">
                Analyzed {research.competitors.length} competitors, {research.regulations.length} regulations, 
                and {research.marketTrends.length} market trends
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Competitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-500" />
              Competitor Analysis
            </CardTitle>
            <CardDescription>Key players in your market</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {research.competitors.map((comp, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Market Share: {comp.marketShare}%
                      </p>
                    </div>
                    <Badge variant="outline">{comp.pricing}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Regulations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-purple-500" />
              Regulatory Requirements
            </CardTitle>
            <CardDescription>Compliance considerations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {research.regulations.map((reg, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs text-purple-500">{i + 1}</span>
                    </span>
                    {reg}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Market Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Market Trends 2026
            </CardTitle>
            <CardDescription>Current industry direction</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {research.marketTrends.map((trend, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-2 p-2 rounded bg-green-500/5 border border-green-500/10"
                  >
                    <TrendingUp className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{trend}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Cost Estimates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Cost Estimates
            </CardTitle>
            <CardDescription>Initial investment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {research.costs.map((cost, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <span className="text-sm">{cost.item}</span>
                    <span className="font-medium text-orange-500">
                      ${cost.cost.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 mt-4">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg text-orange-500">
                    ${research.costs.reduce((sum, c) => sum + c.cost, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities & Threats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              Market Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {research.opportunities.map((opp, i) => (
                <li 
                  key={i} 
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span className="text-muted-foreground">{opp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Market Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {research.threats.map((threat, i) => (
                <li 
                  key={i} 
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                  <span className="text-muted-foreground">{threat}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Sources */}
      {research.sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Research Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {research.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                >
                  {source.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
