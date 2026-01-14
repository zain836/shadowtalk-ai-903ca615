import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LEMONSQUEEZY-WEBHOOK] ${step}${detailsStr}`);
};

// Verify webhook signature using Web Crypto API
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const digest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return signature === digest;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    }

    const signature = req.headers.get("x-signature");
    const rawBody = await req.text();

    if (signature && !(await verifySignature(rawBody, signature, webhookSecret))) {
      logStep("Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    logStep("Event received", { eventName });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different webhook events
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const subscription = payload.data.attributes;
        const customerId = payload.data.attributes.customer_id;
        const userId = payload.meta?.custom_data?.user_id;
        const variantId = payload.data.attributes.variant_id;
        const status = subscription.status;
        const endsAt = subscription.ends_at;

        logStep("Subscription event", { customerId, userId, variantId, status });

        // Determine plan based on variant ID (you'll need to map these)
        let plan = "free";
        const variantPlanMap: Record<string, string> = {
          // Add your Lemon Squeezy variant IDs here
          // "variant_id": "plan_name"
        };
        plan = variantPlanMap[variantId] || "pro";

        // Update subscriber in database
        if (userId) {
          const { error } = await supabaseClient
            .from("subscribers")
            .upsert({
              user_id: userId,
              email: subscription.user_email,
              subscribed: status === "active",
              subscription_tier: plan,
              subscription_end: endsAt,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (error) {
            logStep("Error updating subscriber", { error });
          } else {
            logStep("Subscriber updated successfully");
          }
        }
        break;
      }

      case "subscription_cancelled": {
        const userId = payload.meta?.custom_data?.user_id;
        
        if (userId) {
          const { error } = await supabaseClient
            .from("subscribers")
            .update({
              subscribed: false,
              subscription_tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            logStep("Error cancelling subscription", { error });
          } else {
            logStep("Subscription cancelled successfully");
          }
        }
        break;
      }

      case "order_created": {
        const order = payload.data.attributes;
        const userId = payload.meta?.custom_data?.user_id;
        
        logStep("Order created", { 
          orderId: payload.data.id,
          userId,
          total: order.total,
        });
        break;
      }

      default:
        logStep("Unhandled event", { eventName });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
