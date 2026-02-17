import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  // Require authentication
  const auth = await requireAuth(req, corsHeaders);
  if (!auth.authenticated) return auth.response;

  try {
    const { query, numResults = 5 } = await req.json();

    if (!query || typeof query !== "string" || query.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid query (max 500 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const searchEngineId = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    if (!apiKey || !searchEngineId) {
      console.error("Google Search credentials not configured");
      return new Response(JSON.stringify({ error: "Web search not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[WEB-SEARCH] User ${auth.userId} searching for: "${query}"`);

    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("cx", searchEngineId);
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("num", String(Math.min(Math.max(1, numResults), 10)));

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error("Google Search API error:", data);
      return new Response(JSON.stringify({ error: data.error?.message || "Search failed" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }));

    return new Response(
      JSON.stringify({ success: true, results, totalResults: data.searchInformation?.totalResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Web search error:", error);
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
