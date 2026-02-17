import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
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
