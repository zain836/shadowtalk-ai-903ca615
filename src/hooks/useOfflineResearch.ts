import { useState, useCallback } from 'react';
import { useAdvancedOfflineAI } from './useAdvancedOfflineAI';
import { useOfflineRAG } from './useOfflineRAG';
import { useLocalVectorStore } from './useLocalVectorStore';

interface ResearchSource {
  id: string;
  title: string;
  content: string;
  relevance: number;
  type: 'cached' | 'memory' | 'document' | 'conversation';
}

interface ResearchResult {
  summary: string;
  sources: ResearchSource[];
  insights: string[];
  citations: string[];
  followUpQuestions: string[];
  timestamp: Date;
  queryDecomposition: string[];
}

interface ResearchState {
  isResearching: boolean;
  progress: number;
  stage: string;
  results: ResearchResult | null;
  error: string | null;
  researchHistory: ResearchResult[];
}

// Expanded offline knowledge base with deeper coverage
const OFFLINE_KNOWLEDGE_BASE: Record<string, string[]> = {
  startup: [
    'A startup is a company in its early stages designed for rapid growth and scalability.',
    'Key elements: Product-market fit, MVP (Minimum Viable Product), runway, burn rate.',
    'Funding stages: Pre-seed, Seed, Series A, B, C, and beyond.',
    'Common legal structures: LLC, C-Corp (preferred for VC funding), S-Corp.',
    'Lean Startup methodology: Build-Measure-Learn loop for rapid iteration.',
    'Key metrics: MRR, ARR, churn rate, NPS, activation rate, retention curves.',
  ],
  business_plan: [
    'Executive Summary: Brief overview of business concept, goals, and financial projections.',
    'Market Analysis: Target market size (TAM, SAM, SOM), competition, and trends.',
    'Revenue Model: How the business generates income (SaaS, marketplace, subscription, etc.).',
    'Financial Projections: 3-5 year forecasts for revenue, costs, and profitability.',
    'Team: Key personnel, their expertise, and roles.',
    'Go-to-Market Strategy: Customer acquisition, distribution channels, and partnerships.',
  ],
  marketing: [
    'Digital marketing channels: SEO, SEM, social media, content marketing, email.',
    'Customer acquisition cost (CAC) should be less than customer lifetime value (LTV).',
    'The marketing funnel: Awareness → Interest → Consideration → Conversion → Retention.',
    'Growth hacking focuses on rapid experimentation across marketing channels.',
    'Content marketing ROI: Blogs generate 67% more leads than companies without them.',
    'A/B testing is essential for optimizing conversion rates across all touchpoints.',
  ],
  finance: [
    'Unit economics: Revenue per unit minus cost per unit.',
    'Key metrics: Gross margin, net margin, EBITDA, burn rate, runway.',
    'Valuation methods: DCF, comparables, precedent transactions, revenue multiples.',
    'Financial statements: Income statement, balance sheet, cash flow statement.',
    'SaaS Rule of 40: Growth rate + profit margin should exceed 40%.',
    'Break-even analysis: Fixed costs / (price per unit - variable cost per unit).',
  ],
  technology: [
    'Tech stack considerations: Scalability, maintainability, cost, team expertise.',
    'Cloud providers: AWS, Google Cloud, Azure, with serverless options.',
    'Development methodologies: Agile, Scrum, Kanban, DevOps.',
    'Security considerations: Data encryption, authentication, compliance (GDPR, SOC2).',
    'Microservices vs monolith: Trade-offs in complexity, deployment, and scaling.',
    'Edge computing reduces latency by processing data closer to users.',
  ],
  legal: [
    'Intellectual property: Patents, trademarks, copyrights, trade secrets.',
    'Contracts: Terms of service, privacy policy, employment agreements.',
    'Compliance: Industry-specific regulations, data protection laws.',
    'Entity formation: Jurisdiction selection, shareholder agreements, cap table.',
    'GDPR requires explicit consent, data portability, and right to deletion.',
    'SOC 2 certification validates security, availability, and confidentiality controls.',
  ],
  ai_ml: [
    'Machine learning paradigms: Supervised, unsupervised, reinforcement learning.',
    'Neural network architectures: CNNs for vision, transformers for language, GANs for generation.',
    'Large language models (LLMs): GPT, Llama, Gemini, Claude — trained on internet-scale data.',
    'RAG (Retrieval-Augmented Generation): Combines search with AI generation for accuracy.',
    'Edge AI: Running inference on-device for privacy and low latency.',
    'AI safety: Alignment, interpretability, bias mitigation, responsible deployment.',
  ],
  cybersecurity: [
    'OWASP Top 10: Injection, broken auth, XSS, insecure design, misconfig, etc.',
    'Zero Trust Architecture: Never trust, always verify — micro-segmentation and least privilege.',
    'Incident response: Preparation, identification, containment, eradication, recovery, lessons.',
    'Penetration testing: Black box, white box, gray box approaches to security assessment.',
    'Bug bounty programs: Crowdsourced security testing via HackerOne, Bugcrowd platforms.',
    'Encryption: AES-256 for data at rest, TLS 1.3 for data in transit.',
  ],
  product: [
    'Product-led growth (PLG): Product itself drives acquisition, activation, retention.',
    'Jobs-to-be-done framework: Focus on what customers are trying to accomplish.',
    'North Star Metric: The single metric that best captures the value delivered.',
    'Feature prioritization: RICE scoring (Reach, Impact, Confidence, Effort).',
    'User research: Interviews, surveys, usability testing, analytics, A/B testing.',
    'Product-market fit: When 40%+ users say they would be very disappointed without your product.',
  ],
};

export const useOfflineResearch = () => {
  const [state, setState] = useState<ResearchState>({
    isResearching: false,
    progress: 0,
    stage: '',
    results: null,
    error: null,
    researchHistory: [],
  });

  const { generateResponse, isReady: aiReady, loadModel } = useAdvancedOfflineAI();
  const { search: ragSearch, documentCount } = useOfflineRAG();
  const { search: vectorSearch, entryCount: vectorCount } = useLocalVectorStore();

  // Decompose complex queries into sub-questions
  const decomposeQuery = useCallback((query: string): string[] => {
    const subQueries = [query];
    const words = query.toLowerCase().split(' ');

    // Detect multi-part questions
    if (query.includes(' and ')) {
      const parts = query.split(/\s+and\s+/i);
      subQueries.push(...parts.map(p => p.trim()).filter(p => p.length > 10));
    }

    // Generate related sub-queries based on topic detection
    const topicKeywords: Record<string, string[]> = {
      'how to': ['steps for', 'best practices for', 'common mistakes in'],
      'compare': ['advantages of', 'disadvantages of', 'alternatives to'],
      'what is': ['definition of', 'examples of', 'history of'],
      'why': ['reasons for', 'benefits of', 'impact of'],
    };

    for (const [trigger, expansions] of Object.entries(topicKeywords)) {
      if (query.toLowerCase().startsWith(trigger)) {
        const topic = query.toLowerCase().replace(trigger, '').trim();
        subQueries.push(`${expansions[0]} ${topic}`);
      }
    }

    return [...new Set(subQueries)].slice(0, 4);
  }, []);

  // Search the offline knowledge base with improved matching
  const searchKnowledgeBase = useCallback((query: string): ResearchSource[] => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const sources: ResearchSource[] = [];

    Object.entries(OFFLINE_KNOWLEDGE_BASE).forEach(([topic, facts]) => {
      const topicWords = topic.replace('_', ' ').split(' ');
      const topicMatch = topicWords.some(tw => queryLower.includes(tw));

      facts.forEach((fact, index) => {
        const factLower = fact.toLowerCase();
        const wordMatches = queryWords.filter(word => factLower.includes(word)).length;
        const matchRatio = wordMatches / Math.max(queryWords.length, 1);

        if (topicMatch || matchRatio >= 0.3) {
          sources.push({
            id: `kb-${topic}-${index}`,
            title: `${topic.replace('_', ' ').charAt(0).toUpperCase() + topic.replace('_', ' ').slice(1)}`,
            content: fact,
            relevance: topicMatch ? 0.85 + (matchRatio * 0.15) : 0.4 + (matchRatio * 0.4),
            type: 'cached',
          });
        }
      });
    });

    return sources.sort((a, b) => b.relevance - a.relevance).slice(0, 12);
  }, []);

  // Search conversation memory via vector store
  const searchConversationMemory = useCallback(async (query: string): Promise<ResearchSource[]> => {
    if (vectorCount === 0) return [];
    try {
      const results = await vectorSearch(query, 5, 0.15);
      return results.map((r, i) => ({
        id: `conv-${i}`,
        title: `Past Conversation: ${r.metadata?.topic || 'Memory'}`,
        content: r.text,
        relevance: r.score * 0.8,
        type: 'conversation' as const,
      }));
    } catch {
      return [];
    }
  }, [vectorSearch, vectorCount]);

  // Multi-step research with query decomposition
  const conductResearch = useCallback(async (
    query: string,
    options?: {
      onProgress?: (progress: number, stage: string) => void;
      maxSources?: number;
      depth?: 'quick' | 'standard' | 'deep';
    }
  ): Promise<ResearchResult> => {
    const { onProgress, maxSources = 10, depth = 'standard' } = options || {};

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
      // Step 1: Decompose query
      updateProgress(5, 'Decomposing query...');
      const subQueries = decomposeQuery(query);

      // Step 2: Gather sources from all sub-queries
      updateProgress(10, 'Searching knowledge base...');
      const allKbSources: ResearchSource[] = [];
      for (const sq of subQueries) {
        allKbSources.push(...searchKnowledgeBase(sq));
      }

      // Step 3: Search RAG documents
      updateProgress(25, 'Searching indexed documents...');
      let ragSources: ResearchSource[] = [];
      if (documentCount > 0) {
        try {
          const ragResults = await ragSearch(query, 5, 0.3);
          ragSources = ragResults.map((r, i) => ({
            id: `rag-${i}`,
            title: `Document: ${r.metadata?.title || `Source ${i + 1}`}`,
            content: r.text,
            relevance: r.similarity,
            type: 'document' as const,
          }));
        } catch (e) {
          console.warn('[OfflineResearch] RAG search failed:', e);
        }
      }

      // Step 4: Search conversation memory
      updateProgress(35, 'Searching conversation memory...');
      const memSources = await searchConversationMemory(query);

      // Step 5: Deduplicate and rank all sources
      updateProgress(45, 'Ranking sources...');
      const seenContent = new Set<string>();
      const allSources = [...allKbSources, ...ragSources, ...memSources]
        .filter(s => {
          const key = s.content.substring(0, 80);
          if (seenContent.has(key)) return false;
          seenContent.add(key);
          return true;
        })
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxSources);

      // Step 6: Ensure AI is ready
      updateProgress(50, 'Preparing AI analysis...');
      if (!aiReady) {
        await loadModel();
      }

      // Step 7: Multi-step synthesis
      updateProgress(60, 'Synthesizing research...');

      const sourceContext = allSources.map((s, i) =>
        `[${i + 1}] (${s.type}) ${s.title}: ${s.content}`
      ).join('\n\n');

      const depthInstruction = depth === 'deep'
        ? 'Provide an extremely detailed analysis with 5+ paragraphs, covering all angles, edge cases, and actionable recommendations.'
        : depth === 'quick'
          ? 'Provide a concise 2-paragraph answer with key takeaways.'
          : 'Provide a thorough 3-4 paragraph analysis with key insights and recommendations.';

      const researchPrompt = `You are ShadowTalk AI's Deep Research Engine operating in SOVEREIGN MODE.
Conduct comprehensive research on:

QUERY: ${query}
${subQueries.length > 1 ? `\nSUB-QUESTIONS:\n${subQueries.slice(1).map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

SOURCES (${allSources.length} found):
${sourceContext || 'No specific sources. Use your training knowledge.'}

${depthInstruction}

Structure your response:
## Research Summary
[Main analysis]

## Key Insights
- [Insight 1]
- [Insight 2]
- [Insight 3]

## Recommendations
1. [Action item]
2. [Action item]

## Follow-Up Questions
- [Question to explore further]
- [Related area to investigate]`;

      let summary = '';
      await generateResponse(
        [{ role: 'user', content: researchPrompt }],
        {
          onChunk: (chunk) => {
            summary += chunk;
            const wordCount = summary.split(' ').length;
            const estimatedProgress = Math.min(60 + (wordCount / 8), 92);
            updateProgress(estimatedProgress, 'Generating analysis...');
          },
          useRAG: false,
          useBusinessContext: true,
          taskType: 'reasoning',
          maxTokens: depth === 'deep' ? 2500 : depth === 'quick' ? 600 : 1500,
          temperature: 0.5,
        }
      );

      // Step 8: Extract structured outputs
      updateProgress(95, 'Finalizing results...');

      const insights = summary
        .split('\n')
        .filter(line => line.trim().match(/^[-•]\s/) || line.trim().match(/^\d+\.\s/))
        .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
        .filter(line => line.length > 15)
        .slice(0, 6);

      const followUpMatch = summary.match(/## Follow-Up Questions\n([\s\S]*?)(?=\n##|$)/);
      const followUpQuestions = followUpMatch
        ? followUpMatch[1].split('\n')
            .filter(l => l.trim().startsWith('-'))
            .map(l => l.replace(/^-\s*/, '').trim())
            .slice(0, 3)
        : [];

      const citations = allSources.map((s, i) =>
        `[${i + 1}] ${s.title} (${s.type}, ${Math.round(s.relevance * 100)}% match)`
      );

      const result: ResearchResult = {
        summary,
        sources: allSources,
        insights,
        citations,
        followUpQuestions,
        timestamp: new Date(),
        queryDecomposition: subQueries,
      };

      updateProgress(100, 'Research complete!');

      setState(prev => ({
        ...prev,
        isResearching: false,
        progress: 100,
        stage: 'Complete',
        results: result,
        researchHistory: [...prev.researchHistory.slice(-9), result],
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
  }, [decomposeQuery, searchKnowledgeBase, searchConversationMemory, ragSearch, documentCount, generateResponse, aiReady, loadModel]);

  const quickAnswer = useCallback(async (query: string): Promise<string> => {
    const sources = searchKnowledgeBase(query);
    if (sources.length === 0) {
      return "I don't have specific offline information about this topic. Try a full research session for comprehensive analysis.";
    }
    const context = sources.slice(0, 3).map(s => s.content).join(' ');
    if (!aiReady) {
      return `Based on my offline knowledge:\n\n${sources.slice(0, 3).map(s => `• ${s.content}`).join('\n')}`;
    }
    return generateResponse(
      [{ role: 'user', content: `Answer briefly using this context:\n${context}\n\nQuestion: ${query}` }],
      { maxTokens: 300, temperature: 0.5 }
    );
  }, [searchKnowledgeBase, aiReady, generateResponse]);

  const clearResults = useCallback(() => {
    setState(prev => ({ ...prev, results: null, progress: 0, stage: '' }));
  }, []);

  return {
    ...state,
    conductResearch,
    quickAnswer,
    clearResults,
    hasKnowledgeBase: true,
    documentCount,
  };
};
