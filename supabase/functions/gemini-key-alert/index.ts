import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  type: 'exhaustion' | 'usage_threshold' | 'auto_disabled';
  keyId: string;
  keyMasked: string;
  exhaustionCount?: number;
  usageCount?: number;
  reason?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping email alert");
      return new Response(
        JSON.stringify({ success: false, message: "Email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get settings
    const { data: settings } = await supabase
      .from('gemini_settings')
      .select('setting_key, setting_value');

    const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]) || []);
    
    const alertsEnabled = settingsMap.get('alerts_enabled') === 'true';
    const alertEmail = settingsMap.get('alert_email');

    if (!alertsEnabled || !alertEmail) {
      console.log("Alerts disabled or no email configured");
      return new Response(
        JSON.stringify({ success: false, message: "Alerts not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, keyId, keyMasked, exhaustionCount, usageCount, reason }: AlertRequest = await req.json();

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case 'exhaustion':
        subject = `⚠️ Gemini API Key Exhausted - ${keyMasked}`;
        htmlContent = `
          <h2>API Key Exhausted</h2>
          <p>One of your Gemini API keys has been exhausted:</p>
          <ul>
            <li><strong>Key:</strong> ${keyMasked}</li>
            <li><strong>Key ID:</strong> ${keyId}</li>
            <li><strong>Total Exhaustions:</strong> ${exhaustionCount || 'N/A'}</li>
          </ul>
          <p>The system will automatically try other available keys. The key will be reset at midnight UTC.</p>
        `;
        break;

      case 'usage_threshold':
        subject = `📊 Gemini API Key Usage Threshold Reached - ${keyMasked}`;
        htmlContent = `
          <h2>Usage Threshold Reached</h2>
          <p>One of your Gemini API keys has reached the usage threshold:</p>
          <ul>
            <li><strong>Key:</strong> ${keyMasked}</li>
            <li><strong>Key ID:</strong> ${keyId}</li>
            <li><strong>Current Usage:</strong> ${usageCount || 'N/A'} requests</li>
          </ul>
          <p>Consider adding more API keys to distribute the load.</p>
        `;
        break;

      case 'auto_disabled':
        subject = `🔴 Gemini API Key Auto-Disabled - ${keyMasked}`;
        htmlContent = `
          <h2>API Key Auto-Disabled</h2>
          <p>One of your Gemini API keys has been automatically disabled due to frequent exhaustions:</p>
          <ul>
            <li><strong>Key:</strong> ${keyMasked}</li>
            <li><strong>Key ID:</strong> ${keyId}</li>
            <li><strong>Reason:</strong> ${reason || 'Exceeded exhaustion threshold'}</li>
            <li><strong>Total Exhaustions:</strong> ${exhaustionCount || 'N/A'}</li>
          </ul>
          <p>This key will not be used until manually re-enabled from the admin dashboard.</p>
        `;
        break;
    }

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ShadowTalk AI <noreply@shadowtalk.ai>",
        to: [alertEmail],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h2 { color: #1a1a1a; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
              ul { background: #f5f5f5; padding: 20px 40px; border-radius: 8px; }
              li { margin: 10px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              ${htmlContent}
              <div class="footer">
                <p>This is an automated message from ShadowTalk AI.</p>
                <p>You can configure these alerts in the Admin Dashboard → Gemini Keys section.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email alert sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, messageId: emailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error sending alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
