import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";


serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("Resend_api_key");
    if (!resendKey) throw new Error("Resend API key not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { subject, features, preview_only } = await req.json();

    if (!subject || !features || !Array.isArray(features) || features.length === 0) {
      return new Response(
        JSON.stringify({ error: "subject and features[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all subscribed users
    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("email")
      .eq("subscribed", true);

    if (subError) throw new Error(`Failed to fetch subscribers: ${subError.message}`);

    const emails = [...new Set((subscribers || []).map(s => s.email).filter(Boolean))];

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No subscribed users found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build feature list HTML
    const featuresHtml = features.map((f: { title: string; description: string; emoji?: string }) => `
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid rgba(124,58,237,0.1);">
          <div style="font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px;">
            ${f.emoji || "✨"} ${f.title}
          </div>
          <div style="font-size: 14px; color: #64748b; line-height: 1.5;">
            ${f.description}
          </div>
        </td>
      </tr>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0; padding:0; background:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width:600px; margin:0 auto; padding:20px;">
          <div style="background: linear-gradient(135deg, #7c3aed, #3b82f6); padding:32px; border-radius:16px 16px 0 0; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:24px;">🚀 What's New in ShadowTalk AI</h1>
            <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:14px;">Latest features & updates</p>
          </div>
          <div style="background:#ffffff; padding:0; border-radius:0 0 16px 16px;">
            <table style="width:100%; border-collapse:collapse;">
              ${featuresHtml}
            </table>
            <div style="padding:24px; text-align:center;">
              <a href="https://shadowtalk-ai.lovable.app/changelog" 
                 style="display:inline-block; background:linear-gradient(135deg,#7c3aed,#3b82f6); color:#fff; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
                View Full Changelog →
              </a>
            </div>
            <div style="padding:16px 24px; text-align:center; border-top:1px solid #f1f5f9;">
              <p style="color:#94a3b8; font-size:11px; margin:0;">
                You're receiving this because you subscribed to ShadowTalk AI updates.<br>
                <a href="https://shadowtalk-ai.lovable.app/settings" style="color:#7c3aed;">Manage preferences</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Preview mode - return HTML and recipient count without sending
    if (preview_only) {
      return new Response(
        JSON.stringify({ preview: true, recipientCount: emails.length, html: emailHtml }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send in batches of 50 (Resend batch limit)
    const batchSize = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      // Use BCC approach - send one email per batch
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "ShadowTalk AI <noreply@shadowtalk.ai>",
          to: batch,
          subject,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        sent += batch.length;
      } else {
        const err = await response.text();
        console.error(`Batch send failed:`, err);
        failed += batch.length;
      }
    }

    console.log(`Broadcast complete: ${sent} sent, ${failed} failed out of ${emails.length}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: emails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
