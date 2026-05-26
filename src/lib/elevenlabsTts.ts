/**
 * Client helper for the elevenlabs-tts edge function.
 * Handles auth headers, errors, and audio playback without crashing the UI.
 */

export interface ElevenLabsTtsOptions {
  text: string;
  voiceId?: string;
  signal?: AbortSignal;
}

export interface ElevenLabsTtsResult {
  ok: boolean;
  audio?: HTMLAudioElement;
  error?: string;
  code?: string;
}

export async function fetchElevenLabsSpeech(
  options: ElevenLabsTtsOptions
): Promise<ElevenLabsTtsResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return { ok: false, error: "Supabase is not configured", code: "CONFIG_ERROR" };
  }

  const text = options.text?.trim();
  if (!text) {
    return { ok: false, error: "Text is required", code: "INVALID_INPUT" };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        text,
        voiceId: options.voiceId,
      }),
      signal: options.signal,
    });

    const contentType = response.headers.get("Content-Type") ?? "";

    if (!response.ok) {
      let message = "Text-to-speech failed";
      let code = "TTS_ERROR";
      if (contentType.includes("application/json")) {
        try {
          const errBody = await response.json();
          message = errBody.error ?? message;
          code = errBody.code ?? code;
        } catch {
          /* ignore parse errors */
        }
      }
      return { ok: false, error: message, code };
    }

    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (!data?.audioContent) {
        return { ok: false, error: "No audio returned", code: "EMPTY_RESPONSE" };
      }
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      return { ok: true, audio };
    }

    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    return { ok: true, audio };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Cancelled", code: "ABORTED" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Text-to-speech failed",
      code: "NETWORK_ERROR",
    };
  }
}

export function playElevenLabsAudio(
  audio: HTMLAudioElement,
  volume = 0.8
): Promise<void> {
  audio.volume = volume;
  return new Promise((resolve) => {
    const finish = () => resolve();
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  });
}
