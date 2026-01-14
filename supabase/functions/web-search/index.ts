import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, numResults = 5 } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AIzaSyApab-8gpoG739QFGoMHERvIglR9KUpmLk");
    const searchEngineId = Deno.env.get("32505dc3078844606");

    if (!apiKey || !searchEngineId) {
      console.error("Google Search credentials not configured");
      return new Response(JSON.stringify({ error: "Web search not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[WEB-SEARCH] Searching for: "${query}"`);

    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("cx", searchEngineId);
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("num", String(Math.min(numResults, 10)));

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

    console.log(`[WEB-SEARCH] Found ${results.length} results`);

    return new Response(
      JSON.stringify({ success: true, results, totalResults: data.searchInformation?.totalResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Web search error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Search failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
