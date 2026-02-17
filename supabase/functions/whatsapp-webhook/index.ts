import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // GET = Twilio webhook verification
    if (req.method === "GET") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // POST = incoming WhatsApp message from Twilio
    const contentType = req.headers.get("content-type") || "";
    
    let from = "";
    let body = "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio sends form-encoded data
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      from = params.get("From") || "";
      body = params.get("Body") || "";
    } else {
      // JSON (for internal testing / link verification)
      const json = await req.json();
      
      // Handle link verification request from our app
      if (json.action === "verify") {
        return await handleVerification(supabase, json);
      }
      
      // Handle link creation from our app
      if (json.action === "link") {
        return await handleLinkCreation(supabase, json);
      }

      // Handle unlink
      if (json.action === "unlink") {
        return await handleUnlink(supabase, json);
      }

      // Handle send verification code
      if (json.action === "send_code") {
        return await handleSendCode(supabase, json);
      }
      
      from = json.From || json.from || "";
      body = json.Body || json.body || "";
    }

    if (!from || !body) {
      return new Response("Missing From or Body", { status: 400, headers: corsHeaders });
    }

    // Strip whatsapp: prefix for lookup
    const phoneNumber = from.replace("whatsapp:", "").trim();
    
    console.log(`[WhatsApp] Incoming from ${phoneNumber}: ${body.substring(0, 100)}`);

    // Look up linked user
    const { data: link } = await supabase
      .from("whatsapp_links")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("is_verified", true)
      .eq("is_active", true)
      .single();

    if (!link) {
      // Not linked - send welcome/link instructions
      await sendWhatsAppReply(
        from,
        "👋 Welcome to ShadowTalk AI!\n\nYour number isn't linked yet. Visit shadowtalk-ai.lovable.app and go to Settings → WhatsApp to connect your account.\n\nYou'll receive a verification code to complete the setup."
      );
      return twimlResponse();
    }

    // Check if this is a command
    const isCommand = body.trim().startsWith("/");
    let aiResponse = "";

    if (isCommand) {
      aiResponse = await handleCommand(supabase, body.trim(), link.user_id);
    } else {
      // Process through AI chat
      aiResponse = await processAIChat(supabase, body, link.user_id);
    }

    // Update stats
    await supabase
      .from("whatsapp_links")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (link.message_count || 0) + 1,
      })
      .eq("id", link.id);

    // Send reply via Twilio
    await sendWhatsAppReply(from, aiResponse);

    return twimlResponse();
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Command Handler ───────────────────────────────────────────
async function handleCommand(supabase: ReturnType<typeof createClient>, command: string, userId: string): Promise<string> {
  const parts = command.split(" ");
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");

  switch (cmd) {
    case "/help":
      return `🤖 *ShadowTalk Commands:*\n\n` +
        `/search <query> — Web search\n` +
        `/calendar — View upcoming events\n` +
        `/email — Check recent emails\n` +
        `/remind <text> — Set a reminder\n` +
        `/status — Account status\n` +
        `/help — Show this menu\n\n` +
        `Or just type naturally to chat with AI!`;

    case "/search":
      if (!args) return "Usage: /search <query>";
      return await processAIChat(supabase, `Search the web for: ${args}`, userId);

    case "/calendar":
      return await processAIChat(supabase, "Show me my upcoming calendar events", userId);

    case "/email":
      return await processAIChat(supabase, "Check my recent emails", userId);

    case "/status": {
      const { data: credits } = await supabase
        .from("shadow_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      return `📊 *Account Status*\nCredits: ${credits?.balance || 0}\nChannel: WhatsApp ✅`;
    }

    case "/remind":
      if (!args) return "Usage: /remind <what to remember>";
      return await processAIChat(supabase, `Set a reminder: ${args}`, userId);

    default:
      return `Unknown command: ${cmd}\nType /help for available commands.`;
  }
}

// ─── AI Chat Processing ────────────────────────────────────────
async function processAIChat(supabase: ReturnType<typeof createClient>, message: string, userId: string): Promise<string> {
  try {
    // Call the existing chat edge function internally
    const chatUrl = `${SUPABASE_URL}/functions/v1/chat`;
    
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
      return "I'm having trouble processing your request. Please try again in a moment.";
    }

    // Handle streaming response - collect all chunks
    const reader = response.body?.getReader();
    if (!reader) return "Error processing response.";

    let fullText = "";
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    // Clean up the response for WhatsApp (remove markdown, limit length)
    let cleaned = fullText
      .replace(/```[\s\S]*?```/g, "[code block]")
      .replace(/\*\*\*(.*?)\*\*\*/g, "*$1*")
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    // WhatsApp has a 1600 char limit
    if (cleaned.length > 1500) {
      cleaned = cleaned.substring(0, 1497) + "...";
    }

    return cleaned || "I processed your request but had no response to share.";
  } catch (error) {
    console.error("[WhatsApp] AI processing error:", error);
    return "Sorry, I couldn't process that right now. Please try again.";
  }
}

// ─── Link Management ───────────────────────────────────────────
async function handleLinkCreation(supabase: ReturnType<typeof createClient>, json: Record<string, string>) {
  const { userId, phoneNumber } = json;
  if (!userId || !phoneNumber) {
    return jsonResponse({ error: "Missing userId or phoneNumber" }, 400);
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Upsert the link
  const { error } = await supabase
    .from("whatsapp_links")
    .upsert({
      user_id: userId,
      phone_number: phoneNumber,
      verification_code: code,
      verification_expires_at: expiresAt,
      is_verified: false,
      is_active: true,
    }, { onConflict: "phone_number" });

  if (error) {
    console.error("[WhatsApp] Link creation error:", error);
    return jsonResponse({ error: error.message }, 500);
  }

  // Send verification code via WhatsApp
  const formattedTo = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;
  await sendWhatsAppReply(
    formattedTo,
    `🔐 Your ShadowTalk verification code is: *${code}*\n\nEnter this code in the app to complete linking.\nThis code expires in 10 minutes.`
  );

  return jsonResponse({ success: true, message: "Verification code sent" });
}

async function handleVerification(supabase: ReturnType<typeof createClient>, json: Record<string, string>) {
  const { userId, phoneNumber, code } = json;
  if (!userId || !phoneNumber || !code) {
    return jsonResponse({ error: "Missing fields" }, 400);
  }

  const { data: link, error } = await supabase
    .from("whatsapp_links")
    .select("*")
    .eq("user_id", userId)
    .eq("phone_number", phoneNumber)
    .single();

  if (error || !link) {
    return jsonResponse({ error: "Link not found" }, 404);
  }

  if (link.verification_code !== code) {
    return jsonResponse({ error: "Invalid verification code" }, 400);
  }

  if (new Date(link.verification_expires_at) < new Date()) {
    return jsonResponse({ error: "Verification code expired" }, 400);
  }

  // Mark as verified
  await supabase
    .from("whatsapp_links")
    .update({
      is_verified: true,
      verification_code: null,
      verification_expires_at: null,
    })
    .eq("id", link.id);

  // Send welcome message
  const formattedTo = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;
  await sendWhatsAppReply(
    formattedTo,
    `✅ *ShadowTalk Connected!*\n\nYou can now chat with ShadowTalk AI directly from WhatsApp.\n\nType /help to see available commands, or just send a message to start chatting!`
  );

  return jsonResponse({ success: true, verified: true });
}

async function handleUnlink(supabase: ReturnType<typeof createClient>, json: Record<string, string>) {
  const { userId, phoneNumber } = json;
  if (!userId) {
    return jsonResponse({ error: "Missing userId" }, 400);
  }

  const query = phoneNumber
    ? supabase.from("whatsapp_links").delete().eq("user_id", userId).eq("phone_number", phoneNumber)
    : supabase.from("whatsapp_links").delete().eq("user_id", userId);

  const { error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);
  
  return jsonResponse({ success: true });
}

async function handleSendCode(supabase: ReturnType<typeof createClient>, json: Record<string, string>) {
  const { userId, phoneNumber } = json;
  if (!userId || !phoneNumber) {
    return jsonResponse({ error: "Missing fields" }, 400);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("whatsapp_links")
    .update({
      verification_code: code,
      verification_expires_at: expiresAt,
    })
    .eq("user_id", userId)
    .eq("phone_number", phoneNumber);

  const formattedTo = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;
  await sendWhatsAppReply(
    formattedTo,
    `🔐 Your ShadowTalk verification code is: *${code}*\n\nThis code expires in 10 minutes.`
  );

  return jsonResponse({ success: true });
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

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      Body: message,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    console.error("[WhatsApp] Twilio send error:", errData);
  }
}

function twimlResponse() {
  // Return empty TwiML so Twilio doesn't retry
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    }
  );
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
