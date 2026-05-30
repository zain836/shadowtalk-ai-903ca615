import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

function getResendApiKey(): string | undefined {
  return (
    Deno.env.get("RESEND_API_KEY") ||
    Deno.env.get("Resend_api_key") ||
    Deno.env.get("resend_api_key")
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resendKey = getResendApiKey();
    if (!resendKey) {
      console.error("[send-contact-email] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Email service is not configured. Please email shadowtalk68@gmail.com directly.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const source = String(body.source ?? "Contact Page").trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
    const safeSource = escapeHtml(source);

    const subjectLine = subject
      ? `📩 ${subject} — Contact from ${name}`
      : `📩 New Contact Message from ${name}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">📩 New Contact Message</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">From ${safeSource}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151; width: 100px;">Name:</td>
              <td style="padding: 8px; color: #1f2937;">${safeName}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 8px; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px;"><a href="mailto:${safeEmail}" style="color: #6366f1;">${safeEmail}</a></td>
            </tr>
            ${subject ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">Subject:</td>
              <td style="padding: 8px; color: #1f2937;">${safeSubject}</td>
            </tr>` : ""}
          </table>
          <div style="margin-top: 16px;">
            <h3 style="color: #374151; margin-bottom: 8px; font-size: 14px;">Message:</h3>
            <div style="background: white; padding: 16px; border-radius: 8px; color: #1f2937; line-height: 1.6; border: 1px solid #e5e7eb;">
              ${safeMessage}
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

    const result = await response.json().catch(() => ({}));
    console.log("[send-contact-email] Resend status:", response.status, result);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to send email. Please try again or contact shadowtalk68@gmail.com.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-contact-email] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to send message",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
