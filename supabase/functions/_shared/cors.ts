 // Production-Ready CORS Configuration for Edge Functions
 // Strict origin validation with comprehensive security headers
 
 // Explicitly allowed origins for production
 const PRODUCTION_ORIGINS = [
   "https://shadowtalk-ai.lovable.app",
   "https://shadowtalk.app",
 ];
 
 // Development origins (only matched in development mode)
 const DEVELOPMENT_ORIGINS = [
   "http://localhost:8080",
   "http://localhost:5173",
   "http://localhost:3000",
 ];
 
 // Pattern to match Lovable preview/staging domains
 const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/;
 const LOVABLE_PROJECT_PATTERN = /^https:\/\/[a-z0-9-]+\.lovable(project)?\.com$/;
 const LOVABLE_APP_PATTERN = /^https:\/\/[a-z0-9-]+\.lovable\.app$/;
 
 // Validate origin against allowed list
 function isAllowedOrigin(origin: string | null): boolean {
   if (!origin) return false;
   
   // Check production origins first
   if (PRODUCTION_ORIGINS.includes(origin)) return true;
   
   // Check Lovable preview/staging domains
   if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true;
   if (LOVABLE_PROJECT_PATTERN.test(origin)) return true;
   if (LOVABLE_APP_PATTERN.test(origin)) return true;
   
   // Allow development origins only in dev environment
   const isDev = Deno.env.get("DENO_DEPLOYMENT_ID") === undefined;
   if (isDev && DEVELOPMENT_ORIGINS.includes(origin)) return true;
   
   return false;
 }
 
 export function getCorsHeaders(origin: string | null): Record<string, string> {
   // Strict origin validation - never return * in production
   const allowedOrigin = isAllowedOrigin(origin) ? origin! : PRODUCTION_ORIGINS[0];
 
   return {
     "Access-Control-Allow-Origin": allowedOrigin,
     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
     "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT, PATCH",
     "Access-Control-Allow-Credentials": "true",
     "Access-Control-Max-Age": "86400",
     // Security headers
     "X-Content-Type-Options": "nosniff",
     "X-Frame-Options": "DENY",
     "X-XSS-Protection": "1; mode=block",
     "Referrer-Policy": "strict-origin-when-cross-origin",
   };
 }
 
 export function handleCorsOptions(origin: string | null): Response {
   return new Response(null, {
     status: 204,
     headers: getCorsHeaders(origin),
   });
 }
 
 // Security logging for suspicious requests
 export function logSecurityEvent(
   eventType: "cors_violation" | "rate_limit" | "invalid_input" | "auth_failure",
   details: Record<string, unknown>
 ): void {
   const logEntry = {
     timestamp: new Date().toISOString(),
     event: eventType,
     ...details,
   };
   console.warn(`[SECURITY] ${JSON.stringify(logEntry)}`);
 }
