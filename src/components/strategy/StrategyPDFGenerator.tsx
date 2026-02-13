import { useState, RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Loader2,
  CheckCircle,
  Eye,
  Settings,
  Sparkles,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BusinessIdea, StrategyResult } from "./StrategyAgent";

interface StrategyPDFGeneratorProps {
  businessIdea: BusinessIdea;
  result: StrategyResult;
  chartsRef: RefObject<HTMLDivElement>;
}

export const StrategyPDFGenerator = ({ 
  businessIdea, 
  result, 
  chartsRef 
}: StrategyPDFGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAppendix, setIncludeAppendix] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    setIsComplete(false);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper functions
      const addPage = () => {
        pdf.addPage();
        yPosition = margin;
      };

      const checkPageBreak = (height: number) => {
        if (yPosition + height > pageHeight - margin) {
          addPage();
        }
      };

      const addHeader = (text: string, size: number = 16) => {
        checkPageBreak(15);
        pdf.setFontSize(size);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175); // Blue color
        pdf.text(text, margin, yPosition);
        yPosition += size * 0.5 + 5;
      };

      const addSubheader = (text: string) => {
        checkPageBreak(12);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text(text, margin, yPosition);
        yPosition += 8;
      };

      const addParagraph = (text: string) => {
        checkPageBreak(10);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 5 + 5;
      };

      const addBulletPoint = (text: string) => {
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        const lines = pdf.splitTextToSize(`• ${text}`, contentWidth - 5);
        pdf.text(lines, margin + 3, yPosition);
        yPosition += lines.length * 5 + 2;
      };

      const addSeparator = () => {
        checkPageBreak(10);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      };

      // ============= COVER PAGE =============
      // Background gradient simulation
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, pageWidth, 80, 'F');
      
      // Logo/Brand area
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('SHADOWTALK AI', margin, 25);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Strategic Business Intelligence', margin, 32);

      // Title
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Business Strategy', margin, 55);
      pdf.text('Analysis Report', margin, 68);

      // Business name
      yPosition = 100;
      pdf.setFontSize(22);
      pdf.setTextColor(30, 64, 175);
      pdf.text(businessIdea.name, margin, yPosition);
      yPosition += 15;

      // Meta info
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Location: ${businessIdea.location}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Industry: ${businessIdea.industry}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Target Market: ${businessIdea.targetMarket || 'General'}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Initial Investment: ${businessIdea.initialInvestment || 'Not specified'}`, margin, yPosition);
      yPosition += 20;

      // Description box
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 3, 3, 'F');
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const descLines = pdf.splitTextToSize(businessIdea.description, contentWidth - 10);
      pdf.text(descLines.slice(0, 5), margin + 5, yPosition);
      yPosition += 50;

      // Date and footer
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, margin, pageHeight - 30);
      pdf.text('Powered by ShadowTalk AI Strategy Agent', margin, pageHeight - 22);

      // Sovereign stamp / watermark
      pdf.setFontSize(8);
      pdf.setTextColor(200, 200, 200);
      pdf.text('SHADOWTALK AI - CONFIDENTIAL', pageWidth - margin - 55, pageHeight - 15);

      // ============= EXECUTIVE SUMMARY =============
      addPage();
      addHeader('Executive Summary', 18);
      addSeparator();
      addParagraph(result.executiveSummary);
      yPosition += 10;

      // ============= SWOT ANALYSIS =============
      addHeader('SWOT Analysis', 18);
      addSeparator();

      // Strengths
      addSubheader('Strengths');
      result.swot.strengths.forEach(item => addBulletPoint(item));
      yPosition += 5;

      // Weaknesses
      addSubheader('Weaknesses');
      result.swot.weaknesses.forEach(item => addBulletPoint(item));
      yPosition += 5;

      // Opportunities
      checkPageBreak(50);
      addSubheader('Opportunities');
      result.swot.opportunities.forEach(item => addBulletPoint(item));
      yPosition += 5;

      // Threats
      addSubheader('Threats');
      result.swot.threats.forEach(item => addBulletPoint(item));
      yPosition += 10;

      // ============= MARKET RESEARCH =============
      addPage();
      addHeader('Market Research', 18);
      addSeparator();

      // Competitors
      addSubheader('Competitor Analysis');
      result.research.competitors.forEach(comp => {
        addBulletPoint(`${comp.name} - Market Share: ${comp.marketShare}% (${comp.pricing} pricing)`);
      });
      yPosition += 5;

      // Market Trends
      addSubheader('Market Trends 2026');
      result.research.marketTrends.forEach(trend => addBulletPoint(trend));
      yPosition += 5;

      // Regulations
      addSubheader('Regulatory Considerations');
      result.research.regulations.forEach(reg => addBulletPoint(reg));
      yPosition += 10;

      // ============= FINANCIAL PROJECTIONS =============
      addPage();
      addHeader('Financial Projections', 18);
      addSeparator();

      // Cost breakdown
      addSubheader('Initial Investment Breakdown');
      result.research.costs.forEach(cost => {
        addBulletPoint(`${cost.item}: $${cost.cost.toLocaleString()}`);
      });
      const totalCost = result.research.costs.reduce((sum, c) => sum + c.cost, 0);
      yPosition += 3;
      pdf.setFont('helvetica', 'bold');
      addBulletPoint(`Total Initial Investment: $${totalCost.toLocaleString()}`);
      pdf.setFont('helvetica', 'normal');
      yPosition += 10;

      // 12-month projections table
      addSubheader('12-Month Revenue Projections');
      yPosition += 5;

      // Table header
      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Month', margin + 3, yPosition + 5.5);
      pdf.text('Revenue', margin + 50, yPosition + 5.5);
      pdf.text('Expenses', margin + 90, yPosition + 5.5);
      pdf.text('Profit', margin + 130, yPosition + 5.5);
      yPosition += 8;

      // Table rows
      result.financialProjections.forEach((proj, i) => {
        checkPageBreak(7);
        pdf.setFillColor(i % 2 === 0 ? 250 : 245, i % 2 === 0 ? 250 : 247, i % 2 === 0 ? 250 : 250);
        pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        pdf.setTextColor(60, 60, 60);
        pdf.setFont('helvetica', 'normal');
        pdf.text(proj.month, margin + 3, yPosition + 4.5);
        pdf.text(`$${proj.revenue.toLocaleString()}`, margin + 50, yPosition + 4.5);
        pdf.text(`$${proj.expenses.toLocaleString()}`, margin + 90, yPosition + 4.5);
        pdf.setTextColor(proj.profit >= 0 ? 34 : 220, proj.profit >= 0 ? 139 : 38, proj.profit >= 0 ? 34 : 38);
        pdf.text(`$${proj.profit.toLocaleString()}`, margin + 130, yPosition + 4.5);
        yPosition += 6;
      });

      // Summary row
      const totalRevenue = result.financialProjections.reduce((sum, p) => sum + p.revenue, 0);
      const totalExpenses = result.financialProjections.reduce((sum, p) => sum + p.expenses, 0);
      const totalProfit = result.financialProjections.reduce((sum, p) => sum + p.profit, 0);

      pdf.setFillColor(30, 64, 175);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL', margin + 3, yPosition + 5.5);
      pdf.text(`$${totalRevenue.toLocaleString()}`, margin + 50, yPosition + 5.5);
      pdf.text(`$${totalExpenses.toLocaleString()}`, margin + 90, yPosition + 5.5);
      pdf.text(`$${totalProfit.toLocaleString()}`, margin + 130, yPosition + 5.5);
      yPosition += 15;

      // ============= CHARTS (if enabled) =============
      if (includeCharts && chartsRef.current) {
        addPage();
        addHeader('Visual Analytics', 18);
        addSeparator();

        try {
          const canvas = await html2canvas(chartsRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Split into pages if too tall
          let remainingHeight = imgHeight;
          let sourceY = 0;
          
          while (remainingHeight > 0) {
            const availableHeight = pageHeight - yPosition - margin;
            const heightToAdd = Math.min(remainingHeight, availableHeight);
            
            if (heightToAdd < 50) {
              addPage();
              continue;
            }
            
            pdf.addImage(
              imgData, 
              'PNG', 
              margin, 
              yPosition, 
              imgWidth, 
              heightToAdd,
              undefined,
              'FAST'
            );
            
            remainingHeight -= heightToAdd;
            sourceY += heightToAdd;
            
            if (remainingHeight > 0) {
              addPage();
            } else {
              yPosition += heightToAdd + 10;
            }
          }
        } catch (error) {
          console.error('Error capturing charts:', error);
          addParagraph('Charts visualization not available in PDF export.');
        }
      }

      // ============= STRATEGIC RECOMMENDATIONS =============
      addPage();
      addHeader('Strategic Recommendations', 18);
      addSeparator();
      result.recommendations.forEach((rec, i) => {
        checkPageBreak(15);
        pdf.setFillColor(245, 247, 250);
        const recLines = pdf.splitTextToSize(rec, contentWidth - 20);
        const boxHeight = recLines.length * 5 + 10;
        pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'F');
        
        pdf.setFillColor(30, 64, 175);
        pdf.circle(margin + 8, yPosition + 7, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(i + 1), margin + 6.5, yPosition + 8.5);
        
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(recLines, margin + 18, yPosition + 8);
        yPosition += boxHeight + 5;
      });
      yPosition += 10;

      // ============= RISK ASSESSMENT =============
      addHeader('Risk Assessment', 18);
      addSeparator();
      addParagraph(result.riskAssessment);
      yPosition += 10;

      // ============= IMPLEMENTATION PLAN =============
      addPage();
      addHeader('Implementation Roadmap', 18);
      addSeparator();
      
      result.implementationPlan.forEach((step, i) => {
        checkPageBreak(12);
        pdf.setFillColor(30, 64, 175);
        pdf.circle(margin + 5, yPosition + 2, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(i + 1), margin + 3.5, yPosition + 3.5);
        
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const stepLines = pdf.splitTextToSize(step, contentWidth - 15);
        pdf.text(stepLines, margin + 15, yPosition + 3);
        yPosition += stepLines.length * 5 + 8;
      });

      // ============= APPENDIX (if enabled) =============
      if (includeAppendix) {
        addPage();
        addHeader('Appendix', 18);
        addSeparator();

        addSubheader('Market Opportunities');
        result.research.opportunities.forEach(opp => addBulletPoint(opp));
        yPosition += 5;

        addSubheader('Market Threats');
        result.research.threats.forEach(threat => addBulletPoint(threat));
        yPosition += 10;

        if (result.research.sources.length > 0) {
          addSubheader('Research Sources');
          result.research.sources.forEach(source => {
            addBulletPoint(`${source.title}: ${source.url}`);
          });
        }
      }

      // ============= FINAL PAGE - DISCLAIMER =============
      addPage();
      yPosition = pageHeight / 2 - 30;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175);
      const disclaimerTitle = 'Disclaimer & Confidentiality';
      pdf.text(disclaimerTitle, pageWidth / 2 - pdf.getTextWidth(disclaimerTitle) / 2, yPosition);
      yPosition += 15;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const disclaimer = `This report was generated by ShadowTalk AI Strategy Agent and is intended for informational and planning purposes only. The projections, analyses, and recommendations contained herein are based on AI-generated insights and publicly available data. Actual results may vary significantly. This document does not constitute financial, legal, or professional advice. Users should conduct their own due diligence and consult with appropriate professionals before making business decisions.`;
      const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth - 20);
      pdf.text(disclaimerLines, margin + 10, yPosition);
      yPosition += disclaimerLines.length * 4 + 20;

      // Confidential stamp
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(200, 200, 200);
      const confidential = 'CONFIDENTIAL - SHADOWTALK AI';
      pdf.text(confidential, pageWidth / 2 - pdf.getTextWidth(confidential) / 2, yPosition);

      // Save the PDF
      pdf.save(`${businessIdea.name.replace(/\s+/g, '_')}_Strategy_Report.pdf`);

      // Auto-save to business memories
      if (user) {
        try {
          const memorySummary = `Industry: ${businessIdea.industry} | Location: ${businessIdea.location} | Target: ${businessIdea.targetMarket || 'General'} | Investment: ${businessIdea.initialInvestment || 'N/A'}\n\nExecutive Summary: ${result.executiveSummary?.substring(0, 500)}...\n\nKey Recommendations: ${result.recommendations?.slice(0, 3).join('; ')}`;
          
          await supabase.from('business_memories').insert({
            user_id: user.id,
            title: `Strategy Report: ${businessIdea.name}`,
            content: memorySummary,
            category: 'strategy_report',
            is_active: true,
            priority: 1,
          });

          toast({
            title: "📊 Report Saved to AI Memory",
            description: "ShadowTalk will monitor market changes for this business and notify you of updates.",
          });
        } catch (memErr) {
          console.error('Error saving to business memory:', memErr);
        }
      }

      setIsComplete(true);
      toast({
        title: "PDF Generated Successfully! 📄",
        description: "Your business strategy report has been downloaded."
      });

    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        title: "Error Generating PDF",
        description: "There was an issue creating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Export Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Export Professional Report
          </CardTitle>
          <CardDescription>
            Generate an investor-ready PDF document with your complete business strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview Info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Report Preview</span>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name</span>
                <span className="font-medium">{businessIdea.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span>{businessIdea.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry</span>
                <Badge variant="outline">{businessIdea.industry}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Pages</span>
                <span>{includeCharts ? '12-15' : '8-10'} pages</span>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Export Options</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Include Charts & Graphs</p>
                  <p className="text-xs text-muted-foreground">
                    Add visual analytics to your report
                  </p>
                </div>
                <Switch
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Include Appendix</p>
                  <p className="text-xs text-muted-foreground">
                    Add detailed research sources and data
                  </p>
                </div>
                <Switch
                  checked={includeAppendix}
                  onCheckedChange={setIncludeAppendix}
                />
              </div>
            </div>
          </div>

          {/* Report Contents */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Report Contains:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                'Cover Page',
                'Executive Summary',
                'SWOT Analysis',
                'Market Research',
                'Financial Projections',
                'Strategic Recommendations',
                'Risk Assessment',
                'Implementation Roadmap',
                includeCharts && 'Visual Analytics',
                includeAppendix && 'Research Appendix'
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            size="lg"
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating PDF...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Download Again
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Generate & Download PDF
              </>
            )}
          </Button>

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">
                Your professional strategy report has been generated with the ShadowTalk sovereign stamp!
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Branding Note */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">ShadowTalk AI Sovereign Stamp</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Every exported report includes the official ShadowTalk AI watermark, 
                establishing your brand as a trusted source of business intelligence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
