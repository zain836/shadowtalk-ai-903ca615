import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";


serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url, scanDepth = 'standard' } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Block internal/private IPs
    const hostname = targetUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    ) {
      return new Response(JSON.stringify({ error: 'Scanning internal/private addresses is not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[WebSecScan] Scanning: ${targetUrl.href} (depth: ${scanDepth}) for user: ${userData.user.id}`);

    const results: { files: Array<{ name: string; path: string; content: string; size: number; type: string; language: string }>; metadata: any } = {
      files: [],
      metadata: {
        url: targetUrl.href,
        scannedAt: new Date().toISOString(),
        scanDepth,
      },
    };

    // 1. Fetch main page HTML
    const mainResponse = await fetch(targetUrl.href, {
      headers: {
        'User-Agent': 'ShadowTalk-HSCA-SecurityScanner/1.0 (Authorized Security Audit)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!mainResponse.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch website: HTTP ${mainResponse.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await mainResponse.text();
    const responseHeaders = Object.fromEntries(mainResponse.headers.entries());

    results.files.push({
      name: 'index.html',
      path: `${targetUrl.hostname}/index.html`,
      content: html,
      size: html.length,
      type: 'file',
      language: 'html',
    });

    // 2. Extract and analyze security headers
    const securityHeadersAnalysis = analyzeSecurityHeaders(responseHeaders);
    results.files.push({
      name: 'security-headers.txt',
      path: `${targetUrl.hostname}/security-headers.txt`,
      content: securityHeadersAnalysis,
      size: securityHeadersAnalysis.length,
      type: 'file',
      language: 'text',
    });

    // 3. Extract inline scripts from HTML
    const inlineScripts = extractInlineScripts(html);
    if (inlineScripts.length > 0) {
      const combinedScripts = inlineScripts.join('\n\n// === Next Inline Script ===\n\n');
      results.files.push({
        name: 'inline-scripts.js',
        path: `${targetUrl.hostname}/inline-scripts.js`,
        content: combinedScripts,
        size: combinedScripts.length,
        type: 'file',
        language: 'javascript',
      });
    }

    // 4. Extract external script URLs and fetch them (limited to avoid abuse)
    const scriptUrls = extractExternalScriptUrls(html, targetUrl);
    const maxScripts = scanDepth === 'deep' ? 15 : 5;
    
    for (const scriptUrl of scriptUrls.slice(0, maxScripts)) {
      try {
        const scriptResp = await fetch(scriptUrl, {
          headers: { 'User-Agent': 'ShadowTalk-HSCA-SecurityScanner/1.0' },
        });
        if (scriptResp.ok) {
          const scriptContent = await scriptResp.text();
          if (scriptContent.length < 500000) { // 500KB limit per file
            const scriptName = scriptUrl.split('/').pop()?.split('?')[0] || 'script.js';
            results.files.push({
              name: scriptName,
              path: `${targetUrl.hostname}/scripts/${scriptName}`,
              content: scriptContent,
              size: scriptContent.length,
              type: 'file',
              language: 'javascript',
            });
          }
        }
      } catch (e) {
        console.warn(`[WebSecScan] Failed to fetch script: ${scriptUrl}`);
      }
    }

    // 5. Try to fetch common sensitive files
    const sensitiveFiles = [
      '/.env', '/.git/config', '/robots.txt', '/sitemap.xml',
      '/.well-known/security.txt', '/package.json', '/composer.json',
      '/wp-config.php.bak', '/.htaccess', '/server-status',
      '/crossdomain.xml', '/.DS_Store', '/web.config',
    ];

    for (const sensitiveFile of sensitiveFiles) {
      try {
        const fileUrl = new URL(sensitiveFile, targetUrl.origin).href;
        const resp = await fetch(fileUrl, {
          headers: { 'User-Agent': 'ShadowTalk-HSCA-SecurityScanner/1.0' },
          redirect: 'manual',
        });
        if (resp.ok && resp.status === 200) {
          const content = await resp.text();
          if (content.length < 100000 && !content.includes('<!DOCTYPE') && !content.includes('<html')) {
            const name = sensitiveFile.replace(/^\/\.?/, '') || 'root';
            results.files.push({
              name,
              path: `${targetUrl.hostname}/sensitive/${name}`,
              content: `// EXPOSED FILE: ${fileUrl}\n// Status: ${resp.status}\n\n${content}`,
              size: content.length,
              type: 'file',
              language: name.endsWith('.json') ? 'json' : name.endsWith('.xml') ? 'xml' : 'text',
            });
          }
        }
      } catch {
        // Expected - most files should 404
      }
    }

    // 6. Extract meta tags, forms, cookies info
    const metaAnalysis = analyzeHtmlSecurity(html, targetUrl.href);
    results.files.push({
      name: 'html-security-analysis.txt',
      path: `${targetUrl.hostname}/html-security-analysis.txt`,
      content: metaAnalysis,
      size: metaAnalysis.length,
      type: 'file',
      language: 'text',
    });

    // Store metadata
    results.metadata.filesFound = results.files.length;
    results.metadata.responseHeaders = responseHeaders;
    results.metadata.serverInfo = responseHeaders['server'] || 'Unknown';
    results.metadata.poweredBy = responseHeaders['x-powered-by'] || 'Unknown';

    console.log(`[WebSecScan] Scan complete. Found ${results.files.length} files to analyze.`);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[WebSecScan] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Scan failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeSecurityHeaders(headers: Record<string, string>): string {
  const lines: string[] = ['// === Security Headers Analysis ===', ''];

  const checks = [
    { header: 'strict-transport-security', name: 'HSTS', severity: 'HIGH' },
    { header: 'content-security-policy', name: 'CSP', severity: 'HIGH' },
    { header: 'x-content-type-options', name: 'X-Content-Type-Options', severity: 'MEDIUM' },
    { header: 'x-frame-options', name: 'X-Frame-Options', severity: 'MEDIUM' },
    { header: 'x-xss-protection', name: 'X-XSS-Protection', severity: 'LOW' },
    { header: 'referrer-policy', name: 'Referrer-Policy', severity: 'MEDIUM' },
    { header: 'permissions-policy', name: 'Permissions-Policy', severity: 'MEDIUM' },
    { header: 'cross-origin-opener-policy', name: 'COOP', severity: 'MEDIUM' },
    { header: 'cross-origin-resource-policy', name: 'CORP', severity: 'MEDIUM' },
    { header: 'cross-origin-embedder-policy', name: 'COEP', severity: 'LOW' },
  ];

  lines.push('// MISSING SECURITY HEADERS:');
  for (const check of checks) {
    const value = headers[check.header];
    if (!value) {
      lines.push(`// [${check.severity}] MISSING: ${check.name} (${check.header})`);
      lines.push(`//   → This header is not set, leaving the site vulnerable.`);
    } else {
      lines.push(`// [OK] ${check.name}: ${value}`);
    }
  }

  // Check for information disclosure headers
  lines.push('', '// INFORMATION DISCLOSURE:');
  const disclosureHeaders = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version'];
  for (const h of disclosureHeaders) {
    if (headers[h]) {
      lines.push(`// [MEDIUM] Server reveals: ${h}: ${headers[h]}`);
    }
  }

  // Check cookie security
  const setCookie = headers['set-cookie'];
  if (setCookie) {
    lines.push('', '// COOKIE SECURITY:');
    if (!setCookie.includes('Secure')) lines.push('// [HIGH] Cookie missing Secure flag');
    if (!setCookie.includes('HttpOnly')) lines.push('// [HIGH] Cookie missing HttpOnly flag');
    if (!setCookie.includes('SameSite')) lines.push('// [MEDIUM] Cookie missing SameSite attribute');
  }

  // Raw headers dump
  lines.push('', '// === ALL RESPONSE HEADERS ===');
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`// ${key}: ${value}`);
  }

  return lines.join('\n');
}

function extractInlineScripts(html: string): string[] {
  const scripts: string[] = [];
  const regex = /<script(?:\s[^>]*)?>([^]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const content = match[1]?.trim();
    if (content && content.length > 10 && !match[0].includes(' src=')) {
      scripts.push(content);
    }
  }
  return scripts;
}

function extractExternalScriptUrls(html: string, baseUrl: URL): string[] {
  const urls: string[] = [];
  const regex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const scriptUrl = new URL(match[1], baseUrl.origin).href;
      // Only fetch same-origin or well-known CDN scripts
      if (scriptUrl.startsWith(baseUrl.origin) || 
          scriptUrl.includes('cdn') || 
          scriptUrl.includes('assets')) {
        urls.push(scriptUrl);
      }
    } catch {
      // Skip invalid URLs
    }
  }
  return urls;
}

function analyzeHtmlSecurity(html: string, url: string): string {
  const lines: string[] = ['// === HTML Security Analysis ===', `// URL: ${url}`, ''];

  // Check for forms without CSRF
  const formRegex = /<form[^>]*>/gi;
  const forms = html.match(formRegex) || [];
  if (forms.length > 0) {
    lines.push(`// FORMS DETECTED: ${forms.length}`);
    forms.forEach((form, i) => {
      const hasAction = form.includes('action=');
      const method = form.match(/method=["'](\w+)["']/i)?.[1] || 'GET';
      lines.push(`//   Form ${i + 1}: method=${method.toUpperCase()}, hasAction=${hasAction}`);
      if (method.toUpperCase() === 'POST' && !html.includes('csrf') && !html.includes('_token')) {
        lines.push(`//   [HIGH] POST form may lack CSRF protection`);
      }
    });
  }

  // Check for password fields
  if (html.includes('type="password"') || html.includes("type='password'")) {
    lines.push('', '// PASSWORD FIELDS DETECTED');
    if (!url.startsWith('https://')) {
      lines.push('// [CRITICAL] Password transmitted over HTTP (no TLS)');
    }
    if (html.includes('autocomplete="on"') || !html.includes('autocomplete=')) {
      lines.push('// [LOW] Password field may allow autocomplete');
    }
  }

  // Check for mixed content indicators
  const httpLinks = html.match(/http:\/\/[^"'\s]+/g) || [];
  const mixedContent = httpLinks.filter(link => !link.includes('localhost'));
  if (mixedContent.length > 0 && url.startsWith('https://')) {
    lines.push('', `// [MEDIUM] MIXED CONTENT: ${mixedContent.length} HTTP references on HTTPS page`);
    mixedContent.slice(0, 5).forEach(mc => lines.push(`//   → ${mc}`));
  }

  // Check for comments with sensitive info
  const comments = html.match(/<!--[\s\S]*?-->/g) || [];
  const sensitiveComments = comments.filter(c => 
    /password|secret|key|token|todo|fixme|hack|bug|api/i.test(c)
  );
  if (sensitiveComments.length > 0) {
    lines.push('', `// [MEDIUM] SENSITIVE HTML COMMENTS: ${sensitiveComments.length}`);
    sensitiveComments.forEach(c => {
      lines.push(`//   → ${c.substring(0, 100)}${c.length > 100 ? '...' : ''}`);
    });
  }

  // Check for outdated/vulnerable libraries in script tags
  const libPatterns = [
    { pattern: /jquery[/-]?(\d+\.\d+\.\d+)/i, name: 'jQuery', vulnerable: (v: string) => parseFloat(v) < 3.5 },
    { pattern: /angular[/-]?(\d+\.\d+)/i, name: 'AngularJS', vulnerable: (v: string) => parseFloat(v) < 1.8 },
    { pattern: /bootstrap[/-]?(\d+\.\d+)/i, name: 'Bootstrap', vulnerable: (v: string) => parseFloat(v) < 5.0 },
  ];

  for (const lib of libPatterns) {
    const match = html.match(lib.pattern);
    if (match) {
      const version = match[1];
      if (lib.vulnerable(version)) {
        lines.push(`// [HIGH] Outdated ${lib.name} v${version} detected (known vulnerabilities)`);
      } else {
        lines.push(`// [INFO] ${lib.name} v${version} detected`);
      }
    }
  }

  // Check for open redirect potential
  if (html.includes('window.location') || html.includes('document.location')) {
    const redirectPatterns = html.match(/(window|document)\.location\s*=\s*[^;]+/g) || [];
    if (redirectPatterns.some(p => p.includes('param') || p.includes('url') || p.includes('redirect'))) {
      lines.push('// [HIGH] Potential open redirect vulnerability detected');
    }
  }

  return lines.join('\n');
}
