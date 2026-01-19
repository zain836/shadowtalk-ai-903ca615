import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId, userId } = await req.json();

    // Get client IP from request headers
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-real-ip")
      || "unknown";

    console.log("Tracking location for session:", sessionId, "IP:", clientIP);

    // Check if we already have this session
    const { data: existing } = await supabase
      .from("user_locations")
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (existing) {
      // Update last seen
      await supabase
        .from("user_locations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);

      return new Response(
        JSON.stringify({ success: true, message: "Location updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use ip-api.com (free, no API key required, 45 requests/minute)
    let geoData = {
      country: "Unknown",
      countryCode: "XX",
      region: "",
      city: "",
      lat: 0,
      lon: 0,
      timezone: "UTC",
      isp: "",
    };

    try {
      // ip-api.com is free and doesn't require an API key
      const geoResponse = await fetch(
        `http://ip-api.com/json/${clientIP}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp`
      );
      
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
      // Continue with default values
    }

    // Insert new location record
    const { error: insertError } = await supabase
      .from("user_locations")
      .insert({
        session_id: sessionId,
        user_id: userId || null,
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
        location: {
          country: geoData.country,
          countryCode: geoData.countryCode,
          city: geoData.city,
          timezone: geoData.timezone,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error tracking location:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
