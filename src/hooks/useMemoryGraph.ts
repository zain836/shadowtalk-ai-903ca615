import { useState, useCallback, useEffect, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// CONTEXTUAL MEMORY GRAPHS - Beyond RAG
// =============================================================================
// Implements: Episodic + Semantic + Procedural Memory Layers
// =============================================================================

interface MemoryGraphDB extends DBSchema {
  episodic: {
    key: string;
    value: EpisodicMemory;
    indexes: { 'by-user': string; 'by-timestamp': number; 'by-context': string };
  };
  semantic: {
    key: string;
    value: SemanticNode;
    indexes: { 'by-user': string; 'by-type': string };
  };
  procedural: {
    key: string;
    value: ProceduralMemory;
    indexes: { 'by-user': string; 'by-frequency': number };
  };
  relationships: {
    key: string;
    value: MemoryRelationship;
    indexes: { 'by-source': string; 'by-target': string };
  };
}

// Episodic Memory: Specific events and interactions
export interface EpisodicMemory {
  id: string;
  userId: string;
  timestamp: number;
  context: string; // e.g., "report_generation", "code_review"
  userInput: string;
  aiResponse: string;
  outcome: 'positive' | 'negative' | 'neutral';
  userFeedback?: string;
  preferences: Record<string, any>; // e.g., { format: 'slides', style: 'detailed' }
  metadata: Record<string, any>;
}

// Semantic Memory: Facts and knowledge about the user/business
export interface SemanticNode {
  id: string;
  userId: string;
  type: 'entity' | 'concept' | 'fact' | 'preference' | 'relationship';
  label: string;
  properties: Record<string, any>;
  embedding?: number[]; // For similarity search
  confidence: number;
  lastUpdated: number;
  sources: string[]; // Episode IDs that contributed to this knowledge
}

// Procedural Memory: Learned workflows and patterns
export interface ProceduralMemory {
  id: string;
  userId: string;
  name: string;
  description: string;
  triggerPattern: string; // Regex or keyword pattern
  steps: ProceduralStep[];
  frequency: number; // How often this workflow is used
  successRate: number;
  lastUsed: number;
  isAutomatable: boolean;
}

export interface ProceduralStep {
  order: number;
  action: string;
  params: Record<string, any>;
  expectedOutcome: string;
  alternatives?: string[];
}

// Relationships between memory nodes
export interface MemoryRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'related_to' | 'caused_by' | 'requires' | 'part_of' | 'similar_to' | 'contradicts';
  strength: number; // 0-1
  metadata?: Record<string, any>;
}

export interface MemoryContext {
  episodicMemories: EpisodicMemory[];
  relevantFacts: SemanticNode[];
  suggestedWorkflows: ProceduralMemory[];
  contextSummary: string;
}

const DB_NAME = 'shadowtalk-memory-graph';
const DB_VERSION = 1;

export const useMemoryGraph = () => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState({
    episodicCount: 0,
    semanticCount: 0,
    proceduralCount: 0,
  });
  const dbRef = useRef<IDBPDatabase<MemoryGraphDB> | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        dbRef.current = await openDB<MemoryGraphDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Episodic memory store
            if (!db.objectStoreNames.contains('episodic')) {
              const episodicStore = db.createObjectStore('episodic', { keyPath: 'id' });
              episodicStore.createIndex('by-user', 'userId');
              episodicStore.createIndex('by-timestamp', 'timestamp');
              episodicStore.createIndex('by-context', 'context');
            }

            // Semantic knowledge store
            if (!db.objectStoreNames.contains('semantic')) {
              const semanticStore = db.createObjectStore('semantic', { keyPath: 'id' });
              semanticStore.createIndex('by-user', 'userId');
              semanticStore.createIndex('by-type', 'type');
            }

            // Procedural workflow store
            if (!db.objectStoreNames.contains('procedural')) {
              const proceduralStore = db.createObjectStore('procedural', { keyPath: 'id' });
              proceduralStore.createIndex('by-user', 'userId');
              proceduralStore.createIndex('by-frequency', 'frequency');
            }

            // Relationships store
            if (!db.objectStoreNames.contains('relationships')) {
              const relationshipsStore = db.createObjectStore('relationships', { keyPath: 'id' });
              relationshipsStore.createIndex('by-source', 'sourceId');
              relationshipsStore.createIndex('by-target', 'targetId');
            }
          },
        });

        setIsReady(true);
        await updateStats();
      } catch (e) {
        console.error('[MemoryGraph] Init error:', e);
      }
    };

    initDB();
  }, []);

  const updateStats = useCallback(async () => {
    if (!dbRef.current || !user) return;

    const tx = dbRef.current.transaction(['episodic', 'semantic', 'procedural'], 'readonly');
    const [episodic, semantic, procedural] = await Promise.all([
      tx.objectStore('episodic').index('by-user').getAll(user.id),
      tx.objectStore('semantic').index('by-user').getAll(user.id),
      tx.objectStore('procedural').index('by-user').getAll(user.id),
    ]);

    setStats({
      episodicCount: episodic.length,
      semanticCount: semantic.length,
      proceduralCount: procedural.length,
    });
  }, [user]);

  // ==================== EPISODIC MEMORY ====================

  const recordEpisode = useCallback(async (
    episode: Omit<EpisodicMemory, 'id' | 'userId' | 'timestamp'>
  ): Promise<EpisodicMemory | null> => {
    if (!dbRef.current || !user) return null;

    const newEpisode: EpisodicMemory = {
      ...episode,
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: user.id,
      timestamp: Date.now(),
    };

    await dbRef.current.put('episodic', newEpisode);
    await updateStats();

    // Auto-extract semantic knowledge from episode
    await extractSemanticKnowledge(newEpisode);

    // Sync to cloud knowledge_entries
    try {
      await supabase.from('knowledge_entries').insert({
        user_id: user.id,
        title: `Episode: ${episode.context}`,
        content: `User: ${episode.userInput}\nAI: ${episode.aiResponse}`,
        entry_type: 'episodic',
        tags: [episode.context, episode.outcome],
      });
    } catch { /* best-effort */ }

    return newEpisode;
  }, [user, updateStats]);

  const getRecentEpisodes = useCallback(async (
    limit = 10,
    context?: string
  ): Promise<EpisodicMemory[]> => {
    if (!dbRef.current || !user) return [];

    const tx = dbRef.current.transaction('episodic', 'readonly');
    const store = tx.objectStore('episodic');

    let episodes: EpisodicMemory[];
    if (context) {
      episodes = await store.index('by-context').getAll(context);
      episodes = episodes.filter(e => e.userId === user.id);
    } else {
      episodes = await store.index('by-user').getAll(user.id);
    }

    return episodes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [user]);

  const findSimilarEpisodes = useCallback(async (
    query: string,
    limit = 5
  ): Promise<EpisodicMemory[]> => {
    if (!dbRef.current || !user) return [];

    const allEpisodes = await dbRef.current
      .transaction('episodic', 'readonly')
      .objectStore('episodic')
      .index('by-user')
      .getAll(user.id);

    // Simple keyword matching (TODO: use embeddings)
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const scored = allEpisodes.map(ep => {
      const text = `${ep.userInput} ${ep.context}`.toLowerCase();
      const score = queryWords.reduce((sum, word) =>
        sum + (text.includes(word) ? 1 : 0), 0
      ) / queryWords.length;
      return { episode: ep, score };
    });

    return scored
      .filter(s => s.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.episode);
  }, [user]);

  // ==================== SEMANTIC MEMORY ====================

  const extractSemanticKnowledge = useCallback(async (
    episode: EpisodicMemory
  ): Promise<void> => {
    if (!dbRef.current || !user) return;

    // Extract preferences from the episode
    if (episode.preferences && Object.keys(episode.preferences).length > 0) {
      for (const [key, value] of Object.entries(episode.preferences)) {
        const existingNode = await findSemanticNode('preference', key);

        if (existingNode) {
          // Update existing preference
          existingNode.properties.value = value;
          existingNode.confidence = Math.min(1, existingNode.confidence + 0.1);
          existingNode.lastUpdated = Date.now();
          existingNode.sources.push(episode.id);
          await dbRef.current.put('semantic', existingNode);
        } else {
          // Create new preference node
          const newNode: SemanticNode = {
            id: `sem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            userId: user.id,
            type: 'preference',
            label: key,
            properties: { value, context: episode.context },
            confidence: 0.5,
            lastUpdated: Date.now(),
            sources: [episode.id],
          };
          await dbRef.current.put('semantic', newNode);
        }
      }
    }

    await updateStats();
  }, [user, updateStats]);

  const findSemanticNode = useCallback(async (
    type: SemanticNode['type'],
    label: string
  ): Promise<SemanticNode | null> => {
    if (!dbRef.current || !user) return null;

    const nodes = await dbRef.current
      .transaction('semantic', 'readonly')
      .objectStore('semantic')
      .index('by-type')
      .getAll(type);

    return nodes.find(n =>
      n.userId === user.id && n.label.toLowerCase() === label.toLowerCase()
    ) || null;
  }, [user]);

  const addSemanticFact = useCallback(async (
    fact: Omit<SemanticNode, 'id' | 'userId' | 'lastUpdated'>
  ): Promise<SemanticNode | null> => {
    if (!dbRef.current || !user) return null;

    const newNode: SemanticNode = {
      ...fact,
      id: `sem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: user.id,
      lastUpdated: Date.now(),
    };

    await dbRef.current.put('semantic', newNode);
    await updateStats();

    // Sync to cloud
    try {
      await supabase.from('knowledge_entries').insert({
        user_id: user.id,
        title: newNode.label,
        content: JSON.stringify(newNode.properties),
        entry_type: 'semantic',
        tags: [newNode.type, ...newNode.sources],
      });
    } catch { /* best-effort */ }

    return newNode;
  }, [user, updateStats]);

  const getSemanticKnowledge = useCallback(async (
    type?: SemanticNode['type']
  ): Promise<SemanticNode[]> => {
    if (!dbRef.current || !user) return [];

    const store = dbRef.current.transaction('semantic', 'readonly').objectStore('semantic');

    if (type) {
      const nodes = await store.index('by-type').getAll(type);
      return nodes.filter(n => n.userId === user.id);
    }

    return store.index('by-user').getAll(user.id);
  }, [user]);

  // ==================== PROCEDURAL MEMORY ====================

  const learnWorkflow = useCallback(async (
    workflow: Omit<ProceduralMemory, 'id' | 'userId' | 'frequency' | 'lastUsed'>
  ): Promise<ProceduralMemory | null> => {
    if (!dbRef.current || !user) return null;

    const newWorkflow: ProceduralMemory = {
      ...workflow,
      id: `proc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId: user.id,
      frequency: 1,
      lastUsed: Date.now(),
    };

    await dbRef.current.put('procedural', newWorkflow);
    await updateStats();
    return newWorkflow;
  }, [user, updateStats]);

  const findMatchingWorkflows = useCallback(async (
    query: string
  ): Promise<ProceduralMemory[]> => {
    if (!dbRef.current || !user) return [];

    const workflows = await dbRef.current
      .transaction('procedural', 'readonly')
      .objectStore('procedural')
      .index('by-user')
      .getAll(user.id);

    return workflows.filter(w => {
      try {
        const pattern = new RegExp(w.triggerPattern, 'i');
        return pattern.test(query);
      } catch {
        return query.toLowerCase().includes(w.name.toLowerCase());
      }
    });
  }, [user]);

  const recordWorkflowUsage = useCallback(async (
    workflowId: string,
    success: boolean
  ): Promise<void> => {
    if (!dbRef.current) return;

    const workflow = await dbRef.current.get('procedural', workflowId);
    if (!workflow) return;

    workflow.frequency += 1;
    workflow.lastUsed = Date.now();
    workflow.successRate = (workflow.successRate * (workflow.frequency - 1) + (success ? 1 : 0)) / workflow.frequency;

    await dbRef.current.put('procedural', workflow);
  }, []);

  const getFrequentWorkflows = useCallback(async (
    limit = 5
  ): Promise<ProceduralMemory[]> => {
    if (!dbRef.current || !user) return [];

    const workflows = await dbRef.current
      .transaction('procedural', 'readonly')
      .objectStore('procedural')
      .index('by-user')
      .getAll(user.id);

    return workflows
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }, [user]);

  // ==================== CONTEXT BUILDING ====================

  const buildContext = useCallback(async (
    query: string
  ): Promise<MemoryContext> => {
    const [
      recentEpisodes,
      similarEpisodes,
      preferences,
      facts,
      workflows,
    ] = await Promise.all([
      getRecentEpisodes(5),
      findSimilarEpisodes(query, 3),
      getSemanticKnowledge('preference'),
      getSemanticKnowledge('fact'),
      findMatchingWorkflows(query),
    ]);

    // Combine and dedupe episodes
    const episodicMemories = [
      ...similarEpisodes,
      ...recentEpisodes.filter(r =>
        !similarEpisodes.find(s => s.id === r.id)
      ),
    ].slice(0, 5);

    // Build context summary
    const prefSummary = preferences.length > 0
      ? `User prefers: ${preferences.map(p => `${p.label}=${p.properties.value}`).join(', ')}`
      : '';

    const factSummary = facts.length > 0
      ? `Known facts: ${facts.map(f => f.label).join(', ')}`
      : '';

    const workflowSummary = workflows.length > 0
      ? `Suggested workflows: ${workflows.map(w => w.name).join(', ')}`
      : '';

    return {
      episodicMemories,
      relevantFacts: [...preferences, ...facts],
      suggestedWorkflows: workflows,
      contextSummary: [prefSummary, factSummary, workflowSummary].filter(Boolean).join('\n'),
    };
  }, [getRecentEpisodes, findSimilarEpisodes, getSemanticKnowledge, findMatchingWorkflows]);

  // ==================== CLEANUP ====================

  const clearAllMemory = useCallback(async (): Promise<void> => {
    if (!dbRef.current || !user) return;

    const tx = dbRef.current.transaction(['episodic', 'semantic', 'procedural', 'relationships'], 'readwrite');

    // Delete only user's data
    const stores = ['episodic', 'semantic', 'procedural'] as const;
    for (const storeName of stores) {
      const store = tx.objectStore(storeName);
      const keys = await store.index('by-user').getAllKeys(user.id);
      for (const key of keys) {
        await store.delete(key);
      }
    }

    await tx.done;
    await updateStats();
  }, [user, updateStats]);

  return {
    isReady,
    stats,
    // Episodic
    recordEpisode,
    getRecentEpisodes,
    findSimilarEpisodes,
    // Semantic
    addSemanticFact,
    getSemanticKnowledge,
    findSemanticNode,
    // Procedural
    learnWorkflow,
    findMatchingWorkflows,
    recordWorkflowUsage,
    getFrequentWorkflows,
    // Context
    buildContext,
    // Cleanup
    clearAllMemory,
  };
};
