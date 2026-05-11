import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { text, voiceId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default voice - Sarah (professional, clear)
    const selectedVoiceId = voiceId || "EXAVITQu4vr4xnSDxMaL";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", errorText);
      
      // Parse error for better user feedback
      let errorMessage = "Failed to generate speech";
      let errorCode = "TTS_ERROR";
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail?.status === "detected_unusual_activity") {
          errorMessage = "ElevenLabs free tier limit reached. Please upgrade your ElevenLabs API key to a paid plan.";
          errorCode = "QUOTA_EXCEEDED";
        } else if (errorData.detail?.status === "quota_exceeded") {
          errorMessage = "ElevenLabs quota exceeded. Please check your API usage limits.";
          errorCode = "QUOTA_EXCEEDED";
        } else if (response.status === 401) {
          errorMessage = "Invalid ElevenLabs API key. Please check your configuration.";
          errorCode = "INVALID_API_KEY";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
          errorCode = "RATE_LIMITED";
        } else if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        }
      } catch {
        // Use default error message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, code: errorCode }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in elevenlabs-tts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
