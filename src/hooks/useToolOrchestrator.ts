 import { useCallback } from 'react';
 
 export type ToolType = 
   | 'image_generator'
   | 'deep_research'
   | 'agentic_runner'
   | 'visual_reasoning'
   | 'creative_synthesis'
   | 'shadow_browser'
   | 'shadow_live'
   | 'multi_model'
   | 'api_marketplace'
   | 'code_canvas'
   | 'analytics'
   | 'stealth_vault'
   | 'data_organizer'
   | 'camera_capture'
   | 'calculator'
   | 'web_search';
 
 interface ToolDetectionResult {
   tool: ToolType | null;
   confidence: number;
   action?: string;
   params?: Record<string, string>;
  autoExecute?: boolean;
  originalMessage?: string;
 }
 
 // Tool detection patterns with priority
 const TOOL_PATTERNS: Array<{
   tool: ToolType;
   patterns: RegExp[];
   priority: number;
  autoExecute?: boolean;
   extractParams?: (message: string) => Record<string, string>;
 }> = [
   {
     tool: 'image_generator',
     patterns: [
       /\b(generate|create|make|draw|design|imagine)\s+(an?\s+)?(image|picture|illustration|artwork|logo|icon|banner|poster)/i,
       /\/imagine\s+/i,
       /\b(visualize|render|sketch)\s+/i,
       /\bshow\s+me\s+(an?\s+)?(image|picture|visual)\s+of/i,
       /\b(create|generate)\s+.*\s+(logo|banner|poster|artwork)/i,
     ],
     priority: 10,
    autoExecute: true,
     extractParams: (msg) => {
      // Remove the command prefix to get the actual prompt
      const cleaned = msg
        .replace(/^(generate|create|make|draw|design|imagine|visualize|render|show me)\s+(an?\s+)?(image|picture|illustration|artwork|logo|icon|banner|poster)\s*(of|for|about|showing)?\s*/i, '')
        .trim();
      return { prompt: cleaned || msg };
     }
   },
   {
     tool: 'deep_research',
     patterns: [
       /\b(research|investigate|deep\s*dive|analyze|study|explore)\s+(about|on|into|the)?\s*.{5,}/i,
       /\bwhat\s+(?:is|are)\s+the\s+latest\s+.{5,}/i,
       /\b(find|search|look\s+up)\s+(?:detailed|comprehensive|in-?depth)\s+information/i,
       /\bgive\s+me\s+(?:a\s+)?(?:detailed|comprehensive|full)\s+(?:report|analysis|overview)/i,
       /\bmarket\s+(?:research|analysis)/i,
       /\bcompetitor\s+analysis/i,
       /\btrend\s+analysis/i,
     ],
     priority: 9,
    autoExecute: true,
     extractParams: (msg) => {
      const cleaned = msg
        .replace(/^(research|investigate|deep\s*dive|analyze|study|explore|find|search|look\s+up|give\s+me)\s+(about|on|into|the|a|an|detailed|comprehensive|in-?depth|information)?\s*/gi, '')
        .replace(/^(market|competitor|trend)\s+(research|analysis)\s*(on|about|of|for)?\s*/i, '')
        .trim();
      return { query: cleaned || msg };
     }
   },
   {
     tool: 'agentic_runner',
     patterns: [
       /\b(automate|run\s+agent|execute\s+workflow|multi-?step|autonomous)/i,
       /\b(send\s+(?:an?\s+)?(?:email|whatsapp|message)\s+to)/i,
       /\b(schedule|book|create)\s+(?:a\s+)?(?:meeting|appointment|event)/i,
       /\b(check|read|fetch)\s+(?:my\s+)?(?:emails?|calendar|contacts)/i,
       /\b(search|browse)\s+(?:google\s+)?drive/i,
       /\bopen\s+(?:the\s+)?(?:app|application)/i,
     ],
     priority: 8,
    autoExecute: true,
    extractParams: (msg) => {
      return { goal: msg };
    }
   },
   {
     tool: 'shadow_browser',
     patterns: [
       /\b(browse|open|visit|go\s+to|navigate\s+to)\s+(?:the\s+)?(?:website|webpage|page|site|url)/i,
       /\b(browse|open|visit)\s+(https?:\/\/|www\.)/i,
       /\b(scrape|extract|crawl)\s+(?:data\s+from|the)\s+(?:website|webpage|page)/i,
       /\bopen\s+(?:this\s+)?url/i,
     ],
     priority: 7,
    autoExecute: false,
     extractParams: (msg) => {
       const urlMatch = msg.match(/(https?:\/\/[^\s]+)/i);
       return { url: urlMatch?.[1] || '' };
     }
   },
   {
     tool: 'visual_reasoning',
     patterns: [
       /\b(analyze|explain|describe|understand)\s+(?:this\s+)?(?:image|picture|photo|screenshot|diagram|chart)/i,
       /\bwhat(?:'s| is)\s+(?:in\s+)?(?:this\s+)?(?:image|picture|photo)/i,
       /\b(read|extract|ocr)\s+(?:text\s+from|the)\s+(?:this\s+)?(?:image|picture|screenshot)/i,
     ],
     priority: 6,
    autoExecute: false,
   },
   {
     tool: 'creative_synthesis',
     patterns: [
       /\b(brainstorm|ideate|creative|generate\s+ideas)/i,
       /\b(write|compose|draft)\s+(?:a\s+)?(?:story|poem|song|script|essay|article|blog)/i,
       /\bcreative\s+writing/i,
       /\bstoryboard/i,
     ],
     priority: 5,
    autoExecute: true,
    extractParams: (msg) => {
      const cleaned = msg
        .replace(/^(brainstorm|ideate|generate\s+ideas|write|compose|draft|creative\s+writing|storyboard)\s+(a\s+)?(story|poem|song|script|essay|article|blog)?\s*(about|on|for)?\s*/i, '')
        .trim();
      return { prompt: cleaned || msg };
    }
   },
   {
     tool: 'code_canvas',
     patterns: [
       /\b(write|create|generate|build)\s+(?:some\s+)?(?:code|program|script|function|app|application)/i,
       /\b(code|program|develop|implement)\s+(?:a\s+|an\s+)?(?:\w+\s+)?(?:in\s+)?(?:python|javascript|typescript|react|java|c\+\+)/i,
       /\b(fix|debug|refactor)\s+(?:this\s+)?code/i,
       /\bopen\s+(?:the\s+)?code\s+(?:editor|canvas|workspace)/i,
     ],
     priority: 5,
    autoExecute: false,
   },
   {
     tool: 'shadow_live',
     patterns: [
       /\b(voice\s+chat|talk\s+to\s+ai|live\s+conversation|speak\s+with)/i,
       /\bstart\s+(?:a\s+)?(?:voice|live)\s+(?:call|chat|session)/i,
     ],
     priority: 4,
    autoExecute: false,
   },
   {
     tool: 'data_organizer',
     patterns: [
       /\b(organize|sort|manage|structure)\s+(?:my\s+)?(?:data|files|documents|notes)/i,
       /\b(create|make)\s+(?:a\s+)?(?:table|spreadsheet|database)/i,
     ],
     priority: 4,
    autoExecute: false,
   },
   {
     tool: 'camera_capture',
     patterns: [
       /\b(take|capture|snap)\s+(?:a\s+)?(?:photo|picture|screenshot)/i,
       /\bopen\s+(?:the\s+)?camera/i,
       /\buse\s+(?:my\s+)?camera/i,
     ],
     priority: 4,
    autoExecute: false,
   },
   {
     tool: 'stealth_vault',
     patterns: [
       /\b(encrypt|secure|protect|hide)\s+(?:my\s+)?(?:data|notes|secrets|passwords)/i,
       /\bopen\s+(?:the\s+)?(?:stealth\s+)?vault/i,
       /\bsave\s+(?:to\s+)?(?:stealth\s+)?vault/i,
     ],
     priority: 3,
    autoExecute: false,
   },
   {
     tool: 'calculator',
     patterns: [
       /^[\d\s+\-*/().^%=]+$/,
       /\b(calculate|compute|solve|what\s+is)\s+[\d\s+\-*/().^%]+/i,
       /\bmath\s+(?:problem|equation|calculation)/i,
     ],
     priority: 3,
    autoExecute: true,
     extractParams: (msg) => {
       const expr = msg.replace(/^(calculate|compute|solve|what\s+is)\s*/i, '');
       return { expression: expr.trim() };
     }
   },
   {
     tool: 'web_search',
     patterns: [
       /\b(search|google|look\s+up|find)\s+(?:for\s+)?(?:information\s+(?:about|on))?\s*.{3,}/i,
       /\bwhat(?:'s| is)\s+(?:the\s+)?(?:latest|current|recent)\s+(?:news|update)/i,
     ],
     priority: 2,
    autoExecute: true,
     extractParams: (msg) => {
       const cleaned = msg.replace(/^(search|google|look\s+up|find)\s+(?:for\s+)?(?:information\s+(?:about|on))?\s*/i, '');
       return { query: cleaned.trim() };
     }
   },
 ];
 
 export const useToolOrchestrator = () => {
   // Detect which tool should be triggered based on user message
   const detectTool = useCallback((message: string): ToolDetectionResult => {
     const normalizedMessage = message.trim().toLowerCase();
     
     if (!normalizedMessage || normalizedMessage.length < 3) {
       return { tool: null, confidence: 0 };
     }
 
     let bestMatch: ToolDetectionResult = { tool: null, confidence: 0 };
 
     for (const toolDef of TOOL_PATTERNS) {
       for (const pattern of toolDef.patterns) {
         if (pattern.test(message)) {
           const confidence = toolDef.priority * 10;
           if (confidence > bestMatch.confidence) {
             bestMatch = {
               tool: toolDef.tool,
               confidence,
               params: toolDef.extractParams?.(message),
                autoExecute: toolDef.autoExecute ?? false,
                originalMessage: message,
             };
           }
           break; // Found match for this tool, check next tool
         }
       }
     }
 
     return bestMatch;
   }, []);
 
   // Execute calculator inline
   const executeCalculator = useCallback((expression: string): string => {
     try {
       const sanitized = expression.replace(/[^0-9+\-*/().^% ]/g, '');
       // eslint-disable-next-line no-eval
       const result = eval(sanitized);
       return `**Result:** ${result}`;
     } catch {
       return 'Could not calculate. Please check the expression.';
     }
   }, []);
 
   return {
     detectTool,
     executeCalculator,
   };
 };
 
 export default useToolOrchestrator;