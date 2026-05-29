import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // GET = Twilio webhook verification
    if (req.method === "GET") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const contentType = req.headers.get("content-type") || "";

    // Twilio sends form-encoded data for incoming messages
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return await handleIncomingTwilio(req, supabaseAdmin, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    // JSON requests from our app require auth
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;

    const { userId } = auth;
    await checkRateLimit(userId, supabaseAdmin);

    const json = await req.json();
    const { action, phoneNumber, code } = json;
    const userId = auth.userId;

    switch (action) {
      case "link":
        return await handleLinkCreation(supabaseAdmin, userId, phoneNumber, corsHeaders);
      case "verify":
        return await handleVerification(supabaseAdmin, userId, phoneNumber, code, corsHeaders);
      case "unlink":
        return await handleUnlink(supabaseAdmin, userId, phoneNumber, corsHeaders);
      default:
        return jsonResponse({ error: "Unknown action" }, 400, corsHeaders);
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
      corsHeaders
    );
  }
});

// ─── Link Management ───────────────────────────────────────────
async function handleLinkCreation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  phoneNumber: string,
  corsHeaders: Record<string, string>
) {
  if (!phoneNumber || phoneNumber.length < 10) {
    return jsonResponse({ error: "Invalid phone number" }, 400, corsHeaders);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Deactivate existing links for this user
  await supabase
    .from("whatsapp_links")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  // Create new link
  const { error } = await supabase.from("whatsapp_links").insert({
    user_id: userId,
    phone_number: phoneNumber,
    verification_code: code,
    verification_expires_at: expiresAt,
    is_verified: false,
    is_active: true,
  });

  if (error) {
    console.error("[WhatsApp] Link creation error:", error);
    return jsonResponse({ error: error.message }, 500, corsHeaders);
  }

  await sendWhatsAppReply(
    phoneNumber,
    `Your ShadowTalk verification code is: *${code}*\n\nEnter this code in the app to complete linking.\nThis code expires in 10 minutes.`
  );

  return jsonResponse({ success: true, message: "Verification code sent" }, 200, corsHeaders);
}

async function handleVerification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  phoneNumber: string,
  code: string,
  corsHeaders: Record<string, string>
) {
  if (!phoneNumber || !code || code.length !== 6) {
    return jsonResponse({ error: "Missing or invalid fields" }, 400, corsHeaders);
  }

  const { data: link, error } = await supabase
    .from("whatsapp_links")
    .select("*")
    .eq("user_id", userId)
    .eq("phone_number", phoneNumber)
    .eq("is_active", true)
    .eq("is_verified", false)
    .single();

  if (error || !link) {
    return jsonResponse({ error: "No pending verification found" }, 404, corsHeaders);
  }

  if (link.verification_code !== code) {
    return jsonResponse({ error: "Invalid verification code" }, 400, corsHeaders);
  }

  if (link.verification_expires_at && new Date(link.verification_expires_at) < new Date()) {
    return jsonResponse({ error: "Verification code expired. Request a new one." }, 400, corsHeaders);
  }

  await supabase
    .from("whatsapp_links")
    .update({
      is_verified: true,
      verification_code: null,
      verification_expires_at: null,
    })
    .eq("id", link.id);

  await sendWhatsAppReply(
    phoneNumber,
    `ShadowTalk Connected!\n\nYou can now chat with ShadowTalk AI directly from WhatsApp.\n\nType /help to see available commands, or just send a message to start chatting.`
  );

  return jsonResponse({ success: true, verified: true }, 200, corsHeaders);
}

async function handleUnlink(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  phoneNumber: string,
  corsHeaders: Record<string, string>
) {
  const { error } = await supabase
    .from("whatsapp_links")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    return jsonResponse({ error: error.message }, 500, corsHeaders);
  }

  if (phoneNumber) {
    await sendWhatsAppReply(phoneNumber, "Your WhatsApp has been unlinked from ShadowTalk AI. You can re-link anytime from the app.");
  }

  return jsonResponse({ success: true }, 200, corsHeaders);
}

// ─── Incoming Twilio Handler ───────────────────────────────────
async function handleIncomingTwilio(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const formData = await req.text();
  const params = new URLSearchParams(formData);
  const from = (params.get("From") || "").replace("whatsapp:", "").trim();
  const body = (params.get("Body") || "").trim();

  if (!from || !body) {
    return twimlResponse("");
  }

  console.log(`[WhatsApp] Incoming from ${from}: ${body.substring(0, 100)}`);

  // Find linked user
  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("*")
    .eq("phone_number", from)
    .eq("is_verified", true)
    .eq("is_active", true)
    .single();

  if (!link) {
    await sendWhatsAppReply(from, "This number isn't linked to a ShadowTalk account. Visit shadowtalk-ai.lovable.app and go to Profile → WhatsApp to connect.");
    return twimlResponse("");
  }

  // Update stats
  await supabase
    .from("whatsapp_links")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: (link.message_count || 0) + 1,
    })
    .eq("id", link.id);

  // Handle slash commands
  if (body.startsWith("/")) {
    const response = await handleCommand(supabase, body, link.user_id, supabaseUrl, serviceRoleKey);
    await sendWhatsAppReply(from, response);
    return twimlResponse("");
  }

  // Natural language → AI
  const aiResponse = await processAIChat(body, link.user_id, supabaseUrl, serviceRoleKey);
  await sendWhatsAppReply(from, aiResponse);
  return twimlResponse("");
}

// ─── Command Handler ───────────────────────────────────────────
async function handleCommand(
  supabase: ReturnType<typeof createClient>,
  command: string,
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string> {
  const parts = command.split(" ");
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");

  switch (cmd) {
    case "/help":
      return `ShadowTalk Commands:\n\n/search <query> — Web search\n/status — Account status\n/help — Show this menu\n\nOr just type naturally to chat with AI.`;

    case "/search":
      if (!args) return "Usage: /search <query>\nExample: /search latest AI news";
      return await processAIChat(`Search the web for: ${args}`, userId, supabaseUrl, serviceRoleKey);

    case "/status": {
      const { data: credits } = await supabase
        .from("shadow_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      return `Account Status\nCredits: ${credits?.balance || 0}\nChannel: WhatsApp — Active`;
    }

    default:
      return `Unknown command: ${cmd}\nType /help for available commands.`;
  }
}

// ─── AI Chat Processing ────────────────────────────────────────
async function processAIChat(
  message: string,
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        sessionId: `whatsapp-${userId}`,
        personality: "sovereign",
        isWhatsApp: true,
      }),
    });

    if (!response.ok) {
      console.error("[WhatsApp] Chat API error:", response.status);
      return "I'm having trouble processing your request. Please try again shortly.";
    }

    const reader = response.body?.getReader();
    if (!reader) return "Error processing response.";

    let fullText = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    // Clean markdown for WhatsApp plain text
    let cleaned = fullText
      .replace(/```[\s\S]*?```/g, "[code block]")
      .replace(/\*\*\*(.*?)\*\*\*/g, "*$1*")
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    if (cleaned.length > 1500) {
      cleaned = cleaned.substring(0, 1497) + "...";
    }

    return cleaned || "I processed your request but had no response to share.";
  } catch (error) {
    console.error("[WhatsApp] AI processing error:", error);
    return "Sorry, I couldn't process that right now. Please try again.";
  }
}

// ─── Twilio Helpers ────────────────────────────────────────────
async function sendWhatsAppReply(to: string, message: string) {
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.error("[WhatsApp] Twilio credentials not configured");
    return;
  }

  const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith("whatsapp:")
    ? TWILIO_WHATSAPP_NUMBER
    : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: formattedFrom, To: formattedTo, Body: message }),
    }
  );

  if (!response.ok) {
    const errData = await response.json();
    console.error("[WhatsApp] Twilio send error:", errData);
  }
}

function twimlResponse(message: string) {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(body, { status: 200, headers: { "Content-Type": "text/xml" } });
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
