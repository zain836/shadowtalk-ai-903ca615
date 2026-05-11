import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { prompt, duration, type } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isMusic = type === "music";
    const apiUrl = isMusic
      ? "https://api.elevenlabs.io/v1/music"
      : "https://api.elevenlabs.io/v1/sound-generation";

    const body = isMusic
      ? { prompt, duration_seconds: duration || 30 }
      : { text: prompt, duration_seconds: duration || 5, prompt_influence: 0.3 };

    console.log(`Generating ${isMusic ? "music" : "SFX"}: "${prompt}" (${duration || (isMusic ? 30 : 5)}s)`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs audio generation error:", errorText);

      let errorMessage = `Failed to generate ${isMusic ? "music" : "sound effect"}`;
      if (response.status === 401) errorMessage = "Invalid ElevenLabs API key";
      else if (response.status === 429) errorMessage = "Rate limit exceeded. Try again later.";
      else if (response.status === 402) errorMessage = "Insufficient credits. Please top up your ElevenLabs account.";

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="${isMusic ? "music" : "sfx"}-${Date.now()}.mp3"`,
      },
    });
  } catch (error) {
    console.error("Error in elevenlabs-audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
