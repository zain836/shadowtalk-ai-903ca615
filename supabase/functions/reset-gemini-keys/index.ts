import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { requireAdmin } from "../_shared/admin.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.authenticated) return auth.response;
    const adminResp = await requireAdmin(auth, corsHeaders);
    if (adminResp) return adminResp;

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset all exhausted keys
    const { data, error } = await supabase
      .from('gemini_api_keys')
      .update({ 
        is_exhausted: false,
        last_exhausted_at: null 
      })
      .eq('is_exhausted', true)
      .select();

    if (error) {
      console.error('Error resetting keys:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to reset API keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resetCount = data?.length || 0;
    console.log(`Reset ${resetCount} exhausted API keys`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset ${resetCount} exhausted API keys`,
        keysReset: resetCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-gemini-keys:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
