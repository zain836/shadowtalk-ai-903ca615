import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

async function verifyWebhookSignature(payload: string, headers: Headers, secret: string): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing svix headers");
    return false;
  }

  // Check timestamp is within 5 minutes
  const timestamp = parseInt(svixTimestamp);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  // Verify signature
  const secretBytes = Uint8Array.from(atob(secret.replace("whsec_", "")), c => c.charCodeAt(0));
  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(toSign));
  const computedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const signatures = svixSignature.split(" ");
  return signatures.some(sig => {
    const sigValue = sig.split(",")[1];
    return sigValue === computedSig;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    const body = await req.text();

    if (secret) {
      const isValid = await verifyWebhookSignature(body, req.headers, secret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(body);
    console.log("Resend webhook received:", JSON.stringify(payload));

    const { type, data } = payload;

    switch (type) {
      case "email.sent":
        console.log("Email sent:", data?.email_id);
        break;
      case "email.delivered":
        console.log("Email delivered:", data?.email_id);
        break;
      case "email.bounced":
        console.log("Email bounced:", data?.email_id);
        break;
      case "email.complained":
        console.log("Email complained:", data?.email_id);
        break;
      case "email.opened":
        console.log("Email opened:", data?.email_id);
        break;
      case "email.clicked":
        console.log("Email clicked:", data?.email_id);
        break;
      default:
        console.log("Unknown event type:", type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
