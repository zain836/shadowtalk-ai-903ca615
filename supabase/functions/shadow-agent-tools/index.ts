import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
 
 const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
 const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
 serve(async (req) => {
   const origin = req.headers.get("origin");
   
   if (req.method === "OPTIONS") {
     return handleCorsOptions(origin);
   }
   
   const corsHeaders = getCorsHeaders(origin);
   
   try {
     // Authenticate user
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), {
         status: 401,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
     const token = authHeader.replace("Bearer ", "");
     const { data: { user }, error: authError } = await supabase.auth.getUser(token);
     
     if (authError || !user) {
       return new Response(JSON.stringify({ error: "Invalid token" }), {
         status: 401,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     
     const { tool, params } = await req.json();
     
     console.log(`[Shadow-Agent] User ${user.id} executing tool: ${tool}`);
     console.log(`[Shadow-Agent] Params:`, params);
     
     // Get user's OAuth tokens if needed for Google services
     const { data: oauthToken } = await supabase
       .from("oauth_tokens")
       .select("*")
       .eq("user_id", user.id)
       .eq("provider", "google")
       .single();
     
     let result: { success: boolean; data?: unknown; output?: string; error?: string };
     
     switch (tool) {
       case "send_whatsapp": {
          // Real Twilio WhatsApp integration
          const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
          const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
          const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
          
          if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
            result = { 
              success: false, 
              error: "WhatsApp not configured. Please add Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER) in project secrets." 
            };
            break;
          }
          
          const toNumber = params.to as string;
          const message = params.message as string;
          
          // Format number for WhatsApp (add whatsapp: prefix)
          const formattedTo = toNumber.startsWith("whatsapp:") ? toNumber : `whatsapp:${toNumber}`;
          const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith("whatsapp:") ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
          
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
          
          const twilioResponse = await fetch(twilioUrl, {
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
          
          const twilioData = await twilioResponse.json();
          
          if (!twilioResponse.ok) {
            result = { success: false, error: `Twilio error: ${twilioData.message || twilioData.error_message || "Failed to send"}` };
          } else {
            result = {
              success: true,
              output: `WhatsApp message sent to ${toNumber}`,
              data: { sid: twilioData.sid, status: twilioData.status }
            };
           }
         break;
       }
       
       case "read_emails": {
         if (!oauthToken?.access_token) {
           result = { success: false, error: "Gmail not connected. Please connect Google account first." };
           break;
         }
         
         // Call Gmail API
         const gmailResponse = await fetch(
           `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(params.query || "is:unread")}&maxResults=${params.maxResults || 10}`,
           {
             headers: { Authorization: `Bearer ${oauthToken.access_token}` }
           }
         );
         
         if (!gmailResponse.ok) {
           const errText = await gmailResponse.text();
           result = { success: false, error: `Gmail API error: ${errText}` };
           break;
         }
         
         const gmailData = await gmailResponse.json();
         result = {
           success: true,
           data: gmailData.messages || [],
           output: `Found ${gmailData.messages?.length || 0} emails matching "${params.query || "is:unread"}"`
         };
         break;
       }
       
       case "send_email": {
         if (!oauthToken?.access_token) {
           result = { success: false, error: "Gmail not connected" };
           break;
         }
         
         // Construct email
         const email = [
           `To: ${params.to}`,
           `Subject: ${params.subject}`,
           `Content-Type: text/plain; charset=utf-8`,
           "",
           params.body
         ].join("\r\n");
         
         const encodedEmail = btoa(unescape(encodeURIComponent(email)))
           .replace(/\+/g, "-")
           .replace(/\//g, "_")
           .replace(/=+$/, "");
         
         const sendResponse = await fetch(
           "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
           {
             method: "POST",
             headers: {
               Authorization: `Bearer ${oauthToken.access_token}`,
               "Content-Type": "application/json",
             },
             body: JSON.stringify({ raw: encodedEmail }),
           }
         );
         
         if (!sendResponse.ok) {
           result = { success: false, error: "Failed to send email" };
           break;
         }
         
         const sendData = await sendResponse.json();
         result = {
           success: true,
           data: sendData,
           output: `Email sent to ${params.to} with subject "${params.subject}"`
         };
         break;
       }
       
       case "get_contacts": {
         if (!oauthToken?.access_token) {
           result = { success: false, error: "Google Contacts not connected" };
           break;
         }
         
         const contactsResponse = await fetch(
           `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100`,
           {
             headers: { Authorization: `Bearer ${oauthToken.access_token}` }
           }
         );
         
         if (!contactsResponse.ok) {
           result = { success: false, error: "Failed to fetch contacts" };
           break;
         }
         
         const contactsData = await contactsResponse.json();
         
         // Filter by query if provided
         let contacts = contactsData.connections || [];
         if (params.query) {
           const query = params.query.toLowerCase();
           contacts = contacts.filter((c: { names?: Array<{ displayName?: string }> }) => 
             c.names?.some(n => n.displayName?.toLowerCase().includes(query))
           );
         }
         
         result = {
           success: true,
           data: contacts.slice(0, 20),
           output: `Found ${contacts.length} contacts${params.query ? ` matching "${params.query}"` : ""}`
         };
         break;
       }
       
       case "get_calendar": {
         if (!oauthToken?.access_token) {
           result = { success: false, error: "Google Calendar not connected" };
           break;
         }
         
         const timeMin = params.timeMin || new Date().toISOString();
         const timeMax = params.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
         
         const calendarResponse = await fetch(
           `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
           {
             headers: { Authorization: `Bearer ${oauthToken.access_token}` }
           }
         );
         
         if (!calendarResponse.ok) {
           result = { success: false, error: "Failed to fetch calendar events" };
           break;
         }
         
         const calendarData = await calendarResponse.json();
         result = {
           success: true,
           data: calendarData.items || [],
           output: `Found ${calendarData.items?.length || 0} upcoming events`
         };
         break;
       }
       
       case "create_event": {
         if (!oauthToken?.access_token) {
           result = { success: false, error: "Google Calendar not connected" };
           break;
         }
         
         const event = {
           summary: params.title,
           description: params.description,
           start: {
             dateTime: params.start,
             timeZone: "UTC",
           },
           end: {
             dateTime: params.end,
             timeZone: "UTC",
           },
         };
         
         const createResponse = await fetch(
           "https://www.googleapis.com/calendar/v3/calendars/primary/events",
           {
             method: "POST",
             headers: {
               Authorization: `Bearer ${oauthToken.access_token}`,
               "Content-Type": "application/json",
             },
             body: JSON.stringify(event),
           }
         );
         
         if (!createResponse.ok) {
           result = { success: false, error: "Failed to create event" };
           break;
         }
         
         const eventData = await createResponse.json();
         result = {
           success: true,
           data: eventData,
           output: `Created event "${params.title}" from ${params.start} to ${params.end}`
         };
         break;
       }
       
       case "search_drive": {
         if (!oauthToken?.access_token) {
           result = { success: false, error: "Google Drive not connected" };
           break;
         }
         
         const driveResponse = await fetch(
           `https://www.googleapis.com/drive/v3/files?q=name+contains+'${encodeURIComponent(params.query)}'&fields=files(id,name,mimeType,webViewLink)`,
           {
             headers: { Authorization: `Bearer ${oauthToken.access_token}` }
           }
         );
         
         if (!driveResponse.ok) {
           result = { success: false, error: "Failed to search Drive" };
           break;
         }
         
         const driveData = await driveResponse.json();
         result = {
           success: true,
           data: driveData.files || [],
           output: `Found ${driveData.files?.length || 0} files matching "${params.query}"`
         };
         break;
       }
       
       case "web_search": {
         // Use the existing web-search function
         const searchResponse = await fetch(
           `${SUPABASE_URL}/functions/v1/web-search`,
           {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
             },
             body: JSON.stringify({ query: params.query }),
           }
         );
         
         if (!searchResponse.ok) {
           result = { success: false, error: "Web search failed" };
           break;
         }
         
         const searchData = await searchResponse.json();
         result = {
           success: true,
           data: searchData.results || [],
           output: `Found ${searchData.results?.length || 0} web results for "${params.query}"`
         };
         break;
       }
       
       case "open_app": {
         // This would be handled by the native Android app via intent
         // Return the intent data that the mobile app should execute
         result = {
           success: true,
           data: {
             action: "android.intent.action.MAIN",
             package: params.packageName,
             intentData: params.action || null,
           },
           output: `App launch intent prepared for ${params.packageName}`
         };
         break;
       }
       
       default:
         result = { success: false, error: `Unknown tool: ${tool}` };
     }
     
     console.log(`[Shadow-Agent] Tool result:`, result);
     
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
     
   } catch (error) {
     console.error("[Shadow-Agent] Error:", error);
     return new Response(
       JSON.stringify({ 
         success: false, 
         error: error instanceof Error ? error.message : "Unknown error" 
       }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });