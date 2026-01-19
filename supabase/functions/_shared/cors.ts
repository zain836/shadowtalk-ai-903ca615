// Shared CORS configuration for all edge functions

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://axsudmhjpfzffcicfvuj.supabase.co",
  "https://shadowtalk-ai.lovable.app",
  "https://id-preview--0497e2a8-1dfb-4b9b-b437-30ee6b3f7741.lovable.app",
];

// Pattern to match lovableproject.com and lovable.app preview domains
const LOVABLE_DOMAIN_PATTERN = /^https:\/\/[a-z0-9-]+\.lovable(project)?\.com$/;
const LOVABLE_APP_PATTERN = /^https:\/\/[a-z0-9-]+\.lovable\.app$/;

export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Allow specific origins or any Lovable preview domain
  const isAllowedOrigin = 
    ALLOWED_ORIGINS.includes(origin || "") ||
    LOVABLE_DOMAIN_PATTERN.test(origin || "") ||
    LOVABLE_APP_PATTERN.test(origin || "");

  const allowedOrigin = isAllowedOrigin ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsOptions(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
