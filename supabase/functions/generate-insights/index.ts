import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === 'OPTIONS') {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { user_id, memories, recent_topics } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context from user's memories and recent activity
    const memoryContext = (memories || []).slice(0, 10).map((m: any) => m.content).join('; ');
    const topicsContext = (recent_topics || []).slice(0, 5).join(', ');

    const prompt = `You are ShadowTalk AI's Proactive Intelligence Engine. Generate 3 personalized daily insights for this user.

User context:
- Known about user: ${memoryContext || 'New user, no memories yet'}
- Recent conversation topics: ${topicsContext || 'General AI usage'}
- Current date: ${new Date().toISOString().split('T')[0]}

Generate exactly 3 insights in this JSON format:
[
  {
    "title": "Short actionable title (max 60 chars)",
    "content": "2-3 sentence insight that's genuinely useful. Be specific, not generic.",
    "category": "one of: productivity, tech, industry, security, opportunity"
  }
]

Rules:
- Each insight must feel personalized based on user context
- Include at least one actionable recommendation
- Reference specific trends, tools, or strategies
- Never be generic like "stay updated" or "keep learning"
- Be the kind of insight that makes someone think "I'm glad I checked ShadowTalk today"

Return ONLY the JSON array, no other text.`;

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let insights;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch {
      insights = [
        {
          title: "Your AI is getting smarter",
          content: "Every conversation you have with ShadowTalk builds your personal knowledge graph. No other AI remembers your preferences, projects, and goals like this.",
          category: "productivity"
        }
      ];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
