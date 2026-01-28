import { useState, useCallback } from 'react';
import { useAdvancedOfflineAI } from './useAdvancedOfflineAI';
import { useOfflineRAG } from './useOfflineRAG';

interface ResearchSource {
  id: string;
  title: string;
  content: string;
  relevance: number;
  type: 'cached' | 'memory' | 'document';
}

interface ResearchResult {
  summary: string;
  sources: ResearchSource[];
  insights: string[];
  citations: string[];
  timestamp: Date;
}

interface ResearchState {
  isResearching: boolean;
  progress: number;
  stage: string;
  results: ResearchResult | null;
  error: string | null;
}

// Pre-built knowledge base for common business topics
const OFFLINE_KNOWLEDGE_BASE: Record<string, string[]> = {
  startup: [
    'A startup is a company in its early stages designed for rapid growth and scalability.',
    'Key elements: Product-market fit, MVP (Minimum Viable Product), runway, burn rate.',
    'Funding stages: Pre-seed, Seed, Series A, B, C, and beyond.',
    'Common legal structures: LLC, C-Corp (preferred for VC funding), S-Corp.',
  ],
  business_plan: [
    'Executive Summary: Brief overview of business concept, goals, and financial projections.',
    'Market Analysis: Target market size (TAM, SAM, SOM), competition, and trends.',
    'Revenue Model: How the business generates income (SaaS, marketplace, subscription, etc.).',
    'Financial Projections: 3-5 year forecasts for revenue, costs, and profitability.',
    'Team: Key personnel, their expertise, and roles.',
  ],
  marketing: [
    'Digital marketing channels: SEO, SEM, social media, content marketing, email.',
    'Customer acquisition cost (CAC) should be less than customer lifetime value (LTV).',
    'The marketing funnel: Awareness → Interest → Consideration → Conversion → Retention.',
    'Growth hacking focuses on rapid experimentation across marketing channels.',
  ],
  finance: [
    'Unit economics: Revenue per unit minus cost per unit.',
    'Key metrics: Gross margin, net margin, EBITDA, burn rate, runway.',
    'Valuation methods: DCF, comparables, precedent transactions, revenue multiples.',
    'Financial statements: Income statement, balance sheet, cash flow statement.',
  ],
  technology: [
    'Tech stack considerations: Scalability, maintainability, cost, team expertise.',
    'Cloud providers: AWS, Google Cloud, Azure, with serverless options.',
    'Development methodologies: Agile, Scrum, Kanban, DevOps.',
    'Security considerations: Data encryption, authentication, compliance (GDPR, SOC2).',
  ],
  legal: [
    'Intellectual property: Patents, trademarks, copyrights, trade secrets.',
    'Contracts: Terms of service, privacy policy, employment agreements.',
    'Compliance: Industry-specific regulations, data protection laws.',
    'Entity formation: Jurisdiction selection, shareholder agreements, cap table.',
  ],
};

export const useOfflineResearch = () => {
  const [state, setState] = useState<ResearchState>({
    isResearching: false,
    progress: 0,
    stage: '',
    results: null,
    error: null,
  });

  const { generateResponse, isReady: aiReady, loadModel } = useAdvancedOfflineAI();
  const { search: ragSearch, documentCount } = useOfflineRAG();

  // Search the offline knowledge base
  const searchKnowledgeBase = useCallback((query: string): ResearchSource[] => {
    const queryLower = query.toLowerCase();
    const sources: ResearchSource[] = [];

    Object.entries(OFFLINE_KNOWLEDGE_BASE).forEach(([topic, facts]) => {
      const topicMatch = queryLower.includes(topic.replace('_', ' '));
      
      facts.forEach((fact, index) => {
        const factLower = fact.toLowerCase();
        const wordMatches = queryLower.split(' ').filter(word => 
          word.length > 3 && factLower.includes(word)
        ).length;

        if (topicMatch || wordMatches >= 2) {
          sources.push({
            id: `kb-${topic}-${index}`,
            title: `${topic.replace('_', ' ').charAt(0).toUpperCase() + topic.replace('_', ' ').slice(1)} Knowledge`,
            content: fact,
            relevance: topicMatch ? 0.9 : 0.5 + (wordMatches * 0.1),
            type: 'cached',
          });
        }
      });
    });

    return sources.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }, []);

  // Conduct offline research
  const conductResearch = useCallback(async (
    query: string,
    options?: {
      onProgress?: (progress: number, stage: string) => void;
      maxSources?: number;
    }
  ): Promise<ResearchResult> => {
    const { onProgress, maxSources = 8 } = options || {};

    setState(prev => ({
      ...prev,
      isResearching: true,
      progress: 0,
      stage: 'Initializing research...',
      error: null,
    }));

    const updateProgress = (progress: number, stage: string) => {
      setState(prev => ({ ...prev, progress, stage }));
      onProgress?.(progress, stage);
    };

    try {
      // Step 1: Gather sources from knowledge base
      updateProgress(10, 'Searching knowledge base...');
      const kbSources = searchKnowledgeBase(query);

      // Step 2: Search RAG if available
      updateProgress(25, 'Searching indexed documents...');
      let ragSources: ResearchSource[] = [];
      
      if (documentCount > 0) {
        try {
          const ragResults = await ragSearch(query, 5, 0.4);
          ragSources = ragResults.map((r, i) => ({
            id: `rag-${i}`,
            title: `Document ${i + 1}`,
            content: r.text,
            relevance: r.similarity,
            type: 'document' as const,
          }));
        } catch (e) {
          console.warn('[OfflineResearch] RAG search failed:', e);
        }
      }

      // Step 3: Combine and deduplicate sources
      updateProgress(40, 'Analyzing sources...');
      const allSources = [...kbSources, ...ragSources]
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxSources);

      // Step 4: Ensure AI is ready
      updateProgress(50, 'Preparing AI analysis...');
      if (!aiReady) {
        await loadModel();
      }

      // Step 5: Generate research summary
      updateProgress(60, 'Synthesizing research...');
      
      const sourceContext = allSources.map((s, i) => 
        `[Source ${i + 1}] ${s.title}: ${s.content}`
      ).join('\n\n');

      const researchPrompt = `You are conducting deep research on the following query:

QUERY: ${query}

AVAILABLE SOURCES:
${sourceContext || 'No specific sources available. Use general knowledge.'}

Please provide:
1. A comprehensive summary (3-4 paragraphs) answering the query
2. Key insights (3-5 bullet points)
3. Recommendations or next steps

Format your response with clear sections using markdown headers.`;

      let summary = '';
      await generateResponse(
        [{ role: 'user', content: researchPrompt }],
        {
          onChunk: (chunk) => {
            summary += chunk;
            const wordCount = summary.split(' ').length;
            const estimatedProgress = Math.min(60 + (wordCount / 5), 90);
            updateProgress(estimatedProgress, 'Generating analysis...');
          },
          useRAG: false, // Already included in context
          useBusinessContext: true,
          taskType: 'reasoning',
          maxTokens: 1500,
          temperature: 0.6,
        }
      );

      // Step 6: Extract insights
      updateProgress(95, 'Finalizing results...');
      
      const insights = summary
        .split('\n')
        .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
        .filter(line => line.length > 20)
        .slice(0, 5);

      const citations = allSources.map((s, i) => 
        `[${i + 1}] ${s.title} (Relevance: ${Math.round(s.relevance * 100)}%)`
      );

      const result: ResearchResult = {
        summary,
        sources: allSources,
        insights,
        citations,
        timestamp: new Date(),
      };

      updateProgress(100, 'Research complete!');
      
      setState(prev => ({
        ...prev,
        isResearching: false,
        progress: 100,
        stage: 'Complete',
        results: result,
      }));

      return result;
    } catch (e: any) {
      console.error('[OfflineResearch] Research failed:', e);
      setState(prev => ({
        ...prev,
        isResearching: false,
        error: e.message || 'Research failed',
      }));
      throw e;
    }
  }, [searchKnowledgeBase, ragSearch, documentCount, generateResponse, aiReady, loadModel]);

  // Quick answer without full research
  const quickAnswer = useCallback(async (query: string): Promise<string> => {
    const sources = searchKnowledgeBase(query);
    
    if (sources.length === 0) {
      return "I don't have specific offline information about this topic. Try conducting a full research session for a comprehensive analysis.";
    }

    const context = sources.slice(0, 3).map(s => s.content).join(' ');
    
    if (!aiReady) {
      // Return raw knowledge if AI not ready
      return `Based on my offline knowledge:\n\n${sources.slice(0, 3).map(s => `• ${s.content}`).join('\n')}`;
    }

    const response = await generateResponse(
      [{ 
        role: 'user', 
        content: `Answer briefly using this context:\n${context}\n\nQuestion: ${query}` 
      }],
      { maxTokens: 300, temperature: 0.5 }
    );

    return response;
  }, [searchKnowledgeBase, aiReady, generateResponse]);

  // Clear results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: null,
      progress: 0,
      stage: '',
    }));
  }, []);

  return {
    ...state,
    conductResearch,
    quickAnswer,
    clearResults,
    hasKnowledgeBase: Object.keys(OFFLINE_KNOWLEDGE_BASE).length > 0,
    documentCount,
  };
};
