import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { optionalAuth } from "../_shared/auth.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    // Optional auth — location tracking works for anonymous visitors too
    const auth = await optionalAuth(req);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown";

    // Check existing session
    const { data: existing } = await supabase
      .from("user_locations")
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (existing) {
      await supabase
        .from("user_locations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);

      return new Response(
        JSON.stringify({ success: true, message: "Location updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geo lookup
    let geoData = { country: "Unknown", countryCode: "XX", region: "", city: "", lat: 0, lon: 0, timezone: "UTC", isp: "" };

    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp`);
      if (geoResponse.ok) {
        const data = await geoResponse.json();
        if (data.status === "success") {
          geoData = {
            country: data.country || "Unknown",
            countryCode: data.countryCode || "XX",
            region: data.region || "",
            city: data.city || "",
            lat: data.lat || 0,
            lon: data.lon || 0,
            timezone: data.timezone || "UTC",
            isp: data.isp || "",
          };
        }
      }
    } catch (geoError) {
      console.error("Geolocation API error:", geoError);
    }

    const { error: insertError } = await supabase
      .from("user_locations")
      .insert({
        session_id: sessionId,
        user_id: auth.userId || null,
        ip_address: clientIP,
        country: geoData.country,
        country_code: geoData.countryCode,
        region: geoData.region,
        city: geoData.city,
        latitude: geoData.lat,
        longitude: geoData.lon,
        timezone: geoData.timezone,
        isp: geoData.isp,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: { country: geoData.country, countryCode: geoData.countryCode, city: geoData.city, timezone: geoData.timezone },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error tracking location:", error);
    return new Response(
      JSON.stringify({ error: "Location tracking failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
