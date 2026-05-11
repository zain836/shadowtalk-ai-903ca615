import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LEMONSQUEEZY-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { variantId, productId } = await req.json();
    if (!variantId) throw new Error("Variant ID is required");
    logStep("Variant ID received", { variantId, productId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { email: user.email });

    // Lemon Squeezy API key placeholder - add to secrets
    const lemonSqueezyApiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    if (!lemonSqueezyApiKey) {
      throw new Error("LEMONSQUEEZY_API_KEY is not configured");
    }

    const storeId = Deno.env.get("LEMONSQUEEZY_STORE_ID");
    if (!storeId) {
      throw new Error("LEMONSQUEEZY_STORE_ID is not configured");
    }

    const origin = req.headers.get("origin") || "https://axsudmhjpfzffcicfvuj.lovableproject.com";

    // Create checkout via Lemon Squeezy API
    const checkoutResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lemonSqueezyApiKey}`,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
              },
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
            },
            product_options: {
              enabled_variants: [parseInt(variantId)],
              redirect_url: `${origin}/chatbot?checkout=success`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: storeId,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      }),
    });

    const checkoutData = await checkoutResponse.json();
    logStep("Checkout created", { checkoutData });

    if (!checkoutResponse.ok) {
      throw new Error(checkoutData.errors?.[0]?.detail || "Failed to create checkout");
    }

    const checkoutUrl = checkoutData.data?.attributes?.url;

    return new Response(JSON.stringify({ url: checkoutUrl }), {
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
