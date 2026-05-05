/**
 * Gemma 3n Offline Inference Engine
 * --------------------------------------------------
 * Wraps @huggingface/transformers v4 with the real Gemma 3n E2B/E4B ONNX
 * checkpoints from `onnx-community`. Uses WebGPU when available with
 * automatic WASM CPU fallback. Streaming token output via TextStreamer.
 *
 * The engine is a module-level singleton so background downloads survive
 * across route changes (the React tree only subscribes to its progress bus).
 */

import {
  AutoProcessor,
  AutoModelForImageTextToText,
  TextStreamer,
} from "@huggingface/transformers";

export type EngineCapabilities = {
  webgpu: boolean;
  wasm: boolean;
  recommendedDevice: "webgpu" | "wasm";
  memoryGB: number;
};

export type LoadProgress = {
  stage: "init" | "model" | "ready" | "error";
  percent: number;
  message?: string;
};

export type GenerateOptions = {
  maxNewTokens?: number;
  doSample?: boolean;
  onToken?: (token: string) => void;
};

export const GEMMA_MODELS = {
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
    wasm: true,
    recommendedDevice: webgpu ? "webgpu" : "wasm",
    memoryGB,
  };
}

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

export class GemmaEngine {
  private processor: any | null = null;
  private model: any | null = null;
  private modelKey: GemmaModelKey = "default";
  private device: "webgpu" | "wasm" = "wasm";
  private loading = false;
  private currentLoad: Promise<boolean> | null = null;
  private lastProgress: LoadProgress | null = null;
  private listeners = new Set<(p: LoadProgress) => void>();

  get isReady() {
    return this.model !== null && this.processor !== null;
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

  subscribe(fn: (p: LoadProgress) => void): () => void {
    this.listeners.add(fn);
    if (this.lastProgress) fn(this.lastProgress);
    return () => {
      this.listeners.delete(fn);
    };
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
    if (this.isReady && this.modelKey === modelKey) {
      onProgress?.({ stage: "ready", percent: 100, message: "Model already loaded" });
      return true;
    }
    if (this.currentLoad) {
      const off = onProgress ? this.subscribe(onProgress) : null;
      try { return await this.currentLoad; } finally { off?.(); }
    }

    this.loading = true;
    this.modelKey = modelKey;
    const off = onProgress ? this.subscribe(onProgress) : null;
    const modelId = GEMMA_MODELS[modelKey].id;

    this.currentLoad = (async () => {
      try {
        const caps = await detectCapabilities();
        this.device = caps.recommendedDevice;
        this.emit({ stage: "init", percent: 0, message: `Initializing ${this.device.toUpperCase()}` });

        const fileProgress = new Map<string, number>();
        const onPC = (data: any) => {
          if (data?.status === "progress" && data?.file) {
            fileProgress.set(data.file, Math.round(data.progress ?? 0));
            const avg = Math.round(
              [...fileProgress.values()].reduce((a, b) => a + b, 0) /
                Math.max(1, fileProgress.size),
            );
            this.emit({ stage: "model", percent: avg, message: data.file });
          } else if (data?.status === "done" && data?.file) {
            fileProgress.set(data.file, 100);
            this.emit({ stage: "model", percent: 100, message: `Cached ${data.file}` });
          }
        };

        // Processor (tokenizer + image/audio preprocessing) — small
        this.processor = await AutoProcessor.from_pretrained(modelId, {
          progress_callback: onPC,
        });

        // Multimodal model — large weight files
        this.model = await AutoModelForImageTextToText.from_pretrained(modelId, {
          dtype: {
            audio_encoder: this.device === "webgpu" ? "fp32" : "q4",
            vision_encoder: this.device === "webgpu" ? "fp32" : "q4",
            embed_tokens: "q4",
            decoder_model_merged: "q4",
          },
          device: this.device,
          progress_callback: onPC,
        } as any);

        this.emit({ stage: "ready", percent: 100, message: "Model loaded" });
        return true;
      } catch (err) {
        console.error("[GemmaEngine] Load failed:", err);
        this.processor = null;
        this.model = null;
        const msg = err instanceof Error ? err.message : "Load failed";
        this.emit({ stage: "error", percent: 0, message: msg });
        throw err;
      } finally {
        this.loading = false;
        this.currentLoad = null;
        off?.();
      }
    })();

    return this.currentLoad;
  }

  /** Streaming text-only chat completion using Gemma 3n's chat template. */
  async chat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<string> {
    if (!this.isReady) throw new Error("GemmaEngine not loaded");

    // Convert plain text messages to multimodal content blocks expected by 3n
    const mm = messages.map((m) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    }));

    const prompt = this.processor.apply_chat_template(mm, {
      add_generation_prompt: true,
    });
    const inputs = await this.processor(prompt, null, null, {
      add_special_tokens: false,
    });

    let collected = "";
    const streamer = new TextStreamer(this.processor.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        collected += text;
        options.onToken?.(text);
      },
    });

    const outputs = await this.model.generate({
      ...inputs,
      max_new_tokens: options.maxNewTokens ?? 512,
      do_sample: options.doSample ?? false,
      streamer,
    });

    if (collected) return collected;
    // Fallback: decode if streaming yielded nothing
    try {
      const decoded = this.processor.batch_decode(
        outputs.slice(null, [inputs.input_ids.dims.at(-1), null]),
        { skip_special_tokens: true },
      );
      return decoded?.[0] ?? "";
    } catch {
      return "";
    }
  }

  async dispose() {
    try { await this.model?.dispose?.(); } catch { /* ignore */ }
    this.model = null;
    this.processor = null;
    this.lastProgress = null;
  }
}

let singleton: GemmaEngine | null = null;
export function getGemmaEngine(): GemmaEngine {
  if (!singleton) singleton = new GemmaEngine();
  return singleton;
}
