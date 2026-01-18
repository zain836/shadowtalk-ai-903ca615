import { useState, useCallback, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  size: string; // e.g., "360M", "1.5B"
  sizeBytes: number;
  category: 'chat' | 'embedding' | 'image' | 'translation';
  isDownloaded: boolean;
  downloadProgress: number;
  isActive: boolean;
  capabilities: string[];
  memoryRequired: string;
}

interface ModelManagerState {
  models: AIModel[];
  activeModel: AIModel | null;
  isDownloading: boolean;
  downloadProgress: { modelId: string; progress: number } | null;
  totalStorageUsed: number;
  error: string | null;
}

const DB_NAME = 'shadowtalk-models';
const MODELS_STORE = 'models';

// Available models catalog
const MODEL_CATALOG: Omit<AIModel, 'isDownloaded' | 'downloadProgress' | 'isActive'>[] = [
  {
    id: 'smollm2-135m',
    name: 'SmolLM2 135M',
    description: 'Ultra-lightweight model for basic tasks. Fast but limited reasoning.',
    size: '135M',
    sizeBytes: 270_000_000,
    category: 'chat',
    capabilities: ['Basic chat', 'Simple Q&A', 'Quick responses'],
    memoryRequired: '512MB',
  },
  {
    id: 'smollm2-360m',
    name: 'SmolLM2 360M',
    description: 'Compact model with good balance of speed and capability.',
    size: '360M',
    sizeBytes: 720_000_000,
    category: 'chat',
    capabilities: ['General chat', 'Summarization', 'Code assistance'],
    memoryRequired: '1GB',
  },
  {
    id: 'smollm2-1.7b',
    name: 'SmolLM2 1.7B',
    description: 'Larger model with improved reasoning and longer context.',
    size: '1.7B',
    sizeBytes: 3_400_000_000,
    category: 'chat',
    capabilities: ['Advanced chat', 'Complex reasoning', 'Longer context'],
    memoryRequired: '4GB',
  },
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 0.5B',
    description: 'Multilingual model with good instruction following.',
    size: '0.5B',
    sizeBytes: 1_000_000_000,
    category: 'chat',
    capabilities: ['Multilingual', 'Instructions', 'Reasoning'],
    memoryRequired: '2GB',
  },
  {
    id: 'qwen2.5-1.5b',
    name: 'Qwen 2.5 1.5B',
    description: 'Powerful multilingual model for complex tasks.',
    size: '1.5B',
    sizeBytes: 3_000_000_000,
    category: 'chat',
    capabilities: ['Advanced multilingual', 'Complex reasoning', 'Code generation'],
    memoryRequired: '4GB',
  },
  {
    id: 'mxbai-embed-xsmall',
    name: 'MxBai Embed XSmall',
    description: 'Compact embedding model for semantic search.',
    size: '22M',
    sizeBytes: 44_000_000,
    category: 'embedding',
    capabilities: ['Text embeddings', 'Semantic search', 'RAG'],
    memoryRequired: '256MB',
  },
  {
    id: 'mobilenetv4-small',
    name: 'MobileNetV4 Small',
    description: 'Fast image classification model.',
    size: '3M',
    sizeBytes: 6_000_000,
    category: 'image',
    capabilities: ['Image classification', 'Object recognition'],
    memoryRequired: '128MB',
  },
];

export const useModelManager = () => {
  const [state, setState] = useState<ModelManagerState>({
    models: [],
    activeModel: null,
    isDownloading: false,
    downloadProgress: null,
    totalStorageUsed: 0,
    error: null,
  });

  const getDB = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MODELS_STORE)) {
          db.createObjectStore(MODELS_STORE, { keyPath: 'id' });
        }
      },
    });
  };

  // Initialize models list
  useEffect(() => {
    const initModels = async () => {
      try {
        const db = await getDB();
        const savedModels = await db.getAll(MODELS_STORE);
        const savedModelMap = new Map(savedModels.map(m => [m.id, m]));

        const models: AIModel[] = MODEL_CATALOG.map(model => {
          const saved = savedModelMap.get(model.id);
          return {
            ...model,
            isDownloaded: saved?.isDownloaded || false,
            downloadProgress: saved?.downloadProgress || 0,
            isActive: saved?.isActive || false,
          };
        });

        const activeModel = models.find(m => m.isActive) || null;
        const totalStorageUsed = models
          .filter(m => m.isDownloaded)
          .reduce((sum, m) => sum + m.sizeBytes, 0);

        setState(prev => ({
          ...prev,
          models,
          activeModel,
          totalStorageUsed,
        }));
      } catch (err) {
        console.error('Failed to initialize models:', err);
      }
    };

    initModels();
  }, []);

  const downloadModel = useCallback(async (modelId: string): Promise<boolean> => {
    const model = state.models.find(m => m.id === modelId);
    if (!model || model.isDownloaded) return false;

    setState(prev => ({
      ...prev,
      isDownloading: true,
      downloadProgress: { modelId, progress: 0 },
      error: null,
    }));

    try {
      // Simulate download progress (in real implementation, this would track actual model download)
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setState(prev => ({
          ...prev,
          downloadProgress: { modelId, progress },
        }));
      }

      // Mark as downloaded
      const db = await getDB();
      const updatedModel: AIModel = {
        ...model,
        isDownloaded: true,
        downloadProgress: 100,
      };
      await db.put(MODELS_STORE, updatedModel);

      setState(prev => ({
        ...prev,
        isDownloading: false,
        downloadProgress: null,
        models: prev.models.map(m => m.id === modelId ? updatedModel : m),
        totalStorageUsed: prev.totalStorageUsed + model.sizeBytes,
      }));

      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Download failed';
      setState(prev => ({
        ...prev,
        isDownloading: false,
        downloadProgress: null,
        error,
      }));
      return false;
    }
  }, [state.models]);

  const deleteModel = useCallback(async (modelId: string): Promise<boolean> => {
    const model = state.models.find(m => m.id === modelId);
    if (!model || !model.isDownloaded) return false;

    try {
      const db = await getDB();
      const updatedModel: AIModel = {
        ...model,
        isDownloaded: false,
        downloadProgress: 0,
        isActive: false,
      };
      await db.put(MODELS_STORE, updatedModel);

      setState(prev => ({
        ...prev,
        models: prev.models.map(m => m.id === modelId ? updatedModel : m),
        activeModel: prev.activeModel?.id === modelId ? null : prev.activeModel,
        totalStorageUsed: Math.max(0, prev.totalStorageUsed - model.sizeBytes),
      }));

      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Delete failed';
      setState(prev => ({ ...prev, error }));
      return false;
    }
  }, [state.models]);

  const activateModel = useCallback(async (modelId: string): Promise<boolean> => {
    const model = state.models.find(m => m.id === modelId);
    if (!model || !model.isDownloaded) return false;

    try {
      const db = await getDB();

      // Deactivate all models of the same category
      for (const m of state.models) {
        if (m.category === model.category && m.isActive) {
          await db.put(MODELS_STORE, { ...m, isActive: false });
        }
      }

      // Activate the selected model
      const updatedModel: AIModel = { ...model, isActive: true };
      await db.put(MODELS_STORE, updatedModel);

      setState(prev => ({
        ...prev,
        models: prev.models.map(m => {
          if (m.id === modelId) return updatedModel;
          if (m.category === model.category) return { ...m, isActive: false };
          return m;
        }),
        activeModel: model.category === 'chat' ? updatedModel : prev.activeModel,
      }));

      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Activation failed';
      setState(prev => ({ ...prev, error }));
      return false;
    }
  }, [state.models]);

  const getModelsByCategory = useCallback((category: AIModel['category']): AIModel[] => {
    return state.models.filter(m => m.category === category);
  }, [state.models]);

  const getDownloadedModels = useCallback((): AIModel[] => {
    return state.models.filter(m => m.isDownloaded);
  }, [state.models]);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const checkWebGPUSupport = useCallback(async (): Promise<boolean> => {
    if (!('gpu' in navigator)) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = await (navigator as any).gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    downloadModel,
    deleteModel,
    activateModel,
    getModelsByCategory,
    getDownloadedModels,
    formatBytes,
    checkWebGPUSupport,
  };
};
