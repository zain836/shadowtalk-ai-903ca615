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
  // Hugging Face transformers.js compatible Gemma checkpoints (ONNX/q4).
  // We default to the 2B-IT model because the 4B q4 weights are still ~2.5GB
  // and many devices can't allocate that much GPU memory; the engine still
  // supports the larger model when the user explicitly opts in.
  small: {
    id: "onnx-community/gemma-3-270m-it-ONNX",
    label: "Gemma 3 270M (Instruct)",
    sizeMB: 220,
    minMemoryGB: 2,
  },
  default: {
    id: "onnx-community/gemma-3-1b-it-ONNX",
    label: "Gemma 3 1B (Instruct)",
    sizeMB: 900,
    minMemoryGB: 4,
  },
  large: {
    id: "onnx-community/gemma-3-4b-it-ONNX",
    label: "Gemma 3 4B (Instruct)",
    sizeMB: 2600,
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

  get isReady() {
    return this.generator !== null;
  }

  get activeModel() {
    return GEMMA_MODELS[this.modelKey];
  }

  get activeDevice() {
    return this.device;
  }

  async load(
    modelKey: GemmaModelKey = "default",
    onProgress?: (p: LoadProgress) => void,
  ): Promise<boolean> {
    if (this.loading) return false;
    if (this.generator && this.modelKey === modelKey) return true;

    this.loading = true;
    this.modelKey = modelKey;
    const caps = await detectCapabilities();
    this.device = caps.recommendedDevice;

    onProgress?.({ stage: "init", percent: 0, message: `Initializing ${this.device.toUpperCase()}` });

    try {
      const opts: PretrainedModelOptions & Record<string, unknown> = {
        dtype: "q4",
        device: this.device,
        progress_callback: (data: any) => {
          if (data?.status === "progress" && typeof data.progress === "number") {
            onProgress?.({
              stage: "model",
              percent: Math.round(data.progress),
              message: data.file,
            });
          }
        },
      };

      this.generator = await pipeline(
        "text-generation",
        GEMMA_MODELS[modelKey].id,
        opts as any,
      );

      onProgress?.({ stage: "ready", percent: 100, message: "Model loaded" });
      return true;
    } catch (err) {
      console.error("[GemmaEngine] Load failed:", err);
      this.generator = null;
      throw err;
    } finally {
      this.loading = false;
    }
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
