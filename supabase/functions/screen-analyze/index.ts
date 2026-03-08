const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { screenshot, action, userPrompt } = await req.json();

    if (!screenshot) {
      return new Response(
        JSON.stringify({ success: false, error: 'Screenshot is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = '';
    
    if (action === 'clone') {
      systemPrompt = `You are an expert UI engineer. The user has shared a screenshot of their screen.
Your job is to analyze the UI shown and generate clean, modern React + Tailwind CSS code that recreates it as closely as possible.

Rules:
- Output a single React functional component using TypeScript
- Use Tailwind CSS for all styling
- Use semantic HTML elements
- Match colors, spacing, layout, and typography as closely as possible
- Include placeholder text/images where needed
- Make it responsive
- Wrap the code in a \`\`\`tsx code block
- After the code, briefly explain what you recreated

${userPrompt ? `Additional user instructions: ${userPrompt}` : ''}`;
    } else if (action === 'analyze') {
      systemPrompt = `You are a UI/UX expert analyst. The user has shared a screenshot of their screen.
Analyze it thoroughly and provide:
1. **What's on screen**: Describe every element, layout, and content visible
2. **UI/UX Assessment**: Rate the design and suggest improvements
3. **Technical Stack Guess**: Identify likely technologies used
4. **Accessibility Issues**: Flag any potential a11y problems
5. **Actionable Suggestions**: Specific improvements the user could make

${userPrompt ? `The user specifically asks: ${userPrompt}` : ''}`;
    } else {
      // Default: both analyze and offer to clone
      systemPrompt = `You are an expert UI engineer and analyst. The user has shared a screenshot of their screen.

First, briefly describe what you see on the screen.
Then, if the user's message suggests they want to recreate/clone it, generate React + Tailwind CSS code.
If they're asking questions about it, provide analysis and answers.

${userPrompt ? `User says: ${userPrompt}` : 'Describe what you see and ask if the user wants you to clone it as code.'}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: screenshot }
          },
          {
            type: 'text',
            text: userPrompt || (action === 'clone' ? 'Clone this UI as React + Tailwind code.' : action === 'analyze' ? 'Analyze this screen in detail.' : 'What do you see? Describe it and let me know if you want me to clone it.')
          }
        ]
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limited. Try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credits exhausted. Please top up.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Screen analyze error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
