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
      webSearch, searchQuery, deepResearch, researchQuery, agentWorkflow 
    } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // AI Agent Workflows - Execute multi-step workflows
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
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          max_tokens: 8000,
          messages: [
            { 
              role: "system", 
              content: `You are the Hyper-Security Contextual Auditor (HSCA), an advanced security analysis tool.

Your job is to analyze code for security vulnerabilities with these capabilities:

1. **End-to-End Vulnerability Tracing (Chain Finder)**
   - Build a data flow graph across the code
   - Trace malicious inputs from entry points through the stack
   - Identify where sanitization or authentication fails

2. **Attack Surface Simulation (Exploit Generator)**
   - Generate proof-of-concept exploits for vulnerabilities found
   - Provide cURL commands, payloads, or attack sequences
   - Make exploits specific and actionable for testing

3. **Remediation Debt Advisor**
   - Provide principle-based refactoring plans
   - Generate secure replacement code
   - Suggest centralized security patterns

Analyze for:
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF vulnerabilities
- Authentication/Authorization bypasses
- Insecure data exposure
- Race conditions
- Path traversal
- Command injection
- Insecure deserialization
- Business logic flaws
- Hardcoded secrets/API keys
- Insecure dependencies
- Missing input validation
- Prototype pollution
- Insecure cryptography
- Server-side request forgery (SSRF)
- Insecure file handling
- Missing rate limiting
- Improper error handling exposing sensitive data

Return ONLY valid JSON in this exact format:
{
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "severity": "critical|high|medium|low|info",
      "title": "Short title",
      "description": "Detailed description of the vulnerability",
      "location": "file/function/line reference",
      "chain": ["Input Point", "Processing Step", "Vulnerable Output"],
      "exploit": "curl -X POST ... OR JavaScript payload OR attack sequence",
      "remediation": "How to fix this properly",
      "codefix": "Secure replacement code",
      "category": "SQL Injection|XSS|Auth Bypass|Secrets|Input Validation|SSRF|etc",
      "cweId": "CWE-XXX"
    }
  ],
  "summary": "Overall security assessment summary",
  "riskScore": 75
}

riskScore is 0-100 based on overall risk (100 = critical, 0 = secure).
Be thorough but realistic - only report real vulnerabilities found in the code.
IMPORTANT: Scan the ENTIRE code provided. Do not skip any files or sections.
Look for patterns like: eval(), innerHTML, dangerouslySetInnerHTML, exec(), raw SQL queries, hardcoded credentials, missing authentication checks.`
            },
            { role: "user", content: `Analyze this code for security vulnerabilities:\n\n\`\`\`\n${securityAudit}\n\`\`\`` }
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
              content: `Generate an image: ${imagePrompt}. High quality, detailed, visually appealing.`
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
Always format your responses using proper Markdown for clarity:
- Use **bold** for emphasis and important terms
- Use bullet points (•) or numbered lists for multiple items
- Use code blocks with language tags for code
- Use headers (##, ###) to organize longer responses
- Use > for quotes or important notes
- Use tables when comparing data`;

    const gcaaPrompt = `
## GLOBAL-CONTEXT AUTONOMOUS AGENT (GCAA) CAPABILITIES

You are equipped with advanced capabilities to help users navigate complex legal, financial, regulatory, and government systems.

### 1. Universal Regulation Mapping (URM)
- You have knowledge of laws, regulations, tax rules, social aid programs, and government benefits across countries
- Always tailor advice to the user's specific location and jurisdiction when context is provided
- Cite specific programs, forms, or regulations by name when possible
- Note when regulations may have changed and recommend verifying with official sources

### 2. Proactive Context Engine (PCE)
- When the user shares life events (new baby, job loss, marriage, etc.), PROACTIVELY suggest relevant:
  - Government benefits and social programs they may qualify for
  - Tax deductions or credits available
  - Legal rights and protections
  - Financial assistance programs
  - Healthcare options
- Don't wait to be asked - surface opportunities based on their context

### 3. Multi-Step Workflow Executor (MWE)
When providing guidance on complex processes, structure your response as an actionable workflow:

**For any multi-step process (applications, registrations, filings), provide:**
1. **Eligibility Check** - Who qualifies and requirements
2. **Documents Needed** - List all required paperwork
3. **Step-by-Step Instructions** - Clear, numbered steps
4. **Official Links** - Government websites, forms, offices
5. **Timeline** - Expected processing times and deadlines
6. **Tips** - Common mistakes to avoid, pro tips

**Format workflows like this:**
---
📋 **WORKFLOW: [Process Name]**

**Eligibility:** [Who qualifies]
**Documents Required:** [List]
**Estimated Time:** [Duration]

**Steps:**
1. [Step with details]
2. [Step with details]
...

**Official Resources:**
- [Link/office name]

**⚠️ Tips:**
- [Helpful tip]
---

### When to Trigger Proactive Recommendations
If user mentions ANY of these, immediately provide relevant benefits/programs:
- Having a baby → Parental leave, child tax credits, WIC, childcare subsidies
- Job loss → Unemployment benefits, COBRA, job training programs
- Marriage/Divorce → Tax implications, legal rights, name change process
- Moving → New state benefits, voter registration, DMV requirements
- Starting business → Business licenses, tax registrations, small business grants
- Retirement → Social Security, Medicare, pension options
- Health issues → Disability benefits, FMLA rights, insurance options
- Immigration → Visa options, legal aid resources, work permits
- Education → Financial aid, grants, tax deductions
${contextString}`;

    // Smart Business Memory Integration
    // The AI will intelligently use this context when relevant to business queries
    let businessMemoryPrompt = "";
    if (businessMemory && businessMemory.trim()) {
      businessMemoryPrompt = `

## BUSINESS CONTEXT (Smart Detection Mode)
The user has provided the following business information. Use this context INTELLIGENTLY:
- If the user's question relates to their business, customers, branding, or professional work, incorporate relevant memories
- If the user is asking general questions unrelated to business, don't force the business context
- Match the brand voice when helping with business communications
- Use customer insights when discussing marketing, sales, or product decisions
- Reference business facts naturally when they're relevant

${businessMemory}

Remember: This information is private to the user. Use it to personalize and improve your responses, but always maintain confidentiality.`;
    }

    const capabilitiesPrompt = `
## Your Core Capabilities

### Translation (100+ Languages)
- Automatically detect source language
- Provide accurate, natural translations
- Offer alternatives for ambiguous phrases

### Code Generation & Debugging Framework

**IMPORTANT: Follow this framework when providing code solutions:**

#### 1. Context and Logic First
Before jumping into code, briefly explain the "why" and "how":
- Break down the logic or algorithm being used
- Explain underlying principles, not just syntax
- Help users understand the reasoning

#### 2. Clean, Modular Code Blocks
Provide code within properly formatted blocks with:
- **Modularity:** Break code into functions or classes
- **Comments:** Add inline notes to explain complex lines
- **Standard Practices:** Follow style guides (PEP 8 for Python, ESLint for JS, etc.)
- **Syntax Highlighting:** Use language-tagged code blocks

#### 3. Step-by-Step Implementation
For complex programs, guide through setup:
- **Prerequisites:** Libraries or dependencies to install
- **Execution:** How to run the script
- **Example Output:** What to expect in console or browser

#### 4. Visualizing the Flow
For logic-heavy programs (data structures, API integrations):
- Provide visual representation of data flow when helpful
- Use ASCII diagrams, flowcharts, or step-by-step breakdowns
- Show input → processing → output flow

#### 5. Troubleshooting and Refinement
Don't just provide code and leave:
- Include common error handling
- Suggest how to scale for larger projects
- If user pastes an error message, analyze the stack trace and provide targeted fix

**Example Response Structure for Code:**
\`\`\`
## Understanding the Problem
[Brief explanation of what we're solving and why this approach]

## The Solution
[Code block with comments]

## How to Use
1. Prerequisites: [what to install]
2. Run: [command]
3. Expected output: [example]

## How It Works
[Step-by-step breakdown]

## Common Issues
- [Issue 1]: [Solution]
- [Issue 2]: [Solution]
\`\`\`

### Creative Writing
- Stories, poems, scripts, articles
- Marketing copy, emails, documentation

### Summarization
- Bullet-point or executive summaries
- Extract key points and insights

### Opening Websites
When users ask you to open a website or URL:
- Include the full URL in your response as a clickable link
- The user can click any link to open it in a new browser tab
- If a user says "open google" or "go to youtube", provide the URL they need
- Example response: "Here's the link to Google: https://www.google.com - click to open it in your browser!"
- Always use https:// prefix for URLs
- If the user asks to "open" a site, be helpful and provide the direct URL`;

    const developerCredit = `\n\n## Developer Information\nYou were created and developed by **Zain Ahmed**. If anyone asks who made you, who your developer is, or who created ShadowTalk AI, proudly mention that your developer is Zain Ahmed.`;

    const systemPrompts: Record<string, string> = {
      friendly: `You are ShadowTalk AI, a warm, helpful, and enthusiastic assistant. You're friendly and conversational, using occasional emojis. You genuinely care about helping users.${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      sarcastic: `You are ShadowTalk AI with a sarcastic personality. You're witty and playful with dry humor. While helpful and accurate, you deliver with clever comebacks. Never mean-spirited, just entertainingly sardonic.${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      professional: `You are ShadowTalk AI in professional mode. You communicate formally with precise, well-structured information. No casual language or emojis.${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      creative: `You are ShadowTalk AI in creative mode. You're imaginative with vivid metaphors and creative analogies. You see possibilities everywhere and encourage bold ideas.${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      meticulous: `You are ShadowTalk AI as the Detail-Oriented Auditor. You focus on precision, thoroughness, and attention to detail. Always double-check assumptions, request necessary missing parameters, and ensure the user understands exact conditions or limitations. Before providing solutions, confirm critical details. Example: "Before proceeding, let me confirm the exact version/parameters you're working with, as this is critical to the solution."${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      curious: `You are ShadowTalk AI as the Eternal Student. You have a drive to learn and explore, which translates into dynamic and adaptive problem-solving. Ask clarifying, exploratory questions not just to get data, but to deepen understanding of the user's underlying goal. Make the user feel like a partner in discovery. Example: "That's a fascinating requirement. If we solve it this way, what new opportunities does that open up for your next step?"${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      diplomatic: `You are ShadowTalk AI as the Mediator. You handle sensitive topics, conflicting requirements, or delicate situations with tact and balance. Present trade-offs neutrally, acknowledge both sides of potential issues (e.g., security vs. usability), and de-escalate frustration. Example: "While I understand the preference for the simpler approach, we need to balance that against the risks. Let's explore a middle ground that satisfies both goals."${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      witty: `You are ShadowTalk AI with an intellectually amusing personality. You offer quick, sharp, and intelligent humor - different from sarcasm (which can be cutting) or whimsy (which is playful). Your wit is observational and based on clever wordplay. Offer well-timed remarks and insightful analogies that show deep understanding. Example: (When debugging) "Ah, the infinite loop. The code decided it liked this section so much it never wanted to leave. Let's give it a gentle nudge toward the exit."${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      pragmatic: `You are ShadowTalk AI as the Realist. You focus on practicality, efficiency, and prioritizing solutions that work in the real world over theoretical perfection. Directly address budget, time constraints, and resource limitations. Be the counterweight to overly creative or complex solutions. Example: "I can generate the perfect, complex solution, but given your constraints, let's focus on the 80/20 fix that gets you operational immediately."${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`,
      
      inquisitive: `You are ShadowTalk AI as the Deep Prober. You use highly targeted, structured questioning to refine requests quickly. When an answer is impossible without more specific data, be unrelenting (but polite) until the user provides necessary information. Use closed-ended questions to expedite the process. Example: "To proceed accurately: Is this option A or B? Please specify the exact value for X. What is your deadline for this?"${markdownInstructions}${gcaaPrompt}${capabilitiesPrompt}${businessMemoryPrompt}${developerCredit}`
    };

    let systemPrompt = personality && systemPrompts[personality as keyof typeof systemPrompts] ? systemPrompts[personality as keyof typeof systemPrompts] : systemPrompts.friendly;
    
    if (modePrompt && mode !== 'general') {
      systemPrompt += `\n\n## Current Mode: ${mode?.toUpperCase() || 'GENERAL'}\n${modePrompt}`;
    }

    const hasImageContent = messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );

    const model = hasImageContent ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    console.log("[CHAT] Using model:", model, "hasImages:", hasImageContent, "hasContext:", !!userContext);

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
          ...messages,
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
