import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const { name, email, phone, position, coverLetter, portfolioUrl, resumeUrl } = await req.json();

    if (!name || !email || !position) {
      return new Response(
        JSON.stringify({ error: "Name, email, and position are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          🚀 New Job Application - ${position}
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #374151; width: 140px;">Name:</td>
            <td style="padding: 8px; color: #1f2937;">${name}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 8px; color: #1f2937;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #374151;">Phone:</td>
            <td style="padding: 8px; color: #1f2937;">${phone || "Not provided"}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Position:</td>
            <td style="padding: 8px; color: #1f2937; font-weight: bold;">${position}</td>
          </tr>
          ${portfolioUrl ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #374151;">Portfolio:</td>
            <td style="padding: 8px;"><a href="${portfolioUrl}" style="color: #6366f1;">${portfolioUrl}</a></td>
          </tr>` : ""}
          ${resumeUrl ? `
          <tr style="background: #f9fafb;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Resume URL:</td>
            <td style="padding: 8px;"><a href="${resumeUrl}" style="color: #6366f1;">${resumeUrl}</a></td>
          </tr>` : ""}
        </table>

        ${coverLetter ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 8px;">Cover Letter / Message:</h3>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; color: #1f2937; line-height: 1.6;">
            ${coverLetter.replace(/\n/g, "<br>")}
          </div>
        </div>` : ""}

        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          Sent from ShadowTalk AI Careers Page • ${new Date().toISOString()}
        </p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "ShadowTalk AI Careers <noreply@shadowtalk.ai>",
        to: ["h23059476@gmail.com"],
        subject: `📋 Job Application: ${position} — ${name}`,
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
      JSON.stringify({ success: true, message: "Application submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send application" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
