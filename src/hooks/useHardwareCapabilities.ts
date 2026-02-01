import { useState, useEffect, useCallback } from 'react';

export interface HardwareCapabilities {
  // GPU
  hasWebGPU: boolean;
  gpuAdapter: string | null;
  gpuVendor: string | null;
  gpuMaxBufferSize: number;
  estimatedVRAM: number; // in GB
  
  // Memory
  deviceMemory: number; // in GB
  heapSizeLimit: number; // in MB
  usedHeapSize: number; // in MB
  
  // CPU
  logicalCores: number;
  
  // Storage
  estimatedStorage: number; // in GB
  usedStorage: number; // in GB
  
  // Performance tier
  tier: 'low' | 'mid' | 'high' | 'enterprise';
  maxModelSize: string; // e.g., "360M", "1.7B", "3B", "7B"
  recommendedModels: string[];
}

// =============================================================================
// HARDWARE TIER DEFINITIONS
// =============================================================================
// Low (4GB RAM, no GPU): Basic chat only - Llama 3.2 1B
// Mid (8GB RAM): Good reasoning - Llama 3.2 3B  
// High (16GB+ RAM, GPU): Full capability - Llama 3.1 8B
// Enterprise (32GB+ RAM, RTX): Expert mode - Mistral 7B / Qwen 7B
// =============================================================================

const MODEL_TIERS = {
  low: {
    maxSize: '1B',
    maxSizeBytes: 1_000_000_000,
    models: [
      'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      'SmolLM2-360M-Instruct-q4f16_1-MLC',
    ],
    description: 'Basic chat (360M-1B)',
  },
  mid: {
    maxSize: '3B',
    maxSizeBytes: 3_000_000_000,
    models: [
      'Llama-3.2-3B-Instruct-q4f16_1-MLC',
      'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    ],
    description: 'Good reasoning (1.5B-3B)',
  },
  high: {
    maxSize: '8B',
    maxSizeBytes: 8_000_000_000,
    models: [
      'Llama-3.1-8B-Instruct-q4f16_1-MLC',
      'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
      'Llama-3.2-3B-Instruct-q4f16_1-MLC',
      'Phi-3.5-mini-instruct-q4f16_1-MLC',
    ],
    description: 'Full capability (7B-8B)',
  },
  enterprise: {
    maxSize: '13B',
    maxSizeBytes: 13_000_000_000,
    models: [
      'Llama-3.1-8B-Instruct-q4f16_1-MLC',
      'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
      'Qwen2.5-7B-Instruct-q4f16_1-MLC',
      'Phi-3.5-mini-instruct-q4f16_1-MLC',
    ],
    description: 'Expert mode (8B-13B)',
  },
};

export const useHardwareCapabilities = () => {
  const [capabilities, setCapabilities] = useState<HardwareCapabilities>({
    hasWebGPU: false,
    gpuAdapter: null,
    gpuVendor: null,
    gpuMaxBufferSize: 0,
    estimatedVRAM: 0,
    deviceMemory: 4,
    heapSizeLimit: 0,
    usedHeapSize: 0,
    logicalCores: 4,
    estimatedStorage: 0,
    usedStorage: 0,
    tier: 'low',
    maxModelSize: '360M',
    recommendedModels: MODEL_TIERS.low.models,
  });

  const [isDetecting, setIsDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectCapabilities = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const caps: Partial<HardwareCapabilities> = {};

      // Detect WebGPU and GPU capabilities
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu?.requestAdapter();
          if (adapter) {
            caps.hasWebGPU = true;
            
            // Get adapter info
            const info = await adapter.requestAdapterInfo?.();
            caps.gpuAdapter = info?.description || info?.device || 'Unknown GPU';
            caps.gpuVendor = info?.vendor || 'Unknown';
            
            // Estimate VRAM from max buffer size
            const limits = adapter.limits;
            caps.gpuMaxBufferSize = limits?.maxBufferSize || 0;
            
            // Rough VRAM estimation based on max buffer size
            // Modern GPUs typically allow buffer sizes up to VRAM/4
            const estimatedVRAMBytes = (limits?.maxBufferSize || 0) * 4;
            caps.estimatedVRAM = Math.round(estimatedVRAMBytes / (1024 * 1024 * 1024) * 10) / 10;
            
            // If estimation is too low, use device memory as fallback
            if (caps.estimatedVRAM < 2) {
              const memory = (navigator as any).deviceMemory || 4;
              // Integrated GPUs typically share system memory
              caps.estimatedVRAM = Math.min(memory / 2, 4);
            }
          }
        } catch (e) {
          console.warn('[Hardware] WebGPU detection failed:', e);
          caps.hasWebGPU = false;
        }
      }

      // Detect system memory
      caps.deviceMemory = (navigator as any).deviceMemory || 4;

      // Detect JS heap limits
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        caps.heapSizeLimit = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));
        caps.usedHeapSize = Math.round(memory.usedJSHeapSize / (1024 * 1024));
      }

      // Detect CPU cores
      caps.logicalCores = navigator.hardwareConcurrency || 4;

      // Detect storage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          caps.estimatedStorage = Math.round((estimate.quota || 0) / (1024 * 1024 * 1024) * 10) / 10;
          caps.usedStorage = Math.round((estimate.usage || 0) / (1024 * 1024 * 1024) * 100) / 100;
        } catch (e) {
          console.warn('[Hardware] Storage estimation failed:', e);
        }
      }

      // Determine performance tier
      const memory = caps.deviceMemory || 4;
      const vram = caps.estimatedVRAM || 0;
      const cores = caps.logicalCores || 4;
      const hasGPU = caps.hasWebGPU;

      let tier: HardwareCapabilities['tier'];
      
      if (!hasGPU || memory < 4) {
        tier = 'low';
      } else if (memory >= 32 && vram >= 8 && cores >= 8) {
        tier = 'enterprise';
      } else if (memory >= 16 && vram >= 4 && cores >= 6) {
        tier = 'high';
      } else if (memory >= 8 && vram >= 2) {
        tier = 'mid';
      } else {
        tier = 'low';
      }

      caps.tier = tier;
      caps.maxModelSize = MODEL_TIERS[tier].maxSize;
      caps.recommendedModels = MODEL_TIERS[tier].models;

      setCapabilities(prev => ({ ...prev, ...caps }) as HardwareCapabilities);
      console.log('[Hardware] Detected capabilities:', caps);
    } catch (e) {
      console.error('[Hardware] Detection failed:', e);
      setError(e instanceof Error ? e.message : 'Hardware detection failed');
    } finally {
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    detectCapabilities();
  }, [detectCapabilities]);

  const canRunModel = useCallback((modelSize: string): boolean => {
    const sizeMap: Record<string, number> = {
      '135M': 0.135,
      '360M': 0.36,
      '500M': 0.5,
      '1B': 1,
      '1.5B': 1.5,
      '1.7B': 1.7,
      '3B': 3,
      '3.8B': 3.8,
      '7B': 7,
      '8B': 8,
      '13B': 13,
      '70B': 70,
    };

    const maxMap: Record<string, number> = {
      '1B': 1,
      '3B': 3,
      '8B': 8,
      '13B': 13,
    };

    const requestedSize = sizeMap[modelSize] || 0;
    const maxAllowed = maxMap[capabilities.maxModelSize] || 1;

    return requestedSize <= maxAllowed;
  }, [capabilities.maxModelSize]);

  const getOptimalModel = useCallback((): string => {
    return capabilities.recommendedModels[0] || 'SmolLM2-360M-Instruct-q4f16_1-MLC';
  }, [capabilities.recommendedModels]);

  const getModelForTask = useCallback((task: 'chat' | 'code' | 'reasoning' | 'fast'): string => {
    const { tier, recommendedModels } = capabilities;

    switch (task) {
      case 'fast':
        // Always use smallest available for speed
        if (tier === 'low') return 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
        return 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
      
      case 'code':
        // Qwen and Llama 8B are better for code
        if (tier === 'enterprise' || tier === 'high') return 'Llama-3.1-8B-Instruct-q4f16_1-MLC';
        if (tier === 'mid') return 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
        return recommendedModels[0];
      
      case 'reasoning':
        // Llama 8B and Phi excel at reasoning
        if (tier === 'high' || tier === 'enterprise') return 'Llama-3.1-8B-Instruct-q4f16_1-MLC';
        if (tier === 'mid') return 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
        return recommendedModels[0];
      
      case 'chat':
      default:
        return recommendedModels[0];
    }
  }, [capabilities]);

  return {
    capabilities,
    isDetecting,
    error,
    detectCapabilities,
    canRunModel,
    getOptimalModel,
    getModelForTask,
  };
};
