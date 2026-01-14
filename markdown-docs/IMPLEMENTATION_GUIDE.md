# ShadowTalk AI - Critical Fixes Implementation Guide
**Generated:** 2026-01-14
**Priority:** IMMEDIATE ACTION REQUIRED

---

## 🚨 SECURITY FIXES (DO THIS FIRST - Week 1)

### 1. Environment Variables Security

**Status:** ✅ PARTIALLY COMPLETE
- `.env.backup` created
- `env.example` created
- `.gitignore` already properly configured

**IMMEDIATE ACTIONS:**

```powershell
# 1. Check if .env is in git history
git log --all --full-history -- .env

# 2. If found, remove from history (USE WITH CAUTION)
# git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

# 3. Force push (if you removed from history)
# git push origin --force --all

# 4. Rotate ALL API keys immediately:
#    - Supabase: Dashboard > Settings > API > Generate new keys
#    - Lovable: Contact support or regenerate in dashboard
#    - Stripe: Dashboard > Developers > API keys > Create new
#    - LemonSqueezy: Settings > API > Regenerate
#    - SendGrid/Resend: Regenerate in respective dashboards
#    - SERP API: Account > API Key > Regenerate
#    - Google Custom Search: Console > Credentials > Create new

# 5. Update .env with new keys (use env.example as template)
```

### 2. CORS Security - Edge Functions

**FILES TO UPDATE:**
- `supabase/functions/chat/index.ts`
- `supabase/functions/gemini-load-balancer/index.ts`
- `supabase/functions/web-search/index.ts`
- ALL other edge functions

**CHANGE:**
```typescript
// BEFORE (INSECURE):
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AFTER (SECURE):
const ALLOWED_ORIGINS = [
  "https://your-production-domain.com",
  "https://axsudmhjpfzffcicfvuj.supabase.co",
  "http://localhost:8080", // Development only
];

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
});

// In handler:
serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  // ... rest of code
});
```

### 3. Input Validation

**ADD TO ALL EDGE FUNCTIONS:**

```typescript
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Define schemas
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().max(10000),
  })).max(100),
  personality: z.enum(["friendly", "sarcastic", "professional", "creative", "meticulous", "curious", "diplomatic", "witty", "pragmatic", "inquisitive"]).optional(),
  mode: z.string().optional(),
  generateImage: z.boolean().optional(),
  imagePrompt: z.string().max(1000).optional(),
});

// Validate input
try {
  const body = await req.json();
  const validated = ChatRequestSchema.parse(body);
  // Use validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({ error: "Invalid input", details: error.errors }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  throw error;
}
```

### 4. Rate Limiting

**ADD TO `supabase/functions/_shared/rate-limit.ts`:**

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATE_LIMITS = {
  free: { requests: 50, window: 86400 }, // 50/day
  pro: { requests: 10000, window: 86400 }, // 10k/day
  premium: { requests: 50000, window: 86400 }, // 50k/day
  elite: { requests: 100000, window: 86400 }, // 100k/day
  enterprise: { requests: 1000000, window: 86400 }, // 1M/day
};

export async function checkRateLimit(
  userId: string,
  tier: string = "free",
  supabase: any
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.window * 1000);

  // Count requests in current window
  const { count, error } = await supabase
    .from("usage_analytics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart.toISOString());

  if (error) throw error;

  const used = count || 0;
  const remaining = Math.max(0, limit.requests - used);
  const resetAt = new Date(windowStart.getTime() + limit.window * 1000);

  return {
    allowed: used < limit.requests,
    remaining,
    resetAt,
  };
}
```

**USE IN EDGE FUNCTIONS:**

```typescript
import { checkRateLimit } from "../_shared/rate-limit.ts";

// In handler, after auth:
const { data: { user } } = await supabase.auth.getUser(token);
if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers,
  });
}

// Get user tier
const { data: subscriber } = await supabase
  .from("subscribers")
  .select("subscription_tier")
  .eq("user_id", user.id)
  .single();

const tier = subscriber?.subscription_tier || "free";

// Check rate limit
const rateLimit = await checkRateLimit(user.id, tier, supabase);
if (!rateLimit.allowed) {
  return new Response(JSON.stringify({ 
    error: "Rate limit exceeded",
    resetAt: rateLimit.resetAt,
  }), {
    status: 429,
    headers: {
      ...headers,
      "X-RateLimit-Limit": String(RATE_LIMITS[tier as keyof typeof RATE_LIMITS].requests),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
    },
  });
}
```

---

## 🔧 CRITICAL FUNCTIONAL FIXES (Week 2-3)

### 5. SSO Backend Implementation

**CREATE:** `supabase/functions/sso-configure/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token || "");
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { workspaceId, provider, config } = await req.json();

    // Verify user is workspace owner/admin
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Encrypt sensitive fields
    const encryptedConfig = {
      ...config,
      client_secret_encrypted: config.clientSecret ? await encrypt(config.clientSecret) : null,
    };
    delete encryptedConfig.clientSecret;

    // Save SSO configuration
    const { data, error } = await supabase
      .from("sso_configurations")
      .upsert({
        workspace_id: workspaceId,
        provider,
        ...encryptedConfig,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function encrypt(text: string): Promise<string> {
  // Implement proper encryption here
  // For now, return base64 (NOT SECURE - implement real encryption)
  return btoa(text);
}
```

### 6. AI Agent Workflows Backend

**UPDATE:** `supabase/functions/chat/index.ts`

**ADD AFTER LINE 14:**

```typescript
const { 
  messages, 
  personality, 
  generateImage, 
  imagePrompt, 
  mode, 
  modePrompt, 
  userContext, 
  analyzeTask, 
  getEcoActions, 
  location, 
  securityAudit, 
  webSearch, 
  searchQuery, 
  deepResearch, 
  researchQuery,
  // ADD THIS:
  agentWorkflow
} = await req.json();

// ADD WORKFLOW HANDLER (before other special handlers):
if (agentWorkflow) {
  console.log("[CHAT] Executing agent workflow:", agentWorkflow.workflowId);
  
  const workflowResults = [];
  const steps = agentWorkflow.steps || [];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`[CHAT] Executing step ${i + 1}/${steps.length}:`, step.name);
    
    // Execute each step with AI
    const stepResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an AI agent executing step "${step.name}" of a workflow.
Context from previous steps: ${JSON.stringify(workflowResults)}
Task: ${agentWorkflow.input}
Execute this step and provide actionable results.`
          },
          { role: "user", content: `Execute step: ${step.name}\nInput: ${agentWorkflow.input}` }
        ],
      }),
    });
    
    if (!stepResponse.ok) {
      throw new Error(`Step ${i + 1} failed`);
    }
    
    const stepResult = await stepResponse.json();
    const content = stepResult.choices?.[0]?.message?.content || "";
    
    workflowResults.push({
      step: step.name,
      result: content,
      status: "completed",
    });
  }
  
  return new Response(JSON.stringify({ 
    workflowId: agentWorkflow.workflowId,
    steps: workflowResults,
    status: "completed"
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### 7. Email/Calendar OAuth Integration

**CREATE:** `supabase/functions/oauth-initiate/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_OAUTH_CONFIG = {
  clientId: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),
  clientSecret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET"),
  redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`,
  scopes: {
    gmail: "https://www.googleapis.com/auth/gmail.readonly",
    calendar: "https://www.googleapis.com/auth/calendar.readonly",
  },
};

serve(async (req) => {
  const { provider, scope } = await req.json();
  
  if (provider === "google") {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_OAUTH_CONFIG.clientId || "");
    authUrl.searchParams.set("redirect_uri", GOOGLE_OAUTH_CONFIG.redirectUri || "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_OAUTH_CONFIG.scopes[scope as keyof typeof GOOGLE_OAUTH_CONFIG.scopes] || "");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    
    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify({ error: "Provider not supported" }), { status: 400 });
});
```

**CREATE:** `supabase/functions/oauth-callback/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  if (!code) {
    return new Response("Authorization code missing", { status: 400 });
  }
  
  // Exchange code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET"),
      redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-callback`,
      grant_type: "authorization_code",
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Store tokens in database (encrypted)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  
  const { error } = await supabase.from("oauth_tokens").insert({
    user_id: "USER_ID_FROM_STATE", // Extract from state parameter
    provider: "google",
    scope: "gmail", // Or calendar, extract from state
    access_token_encrypted: await encrypt(tokens.access_token),
    refresh_token_encrypted: tokens.refresh_token ? await encrypt(tokens.refresh_token) : null,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });
  
  return new Response("Authorization successful! You can close this window.", { 
    headers: { "Content-Type": "text/html" } 
  });
});
```

---

## 📦 MISSING COMPONENTS IMPLEMENTATION (Week 3-4)

### 8. Model Fine-Tuning Backend

**CREATE:** `supabase/functions/save-custom-model/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create custom_models table first:
// CREATE TABLE custom_models (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   name TEXT NOT NULL,
//   config JSONB NOT NULL,
//   training_examples JSONB DEFAULT '[]'::jsonb,
//   is_active BOOLEAN DEFAULT false,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token || "");
  
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  
  const { model } = await req.json();
  
  const { data, error } = await supabase
    .from("custom_models")
    .insert({
      user_id: user.id,
      name: model.name,
      config: {
        basePersonality: model.basePersonality,
        temperature: model.temperature,
        maxTokens: model.maxTokens,
        topP: model.topP,
        systemPrompt: model.systemPrompt,
      },
      training_examples: model.trainingExamples,
      is_active: model.isActive,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return new Response(JSON.stringify({ success: true, model: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 9. Workspace Branding Backend

**UPDATE:** `src/components/chat/WhiteLabelBranding.tsx`

**REPLACE saveBranding function:**

```typescript
const saveBranding = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    
    // Get current workspace (you'll need workspace context)
    const workspaceId = "GET_FROM_WORKSPACE_CONTEXT";
    
    const { error } = await supabase
      .from("workspace_branding")
      .upsert({
        workspace_id: workspaceId,
        app_name: branding.appName,
        tagline: branding.tagline,
        logo_url: branding.logoUrl,
        favicon_url: branding.faviconUrl,
        primary_color: branding.primaryColor,
        secondary_color: branding.secondaryColor,
        accent_color: branding.accentColor,
        background_color: branding.backgroundColor,
        foreground_color: branding.foregroundColor,
        font_family: branding.fontFamily,
        border_radius: branding.borderRadius,
      });
    
    if (error) throw error;
    
    // Also save to localStorage for immediate apply
    localStorage.setItem('white-label-branding', JSON.stringify(branding));
    applyBranding(branding);
    
    toast({ title: "Branding saved", description: "Your custom branding has been applied" });
  } catch (error) {
    toast({
      title: "Save failed",
      description: error instanceof Error ? error.message : "Failed to save branding",
      variant: "destructive",
    });
  }
};
```

---

## 🧪 TESTING & CI/CD (Week 4)

### 10. Add Testing Infrastructure

**CREATE:** `package.json` (add to scripts):

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.0.4",
    "vitest": "^1.0.4",
    "happy-dom": "^12.10.3"
  }
}
```

**CREATE:** `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**CREATE:** `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
```

---

## 📋 DEPLOYMENT CHECKLIST

### Before Production Launch:

- [ ] All security fixes applied
- [ ] Environment variables rotated
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Error monitoring (Sentry) configured
- [ ] SSL/TLS certificates valid
- [ ] Backup strategy in place
- [ ] DDoS protection enabled (Cloudflare)
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] GDPR compliance verified
- [ ] Load testing completed
- [ ] Security audit performed

---

## 🚀 QUICK START (30 Minutes)

**If you want to get started immediately:**

```powershell
# 1. Security (5 min)
# - Check env.example and create your .env
# - Rotate any exposed API keys

# 2. Database (10 min)
# - Apply migration: supabase\migrations\20260114000000_complete_schema.sql
# - In Supabase Dashboard: SQL Editor > paste file > Run

# 3. Edge Functions Security (15 min)
# - Update CORS in all edge functions (use code above)
# - Add rate limiting to chat function
# - Add input validation to chat function

# 4. Test
npm run dev
# - Try creating conversation
# - Test chat functionality
# - Verify rate limits work
```

---

**Total Implementation Time:** 3-4 weeks (1 developer)  
**Priority Order:** Security → Database → Core Functions → Testing → Advanced Features
