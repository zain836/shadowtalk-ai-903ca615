import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-BROADCAST] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, message, type = "update", sendEmail = true, sendNotification = true } = await req.json();

    if (!subject || !message) {
      return new Response(JSON.stringify({ error: "Subject and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting broadcast", { subject, type, sendEmail, sendNotification });

    // Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    logStep("Found users", { count: users?.length });

    let emailsSent = 0;
    let notificationsCreated = 0;
    const errors: string[] = [];

    // Create in-app notifications for all users
    if (sendNotification && users?.length) {
      const notifications = users.map((u) => ({
        user_id: u.id,
        title: subject,
        message: message,
        type: type,
        action_url: null,
        metadata: { broadcast: true, sent_by: userId },
      }));

      const { error: notifError } = await supabaseAdmin
        .from("user_notifications")
        .insert(notifications);

      if (notifError) {
        logStep("Notification insert error", { error: String(notifError) });
        errors.push("Failed to create some notifications");
      } else {
        notificationsCreated = notifications.length;
      }
    }

    // Send emails via Resend
    if (sendEmail) {
      const resendKey = Deno.env.get("Resend_api_key");
      if (!resendKey) {
        errors.push("Resend API key not configured");
        logStep("No Resend API key found");
      } else {
        const validEmails = users?.filter((u) => u.email) || [];

        // Send in batches of 10
        for (let i = 0; i < validEmails.length; i += 10) {
          const batch = validEmails.slice(i, i + 10);

          const emailPromises = batch.map(async (u) => {
            try {
              const urgencyColor = type === "critical" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#1e40af";

              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, ${urgencyColor}, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 20px;">📢 ${subject}</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">ShadowTalk AI Update</p>
                  </div>
                  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${urgencyColor};">
                      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://shadowtalk-ai.lovable.app/chatbot" style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Open ShadowTalk AI →
                      </a>
                    </div>
                    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
                      You're receiving this because you have an account on ShadowTalk AI.
                    </p>
                  </div>
                </div>
              `;

              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: "ShadowTalk AI <onboarding@resend.dev>",
                  to: [u.email!],
                  subject: `📢 ${subject}`,
                  html: emailHtml,
                }),
              });

              if (res.ok) {
                emailsSent++;
              } else {
                const errBody = await res.text();
                logStep("Email send failed", { email: u.email, status: res.status, body: errBody });
              }
            } catch (e) {
              logStep("Email error", { email: u.email, error: String(e) });
            }
          });

          await Promise.all(emailPromises);
        }
      }
    }

    logStep("Broadcast complete", { emailsSent, notificationsCreated, errors });

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        notificationsCreated,
        totalUsers: users?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logStep("ERROR", { message: String(error) });
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
