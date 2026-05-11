import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return handleCorsOptions(origin);

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { url, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Fetch website content
    console.log("Fetching website:", url);
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const siteResponse = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!siteResponse.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch website: ${siteResponse.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await siteResponse.text();
    
    // Extract meaningful text content from HTML
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // Limit context

    // Extract meta information
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i);
    const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, ''));
    const h2Matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, ''));

    const siteData = {
      url: formattedUrl,
      title: titleMatch?.[1] || '',
      description: descMatch?.[1] || '',
      ogImage: ogImageMatch?.[1] || '',
      headings: { h1: h1Matches.slice(0, 10), h2: h2Matches.slice(0, 20) },
      textContent,
    };

    if (action === "analyze") {
      // Generate a professional analysis plan
      const analyzePrompt = `You are an elite business analyst and presentation strategist. You've been given a website to analyze. Your task is to create a COMPREHENSIVE ANALYSIS PLAN that will be used to generate a world-class presentation.

WEBSITE DATA:
- URL: ${siteData.url}
- Title: ${siteData.title}
- Description: ${siteData.description}
- Main Headings: ${JSON.stringify(siteData.headings)}
- Content Preview: ${siteData.textContent.slice(0, 8000)}

Create a detailed analysis document in the following JSON format:
{
  "companyName": "Extracted company/product name",
  "tagline": "Core value proposition in one line",
  "industry": "Primary industry/sector",
  "websiteAnalysis": {
    "overallScore": 85,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "uniqueSellingPoints": ["usp1", "usp2", "usp3"],
    "targetAudience": "Description of target audience",
    "competitivePosition": "Market positioning analysis"
  },
  "presentationPlan": {
    "recommendedTitle": "Bold, provocative presentation title",
    "narrativeArc": "Brief description of the story arc",
    "slides": [
      {
        "slideNumber": 1,
        "purpose": "Title",
        "title": "Suggested slide title",
        "keyPoints": ["point1", "point2"],
        "dataToInclude": "What data/metrics to feature",
        "visualStyle": "Description of visual approach"
      }
    ],
    "recommendedTheme": "corporate|startup|academic|creative|minimal|dark_elegance",
    "estimatedSlideCount": 10
  },
  "researchInsights": {
    "marketSize": "Estimated market size with source",
    "growthRate": "Industry growth rate",
    "keyCompetitors": ["competitor1", "competitor2"],
    "trendingTopics": ["trend1", "trend2"],
    "relevantStatistics": ["stat1", "stat2", "stat3"]
  },
  "qualityChecklist": {
    "hasValueProposition": true,
    "hasPricingInfo": false,
    "hasTestimonials": false,
    "hasTechStack": true,
    "hasTeamInfo": false,
    "contentDensity": "high|medium|low"
  }
}

Generate exactly 10 slides in the plan. Be specific, use precise numbers (not round), and make every insight actionable.
Return ONLY valid JSON. No markdown fences.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a world-class business analyst. Return ONLY valid JSON." },
            { role: "user", content: analyzePrompt },
          ],
          temperature: 0.5,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const aiData = await aiResponse.json();
      let raw = aiData.choices?.[0]?.message?.content || '';
      raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      raw = raw.replace(/(?<=":[ ]*")((?:[^"\\]|\\.)*)(?=")/g, (match: string) => {
        return match.replace(/[\x00-\x1F\x7F]/g, (ch: string) => {
          if (ch === '\n') return '\\n';
          if (ch === '\r') return '\\r';
          if (ch === '\t') return '\\t';
          return '';
        });
      });

      const plan = JSON.parse(raw);
      return new Response(JSON.stringify({ plan, siteData: { url: siteData.url, title: siteData.title, description: siteData.description } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("analyze-website error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
