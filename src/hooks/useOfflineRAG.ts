import { useState, useCallback, useRef, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface EmbeddingEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface SearchResult {
  id: string;
  text: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

interface OfflineRAGState {
  isLoading: boolean;
  isEmbedding: boolean;
  isSearching: boolean;
  isSupported: boolean;
  loadProgress: number;
  documentCount: number;
  error: string | null;
}

const DB_NAME = 'shadowtalk-rag';
const STORE_NAME = 'embeddings';

export const useOfflineRAG = () => {
  const [state, setState] = useState<OfflineRAGState>({
    isLoading: false,
    isEmbedding: false,
    isSearching: false,
    isSupported: typeof navigator !== 'undefined' && 'gpu' in navigator,
    loadProgress: 0,
    documentCount: 0,
    error: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipelineRef = useRef<any>(null);
  const modelLoadedRef = useRef(false);

  const getDB = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  };

  // Load document count on mount
  useEffect(() => {
    const loadCount = async () => {
      try {
        const db = await getDB();
        const count = await db.count(STORE_NAME);
        setState(prev => ({ ...prev, documentCount: count }));
      } catch (err) {
        console.error('Failed to load document count:', err);
      }
    };
    loadCount();
  }, []);

  const loadModel = useCallback(async () => {
    if (modelLoadedRef.current || pipelineRef.current) return true;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!('gpu' in navigator)) {
        throw new Error('WebGPU not supported for embeddings');
      }

      const { pipeline } = await import('@huggingface/transformers');
      
      pipelineRef.current = await pipeline(
        'feature-extraction',
        'mixedbread-ai/mxbai-embed-xsmall-v1',
        { device: 'webgpu' }
      );

      modelLoadedRef.current = true;
      setState(prev => ({ ...prev, isLoading: false, loadProgress: 100 }));
      return true;
    } catch (err) {
      console.error('Embedding model failed to load:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSupported: false,
        error: err instanceof Error ? err.message : 'Failed to load model',
      }));
      return false;
    }
  }, []);

  // Compute cosine similarity
  const cosineSimilarity = (a: number[], b: number[]): number => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const embed = useCallback(async (text: string): Promise<number[]> => {
    if (!pipelineRef.current) {
      const loaded = await loadModel();
      if (!loaded || !pipelineRef.current) {
        throw new Error('Embedding model not available');
      }
    }

    const result = await pipelineRef.current(text, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    // Convert to array
    return Array.from(result.data as Float32Array);
  }, [loadModel]);

  const addDocument = useCallback(async (
    text: string,
    id?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> => {
    setState(prev => ({ ...prev, isEmbedding: true, error: null }));

    try {
      const embedding = await embed(text);
      const documentId = id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const entry: EmbeddingEntry = {
        id: documentId,
        text,
        embedding,
        metadata,
        createdAt: new Date(),
      };

      const db = await getDB();
      await db.put(STORE_NAME, entry);

      setState(prev => ({
        ...prev,
        isEmbedding: false,
        documentCount: prev.documentCount + 1,
      }));

      return documentId;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add document';
      setState(prev => ({ ...prev, isEmbedding: false, error }));
      throw new Error(error);
    }
  }, [embed]);

  const addDocuments = useCallback(async (
    documents: Array<{ text: string; id?: string; metadata?: Record<string, unknown> }>
  ): Promise<string[]> => {
    setState(prev => ({ ...prev, isEmbedding: true, error: null }));

    try {
      const ids: string[] = [];
      
      for (const doc of documents) {
        const embedding = await embed(doc.text);
        const documentId = doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const entry: EmbeddingEntry = {
          id: documentId,
          text: doc.text,
          embedding,
          metadata: doc.metadata,
          createdAt: new Date(),
        };

        const db = await getDB();
        await db.put(STORE_NAME, entry);
        ids.push(documentId);
      }

      setState(prev => ({
        ...prev,
        isEmbedding: false,
        documentCount: prev.documentCount + ids.length,
      }));

      return ids;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add documents';
      setState(prev => ({ ...prev, isEmbedding: false, error }));
      throw new Error(error);
    }
  }, [embed]);

  const search = useCallback(async (
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.3
  ): Promise<SearchResult[]> => {
    setState(prev => ({ ...prev, isSearching: true, error: null }));

    try {
      const queryEmbedding = await embed(query);
      
      const db = await getDB();
      const allDocs = await db.getAll(STORE_NAME) as EmbeddingEntry[];

      const results: SearchResult[] = allDocs
        .map(doc => ({
          id: doc.id,
          text: doc.text,
          similarity: cosineSimilarity(queryEmbedding, doc.embedding),
          metadata: doc.metadata,
        }))
        .filter(r => r.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      setState(prev => ({ ...prev, isSearching: false }));
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Search failed';
      setState(prev => ({ ...prev, isSearching: false, error }));
      return [];
    }
  }, [embed]);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
    setState(prev => ({ ...prev, documentCount: Math.max(0, prev.documentCount - 1) }));
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    const db = await getDB();
    await db.clear(STORE_NAME);
    setState(prev => ({ ...prev, documentCount: 0 }));
  }, []);

  const unloadModel = useCallback(() => {
    pipelineRef.current = null;
    modelLoadedRef.current = false;
    setState(prev => ({ ...prev, loadProgress: 0 }));
  }, []);

  return {
    ...state,
    loadModel,
    addDocument,
    addDocuments,
    search,
    deleteDocument,
    clearAll,
    unloadModel,
    isModelLoaded: modelLoadedRef.current,
  };
};
