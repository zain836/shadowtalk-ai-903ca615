import { supabase } from "@/integrations/supabase/client";
import { streamChatCompletion } from "./chatCompletion";
import type { MissionPlanStep, MissionStepProof, MissionToolName, ToolExecutionResult } from "./types";

const SENSITIVE_TOOLS: MissionToolName[] = ["send_email", "create_event", "send_whatsapp"];

function inferQuery(step: MissionPlanStep, goal: string): string {
  return step.tool_params?.query?.trim() || step.action.slice(0, 200) || goal.slice(0, 200);
}

function inferUrl(step: MissionPlanStep, previousResults: string[]): string | null {
  if (step.tool_params?.url) return step.tool_params.url;
  const urlInAction = step.action.match(/https?:\/\/[^\s]+/i);
  if (urlInAction) return urlInAction[0];
  for (const r of [...previousResults].reverse()) {
    const m = r.match(/https?:\/\/[^\s)\]]+/i);
    if (m) return m[0];
  }
  return null;
}

function formatSearchResults(
  results: Array<{ title?: string; link?: string; snippet?: string }>
): { text: string; proof: MissionStepProof } {
  const sources = results.map((r) => ({
    title: r.title || "Result",
    link: r.link || "",
    snippet: r.snippet,
  }));
  const text = sources
    .map((s, i) => `${i + 1}. **${s.title}**\n   ${s.link}\n   ${s.snippet || ""}`)
    .join("\n\n");
  return {
    text: text || "No search results returned.",
    proof: {
      tool_invoked: "web_search",
      sources,
      urls: sources.map((s) => s.link).filter(Boolean),
    },
  };
}

export async function executeMissionTool(
  step: MissionPlanStep,
  goal: string,
  accessToken: string,
  previousResults: string[],
  options?: { autoApprove?: boolean; signal?: AbortSignal }
): Promise<ToolExecutionResult> {
  const tool = (step.tool_name || "general") as MissionToolName;

  if (
    SENSITIVE_TOOLS.includes(tool) &&
    step.requires_approval &&
    !options?.autoApprove
  ) {
    return {
      success: false,
      output: `Awaiting approval to run ${tool}: ${step.action}`,
      requiresApproval: true,
    };
  }

  try {
    switch (tool) {
      case "web_search":
      case "verification":
      case "deep_research": {
        const query = inferQuery(step, goal);
        const { data, error } = await supabase.functions.invoke("web-search", {
          body: { query, numResults: tool === "deep_research" ? 8 : 5 },
        });
        if (error) throw new Error(error.message);
        const results = (data?.results || data?.items || []) as Array<{
          title?: string;
          link?: string;
          snippet?: string;
        }>;
        const { text, proof } = formatSearchResults(results);

        if (tool === "deep_research" && results.length > 0) {
          const synthesis = await streamChatCompletion(
            accessToken,
            `Synthesize deep research for goal: "${goal}"\n\nStep: ${step.action}\n\nSearch results:\n${text}\n\nProvide an executive brief with citations (URLs).`,
            { mode: "research", signal: options?.signal }
          );
          return {
            success: true,
            output: synthesis,
            proof: { ...proof, raw_summary: text.slice(0, 2000) },
          };
        }

        return { success: true, output: text, proof };
      }

      case "web_scrape":
      case "data_extraction": {
        const url = inferUrl(step, previousResults);
        if (!url) {
          const searchFirst = await executeMissionTool(
            { ...step, tool_name: "web_search", tool_params: { query: inferQuery(step, goal) } },
            goal,
            accessToken,
            previousResults,
            options
          );
          const found = inferUrl(step, [searchFirst.output, ...previousResults]);
          if (!found) {
            return {
              success: false,
              output: "Could not resolve a URL to scrape. Provide a URL in your goal or run search first.",
              error: "NO_URL",
            };
          }
          return executeMissionTool(
            { ...step, tool_name: "web_scrape", tool_params: { url: found } },
            goal,
            accessToken,
            [...previousResults, searchFirst.output],
            options
          );
        }

        const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
          body: { url, options: { formats: ["markdown"], onlyMainContent: true } },
        });
        if (error) throw new Error(error.message);
        const markdown =
          data?.data?.markdown ||
          data?.markdown ||
          data?.content ||
          JSON.stringify(data).slice(0, 8000);
        const excerpt = String(markdown).slice(0, 6000);
        return {
          success: true,
          output: `Scraped ${url}:\n\n${excerpt}${String(markdown).length > 6000 ? "\n\n[truncated]" : ""}`,
          proof: {
            tool_invoked: "firecrawl-scrape",
            urls: [url],
            raw_summary: excerpt.slice(0, 500),
          },
        };
      }

      case "security_audit": {
        const url = inferUrl(step, previousResults);
        if (!url) {
          return { success: false, output: "Security audit requires a target URL.", error: "NO_URL" };
        }
        const { data, error } = await supabase.functions.invoke("website-security-scan", {
          body: { url },
        });
        if (error) throw new Error(error.message);
        const summary =
          typeof data === "string"
            ? data
            : data?.report || data?.summary || JSON.stringify(data, null, 2).slice(0, 8000);
        return {
          success: true,
          output: String(summary),
          proof: { tool_invoked: "website-security-scan", urls: [url] },
        };
      }

      case "send_email":
      case "email_composer": {
        if (tool === "email_composer" && !options?.autoApprove) {
          const draft = await streamChatCompletion(
            accessToken,
            `Draft email only (do not send) for mission goal: "${goal}"\nStep: ${step.action}\nContext:\n${previousResults.join("\n")}\n\nReturn: To, Subject, Body.`,
            { signal: options?.signal }
          );
          return {
            success: true,
            output: draft,
            proof: { tool_invoked: "email_composer" },
            requiresApproval: !options?.autoApprove,
          };
        }

        const params = step.tool_params || {};
        const { data, error } = await supabase.functions.invoke("shadow-agent-tools", {
          body: {
            tool: "send_email",
            params: {
              to: params.to || params.recipient || "",
              subject: params.subject || `Regarding: ${goal.slice(0, 60)}`,
              body: params.body || previousResults.slice(-1)[0] || step.action,
            },
          },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        return {
          success: true,
          output: data?.output || "Email sent successfully.",
          proof: { tool_invoked: "send_email", raw_summary: JSON.stringify(data?.data || {}).slice(0, 500) },
        };
      }

      case "read_emails":
      case "get_calendar":
      case "get_contacts":
      case "create_event": {
        const agentTool =
          tool === "read_emails"
            ? "read_emails"
            : tool === "get_calendar"
              ? "get_calendar"
              : tool === "get_contacts"
                ? "get_contacts"
                : "create_event";
        const { data, error } = await supabase.functions.invoke("shadow-agent-tools", {
          body: { tool: agentTool, params: step.tool_params || {} },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        return {
          success: true,
          output: data?.output || JSON.stringify(data?.data || {}, null, 2).slice(0, 6000),
          proof: { tool_invoked: `shadow-agent-tools:${agentTool}` },
        };
      }

      case "document_generator":
      case "code_analysis":
      case "synthesis":
      case "general":
      default: {
        const mode = tool === "code_analysis" ? "code" : tool === "document_generator" ? "general" : "general";
        const output = await streamChatCompletion(
          accessToken,
          `Mission goal: "${goal}"
Current step: "${step.action}"
Tool: ${tool}

Previous step outputs:
${previousResults.length ? previousResults.map((r, i) => `### Step ${i + 1}\n${r}`).join("\n\n") : "None"}

Execute this step with concrete, verifiable output. Cite URLs and data from prior steps when relevant. No placeholders.`,
          { mode, model: tool === "synthesis" ? "google/gemini-2.5-pro" : undefined, signal: options?.signal }
        );
        return {
          success: true,
          output,
          proof: { tool_invoked: tool === "general" ? "chat" : tool },
        };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return { success: false, output: message, error: message };
  }
}
