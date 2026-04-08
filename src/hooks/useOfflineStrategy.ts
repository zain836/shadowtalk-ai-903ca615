import { useState, useCallback } from 'react';
import { useAdvancedOfflineAI } from './useAdvancedOfflineAI';
import { useBusinessMemory } from './useBusinessMemory';
import { useLocalVectorStore } from './useLocalVectorStore';

interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface FinancialProjection {
  year: number;
  revenue: number;
  costs: number;
  profit: number;
  growthRate: number;
}

interface MarketAnalysis {
  tam: number; // Total Addressable Market
  sam: number; // Serviceable Addressable Market
  som: number; // Serviceable Obtainable Market
  competitors: string[];
  trends: string[];
}

interface StrategyReport {
  executiveSummary: string;
  swot: SWOTAnalysis;
  marketAnalysis: MarketAnalysis;
  financialProjections: FinancialProjection[];
  recommendations: string[];
  riskFactors: string[];
  nextSteps: string[];
  generatedAt: Date;
}

interface StrategyState {
  isGenerating: boolean;
  progress: number;
  stage: string;
  report: StrategyReport | null;
  error: string | null;
}

export const useOfflineStrategy = () => {
  const [state, setState] = useState<StrategyState>({
    isGenerating: false,
    progress: 0,
    stage: '',
    report: null,
    error: null,
  });

  const { generateResponse, isReady: aiReady, loadModel } = useAdvancedOfflineAI();
  const { memories } = useBusinessMemory();
  const { search: vectorSearch } = useLocalVectorStore();

  // Generate SWOT analysis
  const generateSWOT = useCallback(async (
    businessDescription: string,
    industry: string
  ): Promise<SWOTAnalysis> => {
    const prompt = `Generate a SWOT analysis for this business:

BUSINESS: ${businessDescription}
INDUSTRY: ${industry}

Provide exactly 4 items for each category. Format as:
STRENGTHS:
1. [strength 1]
2. [strength 2]
3. [strength 3]
4. [strength 4]

WEAKNESSES:
1. [weakness 1]
...and so on for OPPORTUNITIES and THREATS`;

    const response = await generateResponse(
      [{ role: 'user', content: prompt }],
      { maxTokens: 800, temperature: 0.6, taskType: 'reasoning' }
    );

    // Parse response
    const sections = response.split(/\n(?=STRENGTHS:|WEAKNESSES:|OPPORTUNITIES:|THREATS:)/i);
    
    const parseSection = (section: string): string[] => {
      return section
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 4);
    };

    return {
      strengths: parseSection(sections.find(s => s.toLowerCase().includes('strengths')) || '') || ['Strong value proposition', 'Innovative approach', 'Dedicated team', 'Growing market'],
      weaknesses: parseSection(sections.find(s => s.toLowerCase().includes('weaknesses')) || '') || ['Limited resources', 'Market presence', 'Scaling challenges', 'Competition'],
      opportunities: parseSection(sections.find(s => s.toLowerCase().includes('opportunities')) || '') || ['Market expansion', 'New segments', 'Partnerships', 'Technology trends'],
      threats: parseSection(sections.find(s => s.toLowerCase().includes('threats')) || '') || ['Competition', 'Economic factors', 'Regulatory changes', 'Technology disruption'],
    };
  }, [generateResponse]);

  // Generate financial projections
  const generateFinancials = useCallback(async (
    businessDescription: string,
    startingRevenue: number = 100000,
    growthRate: number = 0.5
  ): Promise<FinancialProjection[]> => {
    const projections: FinancialProjection[] = [];
    
    let currentRevenue = startingRevenue;
    const costRatio = 0.6; // 60% of revenue as costs initially, improving over time

    for (let year = 1; year <= 5; year++) {
      const adjustedCostRatio = costRatio - (year * 0.05); // Improving margins
      const adjustedGrowth = growthRate * (1 - (year * 0.05)); // Slowing growth
      
      const revenue = Math.round(currentRevenue);
      const costs = Math.round(revenue * Math.max(adjustedCostRatio, 0.3));
      const profit = revenue - costs;
      
      projections.push({
        year,
        revenue,
        costs,
        profit,
        growthRate: adjustedGrowth,
      });
      
      currentRevenue *= (1 + adjustedGrowth);
    }

    return projections;
  }, []);

  // Generate market analysis
  const generateMarketAnalysis = useCallback(async (
    industry: string,
    targetMarket: string
  ): Promise<MarketAnalysis> => {
    const prompt = `Analyze the market for:
INDUSTRY: ${industry}
TARGET: ${targetMarket}

Provide:
1. TAM (Total Addressable Market) estimate in USD
2. SAM (Serviceable Addressable Market) estimate in USD
3. SOM (Serviceable Obtainable Market) estimate in USD
4. Top 3-5 competitors
5. Key market trends (3-4)

Be realistic with numbers.`;

    const response = await generateResponse(
      [{ role: 'user', content: prompt }],
      { maxTokens: 600, temperature: 0.5, taskType: 'reasoning' }
    );

    // Extract numbers and lists
    const extractNumber = (text: string, keyword: string): number => {
      const regex = new RegExp(`${keyword}[^0-9]*([0-9,.]+)\\s*(billion|million|thousand)?`, 'i');
      const match = text.match(regex);
      if (!match) return 0;
      
      let num = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2]?.toLowerCase();
      
      if (unit === 'billion') num *= 1000000000;
      else if (unit === 'million') num *= 1000000;
      else if (unit === 'thousand') num *= 1000;
      
      return num;
    };

    const extractList = (text: string, keyword: string): string[] => {
      const section = text.substring(text.toLowerCase().indexOf(keyword.toLowerCase()));
      return section
        .split('\n')
        .filter(line => line.match(/^[-•\d.]+\s/))
        .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
        .slice(0, 5);
    };

    return {
      tam: extractNumber(response, 'TAM') || 10000000000,
      sam: extractNumber(response, 'SAM') || 1000000000,
      som: extractNumber(response, 'SOM') || 50000000,
      competitors: extractList(response, 'competitor') || ['Competitor A', 'Competitor B', 'Competitor C'],
      trends: extractList(response, 'trend') || ['Digital transformation', 'AI adoption', 'Remote work'],
    };
  }, [generateResponse]);

  // Generate full strategy report
  const generateStrategyReport = useCallback(async (
    businessDescription: string,
    industry: string,
    targetMarket: string,
    options?: {
      onProgress?: (progress: number, stage: string) => void;
      startingRevenue?: number;
      growthRate?: number;
    }
  ): Promise<StrategyReport> => {
    const { onProgress, startingRevenue = 100000, growthRate = 0.5 } = options || {};

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      stage: 'Initializing...',
      error: null,
    }));

    const updateProgress = (progress: number, stage: string) => {
      setState(prev => ({ ...prev, progress, stage }));
      onProgress?.(progress, stage);
    };

    try {
      // Ensure AI is ready
      if (!aiReady) {
        updateProgress(5, 'Loading AI model...');
        await loadModel();
      }

      // Add business memory context
      const memoryContext = memories
        .filter(m => m.is_active)
        .map(m => `${m.category}: ${m.content}`)
        .join('\n');

      const fullDescription = memoryContext 
        ? `${businessDescription}\n\nAdditional context:\n${memoryContext}`
        : businessDescription;

      // Step 1: Generate SWOT
      updateProgress(15, 'Analyzing strengths and weaknesses...');
      const swot = await generateSWOT(fullDescription, industry);

      // Step 2: Generate Market Analysis
      updateProgress(35, 'Conducting market analysis...');
      const marketAnalysis = await generateMarketAnalysis(industry, targetMarket);

      // Step 3: Generate Financial Projections
      updateProgress(50, 'Creating financial projections...');
      const financialProjections = await generateFinancials(fullDescription, startingRevenue, growthRate);

      // Step 4: Generate Executive Summary
      updateProgress(65, 'Writing executive summary...');
      const summaryPrompt = `Write a 2-paragraph executive summary for this business strategy:

BUSINESS: ${businessDescription}
INDUSTRY: ${industry}
TARGET MARKET: ${targetMarket}

Key strengths: ${swot.strengths.slice(0, 2).join(', ')}
Market opportunity: $${(marketAnalysis.som / 1000000).toFixed(0)}M SOM
Year 5 projected revenue: $${(financialProjections[4].revenue / 1000000).toFixed(1)}M

Be professional and compelling.`;

      const executiveSummary = await generateResponse(
        [{ role: 'user', content: summaryPrompt }],
        { maxTokens: 400, temperature: 0.6 }
      );

      // Step 5: Generate Recommendations
      updateProgress(80, 'Generating recommendations...');
      const recsPrompt = `Based on this SWOT analysis:
Strengths: ${swot.strengths.join(', ')}
Weaknesses: ${swot.weaknesses.join(', ')}
Opportunities: ${swot.opportunities.join(', ')}
Threats: ${swot.threats.join(', ')}

Provide 5 strategic recommendations. Format as numbered list.`;

      const recsResponse = await generateResponse(
        [{ role: 'user', content: recsPrompt }],
        { maxTokens: 400, temperature: 0.6 }
      );

      const recommendations = recsResponse
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5);

      // Step 6: Finalize
      updateProgress(95, 'Finalizing report...');

      const report: StrategyReport = {
        executiveSummary,
        swot,
        marketAnalysis,
        financialProjections,
        recommendations: recommendations.length > 0 ? recommendations : [
          'Focus on core value proposition',
          'Build strategic partnerships',
          'Invest in technology infrastructure',
          'Expand market presence gradually',
          'Monitor competitive landscape',
        ],
        riskFactors: swot.threats,
        nextSteps: [
          'Validate market assumptions with customer research',
          'Develop detailed financial model',
          'Create go-to-market strategy',
          'Build MVP or pilot program',
          'Seek initial funding or partnerships',
        ],
        generatedAt: new Date(),
      };

      updateProgress(100, 'Complete!');

      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        stage: 'Complete',
        report,
      }));

      return report;
    } catch (e: any) {
      console.error('[OfflineStrategy] Report generation failed:', e);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: e.message || 'Failed to generate report',
      }));
      throw e;
    }
  }, [aiReady, loadModel, memories, generateSWOT, generateMarketAnalysis, generateFinancials, generateResponse]);

  // Clear report
  const clearReport = useCallback(() => {
    setState(prev => ({
      ...prev,
      report: null,
      progress: 0,
      stage: '',
    }));
  }, []);

  return {
    ...state,
    generateStrategyReport,
    generateSWOT,
    generateFinancials,
    generateMarketAnalysis,
    clearReport,
  };
};
