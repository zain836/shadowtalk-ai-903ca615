import { supabase } from "@/integrations/supabase/client";
import type { ToolType } from "@/hooks/useToolOrchestrator";
import type { ExecuteShadowToolContext, ShadowToolResult } from "./types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function parseChatJsonResponse(resp: Response): Promise<Record<string, unknown>> {
  const text = await resp.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { content: text };
  }
}

async function streamChatToText(body: Record<string, unknown>, accessToken?: string): Promise<string> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(err || `Request failed (${resp.status})`);
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await parseChatJsonResponse(resp);
    if (typeof data.content === "string") return data.content;
    if (typeof data.imageUrl === "string") return String(data.content || "Image generated.");
    return JSON.stringify(data, null, 2).slice(0, 12000);
  }

  const reader = resp.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.slice(6));
          const c = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
          if (c) full += c;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return full;
}

function formatSearchResults(results: Array<{ title?: string; link?: string; snippet?: string }>): string {
  if (!results.length) return "No search results returned.";
  return results
    .map((r, i) => `${i + 1}. **${r.title || "Result"}**\n   ${r.link || ""}\n   ${r.snippet || ""}`)
    .join("\n\n");
}

const UI_ROUTES: Partial<Record<ToolType, { path: string; label: string }>> = {
  mission_control: { path: "/missioncontrol", label: "Mission Control (S.E.E.)" },
  strategy_agent: { path: "/strategy", label: "Strategy Agent" },
  workspace: { path: "/workspace", label: "AI Workspace" },
  marketplace: { path: "/marketplace", label: "Marketplace" },
  presentation_builder: { path: "/presentations", label: "Presentation Builder" },
  knowledge_vault: { path: "/knowledge", label: "Knowledge Graph" },
  privacy_score: { path: "/privacy-score", label: "Privacy Score" },
  referral: { path: "/referral", label: "Referral Program" },
  analytics: { path: "/analytics", label: "Analytics" },
  stealth_vault: { path: "/vault", label: "Stealth Vault" },
  api_marketplace: { path: "/developers", label: "Developers" },
  sovereign_models: { path: "/personal-llm", label: "Personal LLM" },
  eco_actions: { path: "/chatbot", label: "Eco Actions (switch mode to PPAG)" },
};

export async function executeShadowTool(
  tool: ToolType,
  params: Record<string, string> | undefined,
  message: string,
  ctx: ExecuteShadowToolContext
): Promise<ShadowToolResult> {
  const p = params || {};

  switch (tool) {
    case "web_search": {
      const query = p.query || message;
      const { data, error } = await supabase.functions.invoke("web-search", {
        body: { query, numResults: 6 },
      });
      if (error) throw new Error(error.message);
      const results = (data?.results || data?.items || []) as Array<{
        title?: string;
        link?: string;
        snippet?: string;
      }>;
      return {
        kind: "inline",
        tool,
        content: `### Web search: ${query}\n\n${formatSearchResults(results)}`,
      };
    }

    case "deep_research": {
      const query = p.query || message;
      const report = await streamChatToText(
        { deepResearch: true, researchQuery: query, searchMode: "web" },
        ctx.accessToken
      );
      return { kind: "inline", tool, content: report || "Research returned no content." };
    }

    case "image_generator": {
      const prompt = p.prompt || message;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          generateImage: true,
          imagePrompt: prompt,
          messages: [],
          personality: "creative",
        }),
      });
      if (!resp.ok) throw new Error("Image generation failed");
      const data = await parseChatJsonResponse(resp);
      const imageUrl = data.imageUrl as string | undefined;
      return {
        kind: "inline",
        tool,
        content: imageUrl ? `Generated image for: *${prompt}*` : String(data.content || "Image request completed."),
        imageUrl,
      };
    }

    case "image_decoder":
    case "visual_reasoning": {
      if (ctx.attachment?.type === "image" && ctx.attachment.data) {
        const analysis = await streamChatToText(
          {
            decodeImage: true,
            imageToAnalyze: ctx.attachment.data,
            messages: [{ role: "user", content: message || "Analyze this image in detail." }],
            personality: ctx.personality,
          },
          ctx.accessToken
        );
        return { kind: "inline", tool, content: analysis };
      }
      return {
        kind: "ui",
        tool,
        message: "Attach an image to your message, or open Camera Analysis mode.",
        path: "/chatbot",
      };
    }

    case "security_audit": {
      const urlMatch = message.match(/https?:\/\/[^\s]+/i);
      const url = p.url || urlMatch?.[0];
      if (url) {
        const { data, error } = await supabase.functions.invoke("website-security-scan", {
          body: { url },
        });
        if (error) throw new Error(error.message);
        const summary =
          typeof data === "string"
            ? data
            : data?.report || data?.summary || JSON.stringify(data, null, 2).slice(0, 8000);
        return { kind: "inline", tool, content: `### Security audit: ${url}\n\n${summary}` };
      }
      return {
        kind: "chat_flags",
        tool,
        flags: { securityAudit: message, messages: [{ role: "user", content: message }] },
        preamble: "Running security audit on provided code/context…",
      };
    }

    case "shadow_browser": {
      const url = p.url || message.match(/https?:\/\/[^\s]+/i)?.[0];
      if (url) {
        const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
          body: { url, options: { formats: ["markdown"], onlyMainContent: true } },
        });
        if (error) throw new Error(error.message);
        const md =
          data?.data?.markdown || data?.markdown || data?.content || JSON.stringify(data).slice(0, 6000);
        return {
          kind: "inline",
          tool,
          content: `### Scraped ${url}\n\n${String(md).slice(0, 6000)}`,
        };
      }
      return {
        kind: "ui",
        tool,
        message: "Opening Shadow Browser — provide a URL in chat to scrape inline.",
      };
    }

    case "presentation_builder": {
      const topic = p.topic || message;
      const { data, error } = await supabase.functions.invoke("generate-presentation", {
        body: { topic, slides: 8 },
      });
      if (error) throw new Error(error.message);
      const outline = data?.outline || data?.slides || data;
      return {
        kind: "inline",
        tool,
        content: `### Presentation outline: ${topic}\n\n\`\`\`json\n${JSON.stringify(outline, null, 2).slice(0, 8000)}\n\`\`\`\n\nOpen **Presentations** to export as PPTX.`,
      };
    }

    case "agentic_runner": {
      const lower = message.toLowerCase();
      if (/\b(read|check)\b.*\b(email|inbox)\b/.test(lower)) {
        const { data, error } = await supabase.functions.invoke("shadow-agent-tools", {
          body: { tool: "read_emails", params: { limit: 10 } },
        });
        if (error) throw new Error(error.message);
        return {
          kind: "inline",
          tool,
          content: data?.output || JSON.stringify(data?.data || {}, null, 2).slice(0, 6000),
        };
      }
      if (/\b(send|email|draft)\b/.test(lower)) {
        const draft = await streamChatToText(
          {
            messages: [{ role: "user", content: `Draft a professional email (do not send). Request: ${message}` }],
            personality: ctx.personality,
            mode: "email",
          },
          ctx.accessToken
        );
        return { kind: "inline", tool, content: draft };
      }
      if (/\b(calendar|meeting|schedule)\b/.test(lower)) {
        const { data, error } = await supabase.functions.invoke("shadow-agent-tools", {
          body: { tool: "get_calendar", params: {} },
        });
        if (error) throw new Error(error.message);
        return {
          kind: "inline",
          tool,
          content: data?.output || JSON.stringify(data?.data || {}, null, 2).slice(0, 6000),
        };
      }
      return {
        kind: "ui",
        tool: "mission_control",
        message: "Launching autonomous mission for this goal.",
        path: `/missioncontrol?goal=${encodeURIComponent(p.goal || message)}`,
      };
    }

    case "mission_control":
      return {
        kind: "ui",
        tool,
        message: "Opening Mission Control (S.E.E.).",
        path: `/missioncontrol?goal=${encodeURIComponent(message)}`,
      };

    case "document_generator":
    case "creative_synthesis":
    case "daily_planner":
      return {
        kind: "chat_flags",
        tool,
        flags: {
          messages: [{ role: "user", content: p.topic || p.prompt || message }],
          personality: ctx.personality,
          mode: tool === "document_generator" ? "creative" : ctx.mode,
        },
      };

    case "calculator": {
      const expr = p.expression || message;
      try {
        const sanitized = expr.replace(/[^0-9+\-*/().^% ]/g, "");
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        return { kind: "inline", tool, content: `**${expr}** = **${result}**` };
      } catch {
        return { kind: "inline", tool, content: "Could not calculate. Check the expression." };
      }
    }

    case "music_generator":
      return {
        kind: "chat_flags",
        tool,
        flags: {
          messages: [
            {
              role: "user",
              content: `Recommend music and describe sonic direction for: ${p.prompt || message}. Include genre, tempo, instruments, and mood.`,
            },
          ],
          personality: "creative",
          mode: "music",
        },
      };

    default: {
      const route = UI_ROUTES[tool];
      if (route) {
        return {
          kind: "ui",
          tool,
          message: `Opening ${route.label}.`,
          path: route.path,
        };
      }

      const panelTools: ToolType[] = [
        "shadow_live",
        "code_canvas",
        "data_organizer",
        "camera_capture",
        "script_automation",
        "agent_workflows",
        "model_fine_tuning",
        "white_label",
        "gemini_analytics",
        "google_integration",
        "vision_agent",
        "command_palette",
        "multi_model",
        "memory_panel",
        "custom_instructions",
        "conversation_branching",
        "bunker_mode",
        "cognitive_loop",
        "canvas_document",
        "knowledge_vault",
      ];

      if (panelTools.includes(tool)) {
        return { kind: "ui", tool, message: `Opening ${tool.replace(/_/g, " ")}…` };
      }

      return { kind: "chat_flags", tool, flags: { messages: [{ role: "user", content: message }] } };
    }
  }
}
