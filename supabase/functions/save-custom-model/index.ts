import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { CustomModelSchema, validateInput } from "../_shared/validation.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateInput(CustomModelSchema, body);
    
    if (!validation.success) {
      return new Response(JSON.stringify(validation), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = validation.data;

    // Check if user has access to this feature (Elite tier or higher)
    // For now, allow all authenticated users to save models locally
    // Cloud sync feature gating happens on client side
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const tier = subscriber?.subscription_tier || "free";
    
    // Allow saving for all tiers but warn about limited cloud sync
    const isEliteOrHigher = ["elite", "enterprise", "pro"].includes(tier);

    // Check if model already exists
    const { data: existingModel } = await supabase
      .from("custom_models")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", model.name)
      .single();

    let data;
    let upsertError;

    if (existingModel) {
      // Update existing model
      const result = await supabase
        .from("custom_models")
        .update({
          config: {
            basePersonality: model.basePersonality,
            temperature: model.temperature,
            maxTokens: model.maxTokens,
            topP: model.topP,
            frequencyPenalty: model.frequencyPenalty,
            presencePenalty: model.presencePenalty,
            systemPrompt: model.systemPrompt,
          },
          training_examples: model.trainingExamples,
          is_active: model.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingModel.id)
        .select()
        .single();
      
      data = result.data;
      upsertError = result.error;
    } else {
      // Insert new model
      const result = await supabase
        .from("custom_models")
        .insert({
          user_id: user.id,
          name: model.name,
          config: {
            basePersonality: model.basePersonality,
            temperature: model.temperature,
            maxTokens: model.maxTokens,
            topP: model.topP,
            frequencyPenalty: model.frequencyPenalty,
            presencePenalty: model.presencePenalty,
            systemPrompt: model.systemPrompt,
          },
          training_examples: model.trainingExamples,
          is_active: model.isActive,
        })
        .select()
        .single();
      
      data = result.data;
      upsertError = result.error;
    }

    if (upsertError) {
      console.error("[Save Model] Database error:", upsertError);
      throw new Error("Failed to save custom model");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Model "${model.name}" saved successfully`,
        model: {
          id: data.id,
          name: data.name,
          isActive: data.is_active,
          trainingExamplesCount: model.trainingExamples.length,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Save Model] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
