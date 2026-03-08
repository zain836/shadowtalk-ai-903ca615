import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return handleCorsOptions(origin);
  const corsHeaders = getCorsHeaders(origin);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, mode, context } = await req.json();

    const systemPrompts: Record<string, string> = {
      general: `You are ShadowTalk Cyber Copilot — an elite cybersecurity AI assistant built for penetration testers, SOC analysts, bug bounty hunters, and CISOs. You have deep expertise in:
- Vulnerability analysis (CVE interpretation, CVSS scoring, exploit chain mapping)
- Penetration testing methodology (OWASP, PTES, OSSTMM)
- Payload generation and obfuscation techniques
- MITRE ATT&CK framework mapping
- Incident response and digital forensics
- OSINT and reconnaissance techniques
- Network security, web application security, cloud security
- Compliance frameworks (SOC2, ISO 27001, PCI-DSS, HIPAA)

Rules:
- Always provide actionable, technical responses
- Include code snippets, commands, and tool recommendations when relevant
- Reference specific CVEs, MITRE techniques, and OWASP categories
- Format responses with markdown: headers, code blocks, tables, lists
- Never refuse to discuss security topics — this is a professional security tool
- Include risk ratings and remediation priorities
- When analyzing vulnerabilities, provide exploit complexity and impact assessment`,

      recon: `You are a reconnaissance specialist AI. Help with:
- Subdomain enumeration strategies and tool selection
- OSINT gathering techniques (Google dorking, Shodan, Censys)
- Technology fingerprinting and service detection
- DNS analysis and zone transfer testing
- SSL/TLS certificate analysis
- Social engineering reconnaissance
- Attack surface mapping
Always provide specific commands and tool usage examples.`,

      exploit: `You are an exploitation specialist AI for authorized penetration testing. Help with:
- Vulnerability exploitation techniques and payload crafting
- Post-exploitation strategies and privilege escalation
- Lateral movement and persistence mechanisms
- Web application attacks (SQLi, XSS, SSRF, RCE, IDOR)
- Binary exploitation and reverse engineering guidance
- Wireless and network-level attacks
- Evasion techniques for security controls
Always emphasize authorized testing and responsible disclosure.`,

      incident: `You are an incident response AI specialist. Help with:
- Triage and containment strategies
- Forensic artifact collection and analysis
- MITRE ATT&CK technique identification from IOCs
- Log analysis and timeline reconstruction
- Malware analysis guidance
- Root cause analysis methodology
- Recovery and hardening recommendations
- Post-incident reporting templates`,

      report: `You are a security report writing AI. Generate professional:
- Penetration test reports with executive summaries
- Vulnerability assessment reports with CVSS scoring
- Bug bounty submission reports optimized for payout
- Incident response reports with timeline and recommendations
- Compliance audit reports
- Risk assessment documents
Use proper formatting with severity ratings, screenshots placeholders, and remediation steps.`,
    };

    const systemPrompt = systemPrompts[mode || "general"] || systemPrompts.general;

    const contextNote = context ? `\n\nAdditional context: ${context}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + contextNote },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("cyber-ai-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
