import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Shared authentication helper for edge functions.
 * Validates JWT and returns user claims.
 */
export interface AuthResult {
  authenticated: true;
  userId: string;
  email?: string;
  supabase: ReturnType<typeof createClient>;
}

export interface AuthError {
  authenticated: false;
  response: Response;
}

export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  return {
    authenticated: true,
    userId: data.user.id,
    email: data.user.email ?? undefined,
    supabase,
  };
}

/**
 * Optional auth — returns user info if present, null if not.
 * Use for endpoints that work for both anonymous and authenticated users.
 */
export async function optionalAuth(
  req: Request
): Promise<{ userId: string | null; email?: string }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null };
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return { userId: null };
    }

    return {
      userId: data.user.id,
      email: data.user.email ?? undefined,
    };
  } catch {
    return { userId: null };
  }
}
