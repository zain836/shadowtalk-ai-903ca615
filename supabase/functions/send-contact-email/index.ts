import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("Resend_api_key");
    if (!resendKey) {
      throw new Error("Resend API key not configured");
    }

    const { name, email, subject, message, source } = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subjectLine = subject
      ? `📩 ${subject} — Contact from ${name}`
      : `📩 New Contact Message from ${name}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">📩 New Contact Message</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">From ${source || "Contact Page"}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151; width: 100px;">Name:</td>
              <td style="padding: 8px; color: #1f2937;">${name}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 8px; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px;"><a href="mailto:${email}" style="color: #6366f1;">${email}</a></td>
            </tr>
            ${subject ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Subject:</td>
              <td style="padding: 8px; color: #1f2937;">${subject}</td>
            </tr>` : ""}
          </table>
          <div style="margin-top: 16px;">
            <h3 style="color: #374151; margin-bottom: 8px; font-size: 14px;">Message:</h3>
            <div style="background: white; padding: 16px; border-radius: 8px; color: #1f2937; line-height: 1.6; border: 1px solid #e5e7eb;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center;">
            ShadowTalk AI • ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "ShadowTalk AI <noreply@shadowtalk.ai>",
        to: ["h23059476@gmail.com"],
        subject: subjectLine,
        html: emailHtml,
        reply_to: email,
      }),
    });

    const result = await response.json();
    console.log("Resend response:", result);

    if (!response.ok) {
      throw new Error(`Email send failed: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send message" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
