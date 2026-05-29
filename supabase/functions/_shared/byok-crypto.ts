const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const normalized = secret.padEnd(32, "0").slice(0, 32);
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(normalized),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function getByokSecret(): string {
  return (
    Deno.env.get("BYOK_ENCRYPTION_SECRET") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 32) ||
    "shadowtalk-byok-dev-only-secret"
  );
}

export async function encryptApiKey(plaintext: string, secret?: string): Promise<string> {
  const key = await deriveAesKey(secret ?? getByokSecret());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(encoded: string, secret?: string): Promise<string> {
  const key = await deriveAesKey(secret ?? getByokSecret());
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return decoder.decode(plaintext);
}

export function keyPrefix(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
