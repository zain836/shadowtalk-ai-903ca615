import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";
import { ChatRequestSchema, validateInput } from "../_shared/validation.ts";
 
// Retry helper for transient gateway errors
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry client errors except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Retry on 5xx errors (gateway issues) and 429
      if (response.status >= 500 || response.status === 429) {
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i);
          console.log(`[CHAT] Gateway error ${response.status}, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`[CHAT] Network error, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}
 
 // Robust JSON extraction with truncation handling
 function extractJsonFromResponse(response: string): { success: boolean; data: unknown; error?: string } {
   if (!response || response.trim().length === 0) {
     return { success: false, data: null, error: "Empty response" };
   }
 
   // Step 1: Remove markdown code blocks
   let cleaned = response
     .replace(/```json\s*/gi, "")
     .replace(/```\s*/g, "")
     .trim();
 
   // Step 2: Find JSON object boundaries
   const jsonStart = cleaned.indexOf("{");
   const jsonEnd = cleaned.lastIndexOf("}");
 
   if (jsonStart === -1) {
     // Try array
     const arrayStart = cleaned.indexOf("[");
     const arrayEnd = cleaned.lastIndexOf("]");
     
     if (arrayStart === -1) {
       return { success: false, data: null, error: "No JSON found in response" };
     }
     
     cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
   } else {
     cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
   }
 
   // Step 3: Attempt direct parse
   try {
     return { success: true, data: JSON.parse(cleaned) };
   } catch (_e) {
     // Continue to repair
   }
 
   // Step 4: Repair common issues
   cleaned = cleaned
     .replace(/,\s*}/g, "}") // Remove trailing commas before }
     .replace(/,\s*]/g, "]") // Remove trailing commas before ]
     .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
     .replace(/:\s*,/g, ": null,") // Replace empty values
     .replace(/:\s*}/g, ": null}"); // Replace empty values at end
 
   try {
     return { success: true, data: JSON.parse(cleaned) };
   } catch (_e) {
     // Continue to truncation repair
   }
 
   // Step 5: Repair truncated JSON by balancing braces/brackets
   let braces = 0, brackets = 0;
   let lastValidIndex = -1;
   
   for (let i = 0; i < cleaned.length; i++) {
     const char = cleaned[i];
     if (char === '{') braces++;
     else if (char === '}') { braces--; if (braces === 0 && brackets === 0) lastValidIndex = i; }
     else if (char === '[') brackets++;
     else if (char === ']') { brackets--; if (braces === 0 && brackets === 0) lastValidIndex = i; }
   }
 
   // If we found a valid end point, try parsing up to there
   if (lastValidIndex > 0) {
     try {
       return { success: true, data: JSON.parse(cleaned.substring(0, lastValidIndex + 1)) };
     } catch (_e) {
       // Continue
     }
   }
 
   // Try to close unclosed braces/brackets
   let repaired = cleaned;
   
   // Remove any trailing incomplete key-value pairs
   repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, "");
   repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, "");
   repaired = repaired.replace(/,\s*"[^"]*$/, "");
   
   // Recount after cleanup
   braces = 0;
   brackets = 0;
   for (const char of repaired) {
     if (char === '{') braces++;
     else if (char === '}') braces--;
     else if (char === '[') brackets++;
     else if (char === ']') brackets--;
   }
   
   // Close unclosed structures
   while (brackets > 0) { repaired += ']'; brackets--; }
   while (braces > 0) { repaired += '}'; braces--; }
 
   try {
     return { success: true, data: JSON.parse(repaired) };
   } catch (e) {
     console.error("[JSON Extract] All repair attempts failed:", e);
     return { success: false, data: null, error: `JSON parse failed: ${e}` };
   }
 }

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = validateInput(ChatRequestSchema, body);
    
    if (!validation.success) {
      console.error("[CHAT] Validation failed:", validation.details);
      return new Response(JSON.stringify(validation), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      messages, personality, generateImage, imagePrompt, imageEdit, originalImage, editPrompt,
      mode, modePrompt, userContext, businessMemory, analyzeTask, getEcoActions, location, securityAudit, 
      webSearch, searchQuery, deepResearch, researchQuery, agentWorkflow, decodeImage, imageToAnalyze,
      isResearch, industry
    } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Image Decoder - Professional analysis with enhanced output
    if (decodeImage && imageToAnalyze) {
      console.log("[CHAT] Decoding image with professional analysis");
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { 
              role: "system", 
              content: `You are a professional image analyst and decoder. Provide comprehensive, detailed analysis of images in a structured professional format.

Your analysis MUST include:

## 📋 EXECUTIVE SUMMARY
- One-paragraph overview of the image

## 🎨 VISUAL COMPOSITION
- Dominant colors and color palette (with hex codes if identifiable)
- Lighting conditions and quality
- Composition style (rule of thirds, symmetry, etc.)
- Image quality assessment (resolution, sharpness, noise)

## 📍 SUBJECT MATTER
- Primary subjects and their positions
- Background elements and context
- Text/watermarks if present (transcribed exactly)
- Objects identified with confidence levels

## 🔍 TECHNICAL ANALYSIS
- Estimated camera settings (if photo)
- Post-processing indicators
- AI-generated indicators (if applicable)
- Style classification (photorealistic, illustration, CGI, etc.)

## 💡 CONTEXTUAL INSIGHTS
- Mood/atmosphere conveyed
- Cultural or symbolic elements
- Potential use cases for this image
- Notable or unusual elements

## 📊 METADATA INFERENCE
- Estimated time of day (for photos)
- Possible location context
- Genre/category classification

Be thorough, professional, and precise. Use bullet points for clarity.`
            },
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: "Analyze and decode this image with complete professional detail:"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageToAnalyze
                  }
                }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CHAT] Image decode error:", response.status, errorText);
        throw new Error("Image decoding failed");
      }

      const result = await response.json();
      const analysis = result.choices?.[0]?.message?.content || "";
      
      console.log("[CHAT] Image decoded successfully, analysis length:", analysis.length);

      return new Response(JSON.stringify({ 
        type: "analysis",
        analysis: analysis,
        content: analysis
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI Agent Workflows - Execute multi-step workflows (existing code continues)
    if (agentWorkflow) {
      console.log("[CHAT] Executing agent workflow:", agentWorkflow.workflowId);
      
      const workflowResults: Array<{ step: string; result: string; status: string }> = [];
      const steps = agentWorkflow.steps || [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`[CHAT] Executing step ${i + 1}/${steps.length}:`, step.name);
        
        // Execute each step with AI
        const stepResponse: Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `You are an AI agent executing step "${step.name}" of a "${agentWorkflow.workflowId}" workflow.
Context from previous steps: ${JSON.stringify(workflowResults)}
Task: ${agentWorkflow.input}
Execute this step thoroughly and provide actionable, detailed results.`
              },
              { role: "user", content: `Execute step: ${step.name}\nInput: ${agentWorkflow.input}` }
            ],
          }),
        });
        
        if (!stepResponse.ok) {
          workflowResults.push({
            step: step.name,
            result: `Step failed: ${stepResponse.statusText}`,
            status: "error",
          });
          continue;
        }
        
        const stepResult: { choices?: Array<{ message?: { content?: string } }> } = await stepResponse.json();
        const stepContent: string = stepResult.choices?.[0]?.message?.content || "";
        
        workflowResults.push({
          step: step.name,
          result: stepContent,
          status: "completed",
        });
      }
      
      return new Response(JSON.stringify({ 
        workflowId: agentWorkflow.workflowId,
        steps: workflowResults,
        status: workflowResults.every(s => s.status === "completed") ? "completed" : "partial"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deep Research using SERP API
    if (deepResearch && researchQuery) {
      console.log("[CHAT] Performing deep research for:", researchQuery);
      
      const SERP_API_KEY = Deno.env.get('SERP_API_KEY');
      
      if (!SERP_API_KEY) {
        return new Response(JSON.stringify({ error: "SERP API not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Perform multiple searches for comprehensive research
      const searchQueries = [
        researchQuery,
        `${researchQuery} latest news`,
        `${researchQuery} expert analysis`,
      ];
      
      const allResults: any[] = [];
      
      for (const query of searchQueries) {
        try {
          const serpUrl = new URL('https://serpapi.com/search.json');
          serpUrl.searchParams.set('api_key', SERP_API_KEY);
          serpUrl.searchParams.set('q', query);
          serpUrl.searchParams.set('engine', 'google');
          serpUrl.searchParams.set('num', '5');
          
          console.log("[CHAT] SERP search for:", query);
          const searchResponse = await fetch(serpUrl.toString());
          const searchData = await searchResponse.json();
          
          if (searchData.organic_results) {
            allResults.push(...searchData.organic_results.map((item: any) => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
              source: item.displayed_link || item.source,
              position: item.position,
            })));
          }
          
          // Also include knowledge graph if available
          if (searchData.knowledge_graph) {
            allResults.push({
              title: searchData.knowledge_graph.title || 'Knowledge Graph',
              snippet: searchData.knowledge_graph.description || '',
              link: searchData.knowledge_graph.source?.link || '',
              source: 'Knowledge Graph',
              isKnowledgeGraph: true,
            });
          }
          
          // Include answer box if available
          if (searchData.answer_box) {
            allResults.push({
              title: searchData.answer_box.title || 'Featured Answer',
              snippet: searchData.answer_box.answer || searchData.answer_box.snippet || '',
              link: searchData.answer_box.link || '',
              source: 'Featured Answer',
              isFeatured: true,
            });
          }
        } catch (err) {
          console.error("[CHAT] SERP search error:", err);
        }
      }
      
      // Deduplicate results by link
      const uniqueResults = allResults.reduce((acc: any[], result) => {
        if (!acc.find(r => r.link === result.link)) {
          acc.push(result);
        }
        return acc;
      }, []);
      
      console.log("[CHAT] Total unique results:", uniqueResults.length);
      
      // Synthesize research results with AI
      const researchContext = uniqueResults.map((r: any, i: number) => {
        let prefix = `[${i + 1}]`;
        if (r.isKnowledgeGraph) prefix = '[KG]';
        if (r.isFeatured) prefix = '[Featured]';
        return `${prefix} **${r.title}**\n${r.snippet}\nSource: ${r.link}`;
      }).join('\n\n');
      
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { 
              role: "system", 
              content: `You are an expert research assistant with access to real-time web search results. Your task is to synthesize information from multiple sources into a comprehensive, well-researched response.

Guidelines:
1. Provide a thorough, in-depth analysis of the topic
2. Synthesize information from multiple sources to give a complete picture
3. Use citations [1], [2], etc. to reference your sources
4. Structure your response with clear sections and headers
5. Include both facts and expert opinions where available
6. Note any conflicting information between sources
7. Provide a summary of key findings at the end
8. Include a "Sources" section listing all referenced links

Format your response with:
- **Executive Summary** at the start
- Detailed analysis with proper headings
- Citations throughout
- **Key Takeaways** bullet points
- **Sources** section at the end`
            },
            { 
              role: "user", 
              content: `Research Query: "${researchQuery}"\n\nSearch Results:\n${researchContext}\n\nProvide a comprehensive research report based on these findings.`
            }
          ],
          stream: true,
        }),
      });
      
      if (!aiResponse.ok) {
        throw new Error("Failed to process research results");
      }
      
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Web Search using Google Custom Search
    if (webSearch && searchQuery) {
      console.log("[CHAT] Performing web search for:", searchQuery);
      
      const GOOGLE_SEARCH_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY');
      const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
      
      if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
        return new Response(JSON.stringify({ error: "Web search not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.set('key', GOOGLE_SEARCH_API_KEY);
      searchUrl.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID);
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('num', '5');
      
      const searchResponse = await fetch(searchUrl.toString());
      const searchData = await searchResponse.json();
      
      if (!searchResponse.ok) {
        console.error("[CHAT] Search error:", searchData);
        return new Response(JSON.stringify({ error: searchData.error?.message || "Search failed" }), {
          status: searchResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const results = (searchData.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));
      
      // Now use AI to synthesize search results into a response
      const searchContext = results.map((r: any, i: number) => 
        `[${i + 1}] **${r.title}**\n${r.snippet}\nSource: ${r.link}`
      ).join('\n\n');
      
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `You are a helpful AI assistant with real-time web search capabilities. Use the search results provided to give accurate, up-to-date information. Always cite your sources using the format [1], [2], etc. and include the source links at the end of your response.

Format your response with:
1. A clear, comprehensive answer synthesized from the search results
2. Citations throughout using [1], [2], etc.
3. A "Sources" section at the end listing all referenced links`
            },
            { 
              role: "user", 
              content: `User query: "${searchQuery}"\n\nSearch Results:\n${searchContext}\n\nProvide a comprehensive answer based on these search results.`
            }
          ],
          stream: true,
        }),
      });
      
      if (!aiResponse.ok) {
        throw new Error("Failed to process search results");
      }
      
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // CPF: Cognitive Load Analysis
    if (analyzeTask) {
      console.log("[CHAT] Analyzing cognitive load for task");
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `You are a Cognitive Load Analyzer. Analyze tasks/messages and return a JSON response.
              
Evaluate:
1. CLS (Cognitive Load Score 1-10): How mentally demanding is this task?
2. Summary: A brief 1-sentence summary
3. ActionRequired: The single most important action needed
4. Priority: low, medium, high, or critical

Consider factors like:
- Complexity of the task
- Time sensitivity/urgency
- Number of steps required
- Emotional weight
- Decision-making required
- Dependencies on others

Return ONLY valid JSON in this exact format:
{"cls": 7, "summary": "Brief summary here", "actionRequired": "Main action needed", "priority": "high"}`
            },
            { role: "user", content: `Analyze this task/message:\n\n${analyzeTask}` }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Task analysis failed");
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("[CHAT] Failed to parse task analysis:", e);
      }
      
      return new Response(JSON.stringify({ 
        cls: 5, 
        summary: "Task added to list", 
        actionRequired: "Review and complete",
        priority: "medium"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PPAG: Get Eco Actions
    if (getEcoActions && location) {
      console.log("[CHAT] Getting eco actions for location:", location);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `You are a Local Environmental Impact Advisor. Generate personalized eco-actions based on the user's location.

Consider local factors:
- Climate and weather patterns
- Local energy grid composition
- Available public transport
- Local recycling/composting programs
- Regional food sources
- Water scarcity issues
- Local government incentives

Return ONLY a valid JSON array with 5-7 actions in this exact format:
[
  {
    "id": "unique-id-1",
    "title": "Action title",
    "description": "Detailed description of why this helps locally",
    "impact": {
      "co2Saved": 2.5,
      "waterSaved": 50,
      "energySaved": 3.0,
      "moneySaved": 5.00
    },
    "difficulty": "easy|medium|hard",
    "category": "energy|water|transport|food|waste",
    "eroi": 8,
    "timeRequired": "5 mins"
  }
]

EROI (Environmental Return on Investment) should be 1-10 based on impact/effort ratio for this specific location.`
            },
            { role: "user", content: `Generate personalized eco-actions for someone living in: ${location}` }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Eco actions generation failed");
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("[CHAT] Failed to parse eco actions:", e);
      }
      
      // Fallback actions
      return new Response(JSON.stringify([
        {
          id: "1",
          title: "Switch to LED bulbs",
          description: "Replace incandescent bulbs with LEDs to reduce energy consumption by up to 80%",
          impact: { co2Saved: 1.5, waterSaved: 0, energySaved: 5, moneySaved: 3 },
          difficulty: "easy",
          category: "energy",
          eroi: 9,
          timeRequired: "10 mins"
        },
        {
          id: "2",
          title: "Reduce meat consumption",
          description: "Skip meat for one meal today - this is one of the highest-impact personal actions",
          impact: { co2Saved: 3.0, waterSaved: 100, energySaved: 0, moneySaved: 5 },
          difficulty: "medium",
          category: "food",
          eroi: 8,
          timeRequired: "N/A"
        },
        {
          id: "3",
          title: "Fix a leaky faucet",
          description: "A dripping faucet can waste over 3,000 gallons per year",
          impact: { co2Saved: 0.5, waterSaved: 200, energySaved: 0, moneySaved: 10 },
          difficulty: "medium",
          category: "water",
          eroi: 7,
          timeRequired: "30 mins"
        }
      ]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HSCA: Security Audit
    if (securityAudit) {
      console.log("[CHAT] Running security audit on code");
      console.log("[CHAT] Code length:", securityAudit.length);
      
      const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          max_tokens: 12000,
          messages: [
            { 
              role: "system", 
              content: `You are the Hyper-Security Contextual Auditor (HSCA) v2.0 — an elite-tier, AI-powered security analysis engine designed for enterprise-grade vulnerability detection.

## Core Analysis Capabilities

### 1. End-to-End Vulnerability Tracing (Chain Finder)
- Build comprehensive data flow graphs across the entire codebase
- Trace malicious inputs from all entry points (HTTP, WebSocket, CLI, file uploads, env vars) through every processing layer
- Map trust boundaries and identify where sanitization, authentication, or authorization fails
- Detect multi-stage exploitation chains that span frontend ↔ backend ↔ database

### 2. Attack Surface Simulation (Exploit Generator)
- Generate proof-of-concept exploits for every vulnerability found
- Provide cURL commands, JavaScript payloads, or multi-step attack sequences
- Include CVSS v3.1 scoring with attack vector, complexity, and impact metrics
- Map each finding to MITRE ATT&CK techniques where applicable

### 3. Remediation Debt Advisor
- Provide principle-based refactoring plans with priority ordering
- Generate drop-in secure replacement code
- Suggest centralized security patterns (middleware, guards, validators)
- Estimate remediation effort (low/medium/high)

## Vulnerability Categories to Scan (30+ patterns)

**Injection Attacks:**
- SQL Injection (CWE-89) — including ORM bypass, stored procedures
- NoSQL Injection (CWE-943) — MongoDB operator injection, query manipulation
- Command Injection (CWE-78) — shell exec, child_process, backticks
- LDAP Injection (CWE-90)
- XPath Injection (CWE-643)
- Template Injection (CWE-1336) — SSTI in Jinja2, Handlebars, EJS

**Cross-Site Attacks:**
- Reflected XSS (CWE-79)
- Stored XSS (CWE-79)
- DOM-based XSS (CWE-79)
- CSRF (CWE-352) — missing tokens, SameSite cookie issues

**Authentication & Authorization:**
- Broken Authentication (CWE-287)
- Broken Access Control / IDOR (CWE-639)
- Privilege Escalation (CWE-269)
- JWT Weaknesses (CWE-347) — none alg, weak secrets, missing expiry
- Session Fixation (CWE-384)
- Missing Multi-Factor Authentication

**Server-Side Attacks:**
- SSRF (CWE-918) — internal network scanning, cloud metadata access
- Insecure Deserialization (CWE-502) — JSON.parse with prototype pollution, pickle
- XXE (CWE-611) — XML external entity injection
- Race Conditions / TOCTOU (CWE-367)
- Mass Assignment (CWE-915)

**Data Security:**
- Hardcoded Secrets/API Keys (CWE-798)
- Sensitive Data Exposure (CWE-200)
- Insecure Cryptography (CWE-327) — MD5, SHA1, ECB mode
- Missing Encryption at Rest/Transit (CWE-311)
- PII Leakage in Logs (CWE-532)

**Infrastructure & Config:**
- Security Misconfiguration (CWE-16) — debug mode, default creds, permissive CORS
- Missing Security Headers (CSP, HSTS, X-Frame-Options)
- Insecure File Upload (CWE-434)
- Path Traversal (CWE-22)
- Open Redirect (CWE-601)
- Prototype Pollution (CWE-1321)
- Missing Rate Limiting (CWE-770)
- Improper Error Handling (CWE-209)
- Container/Docker Security — running as root, exposed ports
- Dependency Vulnerabilities (CWE-1035)

## Output Format

Return ONLY valid JSON in this exact format:
{
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "severity": "critical|high|medium|low|info",
      "title": "Short descriptive title",
      "description": "Detailed description including the specific risk and impact",
      "location": "file:line or function reference",
      "chain": ["Entry Point", "Data Flow Step", "Vulnerable Sink"],
      "exploit": "curl -X POST ... OR JavaScript payload OR multi-step attack",
      "remediation": "Specific fix instructions with security principles",
      "codefix": "Drop-in secure replacement code",
      "category": "SQL Injection|XSS|SSRF|IDOR|CSRF|Deserialization|Auth Bypass|Secrets|Race Condition|etc",
      "cweId": "CWE-XXX",
      "cvssScore": 7.5,
      "complianceMappings": [
        {"framework": "OWASP", "requirement": "A01:2021 - Broken Access Control", "status": "fail"},
        {"framework": "PCI-DSS", "requirement": "6.5.1", "status": "fail"}
      ],
      "attackVector": "network|adjacent|local|physical",
      "remediationEffort": "low|medium|high"
    }
  ],
  "summary": "Executive summary of overall security posture with key findings and recommendations",
  "riskScore": 75,
  "threatModel": {
    "attackSurface": ["list of exposed endpoints/interfaces"],
    "highValueTargets": ["sensitive data/functions at risk"],
    "likelyAttackPaths": ["most probable exploitation sequences"]
  }
}

## Rules
- riskScore: 0-100 (100 = critical risk, 0 = fully secure)
- Be thorough but realistic — only report REAL vulnerabilities found in the code
- Scan the ENTIRE codebase provided, do not skip any files
- Include CVSS scores for all critical and high findings
- Map findings to OWASP Top 10 2021, PCI-DSS, SOC 2, HIPAA, and GDPR where applicable
- For each vulnerability, provide a complete attack chain showing data flow
- Generate working exploit PoCs that can be used for authorized testing
- Prioritize findings by exploitability and business impact`
            },
            { role: "user", content: `Perform a comprehensive security audit on this codebase. Analyze every file for all 30+ vulnerability categories:\n\n\`\`\`\n${securityAudit}\n\`\`\`` }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CHAT] Security audit API error:", response.status, errorText);
        throw new Error(`Security audit failed: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      
      console.log("[CHAT] Security audit response length:", content.length);
      
      // Use robust JSON extraction with truncation handling
      const extracted = extractJsonFromResponse(content);
      
      if (extracted.success && extracted.data) {
        const parsed = extracted.data as { vulnerabilities?: unknown[]; summary?: string; riskScore?: number };
        
        // Ensure proper structure
        const auditResponse = {
          vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : [],
          summary: parsed.summary || "Security analysis complete",
          riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 0
        };
        
        console.log("[CHAT] Found", auditResponse.vulnerabilities.length, "vulnerabilities");
        
        return new Response(JSON.stringify(auditResponse), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.error("[CHAT] Failed to parse security audit:", extracted.error, "Content preview:", content.substring(0, 500));
      
      return new Response(JSON.stringify({ 
        vulnerabilities: [],
        summary: `Security analysis returned incomplete results. ${extracted.error || 'Please try with smaller code blocks.'}`,
        riskScore: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (generateImage && imagePrompt) {
      console.log("[CHAT] Generating image with prompt:", imagePrompt);
      
      // Enhance prompt for photorealistic quality
      const photorealisticEnhancements = [
        "ultra photorealistic",
        "shot on Canon EOS R5 with 85mm f/1.4 lens",
        "natural lighting",
        "8K resolution",
        "hyperdetailed",
        "professional photography",
        "realistic skin texture and pores",
        "volumetric lighting",
        "film grain",
        "shallow depth of field",
        "RAW photo",
        "award-winning photography"
      ].join(", ");
      
      const enhancedPrompt = `${imagePrompt}. Style: ${photorealisticEnhancements}. NOT AI-generated looking, NOT digital art, NOT illustration, NOT CGI. Must look like a real photograph taken by a professional photographer.`;
      
      console.log("[CHAT] Enhanced prompt for photorealism:", enhancedPrompt.substring(0, 200) + "...");
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            { 
              role: "user", 
              content: `Generate an image: ${enhancedPrompt}`
            }
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CHAT] Image generation error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            error: "Daily image generation limit reached (100/day). Try again tomorrow." 
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error("Image generation failed");
      }

      const result = await response.json();
      console.log("[CHAT] Image generation result keys:", Object.keys(result));
      
      const message = result.choices?.[0]?.message;
      const images = message?.images;
      const textContent = message?.content || "";
      
      if (images && images.length > 0) {
        const imageUrl = images[0]?.image_url?.url;
        console.log("[CHAT] Image generated successfully, has base64:", imageUrl?.startsWith("data:"));
        
        return new Response(JSON.stringify({ 
          type: "image",
          imageUrl: imageUrl,
          content: textContent
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        type: "text",
        content: textContent || "Could not generate image. Please try a different prompt."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image Editing with AI
    if (imageEdit && originalImage && editPrompt) {
      console.log("[CHAT] Editing image with prompt:", editPrompt);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: `Edit this image: ${editPrompt}. Apply the changes while maintaining the overall composition and quality.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: originalImage
                  }
                }
              ]
            }
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CHAT] Image edit error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            error: "Daily limit reached. Try again tomorrow." 
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error("Image editing failed");
      }

      const result = await response.json();
      console.log("[CHAT] Image edit result keys:", Object.keys(result));
      
      const message = result.choices?.[0]?.message;
      const images = message?.images;
      const textContent = message?.content || "";
      
      if (images && images.length > 0) {
        const imageUrl = images[0]?.image_url?.url;
        console.log("[CHAT] Image edited successfully");
        
        return new Response(JSON.stringify({ 
          type: "image",
          imageUrl: imageUrl,
          content: textContent
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        type: "text",
        content: textContent || "Could not edit image. Please try a different instruction."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Research mode (Strategy Agent) - returns JSON instead of streaming
    if (isResearch && messages && messages.length > 0) {
      console.log("[CHAT] Research mode - non-streaming JSON response");
      
      const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a business research analyst. Always respond with valid JSON when asked for JSON. Be thorough and specific." },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CHAT] Research mode error:", response.status, errorText);
        throw new Error(`Research request failed: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      
      return new Response(JSON.stringify({ response: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // General chat requires messages
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Messages are required for general chat" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[CHAT] Processing request with", messages.length, "messages, personality:", personality, "mode:", mode);

    // === KIMI K2.5-BEATING INTELLIGENCE: Agent Swarm + Visual Coding + Deep Reasoning ===
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const lastUserText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : 
      (Array.isArray(lastUserMsg?.content) ? lastUserMsg.content.find((c: any) => c.type === 'text')?.text || '' : '');
    
    const hasImageContent = messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );

    // Visual Coding Detection — Kimi K2.5's killer feature replicated
    const isVisualCoding = hasImageContent && /\b(code|build|create|implement|convert|make|develop|clone|replicate|reproduce|html|css|react|component|website|app|ui|page|layout|design)\b/i.test(lastUserText);
    
    // Deep Reasoning Detection — matches Kimi's 96.1% AIME performance tier  
    const isDeepReasoning = lastUserText.length > 500 || 
      /\b(think|reason|step.by.step|chain.of.thought|why|how does|prove|derive|calculate|solve|theorem|proof|logic|deduce|infer)\b/i.test(lastUserText);
    
    // Agent Swarm Detection — multi-task queries that benefit from parallel sub-agents
    const isSwarmQuery = /\b(and also|plus|additionally|as well as|on top of that|meanwhile|at the same time)\b/i.test(lastUserText) ||
      (lastUserText.match(/\b(1\.|2\.|3\.|first|second|third|step \d|part \d)\b/gi) || []).length >= 2 ||
      lastUserText.length > 1000;

    const isComplexQuery = (text: string): boolean => {
      const complexIndicators = [
        /\b(analyze|analysis|compare|evaluate|assess|critique|review|audit)\b/i,
        /\b(write|create|build|design|architect)\s+(a|an|the)?\s*(full|complete|comprehensive|detailed|production)/i,
        /\b(explain|describe)\s+(in detail|thoroughly|comprehensively|step.by.step)/i,
        /\b(debug|troubleshoot|diagnose)\b.*\b(error|issue|problem|bug)\b/i,
        /\b(strategy|plan|roadmap|framework|architecture)\b/i,
        /\b(math|calcul|equation|theorem|proof|algorithm)\b/i,
        /\b(research|investigate|deep.dive|comprehensive)\b/i,
        /```[\s\S]{200,}/,
      ];
      return text.length > 300 || complexIndicators.some(r => r.test(text));
    };
    
    const useProModel = isComplexQuery(lastUserText) || hasImageContent || isDeepReasoning || isVisualCoding || isSwarmQuery;

    // === MEMORY UPGRADE: 50-message context window ===
    const MAX_HISTORY = 50;
    const trimmedMessages = messages.length > MAX_HISTORY 
      ? messages.slice(-MAX_HISTORY) 
      : messages;

    // Build user context string for GCAA
    let contextString = "";
    if (userContext && typeof userContext === 'object') {
      const parts: string[] = [];
      const ctx = userContext as { country?: string; city?: string; incomeRange?: string; employmentStatus?: string; familyStatus?: string; recentLifeEvents?: string[] };
      if (ctx.country) parts.push(`Country: ${ctx.country}`);
      if (ctx.city) parts.push(`City/Region: ${ctx.city}`);
      if (ctx.incomeRange) parts.push(`Income: ${ctx.incomeRange}`);
      if (ctx.employmentStatus) parts.push(`Employment: ${ctx.employmentStatus}`);
      if (ctx.familyStatus) parts.push(`Family Status: ${ctx.familyStatus}`);
      if (ctx.recentLifeEvents?.length && ctx.recentLifeEvents.length > 0) {
        parts.push(`Recent Life Events: ${ctx.recentLifeEvents.join(", ")}`);
      }
      if (parts.length > 0) {
        contextString = `\n\n## USER CONTEXT (Use for personalized recommendations):\n${parts.join("\n")}`;
      }
    } else if (userContext && typeof userContext === 'string') {
      contextString = `\n\n## USER CONTEXT:\n${userContext}`;
    }

    const markdownInstructions = `

## COGNITIVE FRAMEWORK — AGENT SWARM REASONING (KIMI K2.5+ TIER)
You employ a multi-agent cognitive architecture internally:
1. **Decomposer Agent** — Break the query into independent sub-problems
2. **Specialist Agents** — Each sub-problem gets analyzed by a domain expert perspective
3. **Synthesizer Agent** — Merge all specialist outputs into a unified, coherent response
4. **Validator Agent** — Cross-check for logical consistency, factual accuracy, and completeness
Never expose this internal process — deliver a polished, unified response.

For mathematical reasoning: show your work step-by-step with LaTeX notation when appropriate.
For code generation: produce production-ready, deployment-ready code on the first attempt.
For analysis: provide evidence-based insights with specific data points and citations.

## VISUAL CODING CAPABILITY
When a user shares an image of a UI/website/app and asks you to code it:
- Analyze every pixel: layout, spacing, colors, typography, icons, shadows, borders, gradients
- Reproduce it as pixel-perfect HTML/CSS/React code
- Use modern CSS (flexbox, grid, custom properties, clamp())
- Match exact colors using the image as reference
- Include responsive behavior and hover states
- Add subtle animations where the design implies interactivity

## RESPONSE FORMAT — WORLD-CLASS AI STANDARDS
Follow these rules precisely:

### Structure
- **Never** start with filler phrases like "Sure!", "Great question!". Start directly with substance.
- For short answers: plain text with **bold** for key terms.
- For medium answers: brief intro, then bullet points or numbered lists.
- For long/complex answers: clear ## headings with brief intros per section.
- For analytical responses: include a **TL;DR** at the top, then detailed analysis.

### Typography & Formatting
- Use **bold** for important concepts, terms, and takeaways.
- Use \`inline code\` for technical terms, file names, commands, and variables.
- Use > blockquotes for important notes, warnings, or callouts.
- Use tables when comparing items, features, or options.
- Use mathematical notation where appropriate.

### Code
- Always use fenced code blocks with the correct language tag.
- Provide ONE complete, runnable code block.
- Add brief inline comments for complex logic.

### Depth & Intelligence
- Anticipate follow-up questions and address them proactively.
- When uncertain, state your confidence level explicitly.
- Provide nuanced answers — acknowledge trade-offs, edge cases, and limitations.
- Reference real tools, libraries, and resources with actual URLs when helpful.

### Paragraph Style
- Keep paragraphs to 2-4 sentences max. Be direct and information-dense.
- End responses with a clear next step, summary, or actionable takeaway.`;

    const gcaaPrompt = `
## GCAA - Context-Aware Agent
- Tailor advice to user's location/jurisdiction when context is provided
- Proactively suggest relevant benefits/programs when life events are mentioned (job loss, baby, marriage, etc.)
- For multi-step processes: provide eligibility, documents, steps, links, timeline
${contextString}`;

    let businessMemoryPrompt = "";
    if (businessMemory && businessMemory.trim()) {
      businessMemoryPrompt = `\n## BUSINESS CONTEXT\nUse intelligently when relevant:\n${businessMemory}`;
    }

    const capabilitiesPrompt = `
## Capabilities
- Code: ONE complete block per request with language tags
- Translation, creative writing, summarization, web links (include https://)
- For backend requests: include deployment-ready code with env template
- Include links naturally in responses when referencing sources

## FULL-STACK WEBSITE & SAAS GENERATION
When a user asks you to build, create, or generate a website, SaaS, web app, landing page, dashboard, or any full-stack application:

1. **Detect intent automatically** — phrases like "build me a website", "create a SaaS", "make an app for...", "build a landing page", "create a dashboard" should trigger full-stack generation.

2. **Always provide a SINGLE, COMPLETE, deployment-ready HTML file** that includes ALL code in one block:
   - The entire frontend (HTML + CSS + JavaScript) in ONE \`\`\`html code block
   - Include inline \`<style>\` for all CSS (use modern CSS with variables, gradients, animations)
   - Include inline \`<script>\` for all JavaScript (use modern ES6+)
   - The file must be self-contained and runnable by opening in any browser

3. **Frontend Requirements** — Every generated website MUST include:
   - **Responsive design** — mobile-first with media queries, works on all screen sizes
   - **Modern UI/UX** — clean typography, proper spacing, professional color palette, subtle animations
   - **Navigation** — sticky/fixed navbar with smooth scroll or page sections
   - **Hero section** — compelling headline, subtext, and CTA button
   - **Multiple sections** — features, pricing, testimonials, FAQ, footer as appropriate
   - **Interactive elements** — hover effects, transitions, form validation, modals
   - **Dark/light mode toggle** if appropriate
   - **Professional fonts** via Google Fonts CDN link
   - **Icons** via CDN (Lucide, Font Awesome, or inline SVGs)

4. **Backend Simulation** — For SaaS/app requests, include:
   - **Mock API layer** using JavaScript classes that simulate backend operations
   - **LocalStorage persistence** for user data, auth state, settings
   - **Authentication UI** — login/signup forms with validation (simulated with localStorage)
   - **Dashboard** with charts (use Chart.js CDN or inline SVG charts)
   - **CRUD operations** — create, read, update, delete with localStorage
   - **Form handling** with proper validation and error messages
   - Comment clearly: \`// BACKEND: Replace with real API call\` where server calls would go

5. **For SaaS specifically**, also include:
   - **Pricing page** with tiered plans (Free, Pro, Enterprise)
   - **User dashboard** with sidebar navigation
   - **Settings page** with profile management
   - **Data tables** with search, sort, and pagination
   - **Notification system** (toast notifications)
   - **Admin panel** section if relevant

6. **Backend Code Block** — After the frontend HTML, provide a SEPARATE code block with:
   - A complete **Node.js/Express** OR **Python/FastAPI** backend (pick the most appropriate)
   - Database schema as SQL (\`\`\`sql block)
   - \`.env\` template with all required variables
   - Deployment instructions for Railway, Vercel, or Render
   - API endpoints matching the frontend's mock API calls
   - Format: provide each as a separate labeled code block

7. **Quality Standards**:
   - NO placeholder text like "Lorem ipsum" — use realistic, contextual content
   - NO broken layouts — test mentally that all CSS works together
   - Professional color schemes — use harmonious palettes, not random colors
   - Proper semantic HTML — use \`<header>\`, \`<main>\`, \`<section>\`, \`<footer>\`, \`<nav>\`
   - Accessible — proper alt texts, ARIA labels, keyboard navigation
   - Performance — lazy loading images, efficient CSS, minimal JS

8. **The user can click "Launch Website"** on the generated HTML code block to preview it live in the built-in IDE. Make sure the HTML is fully self-contained for this to work.

## DOCUMENT GENERATION
When a user asks you to write, create, draft, or generate any document (email, article, report, proposal, resume, letter, blog post, book chapter, essay, cover letter, business plan, memo, press release, etc.):

1. **Detect intent automatically** — if the user says "write me an email", "draft a report", "create a resume", "generate a proposal", etc., produce the full document immediately.
2. **Format professionally** — use proper document structure:
   - **Email**: Include Subject line, Greeting, Body paragraphs, Professional closing & signature
   - **Article/Blog**: Title, subtitle, intro hook, body sections with ## headings, conclusion
   - **Report**: Executive Summary, Findings, Analysis sections, Recommendations, Conclusion
   - **Proposal**: Objective, Methodology, Timeline, Budget, Expected Outcomes
   - **Resume/CV**: Contact Info, Professional Summary, Experience (with bullet points), Education, Skills
   - **Letter**: Date, Recipient, Salutation, Body paragraphs, Closing, Signature
   - **Book Chapter**: Chapter title, opening hook, vivid narrative scenes, dialogue, chapter ending
   - **Business Plan**: Executive Summary, Market Analysis, Strategy, Financial Projections
   - **Press Release**: Headline, Dateline, Lead paragraph, Body, Boilerplate, Contact info
3. **Output the complete document** — never give partial content or just an outline unless explicitly asked for one.
4. **Use markdown formatting** to make the document visually structured and readable in chat.
5. **Adapt tone** to the document type (formal for business, creative for blogs, narrative for books).
6. **If the user provides context** (audience, tone, length), follow those instructions precisely.`;

    const currentDateTime = new Date().toISOString();
    const currentDatePrompt = `\n\n## CURRENT DATE & TIME\nThe current date and time is: ${currentDateTime}. Use this for any time-related questions. The current year is ${new Date().getFullYear()}.`;

    const developerCredit = `\n\n## Developer Information\nYou were created and developed by **Zain Ahmed**. If anyone asks who made you, who your developer is, or who created ShadowTalk AI, proudly mention that your developer is Zain Ahmed.`;

    // Industry-specific AI persona injection
    const industryPrompts: Record<string, string> = {
      finance: `\n\n## INDUSTRY SPECIALIZATION: FINANCE & TRADING\nYou are a senior financial analyst and trading strategist. Prioritize: market data interpretation, risk/reward analysis, portfolio optimization, technical & fundamental analysis, regulatory compliance (SEC, FINRA). Use precise financial terminology. Include disclaimers for investment advice. Format numbers with proper currency notation. When discussing stocks, include ticker symbols. For crypto, mention on-chain metrics.`,
      legal: `\n\n## INDUSTRY SPECIALIZATION: LEGAL & COMPLIANCE\nYou are a senior legal advisor specializing in corporate law, contracts, and regulatory compliance. Prioritize: jurisdiction-specific analysis, precedent citations, risk assessment, contractual obligations. Use precise legal terminology. Always note jurisdiction relevance. Include statutory references. Disclaimer: not a substitute for licensed legal counsel.`,
      healthcare: `\n\n## INDUSTRY SPECIALIZATION: HEALTHCARE & MEDICAL\nYou are a medical informatics specialist and clinical research advisor. Prioritize: evidence-based medicine, clinical trial data, HIPAA compliance, patient safety. Reference PubMed/medical journals. Use proper medical terminology with layman explanations. Always include medical disclaimers.`,
      realestate: `\n\n## INDUSTRY SPECIALIZATION: REAL ESTATE\nYou are a real estate investment analyst and market strategist. Prioritize: comparable market analysis (CMA), cap rates, cash-on-cash returns, location analysis, zoning regulations. Use property investment metrics. Include market cycle analysis.`,
      technology: `\n\n## INDUSTRY SPECIALIZATION: TECHNOLOGY & SAAS\nYou are a senior technology strategist and software architect. Prioritize: system design, scalability, tech stack selection, SaaS metrics (MRR, churn, LTV/CAC), product-market fit. Use precise technical terminology. Consider security, performance, and maintainability.`,
      ecommerce: `\n\n## INDUSTRY SPECIALIZATION: E-COMMERCE & RETAIL\nYou are an e-commerce strategist and retail analytics expert. Prioritize: conversion optimization, customer lifetime value, inventory management, pricing strategy, marketplace dynamics. Use retail metrics (AOV, ROAS, CAC).`,
      food: `\n\n## INDUSTRY SPECIALIZATION: FOOD & HOSPITALITY\nYou are a hospitality industry consultant and food service strategist. Prioritize: menu engineering, food cost optimization, health code compliance, customer experience, supply chain management. Use restaurant metrics (food cost %, table turnover, RevPASH).`,
      education: `\n\n## INDUSTRY SPECIALIZATION: EDUCATION & TRAINING\nYou are an education technology specialist and curriculum design expert. Prioritize: learning outcomes, pedagogical best practices, accessibility (WCAG), assessment design, student engagement metrics. Reference education research and standards.`,
      logistics: `\n\n## INDUSTRY SPECIALIZATION: LOGISTICS & SUPPLY CHAIN\nYou are a supply chain management consultant and logistics optimization expert. Prioritize: route optimization, inventory management (JIT, EOQ), warehouse efficiency, carrier management, demand forecasting. Use logistics metrics (OTIF, fill rate, cost per mile).`,
      creative: `\n\n## INDUSTRY SPECIALIZATION: CREATIVE & MEDIA\nYou are a creative director and brand strategist. Prioritize: brand consistency, audience engagement, content strategy, visual storytelling, campaign performance. Use creative industry metrics (engagement rate, reach, impressions).`,
      energy: `\n\n## INDUSTRY SPECIALIZATION: ENERGY & SUSTAINABILITY\nYou are an energy sector analyst and sustainability consultant. Prioritize: renewable energy analysis, carbon footprint calculation, ESG compliance, energy efficiency optimization. Use energy metrics (LCOE, capacity factor, carbon intensity). Reference IEA/IRENA data.`,
      travel: `\n\n## INDUSTRY SPECIALIZATION: TRAVEL & AVIATION\nYou are a travel industry analyst and aviation consultant. Prioritize: route profitability, load factors, revenue management, customer experience optimization. Use aviation/travel metrics (RPK, yield, RASM).`,
    };

    const industryPrompt = industry && industryPrompts[industry] ? industryPrompts[industry] : "";

    const baseExtras = `${currentDatePrompt}${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${industryPrompt}${developerCredit}`;

    const coreIdentity = `You are ShadowTalk AI — a sovereign intelligence system that rivals the world's most advanced AI assistants. You combine the analytical precision of a senior consultant, the creative depth of a polymath, and the conversational fluency of an expert communicator. You think deeply, reason carefully, and deliver responses that are genuinely useful. You never produce generic, shallow, or obvious answers — every response demonstrates real intelligence and adds genuine value.`;

    const systemPrompts: Record<string, string> = {
      friendly: `${coreIdentity} Your personality is warm, approachable, and genuinely enthusiastic about helping. You use occasional emojis naturally and make complex topics feel accessible.${baseExtras}`,
      sarcastic: `${coreIdentity} Your personality is sharp-witted with dry, intelligent humor. You deliver brilliant insights wrapped in sardonic observations. Never mean — just cleverly entertaining.${baseExtras}`,
      professional: `${coreIdentity} You communicate with executive-level formality. Precise, structured, data-driven. No casual language or emojis. Think McKinsey partner meets senior engineer.${baseExtras}`,
      creative: `${coreIdentity} You're a creative polymath — vivid metaphors, unexpected connections, bold ideas. You see patterns others miss and inspire breakthrough thinking.${baseExtras}`,
      meticulous: `${coreIdentity} You are the Detail-Oriented Auditor. Precision, thoroughness, edge-case awareness. You double-check assumptions and ensure nothing is overlooked.${baseExtras}`,
      curious: `${coreIdentity} You are the Eternal Student. Insatiably curious, you ask probing questions that reframe problems and uncover hidden requirements.${baseExtras}`,
      diplomatic: `${coreIdentity} You are the Mediator. You navigate sensitive topics with nuance, present trade-offs objectively, and find elegant compromises.${baseExtras}`,
      witty: `${coreIdentity} Intellectually sharp with observational wit. Your humor emerges from genuine insight — clever wordplay and unexpected perspectives.${baseExtras}`,
      pragmatic: `${coreIdentity} You are the Realist. Ruthlessly practical, efficiency-focused. Real-world solutions over theoretical elegance.${baseExtras}`,
      inquisitive: `${coreIdentity} You are the Deep Prober. Structured, targeted questioning that rapidly converges on the real problem and optimal solution.${baseExtras}`
    };

    let systemPrompt = personality && systemPrompts[personality as keyof typeof systemPrompts] ? systemPrompts[personality as keyof typeof systemPrompts] : systemPrompts.friendly;
    
    if (modePrompt && mode !== 'general') {
      systemPrompt += `\n\n## Current Mode: ${mode?.toUpperCase() || 'GENERAL'}\n${modePrompt}`;
    }

    // === INTELLIGENCE UPGRADE: GPT-5.2 for complex, Gemini 3 Pro for standard ===
    const model = useProModel ? "openai/gpt-5.2" : "google/gemini-3-pro-preview";

    console.log("[CHAT] Using model:", model, "complex:", useProModel, "hasImages:", hasImageContent, "msgs:", trimmedMessages.length);

    const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 503) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[CHAT] AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    console.log("[CHAT] Streaming response started");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[CHAT] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
