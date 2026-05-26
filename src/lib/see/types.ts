export type MissionToolName =
  | "web_search"
  | "web_scrape"
  | "deep_research"
  | "data_extraction"
  | "email_composer"
  | "send_email"
  | "read_emails"
  | "get_calendar"
  | "create_event"
  | "get_contacts"
  | "security_audit"
  | "document_generator"
  | "code_analysis"
  | "verification"
  | "general"
  | "synthesis";

export interface MissionPlanStep {
  id: string;
  action: string;
  tool_name: MissionToolName;
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "awaiting_approval";
  requires_approval?: boolean;
  tool_params?: Record<string, string>;
  result?: string;
  duration_ms?: number;
  proof?: MissionStepProof;
}

export interface MissionStepProof {
  sources?: Array<{ title: string; link: string; snippet?: string }>;
  urls?: string[];
  tool_invoked: string;
  raw_summary?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  proof?: MissionStepProof;
  error?: string;
  requiresApproval?: boolean;
}

export interface ComplexTaskDetection {
  useSEE: boolean;
  confidence: number;
  reason: string;
}
