import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB limit

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const { url, mode } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the page server-side
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch: ${response.status} ${response.statusText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Unsupported content type", contentType }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    if (html.length > MAX_CONTENT_SIZE) {
      return new Response(
        JSON.stringify({ error: "Page too large to proxy" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "extract") {
      // Extract readable text content from HTML
      const textContent = extractReadableContent(html, url);
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: textContent, 
          title: extractTitle(html),
          url,
          mode: "extract",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return sanitized HTML for iframe rendering
    const sanitizedHtml = sanitizeForDisplay(html, url);
    return new Response(
      JSON.stringify({ 
        success: true, 
        html: sanitizedHtml, 
        title: extractTitle(html),
        url,
        mode: "proxy",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isAbort = message.includes("abort");
    
    return new Response(
      JSON.stringify({ error: isAbort ? "Request timed out" : message }),
      { 
        status: isAbort ? 504 : 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return match ? match[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"') : "";
}

function extractReadableContent(html: string, baseUrl: string): string {
  // Remove scripts, styles, nav, footer, header, aside
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Convert headings to markdown
  clean = clean.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
  clean = clean.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  clean = clean.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  clean = clean.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n");

  // Convert links
  clean = clean.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Convert lists
  clean = clean.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");

  // Convert paragraphs and breaks
  clean = clean.replace(/<p[^>]*>/gi, "\n");
  clean = clean.replace(/<\/p>/gi, "\n");
  clean = clean.replace(/<br\s*\/?>/gi, "\n");
  clean = clean.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Bold and italic
  clean = clean.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, "**$2**");
  clean = clean.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, "*$2*");

  // Remove remaining tags
  clean = clean.replace(/<[^>]+>/g, " ");

  // Clean up entities
  clean = clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  // Clean whitespace
  clean = clean.replace(/[ \t]+/g, " ");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  clean = clean.trim();

  return clean;
}

function sanitizeForDisplay(html: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const baseHref = `${base.protocol}//${base.host}`;
  
  // Add base tag for relative URLs and remove scripts
  let sanitized = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");

  // Inject base tag after <head>
  if (sanitized.includes("<head")) {
    sanitized = sanitized.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}/" target="_blank">`);
  }

  // Add styling overrides to prevent layout issues
  const styleOverride = `
    <style>
      * { max-width: 100% !important; overflow-x: hidden !important; }
      body { margin: 0 !important; padding: 16px !important; font-family: system-ui, sans-serif !important; }
      img { height: auto !important; }
      iframe { display: none !important; }
    </style>
  `;

  if (sanitized.includes("</head>")) {
    sanitized = sanitized.replace("</head>", `${styleOverride}</head>`);
  } else {
    sanitized = styleOverride + sanitized;
  }

  return sanitized;
}
