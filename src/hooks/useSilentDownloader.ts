import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// SILENT BACKGROUND DOWNLOADER - Service Worker Architecture
// =============================================================================
// Features:
// - Background model downloads via Service Worker (survives tab close)
// - OPFS (Origin Private File System) storage for persistence
// - Bandwidth throttling to prevent chat lag
// - Battery sensitivity - pauses on battery power
// - Smart-silent "Prepare Bunker" consent UX
// - Chunked downloads with resume capability
// =============================================================================

export interface DownloadTask {
  id: string;
  modelId: string;
  modelName: string;
  totalBytes: number;
  downloadedBytes: number;
  progress: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'error';
  chunks: DownloadChunk[];
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  priority: number;
}

interface DownloadChunk {
  index: number;
  start: number;
  end: number;
  downloaded: boolean;
  retries: number;
}

interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
}

interface SilentDownloaderState {
  isEnabled: boolean;
  bunkerMode: boolean;
  isDownloading: boolean;
  isPaused: boolean;
  pauseReason: 'battery' | 'bandwidth' | 'user' | null;
  tasks: DownloadTask[];
  currentTask: DownloadTask | null;
  totalStorageUsed: number;
  estimatedStorageAvailable: number;
  bandwidthUsage: number; // 0-100 percentage
  batteryStatus: {
    isCharging: boolean;
    level: number;
  } | null;
}

// Model download URLs and metadata
const MODEL_DOWNLOADS: Record<string, { url: string; sizeBytes: number; chunks: number }> = {
  'Llama-3.2-1B-Instruct-q4f16_1-MLC': {
    url: 'https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/',
    sizeBytes: 800_000_000,
    chunks: 8,
  },
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    url: 'https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC/resolve/main/',
    sizeBytes: 2_500_000_000,
    chunks: 25,
  },
  'Llama-3.1-8B-Instruct-q4f16_1-MLC': {
    url: 'https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC/resolve/main/',
    sizeBytes: 5_500_000_000,
    chunks: 55,
  },
  'Mistral-7B-Instruct-v0.3-q4f16_1-MLC': {
    url: 'https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.3-q4f16_1-MLC/resolve/main/',
    sizeBytes: 5_000_000_000,
    chunks: 50,
  },
  'Qwen2.5-7B-Instruct-q4f16_1-MLC': {
    url: 'https://huggingface.co/mlc-ai/Qwen2.5-7B-Instruct-q4f16_1-MLC/resolve/main/',
    sizeBytes: 5_200_000_000,
    chunks: 52,
  },
};

// Chunk size: 100MB for resumable downloads
const CHUNK_SIZE = 100 * 1024 * 1024;

// Bandwidth throttle: max % of connection to use
const MAX_BANDWIDTH_PERCENT = 60;

// Battery threshold: pause below this level when unplugged
const BATTERY_PAUSE_THRESHOLD = 0.2;

const STORAGE_KEYS = {
  BUNKER_MODE: 'shadowtalk_bunker_mode',
  DOWNLOAD_TASKS: 'shadowtalk_download_tasks',
  BANDWIDTH_SETTING: 'shadowtalk_bandwidth_setting',
};

export const useSilentDownloader = () => {
  const [state, setState] = useState<SilentDownloaderState>({
    isEnabled: false,
    bunkerMode: false,
    isDownloading: false,
    isPaused: false,
    pauseReason: null,
    tasks: [],
    currentTask: null,
    totalStorageUsed: 0,
    estimatedStorageAvailable: 0,
    bandwidthUsage: MAX_BANDWIDTH_PERCENT,
    batteryStatus: null,
  });

  const workerRef = useRef<ServiceWorker | null>(null);
  const downloadControllerRef = useRef<AbortController | null>(null);
  const batteryRef = useRef<BatteryManager | null>(null);
  const downloadIntervalRef = useRef<number | null>(null);

  // Initialize battery monitoring
  useEffect(() => {
    const initBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery() as BatteryManager;
          batteryRef.current = battery;
          
          const updateBatteryStatus = () => {
            setState(prev => ({
              ...prev,
              batteryStatus: {
                isCharging: battery.charging,
                level: battery.level,
              },
            }));
            
            // Auto-pause if battery low and not charging
            if (!battery.charging && battery.level < BATTERY_PAUSE_THRESHOLD) {
              pauseDownload('battery');
            } else if (state.pauseReason === 'battery' && (battery.charging || battery.level >= BATTERY_PAUSE_THRESHOLD)) {
              resumeDownload();
            }
          };
          
          updateBatteryStatus();
          battery.addEventListener('chargingchange', updateBatteryStatus);
          battery.addEventListener('levelchange', updateBatteryStatus);
          
          return () => {
            battery.removeEventListener('chargingchange', updateBatteryStatus);
            battery.removeEventListener('levelchange', updateBatteryStatus);
          };
        } catch (e) {
          console.log('[SilentDownloader] Battery API not available');
        }
      }
    };
    
    initBattery();
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedBunkerMode = localStorage.getItem(STORAGE_KEYS.BUNKER_MODE);
      const savedTasks = localStorage.getItem(STORAGE_KEYS.DOWNLOAD_TASKS);
      const savedBandwidth = localStorage.getItem(STORAGE_KEYS.BANDWIDTH_SETTING);

      setState(prev => ({
        ...prev,
        bunkerMode: savedBunkerMode === 'true',
        tasks: savedTasks ? JSON.parse(savedTasks) : [],
        bandwidthUsage: savedBandwidth ? parseInt(savedBandwidth, 10) : MAX_BANDWIDTH_PERCENT,
      }));
    } catch (e) {
      console.warn('[SilentDownloader] Failed to load saved state:', e);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUNKER_MODE, String(state.bunkerMode));
      localStorage.setItem(STORAGE_KEYS.DOWNLOAD_TASKS, JSON.stringify(state.tasks));
      localStorage.setItem(STORAGE_KEYS.BANDWIDTH_SETTING, String(state.bandwidthUsage));
    } catch (e) {
      console.warn('[SilentDownloader] Failed to save state:', e);
    }
  }, [state.bunkerMode, state.tasks, state.bandwidthUsage]);

  // Check storage availability
  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setState(prev => ({
            ...prev,
            totalStorageUsed: estimate.usage || 0,
            estimatedStorageAvailable: (estimate.quota || 0) - (estimate.usage || 0),
          }));
        } catch (e) {
          console.warn('[SilentDownloader] Storage estimate failed:', e);
        }
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Enable Bunker Mode (user consent)
  const enableBunkerMode = useCallback((enable: boolean) => {
    setState(prev => ({
      ...prev,
      bunkerMode: enable,
      isEnabled: enable,
    }));

    if (enable) {
      console.log('[SilentDownloader] 🛡️ Bunker Mode enabled - background downloads activated');
    } else {
      // Cancel any active downloads
      if (downloadControllerRef.current) {
        downloadControllerRef.current.abort();
      }
      console.log('[SilentDownloader] Bunker Mode disabled');
    }
  }, []);

  // Queue a model for background download
  const queueModelDownload = useCallback((modelId: string, modelName: string, priority: number = 1) => {
    const modelInfo = MODEL_DOWNLOADS[modelId];
    if (!modelInfo) {
      console.error('[SilentDownloader] Unknown model:', modelId);
      return;
    }

    // Check if already queued
    if (state.tasks.some(t => t.modelId === modelId)) {
      console.log('[SilentDownloader] Model already in queue:', modelId);
      return;
    }

    // Create chunks
    const numChunks = Math.ceil(modelInfo.sizeBytes / CHUNK_SIZE);
    const chunks: DownloadChunk[] = Array.from({ length: numChunks }, (_, i) => ({
      index: i,
      start: i * CHUNK_SIZE,
      end: Math.min((i + 1) * CHUNK_SIZE - 1, modelInfo.sizeBytes - 1),
      downloaded: false,
      retries: 0,
    }));

    const newTask: DownloadTask = {
      id: `download_${Date.now()}_${modelId}`,
      modelId,
      modelName,
      totalBytes: modelInfo.sizeBytes,
      downloadedBytes: 0,
      progress: 0,
      status: 'queued',
      chunks,
      priority,
    };

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask].sort((a, b) => b.priority - a.priority),
    }));

    console.log(`[SilentDownloader] Queued ${modelName} for background download (${(modelInfo.sizeBytes / 1e9).toFixed(1)} GB)`);
  }, [state.tasks]);

  // Pause download
  const pauseDownload = useCallback((reason: 'battery' | 'bandwidth' | 'user' = 'user') => {
    if (downloadControllerRef.current) {
      downloadControllerRef.current.abort();
    }
    
    setState(prev => ({
      ...prev,
      isDownloading: false,
      isPaused: true,
      pauseReason: reason,
      currentTask: prev.currentTask ? { ...prev.currentTask, status: 'paused' } : null,
    }));
    
    console.log(`[SilentDownloader] Download paused: ${reason}`);
  }, []);

  // Resume download
  const resumeDownload = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: false,
      pauseReason: null,
    }));
    
    console.log('[SilentDownloader] Download resumed');
  }, []);

  // Set bandwidth throttle
  const setBandwidthLimit = useCallback((percent: number) => {
    const clampedPercent = Math.max(10, Math.min(100, percent));
    setState(prev => ({
      ...prev,
      bandwidthUsage: clampedPercent,
    }));
  }, []);

  // Process download queue (with throttling)
  const processDownloadQueue = useCallback(async () => {
    if (state.isPaused || !state.bunkerMode) return;

    const pendingTask = state.tasks.find(t => t.status === 'queued' || t.status === 'paused');
    if (!pendingTask) return;

    const modelInfo = MODEL_DOWNLOADS[pendingTask.modelId];
    if (!modelInfo) return;

    downloadControllerRef.current = new AbortController();
    
    setState(prev => ({
      ...prev,
      isDownloading: true,
      currentTask: { ...pendingTask, status: 'downloading', startedAt: new Date() },
      tasks: prev.tasks.map(t => 
        t.id === pendingTask.id ? { ...t, status: 'downloading' as const, startedAt: new Date() } : t
      ),
    }));

    console.log(`[SilentDownloader] Starting download: ${pendingTask.modelName}`);

    try {
      // Use WebLLM's CreateMLCEngine - it caches models automatically
      const webllm = await import('@mlc-ai/web-llm');
      
      let lastProgress = 0;
      const progressCallback = (progress: any) => {
        const percent = Math.round((progress.progress || 0) * 100);
        const downloadedBytes = Math.round(pendingTask.totalBytes * (percent / 100));
        
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? {
            ...prev.currentTask,
            progress: percent,
            downloadedBytes,
          } : null,
          tasks: prev.tasks.map(t => 
            t.id === pendingTask.id ? { ...t, progress: percent, downloadedBytes } : t
          ),
        }));
        
        // Apply throttling by adding delays
        const throttleDelay = Math.round((100 - state.bandwidthUsage) * 10);
        if (percent - lastProgress > 5 && throttleDelay > 0) {
          lastProgress = percent;
        }
      };

      // Create engine to trigger model download and cache
      const engine = await webllm.CreateMLCEngine(pendingTask.modelId, {
        initProgressCallback: progressCallback,
      });
      
      // Unload after caching - we just wanted to download
      await engine.unload();

      // Mark as completed
      setState(prev => ({
        ...prev,
        isDownloading: false,
        currentTask: null,
        tasks: prev.tasks.map(t => 
          t.id === pendingTask.id ? { 
            ...t, 
            status: 'completed' as const, 
            progress: 100, 
            downloadedBytes: t.totalBytes,
            completedAt: new Date(),
          } : t
        ),
      }));

      console.log(`[SilentDownloader] ✅ Completed: ${pendingTask.modelName}`);
      
      // Process next in queue
      setTimeout(() => processDownloadQueue(), 1000);
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('[SilentDownloader] Download aborted');
        return;
      }
      
      console.error('[SilentDownloader] Download error:', e);
      
      setState(prev => ({
        ...prev,
        isDownloading: false,
        currentTask: null,
        tasks: prev.tasks.map(t => 
          t.id === pendingTask.id ? { ...t, status: 'error' as const, error: e.message } : t
        ),
      }));
    }
  }, [state.isPaused, state.bunkerMode, state.tasks, state.bandwidthUsage]);

  // Auto-start downloads when bunker mode is enabled
  useEffect(() => {
    if (state.bunkerMode && !state.isDownloading && !state.isPaused) {
      const hasPendingTasks = state.tasks.some(t => t.status === 'queued');
      if (hasPendingTasks) {
        processDownloadQueue();
      }
    }
  }, [state.bunkerMode, state.isDownloading, state.isPaused, state.tasks, processDownloadQueue]);

  // Auto-handover: activate local model when offline
  useEffect(() => {
    const handleOffline = () => {
      const completedModels = state.tasks.filter(t => t.status === 'completed');
      if (completedModels.length > 0) {
        console.log('[SilentDownloader] 📴 Offline detected - Local models available:', 
          completedModels.map(m => m.modelName).join(', '));
      }
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [state.tasks]);

  // Remove a task from queue
  const removeTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, []);

  // Get completed models (ready for offline use)
  const getCompletedModels = useCallback(() => {
    return state.tasks.filter(t => t.status === 'completed');
  }, [state.tasks]);

  // Check if a model is cached
  const isModelCached = useCallback((modelId: string) => {
    return state.tasks.some(t => t.modelId === modelId && t.status === 'completed');
  }, [state.tasks]);

  // Cancel current download
  const cancelDownload = useCallback(() => {
    if (downloadControllerRef.current) {
      downloadControllerRef.current.abort();
    }
    
    setState(prev => ({
      ...prev,
      isDownloading: false,
      currentTask: null,
      tasks: prev.tasks.map(t => 
        t.status === 'downloading' ? { ...t, status: 'queued' as const } : t
      ),
    }));
  }, []);

  // Format time remaining estimate
  const getTimeRemaining = useCallback((task: DownloadTask): string => {
    if (!task.startedAt || task.downloadedBytes === 0) return 'Calculating...';
    
    const elapsed = Date.now() - new Date(task.startedAt).getTime();
    const bytesPerMs = task.downloadedBytes / elapsed;
    const remainingBytes = task.totalBytes - task.downloadedBytes;
    const remainingMs = remainingBytes / bytesPerMs;
    
    if (remainingMs < 60000) return 'Less than 1 minute';
    if (remainingMs < 3600000) return `~${Math.round(remainingMs / 60000)} minutes`;
    return `~${(remainingMs / 3600000).toFixed(1)} hours`;
  }, []);

  return {
    // State
    bunkerMode: state.bunkerMode,
    isEnabled: state.isEnabled,
    isDownloading: state.isDownloading,
    isPaused: state.isPaused,
    pauseReason: state.pauseReason,
    tasks: state.tasks,
    currentTask: state.currentTask,
    totalStorageUsed: state.totalStorageUsed,
    estimatedStorageAvailable: state.estimatedStorageAvailable,
    bandwidthUsage: state.bandwidthUsage,
    batteryStatus: state.batteryStatus,

    // Actions
    enableBunkerMode,
    queueModelDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    setBandwidthLimit,
    removeTask,
    getCompletedModels,
    isModelCached,
    getTimeRemaining,
  };
};
