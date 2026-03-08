import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOPICS = [
  { category: "AI & Technology", themes: ["Edge AI deployment strategies", "LLM fine-tuning best practices", "AI agent architectures", "Privacy-preserving machine learning", "Multi-model orchestration patterns", "RAG pipeline optimization", "AI-powered code generation trends", "On-device AI inference breakthroughs"] },
  { category: "Cybersecurity", themes: ["Zero-day vulnerability analysis", "MITRE ATT&CK framework updates", "Bug bounty hunting strategies", "SOC automation with AI", "Threat intelligence platforms", "Penetration testing methodologies", "Supply chain attack prevention", "Cloud security posture management"] },
  { category: "Product Updates", themes: ["New platform feature deep-dives", "Performance optimization wins", "User experience improvements", "Integration capabilities expansion", "Security hardening updates", "API enhancements and new endpoints"] },
  { category: "Tutorials", themes: ["Building AI chatbots from scratch", "Setting up automated security scans", "Creating custom AI workflows", "Prompt engineering masterclass", "Data pipeline automation guides", "Building privacy-first applications"] },
  { category: "Industry Insights", themes: ["State of AI in enterprise", "Cybersecurity market trends", "Open-source AI ecosystem", "Regulatory compliance updates", "Digital sovereignty movement", "Developer productivity with AI"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pick a random category and theme
    const categoryObj = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const theme = categoryObj.themes[Math.floor(Math.random() * categoryObj.themes.length)];
    const category = categoryObj.category;

    // Check we haven't published this theme recently
    const { data: recent } = await supabase
      .from("blog_posts")
      .select("title")
      .order("published_at", { ascending: false })
      .limit(10);
    
    const recentTitles = (recent || []).map((p: any) => p.title?.toLowerCase() || "");

    // Generate blog post via Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior tech writer for ShadowTalk AI, a privacy-first AI platform with cybersecurity tools. Write engaging, technically accurate blog posts. 
            
Rules:
- Write in a professional but accessible tone
- Include practical insights and actionable takeaways
- Reference real technologies, frameworks, and tools
- Never use filler phrases like "in today's world" or "it's no secret"
- Keep paragraphs short (2-3 sentences max)
- Include section headers using ## markdown
- Target 800-1200 words
- End with a compelling conclusion
- Do NOT mention competitors by name negatively`,
          },
          {
            role: "user",
            content: `Write a blog post about: "${theme}" in the ${category} category.

Recent titles to AVOID similar topics: ${recentTitles.join(", ")}

Return ONLY valid JSON with this exact structure:
{
  "title": "Compelling, SEO-friendly title (50-70 chars)",
  "excerpt": "Engaging summary in 1-2 sentences (120-160 chars)",
  "content": "Full markdown blog content with ## headers",
  "tags": ["tag1", "tag2", "tag3"],
  "read_time_minutes": 5
}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_blog_post",
              description: "Create a new blog post with structured data",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Blog post title" },
                  excerpt: { type: "string", description: "Short summary" },
                  content: { type: "string", description: "Full markdown content" },
                  tags: { type: "array", items: { type: "string" }, description: "Relevant tags" },
                  read_time_minutes: { type: "number", description: "Estimated read time" },
                },
                required: ["title", "excerpt", "content", "tags", "read_time_minutes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_blog_post" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, will retry later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const blog = JSON.parse(toolCall.function.arguments);
    
    // Generate slug
    const slug = blog.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);

    // Insert into DB
    const { data: inserted, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: blog.title,
        slug: `${slug}-${Date.now()}`,
        excerpt: blog.excerpt,
        content: blog.content,
        category,
        author: "ShadowTalk AI",
        tags: blog.tags || [],
        read_time_minutes: blog.read_time_minutes || 5,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    console.log(`[BLOG] Generated: "${blog.title}" in ${category}`);

    return new Response(
      JSON.stringify({ success: true, post: { id: inserted.id, title: blog.title, category } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-blog error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
