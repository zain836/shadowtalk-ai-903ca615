import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
 
 interface VisionAnalysis {
   face_detected: boolean;
   emotion: 'happy' | 'sad' | 'neutral' | 'confused' | 'frustrated' | 'tired' | 'excited';
   emotion_confidence: number;
   engagement_level: 'high' | 'medium' | 'low' | 'distracted';
   eye_contact: boolean;
   posture: 'attentive' | 'relaxed' | 'tense' | 'slouched';
   gesture_detected: null | 'wave' | 'thumbs_up' | 'thinking' | 'pointing' | 'palm_stop';
   environment: {
     lighting: 'bright' | 'dim' | 'dark';
     time_guess: 'morning' | 'afternoon' | 'evening' | 'night';
   };
   suggested_action: string;
   conversation_opener: string;
 }
 
 serve(async (req) => {
   const origin = req.headers.get("origin");

   if (req.method === "OPTIONS") {
     return handleCorsOptions(origin);
   }

   const corsHeaders = getCorsHeaders(origin);
 
   try {
     const { imageData, previousAnalysis } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 
     if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not found in environment");
       return new Response(
         JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (!imageData) {
       return new Response(
         JSON.stringify({ error: "Image data is required" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
    // Validate image data format
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      console.error("Invalid image data format");
      return new Response(
        JSON.stringify({ error: "Invalid image format. Expected base64 data URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if image is too large (>4MB base64 = ~3MB actual)
    const imageSizeKB = Math.round(imageData.length / 1024);
    console.log(`Processing image: ${imageSizeKB}KB`);
    
    if (imageData.length > 4 * 1024 * 1024) {
      console.error(`Image too large: ${imageSizeKB}KB`);
      return new Response(
        JSON.stringify({ error: "Image too large. Please use a smaller image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     const analysisPrompt = `You are an advanced behavioral AI that analyzes user camera feeds to understand their emotional state and engagement.
 
 Analyze this image of a user and return ONLY a valid JSON object (no markdown, no code blocks):
 
 {
   "face_detected": boolean - true if a human face is visible,
   "emotion": one of ["happy", "sad", "neutral", "confused", "frustrated", "tired", "excited"],
   "emotion_confidence": number 0-100 representing confidence in emotion detection,
   "engagement_level": one of ["high", "medium", "low", "distracted"],
   "eye_contact": boolean - true if looking at camera/screen,
   "posture": one of ["attentive", "relaxed", "tense", "slouched"],
   "gesture_detected": null or one of ["wave", "thumbs_up", "thinking", "pointing", "palm_stop"],
   "environment": {
     "lighting": one of ["bright", "dim", "dark"],
     "time_guess": one of ["morning", "afternoon", "evening", "night"]
   },
   "suggested_action": string - what the AI should do based on the analysis,
   "conversation_opener": string - a natural conversation starter based on what you observe
 }
 
 ${previousAnalysis ? `Previous analysis showed: ${JSON.stringify(previousAnalysis)}. Note any changes.` : ''}
 
 Be empathetic and accurate. Focus on helping the user.`;
 
    console.log("Sending request to Lovable AI gateway...");
    
    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: analysisPrompt },
                { type: "image_url", image_url: { url: imageData } }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      });
    } catch (fetchError) {
      console.error("Network error calling AI gateway:", fetchError);
      return new Response(
        JSON.stringify({ error: "Network error connecting to AI service" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
     if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vision API error (${response.status}):`, errorText.substring(0, 500));
      
       if (response.status === 429) {
         return new Response(
           JSON.stringify({ error: "Rate limited, please try again" }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (response.status === 402) {
         return new Response(
           JSON.stringify({ error: "Credits exhausted" }),
           { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
      
       return new Response(
        JSON.stringify({ error: "Vision analysis failed", details: response.status }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
    console.log("AI gateway responded successfully");
     const data = await response.json();
     const content = data.choices?.[0]?.message?.content || "";
 
     // Parse the JSON from the response
     let analysis: VisionAnalysis;
     try {
       // Remove any markdown code blocks if present
       const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
       analysis = JSON.parse(jsonStr);
     } catch {
       console.error("Failed to parse vision analysis:", content);
       // Return a default analysis if parsing fails
       analysis = {
         face_detected: false,
         emotion: 'neutral',
         emotion_confidence: 0,
         engagement_level: 'medium',
         eye_contact: false,
         posture: 'relaxed',
         gesture_detected: null,
         environment: { lighting: 'bright', time_guess: 'afternoon' },
         suggested_action: 'Continue normally',
         conversation_opener: 'Hello! How can I help you today?'
       };
     }
 
     return new Response(
       JSON.stringify({ analysis, timestamp: Date.now() }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error in vision-analyze:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });