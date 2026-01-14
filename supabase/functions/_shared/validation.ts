import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Chat request validation
export const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(10000),
  })).min(1).max(100),
  personality: z.enum([
    "friendly", "sarcastic", "professional", "creative", 
    "meticulous", "curious", "diplomatic", "witty", 
    "pragmatic", "inquisitive"
  ]).optional(),
  mode: z.string().max(50).optional(),
  generateImage: z.boolean().optional(),
  imagePrompt: z.string().max(1000).optional(),
  modePrompt: z.string().max(5000).optional(),
  userContext: z.string().max(5000).optional(),
  analyzeTask: z.string().max(2000).optional(),
  getEcoActions: z.boolean().optional(),
  location: z.string().max(200).optional(),
  securityAudit: z.string().max(10000).optional(),
  webSearch: z.boolean().optional(),
  searchQuery: z.string().max(500).optional(),
  deepResearch: z.boolean().optional(),
  researchQuery: z.string().max(500).optional(),
  agentWorkflow: z.object({
    workflowId: z.string(),
    input: z.string().max(2000),
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(["pending", "running", "completed", "error"]).optional(),
    })).optional(),
  }).optional(),
});

// SSO Configuration validation
export const SSOConfigSchema = z.object({
  workspaceId: z.string().uuid(),
  provider: z.enum(["saml", "oauth", "oidc"]),
  config: z.object({
    entityId: z.string().optional(),
    ssoUrl: z.string().url().optional(),
    certificate: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    authorizationUrl: z.string().url().optional(),
    tokenUrl: z.string().url().optional(),
    userInfoUrl: z.string().url().optional(),
    issuerUrl: z.string().url().optional(),
  }),
});

// Model Fine-Tuning validation
export const CustomModelSchema = z.object({
  name: z.string().min(1).max(100),
  basePersonality: z.string().max(50),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(32000),
  topP: z.number().min(0).max(1),
  frequencyPenalty: z.number().min(-2).max(2),
  presencePenalty: z.number().min(-2).max(2),
  systemPrompt: z.string().min(1).max(5000),
  trainingExamples: z.array(z.object({
    id: z.string(),
    userMessage: z.string().max(2000),
    assistantResponse: z.string().max(5000),
  })).max(100),
  isActive: z.boolean(),
});

// Workspace Branding validation
export const WorkspaceBrandingSchema = z.object({
  workspaceId: z.string().uuid(),
  appName: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  foregroundColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  fontFamily: z.string().max(50),
  borderRadius: z.string().max(20),
  customDomain: z.string().max(100).optional(),
});

// Helper function to validate and return errors
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: any } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input",
        details: error.errors,
      };
    }
    return {
      success: false,
      error: "Validation failed",
      details: String(error),
    };
  }
}
