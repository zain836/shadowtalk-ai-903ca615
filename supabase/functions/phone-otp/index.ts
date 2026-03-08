import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory OTP store (for demo; in production use a DB table)
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, code } = await req.json();

    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number. Use international format like +1234567890' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'send') {
      // Rate limit: max 3 OTPs per phone per 5 minutes
      const existing = otpStore.get(phone);
      if (existing && existing.attempts >= 3 && Date.now() < existing.expiresAt) {
        return new Response(JSON.stringify({ error: 'Too many OTP requests. Try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const otp = generateOTP();
      otpStore.set(phone, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: (existing?.attempts || 0) + 1 });

      // Send via Twilio SMS
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')?.replace('whatsapp:', '') || '';

      if (!accountSid || !authToken) {
        return new Response(JSON.stringify({ error: 'SMS service not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: phone,
        From: twilioNumber,
        Body: `Your ShadowTalk verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      });

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!twilioRes.ok) {
        const errData = await twilioRes.json();
        console.error('Twilio error:', errData);
        return new Response(JSON.stringify({ error: 'Failed to send SMS. Please try again.' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'verify') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'OTP code is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const stored = otpStore.get(phone);
      if (!stored || Date.now() > stored.expiresAt) {
        otpStore.delete(phone);
        return new Response(JSON.stringify({ error: 'OTP expired. Please request a new one.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (stored.code !== code) {
        return new Response(JSON.stringify({ error: 'Invalid OTP code' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      otpStore.delete(phone);

      // Create a Supabase admin client to sign in or create user
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Check if user with this phone exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.phone === phone);

      if (existingUser) {
        // Generate a magic link for the existing user
        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: existingUser.email!,
        });
        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          verified: true,
          user_exists: true,
          email: existingUser.email,
          message: 'Phone verified. Use your email to complete sign-in.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        verified: true,
        user_exists: false,
        message: 'Phone verified. Please create an account with your email.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Phone OTP error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
