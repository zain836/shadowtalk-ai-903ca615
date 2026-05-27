import { streamChatCompletion, extractJsonArray } from "./chatCompletion";
import type { MissionPlanStep, MissionToolName } from "./types";

const VALID_TOOLS: MissionToolName[] = [
  "web_search",
  "web_scrape",
  "deep_research",
  "data_extraction",
  "email_composer",
  "send_email",
  "read_emails",
  "get_calendar",
  "get_contacts",
  "security_audit",
  "document_generator",
  "code_analysis",
  "verification",
  "synthesis",
  "general",
];

interface RawPlanStep {
  action: string;
  tool_name?: string;
  requires_approval?: boolean;
  tool_params?: Record<string, string>;
}

export async function generateMissionPlan(
  goal: string,
  accessToken: string,
  signal?: AbortSignal
): Promise<MissionPlanStep[]> {
  const content = await streamChatCompletion(
    accessToken,
    `You are the ShadowTalk S.E.E. (Sovereign Execution Engine) planner. Break this goal into 4-8 concrete steps that use REAL tools.

Goal: ${goal}

Return ONLY a JSON array. Each object:
- "action": clear imperative step (specific, verifiable)
- "tool_name": one of ${VALID_TOOLS.join(", ")}
- "requires_approval": true for send_email, create_event, or destructive actions; false otherwise
- "tool_params": optional object with keys like query, url, to, subject (strings only)

Rules:
- Use web_search or deep_research for market/competitor research
- Use web_scrape or data_extraction when a specific site must be read
- Use security_audit for security/OWASP tasks (include url in tool_params if known)
- Use email_composer before send_email
- End with synthesis or document_generator for final deliverable
- No vague steps like "analyze" without a tool

Example:
[{"action":"Search top 5 competitors for X","tool_name":"web_search","requires_approval":false,"tool_params":{"query":"X competitors 2026"}},{"action":"Scrape pricing pages","tool_name":"web_scrape","requires_approval":false,"tool_params":{"url":"https://example.com/pricing"}},{"action":"Compile executive report","tool_name":"synthesis","requires_approval":false}]`,
    { model: "google/gemini-2.5-flash", signal }
  );

  const parsed = extractJsonArray<RawPlanStep>(content);

  if (parsed && parsed.length > 0) {
    return parsed.map((s, i) => ({
      id: `step-${i + 1}`,
      action: s.action || `Step ${i + 1}`,
      tool_name: (VALID_TOOLS.includes(s.tool_name as MissionToolName)
        ? s.tool_name
        : "general") as MissionToolName,
      status: "pending" as const,
      requires_approval: Boolean(s.requires_approval),
      tool_params: s.tool_params,
    }));
  }

  return [
    { id: "step-1", action: "Research context and gather sources", tool_name: "deep_research", status: "pending" },
    { id: "step-2", action: "Extract and verify key data points", tool_name: "web_scrape", status: "pending" },
    { id: "step-3", action: "Process and analyze findings", tool_name: "general", status: "pending" },
    { id: "step-4", action: "Compile final deliverable", tool_name: "synthesis", status: "pending" },
  ];
}
