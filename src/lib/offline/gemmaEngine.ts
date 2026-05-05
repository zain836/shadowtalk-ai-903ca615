/**
 * Gemma WebGPU Inference Engine
 * --------------------------------------------------
 * Wraps @huggingface/transformers' text-generation pipeline with:
 *  - WebGPU acceleration (auto-fallback to WASM CPU when unavailable)
 *  - q4 quantization for the Gemma 4B family
 *  - Streaming token callback
 *  - Progress reporting during model load
 *
 * Used by the Hybrid Router (Option B from Shadowoffline blueprint) when the
 * device is offline OR the user has explicitly forced local inference.
 */

import {
  pipeline,
  TextStreamer,
  type PretrainedModelOptions,
} from "@huggingface/transformers";

export type EngineCapabilities = {
  webgpu: boolean;
  wasm: boolean;
  recommendedDevice: "webgpu" | "wasm";
  memoryGB: number;
};

export type LoadProgress = {
  stage: "init" | "model" | "ready";
  percent: number;
  message?: string;
};

export type GenerateOptions = {
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  stopSequences?: string[];
  onToken?: (token: string) => void;
};

export const GEMMA_MODELS = {
  // Real, publicly hosted Gemma 3n ONNX checkpoints from HuggingFace
  // (multimodal text-generation, q4 quantization for browser inference).
  // Verified URLs:
  //   https://huggingface.co/onnx-community/gemma-3n-E2B-it-ONNX
  //   https://huggingface.co/onnx-community/gemma-3n-E4B-it-ONNX
  // The 'default' alias maps to E2B for compatibility with the previous
  // routing preference key.
  default: {
    id: "onnx-community/gemma-3n-E2B-it-ONNX",
    label: "Gemma 3n E2B (Instruct)",
    sizeMB: 1700,
    minMemoryGB: 4,
  },
  e2b: {
    id: "onnx-community/gemma-3n-E2B-it-ONNX",
    label: "Gemma 3n E2B (Instruct)",
    sizeMB: 1700,
    minMemoryGB: 4,
  },
  e4b: {
    id: "onnx-community/gemma-3n-E4B-it-ONNX",
    label: "Gemma 3n E4B (Instruct)",
    sizeMB: 3200,
    minMemoryGB: 8,
  },
} as const;

export type GemmaModelKey = keyof typeof GEMMA_MODELS;

export async function detectCapabilities(): Promise<EngineCapabilities> {
  let webgpu = false;
  try {
    if ("gpu" in navigator) {
      // @ts-ignore - WebGPU types
      const adapter = await navigator.gpu.requestAdapter();
      webgpu = !!adapter;
    }
  } catch {
    webgpu = false;
  }
  // @ts-expect-error - deviceMemory is non-standard
  const memoryGB = (navigator.deviceMemory as number | undefined) ?? 4;
  return {
    webgpu,
    wasm: true, // Always available in modern browsers
    recommendedDevice: webgpu ? "webgpu" : "wasm",
    memoryGB,
  };
}

export class GemmaEngine {
  private generator: any | null = null;
  private modelKey: GemmaModelKey = "default";
  private device: "webgpu" | "wasm" = "wasm";
  private loading = false;
  private currentLoad: Promise<boolean> | null = null;
  private lastProgress: LoadProgress | null = null;
  private listeners = new Set<(p: LoadProgress) => void>();

  get isReady() {
    return this.generator !== null;
  }
  get isLoading() {
    return this.loading;
  }
  get progress() {
    return this.lastProgress;
  }

  get activeModel() {
    return GEMMA_MODELS[this.modelKey];
  }

  get activeDevice() {
    return this.device;
  }

  /** Subscribe to background progress events. Returns an unsubscribe fn. */
  subscribe(fn: (p: LoadProgress) => void): () => void {
    this.listeners.add(fn);
    if (this.lastProgress) fn(this.lastProgress);
    return () => this.listeners.delete(fn);
  }

  private emit(p: LoadProgress) {
    this.lastProgress = p;
    this.listeners.forEach((fn) => {
      try { fn(p); } catch { /* ignore */ }
    });
  }

  async load(
    modelKey: GemmaModelKey = "default",
    onProgress?: (p: LoadProgress) => void,
  ): Promise<boolean> {
    if (this.generator && this.modelKey === modelKey) {
      onProgress?.({ stage: "ready", percent: 100, message: "Model already loaded" });
      return true;
    }
    // Already downloading — just attach listener and await the in-flight promise.
    if (this.currentLoad) {
      if (onProgress) {
        const off = this.subscribe(onProgress);
        try { return await this.currentLoad; } finally { off(); }
      }
      return await this.currentLoad;
    }

    this.loading = true;
    this.modelKey = modelKey;
    const off = onProgress ? this.subscribe(onProgress) : null;

    this.currentLoad = (async () => {
      try {
        const caps = await detectCapabilities();
        this.device = caps.recommendedDevice;
        this.emit({ stage: "init", percent: 0, message: `Initializing ${this.device.toUpperCase()}` });

        const opts: PretrainedModelOptions & Record<string, unknown> = {
          dtype: "q4",
          device: this.device,
          progress_callback: (data: any) => {
            if (data?.status === "progress" && typeof data.progress === "number") {
              this.emit({
                stage: "model",
                percent: Math.round(data.progress),
                message: data.file,
              });
            } else if (data?.status === "done" && data.file) {
              this.emit({ stage: "model", percent: 100, message: `Saved ${data.file}` });
            }
          },
        };

        this.generator = await pipeline(
          "text-generation",
          GEMMA_MODELS[modelKey].id,
          opts as any,
        );

        this.emit({ stage: "ready", percent: 100, message: "Model loaded" });
        return true;
      } catch (err) {
        console.error("[GemmaEngine] Load failed:", err);
        this.generator = null;
        this.emit({ stage: "init", percent: 0, message: err instanceof Error ? err.message : "Load failed" });
        throw err;
      } finally {
        this.loading = false;
        this.currentLoad = null;
        off?.();
      }
    })();

    return this.currentLoad;
  }

  /** Conversational completion using Gemma's chat template. */
  async chat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options: GenerateOptions = {},
  ): Promise<string> {
    if (!this.generator) throw new Error("GemmaEngine not loaded");

    const streamer = options.onToken
      ? new TextStreamer(this.generator.tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text: string) => options.onToken!(text),
        })
      : undefined;

    const out = await this.generator(messages, {
      max_new_tokens: options.maxNewTokens ?? 512,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.9,
      top_k: options.topK ?? 40,
      repetition_penalty: options.repetitionPenalty ?? 1.05,
      do_sample: true,
      streamer,
    });

    // transformers.js returns [{ generated_text: [...messages, {role:'assistant', content}] }]
    const last = out?.[0]?.generated_text;
    if (Array.isArray(last)) {
      const final = last[last.length - 1];
      return typeof final?.content === "string" ? final.content : "";
    }
    if (typeof last === "string") return last;
    return "";
  }

  async dispose() {
    try {
      if (this.generator?.dispose) await this.generator.dispose();
    } catch {
      /* ignore */
    }
    this.generator = null;
  }
}

// Module-level singleton to share the loaded model across the app.
let singleton: GemmaEngine | null = null;
export function getGemmaEngine(): GemmaEngine {
  if (!singleton) singleton = new GemmaEngine();
  return singleton;
}
