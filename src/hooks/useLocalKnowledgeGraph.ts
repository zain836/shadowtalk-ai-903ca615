import { useState, useCallback, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface KnowledgeNode {
  id: string;
  label: string;
  type: 'entity' | 'concept' | 'topic' | 'memory';
  content: string;
  frequency: number;
  lastMentioned: Date;
  metadata?: Record<string, unknown>;
}

interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

interface KnowledgeGraphState {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  isLoading: boolean;
  error: string | null;
}

interface GraphInsight {
  type: 'frequent_topic' | 'connection' | 'trend' | 'recommendation';
  title: string;
  description: string;
  relatedNodes: string[];
}

const DB_NAME = 'shadowtalk-knowledge-graph';
const NODES_STORE = 'nodes';
const EDGES_STORE = 'edges';

// Entity extraction patterns
const ENTITY_PATTERNS = {
  company: /\b([A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Co)\b)/g,
  product: /\b((?:the )?[A-Z][a-z]+ (?:Platform|App|Software|System|Tool|Service))\b/g,
  technology: /\b(AI|ML|API|SaaS|Cloud|React|Python|JavaScript|TypeScript|Node\.js|AWS|Azure|GCP)\b/gi,
  industry: /\b(fintech|healthtech|edtech|e-commerce|B2B|B2C|marketplace|subscription)\b/gi,
  metric: /\b(revenue|profit|growth|CAC|LTV|MRR|ARR|churn|conversion)\b/gi,
};

export const useLocalKnowledgeGraph = () => {
  const [state, setState] = useState<KnowledgeGraphState>({
    nodes: [],
    edges: [],
    isLoading: false,
    error: null,
  });

  const getDB = useCallback(async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(NODES_STORE)) {
          db.createObjectStore(NODES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(EDGES_STORE)) {
          db.createObjectStore(EDGES_STORE, { keyPath: ['source', 'target'] });
        }
      },
    });
  }, []);

  // Load graph on mount
  useEffect(() => {
    const loadGraph = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const db = await getDB();
        
        const nodes = await db.getAll(NODES_STORE) as KnowledgeNode[];
        const edges = await db.getAll(EDGES_STORE) as KnowledgeEdge[];
        
        setState({
          nodes,
          edges,
          isLoading: false,
          error: null,
        });
      } catch (e) {
        console.error('[KnowledgeGraph] Failed to load:', e);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: e instanceof Error ? e.message : 'Failed to load graph',
        }));
      }
    };

    loadGraph();
  }, [getDB]);

  // Extract entities from text
  const extractEntities = useCallback((text: string): Array<{ label: string; type: string }> => {
    const entities: Array<{ label: string; type: string }> = [];
    const seen = new Set<string>();

    Object.entries(ENTITY_PATTERNS).forEach(([type, pattern]) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const label = match[1] || match[0];
        const normalized = label.toLowerCase().trim();
        
        if (!seen.has(normalized) && label.length > 2) {
          seen.add(normalized);
          entities.push({ label, type });
        }
      }
    });

    return entities;
  }, []);

  // Add or update a node
  const addNode = useCallback(async (
    label: string,
    type: KnowledgeNode['type'],
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<KnowledgeNode> => {
    const db = await getDB();
    const id = `${type}-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    const existing = await db.get(NODES_STORE, id) as KnowledgeNode | undefined;
    
    const node: KnowledgeNode = {
      id,
      label,
      type,
      content: existing?.content ? `${existing.content}\n\n${content}` : content,
      frequency: (existing?.frequency || 0) + 1,
      lastMentioned: new Date(),
      metadata: { ...existing?.metadata, ...metadata },
    };

    await db.put(NODES_STORE, node);
    
    setState(prev => ({
      ...prev,
      nodes: [...prev.nodes.filter(n => n.id !== id), node],
    }));

    return node;
  }, [getDB]);

  // Add an edge between nodes
  const addEdge = useCallback(async (
    sourceId: string,
    targetId: string,
    relationship: string
  ): Promise<KnowledgeEdge> => {
    const db = await getDB();
    
    const existingEdge = await db.get(EDGES_STORE, [sourceId, targetId]) as KnowledgeEdge | undefined;
    
    const edge: KnowledgeEdge = {
      source: sourceId,
      target: targetId,
      relationship,
      weight: (existingEdge?.weight || 0) + 1,
    };

    await db.put(EDGES_STORE, edge);
    
    setState(prev => ({
      ...prev,
      edges: [
        ...prev.edges.filter(e => !(e.source === sourceId && e.target === targetId)),
        edge,
      ],
    }));

    return edge;
  }, [getDB]);

  // Process a conversation and extract knowledge
  const processConversation = useCallback(async (
    messages: Array<{ role: string; content: string }>
  ): Promise<{ nodesAdded: number; edgesAdded: number }> => {
    let nodesAdded = 0;
    let edgesAdded = 0;

    const allEntities: Array<{ label: string; type: string; nodeId?: string }> = [];

    for (const message of messages) {
      const entities = extractEntities(message.content);
      
      for (const entity of entities) {
        const node = await addNode(
          entity.label,
          entity.type as KnowledgeNode['type'],
          message.content.slice(0, 500),
        );
        
        allEntities.push({ ...entity, nodeId: node.id });
        nodesAdded++;
      }
    }

    // Create edges between entities mentioned together
    for (let i = 0; i < allEntities.length; i++) {
      for (let j = i + 1; j < allEntities.length; j++) {
        if (allEntities[i].nodeId && allEntities[j].nodeId) {
          await addEdge(
            allEntities[i].nodeId!,
            allEntities[j].nodeId!,
            'mentioned_with'
          );
          edgesAdded++;
        }
      }
    }

    return { nodesAdded, edgesAdded };
  }, [extractEntities, addNode, addEdge]);

  // Search the knowledge graph
  const searchGraph = useCallback((query: string): KnowledgeNode[] => {
    const queryLower = query.toLowerCase();
    
    return state.nodes
      .filter(node => 
        node.label.toLowerCase().includes(queryLower) ||
        node.content.toLowerCase().includes(queryLower)
      )
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }, [state.nodes]);

  // Get related nodes
  const getRelatedNodes = useCallback((nodeId: string): KnowledgeNode[] => {
    const relatedIds = new Set<string>();
    
    state.edges.forEach(edge => {
      if (edge.source === nodeId) relatedIds.add(edge.target);
      if (edge.target === nodeId) relatedIds.add(edge.source);
    });

    return state.nodes
      .filter(node => relatedIds.has(node.id))
      .sort((a, b) => b.frequency - a.frequency);
  }, [state.nodes, state.edges]);

  // Generate insights from the graph
  const generateInsights = useCallback((): GraphInsight[] => {
    const insights: GraphInsight[] = [];

    // Most frequent topics
    const frequentNodes = [...state.nodes]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    if (frequentNodes.length > 0) {
      insights.push({
        type: 'frequent_topic',
        title: 'Your Top Topics',
        description: `You frequently discuss: ${frequentNodes.map(n => n.label).join(', ')}`,
        relatedNodes: frequentNodes.map(n => n.id),
      });
    }

    // Strong connections
    const strongEdges = [...state.edges]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    strongEdges.forEach(edge => {
      const sourceNode = state.nodes.find(n => n.id === edge.source);
      const targetNode = state.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        insights.push({
          type: 'connection',
          title: `Strong Connection`,
          description: `"${sourceNode.label}" and "${targetNode.label}" are frequently mentioned together (${edge.weight} times)`,
          relatedNodes: [edge.source, edge.target],
        });
      }
    });

    // Recent topics
    const recentNodes = [...state.nodes]
      .sort((a, b) => new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime())
      .slice(0, 3);

    if (recentNodes.length > 0 && recentNodes[0].lastMentioned) {
      insights.push({
        type: 'trend',
        title: 'Recent Focus',
        description: `Your recent discussions have focused on: ${recentNodes.map(n => n.label).join(', ')}`,
        relatedNodes: recentNodes.map(n => n.id),
      });
    }

    return insights;
  }, [state.nodes, state.edges]);

  // Get graph statistics
  const getStatistics = useCallback(() => ({
    totalNodes: state.nodes.length,
    totalEdges: state.edges.length,
    nodesByType: state.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageFrequency: state.nodes.length > 0
      ? state.nodes.reduce((sum, n) => sum + n.frequency, 0) / state.nodes.length
      : 0,
  }), [state.nodes, state.edges]);

  // Clear the graph
  const clearGraph = useCallback(async () => {
    const db = await getDB();
    await db.clear(NODES_STORE);
    await db.clear(EDGES_STORE);
    setState({
      nodes: [],
      edges: [],
      isLoading: false,
      error: null,
    });
  }, [getDB]);

  // Delete a node and its edges
  const deleteNode = useCallback(async (nodeId: string) => {
    const db = await getDB();
    await db.delete(NODES_STORE, nodeId);
    
    // Delete related edges
    const tx = db.transaction(EDGES_STORE, 'readwrite');
    const store = tx.objectStore(EDGES_STORE);
    const allEdges = await store.getAll() as KnowledgeEdge[];
    
    for (const edge of allEdges) {
      if (edge.source === nodeId || edge.target === nodeId) {
        await store.delete([edge.source, edge.target]);
      }
    }
    
    await tx.done;

    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    }));
  }, [getDB]);

  return {
    ...state,
    addNode,
    addEdge,
    processConversation,
    searchGraph,
    getRelatedNodes,
    generateInsights,
    getStatistics,
    clearGraph,
    deleteNode,
  };
};
