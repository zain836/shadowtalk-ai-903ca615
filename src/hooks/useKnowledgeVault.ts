import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VaultDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  chunks: string[];
  embeddings?: number[][];
  addedAt: Date;
}

interface KnowledgeVaultState {
  documents: VaultDocument[];
  isProcessing: boolean;
  progress: number;
  stage: string;
  totalChunks: number;
  error: string | null;
}

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const DB_NAME = 'shadowtalk-knowledge-vault';
const STORE_NAME = 'documents';

const chunkText = (text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] => {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, size)];
};

const searchChunks = (query: string, chunks: string[]): string[] => {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const scored = chunks.map(chunk => {
    const lowerChunk = chunk.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (lowerChunk.includes(word)) score += 1;
      if (lowerChunk.includes(query.toLowerCase())) score += 5;
    }
    return { chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.chunk);
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const useKnowledgeVault = () => {
  const [state, setState] = useState<KnowledgeVaultState>({
    documents: [],
    isProcessing: false,
    progress: 0,
    stage: '',
    totalChunks: 0,
    error: null,
  });

  const dbRef = useRef<IDBDatabase | null>(null);

  const initialize = useCallback(async () => {
    try {
      const db = await openDB();
      dbRef.current = db;

      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs = request.result.map((d: any) => ({
          ...d,
          addedAt: new Date(d.addedAt),
        }));
        const totalChunks = docs.reduce((sum: number, d: VaultDocument) => sum + d.chunks.length, 0);
        setState(prev => ({ ...prev, documents: docs, totalChunks }));
      };
    } catch (e) {
      console.error('[KnowledgeVault] Init failed:', e);
    }
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    setState(prev => ({ ...prev, isProcessing: true, progress: 0, stage: 'Reading files...', error: null }));

    try {
      const newDocs: VaultDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setState(prev => ({
          ...prev,
          progress: Math.round((i / files.length) * 80),
          stage: `Processing ${file.name}...`,
        }));

        let content = '';
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
          content = await file.text();
        } else {
          content = `[File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes]`;
        }

        const chunks = chunkText(content);

        const doc: VaultDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: content.slice(0, 50000),
          chunks,
          addedAt: new Date(),
        };

        newDocs.push(doc);
      }

      // Save to IndexedDB
      setState(prev => ({ ...prev, progress: 90, stage: 'Saving to vault...' }));

      const db = dbRef.current || await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const doc of newDocs) {
        store.put(doc);
      }

      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });

      // Sync metadata to knowledge_entries table for cloud persistence
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const doc of newDocs) {
            await supabase.from('knowledge_entries').insert({
              user_id: user.id,
              title: doc.name,
              content: doc.content.slice(0, 10000),
              entry_type: 'document',
              tags: [doc.type, 'vault-upload'],
            });
          }
        }
      } catch {
        // Cloud sync is best-effort
      }

      setState(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocs],
        totalChunks: prev.totalChunks + newDocs.reduce((sum, d) => sum + d.chunks.length, 0),
        isProcessing: false,
        progress: 100,
        stage: 'Complete!',
      }));

      return newDocs;
    } catch (e: any) {
      console.error('[KnowledgeVault] Add files failed:', e);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: e.message || 'Failed to process files',
      }));
      return [];
    }
  }, []);

  const search = useCallback((query: string): string[] => {
    const allChunks = state.documents.flatMap(d => d.chunks);
    return searchChunks(query, allChunks);
  }, [state.documents]);

  const getContext = useCallback((query: string, maxTokens = 2000): string => {
    const results = search(query);
    let context = '';
    for (const chunk of results) {
      if ((context + chunk).length > maxTokens) break;
      context += chunk + '\n\n';
    }
    return context.trim();
  }, [search]);

  const removeDocument = useCallback(async (docId: string) => {
    try {
      const db = dbRef.current || await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(docId);

      setState(prev => {
        const doc = prev.documents.find(d => d.id === docId);
        return {
          ...prev,
          documents: prev.documents.filter(d => d.id !== docId),
          totalChunks: prev.totalChunks - (doc?.chunks.length || 0),
        };
      });
    } catch (e) {
      console.error('[KnowledgeVault] Remove failed:', e);
    }
  }, []);

  const clearVault = useCallback(async () => {
    try {
      const db = dbRef.current || await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();

      setState(prev => ({ ...prev, documents: [], totalChunks: 0 }));
    } catch (e) {
      console.error('[KnowledgeVault] Clear failed:', e);
    }
  }, []);

  return {
    ...state,
    initialize,
    addFiles,
    search,
    getContext,
    removeDocument,
    clearVault,
  };
};
