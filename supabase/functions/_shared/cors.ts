// Shared CORS configuration for all edge functions

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://axsudmhjpfzffcicfvuj.supabase.co",
  // Add your production domains here:
  // "https://your-domain.com",
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "") 
    ? origin 
    : ALLOWED_ORIGINS[0];

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
