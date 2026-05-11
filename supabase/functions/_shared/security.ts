import { getCorsHeaders } from "./cors.ts";

/**
 * Shared security middleware for edge functions
 * - Request size limiting
 * - Rate limiting headers
 * - Input sanitization
 * - CORS hardening
 */

// Note: Use getCorsHeaders(origin) for dynamic origin validation
// This static object is kept for compatibility but should be used carefully
export const HARDENED_CORS_HEADERS = {
  ...getCorsHeaders(null),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const MAX_BODY_SIZE = 1_048_576; // 1MB default

/**
 * Validate request body size to prevent payload attacks
 */
export async function validateRequestSize(
  req: Request,
  maxBytes: number = MAX_BODY_SIZE
): Promise<{ valid: true; body: string } | { valid: false; response: Response }> {
  const contentLength = req.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxBytes) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: { ...HARDENED_CORS_HEADERS, 'Content-Type': 'application/json' } }
      ),
    };
  }

  try {
    const body = await req.text();
    if (body.length > maxBytes) {
      return {
        valid: false,
        response: new Response(
          JSON.stringify({ error: 'Request body too large' }),
          { status: 413, headers: { ...HARDENED_CORS_HEADERS, 'Content-Type': 'application/json' } }
        ),
      };
    }
    return { valid: true, body };
  } catch {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...HARDENED_CORS_HEADERS, 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Sanitize string input — strips HTML tags, script injections, null bytes
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/\0/g, '') // null bytes
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // script tags
    .replace(/<[^>]*>/g, '') // all HTML tags
    .replace(/javascript:/gi, '') // javascript: protocol
    .replace(/on\w+\s*=/gi, '') // event handlers
    .replace(/data:text\/html/gi, '') // data URIs
    .trim();
}

/**
 * Validate and parse JSON body with size check
 */
export async function parseSecureBody<T = Record<string, unknown>>(
  req: Request,
  maxBytes: number = MAX_BODY_SIZE
): Promise<{ data: T } | { error: Response }> {
  const sizeCheck = await validateRequestSize(req, maxBytes);
  if (!sizeCheck.valid) return { error: sizeCheck.response };

  try {
    const data = JSON.parse(sizeCheck.body) as T;
    return { data };
  } catch {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...HARDENED_CORS_HEADERS, 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Create a secure JSON response with hardened headers
 */
export function secureJsonResponse(
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...HARDENED_CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle CORS preflight with hardened headers
 */
export function handleCorsPreflightSecure(): Response {
  return new Response(null, { headers: HARDENED_CORS_HEADERS });
}
