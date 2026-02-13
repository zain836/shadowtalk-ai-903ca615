import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[DAILY-MARKET-CHECK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Starting daily market check");

    // Get all users who have strategy reports saved as business memories
    const { data: memories, error: memError } = await supabaseAdmin
      .from('business_memories')
      .select('user_id, title, content, category')
      .eq('category', 'strategy_report')
      .eq('is_active', true);

    if (memError) throw memError;
    if (!memories || memories.length === 0) {
      logStep("No strategy reports in business memories");
      return new Response(JSON.stringify({ message: "No reports to check" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Found strategy memories", { count: memories.length });

    // Group by user
    const userMemories: Record<string, typeof memories> = {};
    for (const m of memories) {
      if (!userMemories[m.user_id]) userMemories[m.user_id] = [];
      userMemories[m.user_id].push(m);
    }

    const geminiKey = Deno.env.get("Gemini_1api");
    const resendKey = Deno.env.get("Resend_api_key");
    let notificationsSent = 0;

    for (const [userId, userMems] of Object.entries(userMemories)) {
      try {
        // Get user email from auth
        const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userErr || !user?.email) continue;

        // Build a summary of their saved businesses
        const businessSummary = userMems.map(m => `- ${m.title}: ${m.content.substring(0, 200)}`).join('\n');

        // Ask AI for market updates
        const aiPrompt = `You are a market intelligence analyst. Given these saved business strategies, provide a brief market update for each one. Focus ONLY on new developments, regulatory changes, competitor moves, or market shifts that happened recently in 2026.

Saved Business Strategies:
${businessSummary}

Respond with a JSON array:
[{"business": "name", "hasUpdate": true/false, "update": "Brief 2-3 sentence update about what changed", "urgency": "low"|"medium"|"high"}]

Only set hasUpdate=true if there's something genuinely new or notable. Don't fabricate updates.`;

        if (!geminiKey) {
          logStep("No Gemini key, skipping AI check");
          continue;
        }

        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: aiPrompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
          }
        );

        if (!aiResponse.ok) {
          logStep("AI request failed", { status: aiResponse.status });
          continue;
        }

        const aiData = await aiResponse.json();
        const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Parse updates
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) continue;

        const updates = JSON.parse(jsonMatch[0]);
        const relevantUpdates = updates.filter((u: any) => u.hasUpdate);

        if (relevantUpdates.length === 0) {
          logStep("No updates for user", { userId });
          continue;
        }

        // Create in-app notification
        const updateMessage = relevantUpdates
          .map((u: any) => `📊 ${u.business}: ${u.update}`)
          .join('\n\n');

        await supabaseAdmin.from('user_notifications').insert({
          user_id: userId,
          title: `🔔 Market Update: ${relevantUpdates.length} business${relevantUpdates.length > 1 ? 'es' : ''} affected`,
          message: updateMessage + '\n\nWould you like an updated strategy report?',
          type: 'market_update',
          action_url: '/strategy',
          metadata: { updates: relevantUpdates },
        });

        // Send email via Resend
        if (resendKey) {
          try {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">📊 ShadowTalk Market Alert</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Daily intelligence for your saved businesses</p>
                </div>
                <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                  ${relevantUpdates.map((u: any) => `
                    <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${u.urgency === 'high' ? '#ef4444' : u.urgency === 'medium' ? '#f59e0b' : '#22c55e'};">
                      <h3 style="margin: 0 0 8px; font-size: 16px;">${u.business}</h3>
                      <p style="margin: 0; color: #64748b; font-size: 14px;">${u.update}</p>
                    </div>
                  `).join('')}
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="https://shadowtalk-ai.lovable.app/strategy" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      Generate Updated Report →
                    </a>
                  </div>
                  <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
                    You're receiving this because you saved a strategy report on ShadowTalk AI.
                  </p>
                </div>
              </div>
            `;

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: "ShadowTalk AI <onboarding@resend.dev>",
                to: [user.email],
                subject: `📊 Market Update: ${relevantUpdates.length} change${relevantUpdates.length > 1 ? 's' : ''} detected`,
                html: emailHtml,
              }),
            });

            logStep("Email sent", { userId, email: user.email });
          } catch (emailErr) {
            logStep("Email send failed", { error: String(emailErr) });
          }
        }

        notificationsSent++;
      } catch (userErr) {
        logStep("Error processing user", { userId, error: String(userErr) });
      }
    }

    logStep("Daily check complete", { notificationsSent });

    return new Response(JSON.stringify({ 
      success: true, 
      notificationsSent,
      usersChecked: Object.keys(userMemories).length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("ERROR", { message: String(error) });
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
