import type { AuthResult } from "./auth.ts";

export async function requireAdmin(auth: AuthResult, corsHeaders: Record<string, string>) {
  const { data, error } = await auth.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.userId)
    .eq("role", "admin")
    .limit(1);

  if (error || !data || data.length === 0) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

