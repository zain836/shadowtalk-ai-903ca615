import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// COGNITIVE LOOP ARCHITECTURE - Beyond 2026 Industry Standard
// =============================================================================
// Implements: Perception → Planning → Multi-Agent Debate → Action → Learning
// =============================================================================

export interface SpecialistAgent {
  id: string;
  name: string;
  domain: string;
  systemPrompt: string;
  confidence: number;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  reasoning: string;
  sources?: string[];
  disagreements?: string[];
  latencyMs: number;
}

export interface CognitiveResult {
  finalAnswer: string;
  agentResponses: AgentResponse[];
  debateSummary: string;
  consensusLevel: number; // 0-100%
  dominantAgent: string;
  totalLatencyMs: number;
  memoryUpdated: boolean;
}

export interface CognitiveState {
  isThinking: boolean;
  currentPhase: 'idle' | 'perceiving' | 'planning' | 'debating' | 'synthesizing' | 'learning';
  activeAgents: string[];
  progress: number;
  debateRound: number;
}

// Specialist Agent Definitions
const SPECIALIST_AGENTS: SpecialistAgent[] = [
  {
    id: 'legal',
    name: 'Legal Counsel',
    domain: 'law, regulations, compliance, contracts',
    systemPrompt: `You are a Legal Specialist Agent. Your role is to analyze queries from a legal perspective.
- Check for regulatory compliance (GDPR, CCPA, industry-specific)
- Identify legal risks and liabilities
- Reference relevant laws and precedents
- Be conservative and flag uncertainties
- Always cite specific regulations when applicable`,
    confidence: 0,
  },
  {
    id: 'technical',
    name: 'Technical Architect',
    domain: 'code, systems, architecture, performance',
    systemPrompt: `You are a Technical Specialist Agent. Your role is to analyze queries from an engineering perspective.
- Evaluate technical feasibility and implementation
- Consider scalability, security, and performance
- Suggest best practices and design patterns
- Identify potential technical debt
- Provide concrete code solutions when relevant`,
    confidence: 0,
  },
  {
    id: 'business',
    name: 'Business Strategist',
    domain: 'strategy, finance, operations, growth',
    systemPrompt: `You are a Business Strategy Agent. Your role is to analyze queries from a business perspective.
- Evaluate ROI and business impact
- Consider market dynamics and competition
- Identify opportunities and threats
- Suggest actionable business strategies
- Focus on measurable outcomes`,
    confidence: 0,
  },
  {
    id: 'research',
    name: 'Research Analyst',
    domain: 'data, analysis, trends, insights',
    systemPrompt: `You are a Research Analyst Agent. Your role is to provide data-driven insights.
- Gather and synthesize relevant information
- Identify patterns and trends
- Provide evidence-based recommendations
- Flag areas needing more research
- Cite sources and methodology`,
    confidence: 0,
  },
  {
    id: 'creative',
    name: 'Creative Director',
    domain: 'ideas, innovation, messaging, design',
    systemPrompt: `You are a Creative Specialist Agent. Your role is to bring innovative perspectives.
- Generate creative solutions and alternatives
- Consider user experience and engagement
- Challenge conventional thinking
- Propose compelling narratives
- Think outside the box while staying practical`,
    confidence: 0,
  },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useCognitiveLoop = () => {
  const [state, setState] = useState<CognitiveState>({
    isThinking: false,
    currentPhase: 'idle',
    activeAgents: [],
    progress: 0,
    debateRound: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  // Query a single specialist agent
  const querySpecialist = useCallback(async (
    agent: SpecialistAgent,
    userQuery: string,
    context: string,
    otherResponses?: AgentResponse[]
  ): Promise<AgentResponse | null> => {
    const startTime = Date.now();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Build debate-aware prompt
      let prompt = userQuery;
      if (otherResponses && otherResponses.length > 0) {
        prompt = `Original Query: ${userQuery}

Other specialists have provided these perspectives:
${otherResponses.map(r => `**${r.agentName}**: ${r.response.slice(0, 500)}...`).join('\n\n')}

Now provide your perspective as the ${agent.name}. If you disagree with any points, explicitly state why. If you agree, build upon their insights.`;
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `${agent.systemPrompt}\n\nContext:\n${context}` },
            { role: 'user', content: prompt },
          ],
          model: 'google/gemini-3-flash-preview',
          stream: false,
        }),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) {
        console.warn(`[Cognitive] Agent ${agent.name} failed:`, response.status);
        return null;
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
                if (content) fullResponse += content;
              } catch {}
            }
          }
        }
      }

      // Extract confidence from response (look for self-assessment)
      const confidenceMatch = fullResponse.match(/confidence[:\s]+(\d+)/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.7;

      // Extract disagreements
      const disagreements: string[] = [];
      const disagreeMatches = fullResponse.match(/disagree[^.]+\./gi);
      if (disagreeMatches) {
        disagreements.push(...disagreeMatches.slice(0, 3));
      }

      return {
        agentId: agent.id,
        agentName: agent.name,
        response: fullResponse.trim(),
        confidence,
        reasoning: `Analysis from ${agent.domain} perspective`,
        disagreements,
        latencyMs: Date.now() - startTime,
      };
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null;
      console.error(`[Cognitive] Error with ${agent.name}:`, e);
      return null;
    }
  }, []);

  // Select relevant agents based on query
  const selectAgents = useCallback((query: string): SpecialistAgent[] => {
    const queryLower = query.toLowerCase();

    // Domain detection patterns
    const patterns: Record<string, RegExp> = {
      legal: /\b(law|legal|compliance|gdpr|regulation|contract|liability|court|sue|policy)\b/i,
      technical: /\b(code|api|database|server|bug|error|implement|build|deploy|architecture|programming)\b/i,
      business: /\b(revenue|profit|market|strategy|growth|roi|business|investor|funding|sales)\b/i,
      research: /\b(research|data|analysis|study|report|statistics|trend|survey|insight)\b/i,
      creative: /\b(design|brand|creative|idea|campaign|content|story|visual|marketing)\b/i,
    };

    const matchedAgents: SpecialistAgent[] = [];

    for (const agent of SPECIALIST_AGENTS) {
      if (patterns[agent.id]?.test(queryLower)) {
        matchedAgents.push({ ...agent, confidence: 0.9 });
      }
    }

    // Always include at least 2 agents for debate (default: technical + business)
    if (matchedAgents.length < 2) {
      const defaults = SPECIALIST_AGENTS.filter(a => ['technical', 'business'].includes(a.id));
      for (const agent of defaults) {
        if (!matchedAgents.find(m => m.id === agent.id)) {
          matchedAgents.push({ ...agent, confidence: 0.6 });
        }
      }
    }

    // Cap at 4 agents for performance
    return matchedAgents.slice(0, 4);
  }, []);

  // Synthesize final answer from debate
  const synthesizeAnswer = useCallback(async (
    query: string,
    responses: AgentResponse[]
  ): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const synthesisPrompt = `You are the Chief Synthesizer. Multiple specialist agents have analyzed this query:

**Original Query**: ${query}

**Agent Responses**:
${responses.map(r => `
### ${r.agentName} (Confidence: ${Math.round(r.confidence * 100)}%)
${r.response}
${r.disagreements?.length ? `\n**Disagreements**: ${r.disagreements.join('; ')}` : ''}
`).join('\n---\n')}

**Your Task**:
1. Synthesize the strongest points from each agent
2. Resolve any contradictions (explain which view is more accurate and why)
3. Provide a unified, actionable answer
4. Highlight key insights from the multi-agent debate
5. Format with markdown for clarity

Provide the BEST possible answer by combining their expertise.`;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: synthesisPrompt }],
          model: 'google/gemini-2.5-pro', // Use strongest model for synthesis
          stream: false,
        }),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) {
        // Fallback: combine responses manually
        return responses.map(r => `**${r.agentName}**: ${r.response}`).join('\n\n');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
                if (content) fullResponse += content;
              } catch {}
            }
          }
        }
      }

      return fullResponse.trim();
    } catch (e) {
      console.error('[Cognitive] Synthesis error:', e);
      return responses.map(r => `**${r.agentName}**: ${r.response}`).join('\n\n');
    }
  }, []);

  // Main cognitive loop execution
  const runCognitiveLoop = useCallback(async (
    query: string,
    options?: {
      context?: string;
      forceAgents?: string[];
      maxDebateRounds?: number;
      onProgress?: (phase: string, agents: string[], progress: number) => void;
    }
  ): Promise<CognitiveResult | null> => {
    const { context = '', forceAgents, maxDebateRounds = 2, onProgress } = options || {};

    abortRef.current = new AbortController();
    const startTime = Date.now();

    setState({
      isThinking: true,
      currentPhase: 'perceiving',
      activeAgents: [],
      progress: 0,
      debateRound: 0,
    });
    onProgress?.('perceiving', [], 10);

    try {
      // Phase 1: Perceive - Analyze query and select agents
      const selectedAgents = forceAgents
        ? SPECIALIST_AGENTS.filter(a => forceAgents.includes(a.id))
        : selectAgents(query);

      setState(prev => ({
        ...prev,
        currentPhase: 'planning',
        activeAgents: selectedAgents.map(a => a.name),
        progress: 20,
      }));
      onProgress?.('planning', selectedAgents.map(a => a.name), 20);

      // Phase 2: First round - All agents respond in parallel
      setState(prev => ({ ...prev, currentPhase: 'debating', progress: 30, debateRound: 1 }));
      onProgress?.('debating', selectedAgents.map(a => a.name), 30);

      const firstRoundPromises = selectedAgents.map(agent =>
        querySpecialist(agent, query, context)
      );
      const firstRoundResults = (await Promise.all(firstRoundPromises)).filter(Boolean) as AgentResponse[];

      if (firstRoundResults.length === 0) {
        throw new Error('No agents responded');
      }

      // Phase 3: Debate rounds - Agents respond to each other
      let allResponses = [...firstRoundResults];

      for (let round = 2; round <= maxDebateRounds; round++) {
        setState(prev => ({
          ...prev,
          debateRound: round,
          progress: 30 + (round * 20),
        }));
        onProgress?.('debating', selectedAgents.map(a => a.name), 30 + (round * 20));

        // Only agents with disagreements respond again
        const agentsWithDisagreements = firstRoundResults.filter(
          r => r.disagreements && r.disagreements.length > 0
        );

        if (agentsWithDisagreements.length === 0) break;

        const debatePromises = agentsWithDisagreements.map(r => {
          const agent = selectedAgents.find(a => a.id === r.agentId);
          if (!agent) return null;
          return querySpecialist(agent, query, context, firstRoundResults.filter(resp => resp.agentId !== r.agentId));
        });

        const debateResults = (await Promise.all(debatePromises)).filter(Boolean) as AgentResponse[];
        allResponses = [...allResponses, ...debateResults];
      }

      // Phase 4: Synthesize final answer
      setState(prev => ({ ...prev, currentPhase: 'synthesizing', progress: 80 }));
      onProgress?.('synthesizing', [], 80);

      const finalAnswer = await synthesizeAnswer(query, allResponses);

      // Calculate consensus level
      const avgConfidence = allResponses.reduce((sum, r) => sum + r.confidence, 0) / allResponses.length;
      const totalDisagreements = allResponses.reduce((sum, r) => sum + (r.disagreements?.length || 0), 0);
      const consensusLevel = Math.max(0, Math.round((avgConfidence * 100) - (totalDisagreements * 5)));

      // Find dominant agent
      const dominantAgent = allResponses.reduce((best, curr) =>
        curr.confidence > best.confidence ? curr : best
      ).agentName;

      // Phase 5: Learning - Update procedural memory (TODO: implement)
      setState(prev => ({ ...prev, currentPhase: 'learning', progress: 95 }));
      onProgress?.('learning', [], 95);

      const result: CognitiveResult = {
        finalAnswer,
        agentResponses: allResponses,
        debateSummary: `${selectedAgents.length} agents debated over ${maxDebateRounds} rounds with ${totalDisagreements} disagreements resolved.`,
        consensusLevel,
        dominantAgent,
        totalLatencyMs: Date.now() - startTime,
        memoryUpdated: false, // TODO: implement memory update
      };

      setState({
        isThinking: false,
        currentPhase: 'idle',
        activeAgents: [],
        progress: 100,
        debateRound: 0,
      });
      onProgress?.('idle', [], 100);

      return result;

    } catch (e) {
      console.error('[Cognitive] Loop error:', e);
      setState({
        isThinking: false,
        currentPhase: 'idle',
        activeAgents: [],
        progress: 0,
        debateRound: 0,
      });
      return null;
    }
  }, [selectAgents, querySpecialist, synthesizeAnswer]);

  // Cancel ongoing loop
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({
      isThinking: false,
      currentPhase: 'idle',
      activeAgents: [],
      progress: 0,
      debateRound: 0,
    });
  }, []);

  return {
    ...state,
    runCognitiveLoop,
    cancel,
    availableAgents: SPECIALIST_AGENTS,
  };
};
