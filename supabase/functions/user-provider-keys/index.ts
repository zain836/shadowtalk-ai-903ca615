import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { encryptApiKey, keyPrefix } from "../_shared/byok-crypto.ts";
import { isValidProvider, verifyProviderApiKey } from "../_shared/verify-provider-key.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function checkRate(userId: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(userId);
  if (!rec || now > rec.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= RATE_LIMIT) return false;
  rec.count++;
  return true;
}

async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !data?.user) return null;
  return data.user;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  try {
    const user = await getUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRate(user.id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    let body: Record<string, unknown> = {};
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }
    const action =
      (typeof body.action === "string" ? body.action : null) ||
      url.searchParams.get("action") ||
      (req.method === "GET" ? "list" : "list");

    if (action === "list") {
      const { data, error } = await admin
        .from("user_provider_keys")
        .select("id, provider, label, key_prefix, verified_at, is_active, is_default, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ keys: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const { provider, apiKey } = body;
      if (!isValidProvider(provider)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid provider" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await verifyProviderApiKey(provider, apiKey);
      return new Response(JSON.stringify({ success: result.ok, message: result.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      const { provider, apiKey, label, setAsDefault } = body;
      if (!isValidProvider(provider) || typeof apiKey !== "string") {
        return new Response(JSON.stringify({ success: false, error: "Invalid request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const verification = await verifyProviderApiKey(provider, apiKey);
      if (!verification.ok) {
        return new Response(JSON.stringify({ success: false, error: verification.message }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ciphertext = await encryptApiKey(apiKey.trim());
      const now = new Date().toISOString();

      if (setAsDefault) {
        await admin
          .from("user_provider_keys")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data: saved, error: saveError } = await admin
        .from("user_provider_keys")
        .upsert(
          {
            user_id: user.id,
            provider,
            label: label?.trim() || null,
            key_prefix: keyPrefix(apiKey),
            key_ciphertext: ciphertext,
            verified_at: now,
            is_active: true,
            is_default: !!setAsDefault,
            updated_at: now,
          },
          { onConflict: "user_id,provider" },
        )
        .select("id, provider, label, key_prefix, verified_at, is_active, is_default, created_at, updated_at")
        .single();

      if (saveError) throw saveError;

      await admin.from("user_settings").upsert(
        {
          user_id: user.id,
          setting_key: "ai_config",
          setting_value: {
            preferredProvider: provider,
            useCustomKey: true,
            configuredAt: now,
          },
          updated_at: now,
        },
        { onConflict: "user_id,setting_key" },
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: verification.message,
          key: saved,
          configured: { preferredProvider: provider, useCustomKey: true },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "set-default") {
      const { provider } = body;
      if (!isValidProvider(provider)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid provider" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin.from("user_provider_keys").update({ is_default: false }).eq("user_id", user.id);
      const { error } = await admin
        .from("user_provider_keys")
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("provider", provider);

      if (error) throw error;

      await admin.from("user_settings").upsert(
        {
          user_id: user.id,
          setting_key: "ai_config",
          setting_value: { preferredProvider: provider, useCustomKey: true },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,setting_key" },
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { provider } = body;
      if (!isValidProvider(provider)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid provider" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await admin
        .from("user_provider_keys")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", provider);

      if (error) throw error;

      const { data: remaining } = await admin
        .from("user_provider_keys")
        .select("provider, is_default")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const nextDefault = remaining?.find((k) => k.is_default) || remaining?.[0];
      await admin.from("user_settings").upsert(
        {
          user_id: user.id,
          setting_key: "ai_config",
          setting_value: nextDefault
            ? { preferredProvider: nextDefault.provider, useCustomKey: true }
            : { preferredProvider: null, useCustomKey: false },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,setting_key" },
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[user-provider-keys]", err);
    const msg = err instanceof Error ? err.message : String(err);
    const isMissingTable =
      msg.includes("user_provider_keys") &&
      (msg.includes("does not exist") || msg.includes("PGRST205") || msg.includes("42P01"));
    const clientMessage = isMissingTable
      ? "Database table user_provider_keys is missing. Run the Supabase migration, then redeploy this function."
      : msg.includes("SUPABASE_SERVICE_ROLE_KEY")
        ? "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is required."
        : "Internal server error";
    return new Response(JSON.stringify({ error: clientMessage, details: msg }), {
      status: isMissingTable ? 503 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
