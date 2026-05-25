import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiApiKey {
  id: string;
  key_string: string;
  is_exhausted: boolean;
  usage_count: number;
  exhaustion_count: number;
  auto_disabled: boolean;
}

interface GeminiSettings {
  exhaustion_threshold: number;
  usage_alert_threshold: number;
  alerts_enabled: boolean;
  alert_email: string;
}

const maskKey = (key: string): string => {
  if (key.length <= 8) return key;
  return key.substring(0, 8) + '...' + key.substring(key.length - 4);
};

const sendAlert = async (
  supabaseUrl: string,
  type: 'exhaustion' | 'usage_threshold' | 'auto_disabled',
  keyId: string,
  keyString: string,
  exhaustionCount?: number,
  usageCount?: number,
  reason?: string
) => {
  try {
    await fetch(`${supabaseUrl}/functions/v1/gemini-key-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        keyId,
        keyMasked: maskKey(keyString),
        exhaustionCount,
        usageCount,
        reason
      })
    });
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
};

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface SettingData {
  setting_key: string;
  setting_value: string;
}

interface ErrorData {
  error?: { code?: number; status?: string };
}

interface GeminiResponseData {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { sessionId, message, userId, stream } = await req.json();

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'sessionId and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for accessing api_keys
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch settings for thresholds
    const { data: settingsData } = await supabase
      .from('gemini_settings')
      .select('setting_key, setting_value');

    const settings: GeminiSettings = {
      exhaustion_threshold: 5,
      usage_alert_threshold: 100,
      alerts_enabled: false,
      alert_email: ''
    };

    settingsData?.forEach((s: SettingData) => {
      if (s.setting_key === 'exhaustion_threshold') settings.exhaustion_threshold = parseInt(s.setting_value) || 5;
      if (s.setting_key === 'usage_alert_threshold') settings.usage_alert_threshold = parseInt(s.setting_value) || 100;
      if (s.setting_key === 'alerts_enabled') settings.alerts_enabled = s.setting_value === 'true';
      if (s.setting_key === 'alert_email') settings.alert_email = s.setting_value;
    });

    // Fetch all non-exhausted, non-auto-disabled API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('gemini_api_keys')
      .select('*')
      .eq('is_exhausted', false)
      .or('auto_disabled.is.null,auto_disabled.eq.false')
      .order('usage_count', { ascending: true }); // Prefer least used keys

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKeys || apiKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No available API keys. All keys are exhausted or disabled.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch or create session history
    const { data: session, error: sessionError } = await supabase
      .from('gemini_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
    }

    let history: ChatMessage[] = [];
    
    if (session) {
      history = session.history as ChatMessage[] || [];
    } else {
      // Create new session
      const { error: insertError } = await supabase
        .from('gemini_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId || null,
          history: []
        });

      if (insertError) {
        console.error('Error creating session:', insertError);
      }
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: message }]
    };
    history.push(userMessage);

    // Try each available key until one works
    let responseText = '';
    let successfulKeyId = '';

    for (const key of apiKeys as GeminiApiKey[]) {
      try {
        console.log(`Trying API key: ${key.id}`);
        
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key.key_string}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: history,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
              },
            }),
          }
        );

        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json() as ErrorData;
          console.error(`API error with key ${key.id}:`, errorData);

          // Check for rate limit / resource exhausted error (429)
          if (geminiResponse.status === 429 || 
              errorData?.error?.code === 429 ||
              errorData?.error?.status === 'RESOURCE_EXHAUSTED') {
            
            const newExhaustionCount = (key.exhaustion_count || 0) + 1;
            console.log(`Key ${key.id} exhausted (count: ${newExhaustionCount}), marking as exhausted`);
            
            // Check if key should be auto-disabled due to too many exhaustions
            const shouldAutoDisable = newExhaustionCount >= settings.exhaustion_threshold;
            
            // Mark key as exhausted and increment exhaustion count
            await supabase
              .from('gemini_api_keys')
              .update({ 
                is_exhausted: true, 
                last_exhausted_at: new Date().toISOString(),
                exhaustion_count: newExhaustionCount,
                auto_disabled: shouldAutoDisable,
                disabled_reason: shouldAutoDisable ? `Auto-disabled: exceeded ${settings.exhaustion_threshold} exhaustions` : null
              })
              .eq('id', key.id);
            
            // Log analytics for exhaustion
            await supabase.from('gemini_key_analytics').insert({
              key_id: key.id,
              user_id: userId || null,
              session_id: sessionId,
              was_exhausted: true,
              response_time_ms: Date.now() - startTime
            });

            // Send alerts if enabled
            if (settings.alerts_enabled && settings.alert_email) {
              if (shouldAutoDisable) {
                await sendAlert(
                  supabaseUrl,
                  'auto_disabled',
                  key.id,
                  key.key_string,
                  newExhaustionCount,
                  undefined,
                  `Exceeded ${settings.exhaustion_threshold} exhaustions`
                );
              } else {
                await sendAlert(
                  supabaseUrl,
                  'exhaustion',
                  key.id,
                  key.key_string,
                  newExhaustionCount
                );
              }
            }
            
            // Continue to next key
            continue;
          }

          // For other errors, throw and don't try other keys
          throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
        }

        const data = await geminiResponse.json() as GeminiResponseData;
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        successfulKeyId = key.id;

        const newUsageCount = (key.usage_count || 0) + 1;

        // Increment usage count for successful key
        await supabase
          .from('gemini_api_keys')
          .update({ usage_count: newUsageCount })
          .eq('id', key.id);

        // Log successful analytics
        const responseTimeMs = Date.now() - startTime;
        await supabase.from('gemini_key_analytics').insert({
          key_id: key.id,
          user_id: userId || null,
          session_id: sessionId,
          was_exhausted: false,
          response_time_ms: responseTimeMs
        });

        // Check if usage threshold reached and send alert
        if (settings.alerts_enabled && settings.alert_email && 
            newUsageCount > 0 && newUsageCount % settings.usage_alert_threshold === 0) {
          await sendAlert(
            supabaseUrl,
            'usage_threshold',
            key.id,
            key.key_string,
            undefined,
            newUsageCount
          );
        }

        break;

      } catch (error) {
        console.error(`Error with key ${key.id}:`, error);
        
        // If this is the last key, throw the error
        if (key === apiKeys[apiKeys.length - 1]) {
          throw error;
        }
        // Otherwise continue to next key
        continue;
      }
    }

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: 'All API keys exhausted or failed' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add model response to history
    const modelMessage: ChatMessage = {
      role: 'model',
      parts: [{ text: responseText }]
    };
    history.push(modelMessage);

    // Update session with new history
    const { error: updateError } = await supabase
      .from('gemini_sessions')
      .update({ history })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    console.log(`Successfully processed with key: ${successfulKeyId} in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({ 
        text: responseText,
        sessionId,
        keyUsed: successfulKeyId,
        responseTimeMs: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in gemini-load-balancer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
