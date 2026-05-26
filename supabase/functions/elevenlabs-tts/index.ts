import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const MAX_TEXT_LENGTH = 5000;

/** Chunked base64 — avoids stack overflow and std import issues on large buffers */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    let body: { text?: string; voiceId?: string; format?: "json" | "binary" } = {};
    const raw = await req.text();
    if (raw.trim()) {
      try {
        body = JSON.parse(raw);
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
      }
    }

    const { text, voiceId, format = "json" } = body;
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return jsonResponse({ error: "ElevenLabs API key not configured", code: "MISSING_API_KEY" }, 500);
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return jsonResponse({ error: "Text is required" }, 400);
    }

    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH);
    const selectedVoiceId =
      typeof voiceId === "string" && voiceId.trim() ? voiceId.trim() : DEFAULT_VOICE_ID;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);

      let errorMessage = "Failed to generate speech";
      let errorCode = "TTS_ERROR";

      try {
        const errorData = JSON.parse(errorText);
        const detail = errorData.detail;
        const status =
          typeof detail === "object" && detail !== null
            ? (detail as { status?: string }).status
            : undefined;
        const message =
          typeof detail === "object" && detail !== null
            ? (detail as { message?: string }).message
            : typeof detail === "string"
              ? detail
              : errorData.message;

        if (status === "detected_unusual_activity" || status === "quota_exceeded") {
          errorMessage =
            "ElevenLabs quota limit reached. Please check your API plan or try again later.";
          errorCode = "QUOTA_EXCEEDED";
        } else if (response.status === 401) {
          errorMessage = "Invalid ElevenLabs API key. Please check your configuration.";
          errorCode = "INVALID_API_KEY";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
          errorCode = "RATE_LIMITED";
        } else if (message) {
          errorMessage = message;
        }
      } catch {
        // keep defaults
      }

      return jsonResponse({ error: errorMessage, code: errorCode }, response.status);
    }

    const audioBuffer = await response.arrayBuffer();

    if (format === "binary") {
      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'inline; filename="speech.mp3"',
        },
      });
    }

    const base64Audio = arrayBufferToBase64(audioBuffer);
    return jsonResponse({ audioContent: base64Audio });
  } catch (error) {
    console.error("Error in elevenlabs-tts:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      },
      500
    );
  }
});
