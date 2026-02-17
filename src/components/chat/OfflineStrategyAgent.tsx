import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  BarChart3,
  Shield,
  Loader2,
  X,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOfflineStrategy } from '@/hooks/useOfflineStrategy';

const formatCurrency = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const OfflineStrategyAgent = () => {
  const [businessDesc, setBusinessDesc] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetMarket, setTargetMarket] = useState('');

  const {
    isGenerating,
    progress,
    stage,
    report,
    error,
    generateStrategyReport,
    clearReport,
  } = useOfflineStrategy();

  const handleGenerate = async () => {
    if (!businessDesc.trim() || !industry.trim()) return;
    await generateStrategyReport(
      businessDesc.trim(),
      industry.trim(),
      targetMarket.trim() || industry.trim()
    );
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Strategy Agent</h3>
            <p className="text-xs text-muted-foreground">
              AI-powered business analysis
            </p>
          </div>
          {report && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7"
              onClick={clearReport}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!report && !isGenerating && (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Business Description</Label>
              <Input
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
                placeholder="Describe your business..."
                className="bg-background/60 border-border/40 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Industry</Label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. SaaS, Fintech"
                  className="bg-background/60 border-border/40 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Target Market</Label>
                <Input
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g. SMBs, Enterprise"
                  className="bg-background/60 border-border/40 mt-1"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!businessDesc.trim() || !industry.trim()}
              className="w-full"
              size="sm"
            >
              Generate Strategy Report
            </Button>
          </div>
        )}
      </div>

      {/* Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-border/20"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">{stage}</span>
              <span className="text-xs font-mono text-primary ml-auto">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report */}
      <ScrollArea className="flex-1">
        {report ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-8">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="swot" className="text-xs">SWOT</TabsTrigger>
                <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>
                <TabsTrigger value="finance" className="text-xs">Finance</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-3 mt-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {report.executiveSummary}
                </p>

                <div className="space-y-1.5">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    Recommendations
                  </h5>
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                      {rec}
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Risk Factors
                  </h5>
                  {report.riskFactors.map((risk, i) => (
                    <div key={i} className="text-xs text-muted-foreground/80 pl-5">
                      • {risk}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* SWOT Tab */}
              <TabsContent value="swot" className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: 'Strengths', items: report.swot.strengths, color: 'text-green-500', bg: 'bg-green-500/5' },
                    { title: 'Weaknesses', items: report.swot.weaknesses, color: 'text-red-500', bg: 'bg-red-500/5' },
                    { title: 'Opportunities', items: report.swot.opportunities, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                    { title: 'Threats', items: report.swot.threats, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                  ].map(({ title, items, color, bg }) => (
                    <div key={title} className={`${bg} rounded-lg p-2.5 border border-border/10`}>
                      <h5 className={`text-xs font-semibold ${color} mb-1.5`}>{title}</h5>
                      {items.map((item, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground mb-1">
                          • {item}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Market Tab */}
              <TabsContent value="market" className="space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'TAM', value: report.marketAnalysis.tam },
                    { label: 'SAM', value: report.marketAnalysis.sam },
                    { label: 'SOM', value: report.marketAnalysis.som },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/20 rounded-lg p-2.5 text-center border border-border/10">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{formatCurrency(value)}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-foreground mb-1.5">Competitors</h5>
                  <div className="flex flex-wrap gap-1">
                    {report.marketAnalysis.competitors.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground border border-border/10">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-foreground mb-1.5">Market Trends</h5>
                  {report.marketAnalysis.trends.map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      {t}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Finance Tab */}
              <TabsContent value="finance" className="space-y-3 mt-3">
                <div className="space-y-2">
                  {report.financialProjections.map((proj) => (
                    <div key={proj.year} className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground w-10 shrink-0">Y{proj.year}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="text-foreground font-medium">
                            {formatCurrency(proj.revenue)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(proj.revenue / report.financialProjections[4].revenue) * 100}%`,
                            }}
                            transition={{ delay: proj.year * 0.15, duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="text-right w-16 shrink-0">
                        <span className={proj.profit > 0 ? 'text-green-500' : 'text-red-500'}>
                          {formatCurrency(proj.profit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 pt-2 border-t border-border/10">
                  <DollarSign className="w-3 h-3" />
                  <span>Projections are estimates based on provided inputs</span>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          !isGenerating && (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Describe your business to generate a strategy report
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                SWOT, market analysis & financial projections
              </p>
            </div>
          )
        )}

        {error && (
          <div className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OfflineStrategyAgent;
