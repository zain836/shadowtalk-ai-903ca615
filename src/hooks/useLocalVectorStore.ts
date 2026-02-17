import { useState, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';

/**
 * Stealth Vault RAG — Local vector store using IndexedDB (OPFS-backed)
 * for fully offline semantic search and retrieval-augmented generation.
 * 
 * Uses simple TF-IDF-style embeddings for zero-dependency local operation.
 */

interface VectorEntry {
  id: string;
  text: string;
  vector: number[];
  metadata: Record<string, string>;
  createdAt: string;
}

interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, string>;
}

const DB_NAME = 'stealth-vault-rag';
const STORE_NAME = 'vectors';
const VOCAB_STORE = 'vocabulary';

// Simple tokenizer
const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

// Cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

export const useLocalVectorStore = () => {
  const [isReady, setIsReady] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const vocabularyRef = useRef<Map<string, number>>(new Map());
  const vocabSizeRef = useRef(0);

  const getDB = useCallback(async (): Promise<IDBPDatabase> => {
    const db = await openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(VOCAB_STORE)) {
          db.createObjectStore(VOCAB_STORE, { keyPath: 'term' });
        }
      },
    });
    setIsReady(true);
    return db;
  }, []);

  // Build vocabulary from all stored texts
  const buildVocabulary = useCallback(async () => {
    const db = await getDB();
    const entries = await db.getAll(STORE_NAME) as VectorEntry[];
    const vocab = new Map<string, number>();
    let idx = 0;

    for (const entry of entries) {
      const tokens = tokenize(entry.text);
      for (const token of tokens) {
        if (!vocab.has(token)) {
          vocab.set(token, idx++);
        }
      }
    }

    vocabularyRef.current = vocab;
    vocabSizeRef.current = idx;
    setEntryCount(entries.length);

    return vocab;
  }, [getDB]);

  // Create a TF vector for text using current vocabulary
  const textToVector = useCallback((text: string): number[] => {
    const vocab = vocabularyRef.current;
    const size = Math.max(vocabSizeRef.current, 1);
    const vector = new Array(size).fill(0);
    const tokens = tokenize(text);
    const tokenCounts = new Map<string, number>();

    for (const token of tokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    }

    for (const [token, count] of tokenCounts) {
      const idx = vocab.get(token);
      if (idx !== undefined) {
        vector[idx] = count / tokens.length; // TF normalization
      }
    }

    return vector;
  }, []);

  // Add a document to the vector store
  const addDocument = useCallback(async (
    text: string,
    metadata: Record<string, string> = {}
  ): Promise<string> => {
    const db = await getDB();

    // Expand vocabulary with new terms
    const tokens = tokenize(text);
    const vocab = vocabularyRef.current;
    let changed = false;

    for (const token of tokens) {
      if (!vocab.has(token)) {
        vocab.set(token, vocabSizeRef.current++);
        changed = true;
      }
    }

    if (changed) {
      vocabularyRef.current = vocab;
    }

    const vector = textToVector(text);
    const id = `vec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const entry: VectorEntry = {
      id,
      text,
      vector,
      metadata,
      createdAt: new Date().toISOString(),
    };

    await db.put(STORE_NAME, entry);
    setEntryCount(prev => prev + 1);
    return id;
  }, [getDB, textToVector]);

  // Semantic search — returns top-k most similar documents
  const search = useCallback(async (
    query: string,
    topK: number = 5,
    minScore: number = 0.1
  ): Promise<SearchResult[]> => {
    const db = await getDB();

    // Ensure vocabulary is loaded
    if (vocabularyRef.current.size === 0) {
      await buildVocabulary();
    }

    const queryVector = textToVector(query);
    const entries = await db.getAll(STORE_NAME) as VectorEntry[];

    const results: SearchResult[] = [];

    for (const entry of entries) {
      // Re-compute vector with current vocab size if needed
      let entryVector = entry.vector;
      if (entryVector.length !== queryVector.length) {
        entryVector = textToVector(entry.text);
      }

      const score = cosineSimilarity(queryVector, entryVector);
      if (score >= minScore) {
        results.push({
          id: entry.id,
          text: entry.text,
          score,
          metadata: entry.metadata,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }, [getDB, buildVocabulary, textToVector]);

  // Delete a document
  const removeDocument = useCallback(async (id: string) => {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
    setEntryCount(prev => Math.max(0, prev - 1));
  }, [getDB]);

  // Clear entire store
  const clearStore = useCallback(async () => {
    const db = await getDB();
    await db.clear(STORE_NAME);
    vocabularyRef.current = new Map();
    vocabSizeRef.current = 0;
    setEntryCount(0);
  }, [getDB]);

  // Get all documents (for backup/export)
  const getAllDocuments = useCallback(async (): Promise<VectorEntry[]> => {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  }, [getDB]);

  // Initialize — load vocabulary
  const initialize = useCallback(async () => {
    await buildVocabulary();
  }, [buildVocabulary]);

  return {
    isReady,
    entryCount,
    initialize,
    addDocument,
    search,
    removeDocument,
    clearStore,
    getAllDocuments,
  };
};
