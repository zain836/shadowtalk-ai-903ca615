import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Sword, 
  Shield, 
  Lightbulb, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from "lucide-react";

interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface SWOTAnalysisProps {
  swot: SWOTData;
  businessName: string;
}

export const SWOTAnalysis = ({ swot, businessName }: SWOTAnalysisProps) => {
  const quadrants = [
    {
      title: "Strengths",
      subtitle: "Internal Advantages",
      items: swot.strengths,
      icon: Sword,
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      textColor: "text-green-500",
      iconBg: "bg-green-500/20"
    },
    {
      title: "Weaknesses",
      subtitle: "Internal Challenges",
      items: swot.weaknesses,
      icon: Shield,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-500",
      iconBg: "bg-red-500/20"
    },
    {
      title: "Opportunities",
      subtitle: "External Potential",
      items: swot.opportunities,
      icon: Lightbulb,
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-500",
      iconBg: "bg-blue-500/20"
    },
    {
      title: "Threats",
      subtitle: "External Risks",
      items: swot.threats,
      icon: AlertTriangle,
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-500",
      iconBg: "bg-orange-500/20"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="mb-2">Strategic Analysis</Badge>
        <h2 className="text-2xl font-bold">SWOT Analysis for {businessName}</h2>
        <p className="text-muted-foreground">
          Comprehensive assessment of internal and external factors
        </p>
      </div>

      {/* SWOT Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {quadrants.map((quadrant, index) => {
          const Icon = quadrant.icon;
          return (
            <motion.div key={quadrant.title} variants={itemVariants}>
              <Card className={`h-full border-2 ${quadrant.borderColor} ${quadrant.bgColor}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${quadrant.iconBg}`}>
                      <Icon className={`h-5 w-5 ${quadrant.textColor}`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${quadrant.textColor}`}>
                        {quadrant.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-normal">
                        {quadrant.subtitle}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {quadrant.items.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + i * 0.05 }}
                        className="flex items-start gap-2"
                      >
                        <ChevronRight className={`h-4 w-4 mt-0.5 shrink-0 ${quadrant.textColor}`} />
                        <span className="text-sm text-foreground/80">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Strategic Insights */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400">
                Leverage Opportunities
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Combine your <strong>strengths</strong> with market <strong>opportunities</strong> to 
              maximize competitive advantage and accelerate growth.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-orange-600 dark:text-orange-400">
                Mitigate Risks
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Address <strong>weaknesses</strong> and prepare contingencies for <strong>threats</strong> to 
              build resilience and protect your market position.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Summary */}
      <Card>
        <CardHeader>
          <CardTitle>SWOT Matrix Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium"></th>
                  <th className="text-center p-3 font-medium text-green-500">
                    <div className="flex items-center justify-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      Opportunities ({swot.opportunities.length})
                    </div>
                  </th>
                  <th className="text-center p-3 font-medium text-orange-500">
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Threats ({swot.threats.length})
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-1 text-green-500">
                      <Sword className="h-4 w-4" />
                      Strengths ({swot.strengths.length})
                    </div>
                  </td>
                  <td className="p-3 text-center bg-green-500/5">
                    <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                      SO Strategies
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Aggressive Growth</p>
                  </td>
                  <td className="p-3 text-center bg-blue-500/5">
                    <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30">
                      ST Strategies
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Diversification</p>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-1 text-red-500">
                      <Shield className="h-4 w-4" />
                      Weaknesses ({swot.weaknesses.length})
                    </div>
                  </td>
                  <td className="p-3 text-center bg-yellow-500/5">
                    <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">
                      WO Strategies
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Turnaround</p>
                  </td>
                  <td className="p-3 text-center bg-red-500/5">
                    <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">
                      WT Strategies
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Defensive</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
