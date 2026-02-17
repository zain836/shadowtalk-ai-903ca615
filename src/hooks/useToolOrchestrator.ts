import { useCallback } from 'react';

export type ToolType = 
  | 'image_generator'
  | 'image_decoder'
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
  | 'web_search'
  | 'document_generator'
  | 'daily_planner'
  | 'wordle_game'
  | 'script_automation'
  | 'agent_workflows'
  | 'model_fine_tuning'
  | 'white_label'
  | 'gemini_analytics'
  | 'google_integration'
  | 'sovereign_models'
  | 'security_audit'
  | 'eco_actions'
  | 'vision_agent'
  | 'command_palette'
  | 'knowledge_vault'
  | 'memory_panel'
  | 'mission_control'
  | 'custom_instructions'
  | 'conversation_branching'
  | 'bunker_mode'
  | 'strategy_agent'
  | 'cognitive_loop'
  | 'canvas_document'
  | 'referral'
  | 'workspace'
  | 'marketplace'
  | 'privacy_score'
  | 'presentation_builder';

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
  // Image Decoder - Hidden built-in tool (high priority)
  {
    tool: 'image_decoder',
    patterns: [
      /\b(decode|analyze|describe|explain|interpret|read)\s+(this\s+)?(image|picture|photo|screenshot)/i,
      /\bwhat('s| is)\s+in\s+(this\s+)?(image|picture|photo)/i,
      /\bextract\s+(text\s+|data\s+)?from\s+(this\s+)?(image|picture)/i,
      /\bimage\s+(analysis|decode|decoding)/i,
      /\bwhat\s+does\s+(this\s+)?(image|picture)\s+show/i,
      /\b(scan|process)\s+(this\s+)?(image|picture)/i,
    ],
    priority: 11,
    autoExecute: true,
    extractParams: (msg) => ({ query: msg }),
  },
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
      /\b(repurpose|fusion|stakeholder)\s+(content|data|strategy)/i,
      /\b(transform|convert)\s+(?:this\s+)?(?:into|to)\s+(?:multiple|different)\s+formats/i,
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
      /\bvoice\s+mode/i,
    ],
    priority: 4,
    autoExecute: false,
  },
  {
    tool: 'data_organizer',
    patterns: [
      /\b(organize|sort|manage|structure)\s+(?:my\s+)?(?:data|files|documents|notes)/i,
      /\b(create|make)\s+(?:a\s+)?(?:table|spreadsheet|database)/i,
      /\b(convert|transform)\s+(?:this\s+)?(?:data|text)\s+(?:into|to)\s+(?:a\s+)?(?:table|json|csv)/i,
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
      /\bprivacy\s+vault/i,
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
  // Document Generator
  {
    tool: 'document_generator',
    patterns: [
      /\b(write|create|generate|draft|compose)\s+(a\s+|an\s+)?(document|doc|article|email|letter|report|proposal|blog\s*post|resume|cv)/i,
      /\b(generate|write|create)\s+(?:me\s+)?(a\s+|an\s+)?(professional\s+)?(email|letter|report)/i,
      /\bmake\s+(?:me\s+)?(a\s+|an\s+)?(document|article|email|report|pdf)/i,
      /\bdraft\s+(an?\s+)?(email|letter|proposal|article)/i,
      /\b(pdf|doc|article|email)\s+(?:about|for|on)\s+/i,
      /\b(write|create|generate|draft)\s+(a\s+|an\s+)?(book|book\s*extract|book\s*chapter|chapter|excerpt|novel\s*excerpt)/i,
      /\bbook\s*(extract|chapter|excerpt|section)\s*(?:about|on|for)?\s*/i,
      /\b(generate|write)\s+(?:me\s+)?(a\s+)?(story|fiction|narrative|book\s*content)/i,
    ],
    priority: 8,
    autoExecute: true,
    extractParams: (msg) => {
      const isBookRequest = /\b(book|chapter|excerpt|novel|story|fiction|narrative)/i.test(msg);
      const cleaned = msg
        .replace(/^(write|create|generate|draft|compose|make)\s+(me\s+)?(a\s+|an\s+)?(professional\s+)?(document|doc|article|email|letter|report|proposal|blog\s*post|resume|cv|book|book\s*extract|book\s*chapter|chapter|excerpt|novel\s*excerpt|story|fiction|narrative)\s*(about|for|on)?\s*/i, '')
        .trim();
      return { topic: cleaned || msg, docType: isBookRequest ? 'book_extract' : undefined };
    }
  },
  // Daily Planner
  {
    tool: 'daily_planner',
    patterns: [
      /\b(plan|schedule|organize)\s+(my\s+)?(day|daily|today|tomorrow|schedule)/i,
      /\bdaily\s+(plan|planner|schedule|agenda)/i,
      /\b(create|make|generate)\s+(a\s+)?(daily\s+)?(plan|schedule|agenda)/i,
      /\bwhat\s+should\s+i\s+do\s+today/i,
      /\bhelp\s+me\s+plan\s+(my\s+)?day/i,
      /\bday\s+planner/i,
    ],
    priority: 7,
    autoExecute: true,
    extractParams: (msg) => {
      return { prompt: msg };
    }
  },
  // Wordle Game
  {
    tool: 'wordle_game',
    patterns: [
      /\b(play|start|open|launch)\s+(a\s+)?wordle/i,
      /\bwordle\s*(game|bot|puzzle)?/i,
      /\bword\s*guess(ing)?\s*(game|puzzle)/i,
      /\blet'?s?\s+play\s+wordle/i,
      /\bi\s+want\s+to\s+play\s+wordle/i,
    ],
    priority: 8,
    autoExecute: true,
    extractParams: () => ({})
  },

  // ========== NEW TOOLS ==========

  // Script Automation
  {
    tool: 'script_automation',
    patterns: [
      /\b(create|build|write|make)\s+(?:a\s+)?(?:automation|automated)\s+(?:script|workflow|task)/i,
      /\bscript\s+automation/i,
      /\b(automate|automation)\s+(?:my\s+)?(?:tasks?|workflows?|processes?)/i,
      /\bopen\s+(?:the\s+)?(?:script|automation)\s+(?:editor|manager|panel)/i,
      /\b(create|run|manage)\s+(?:custom\s+)?scripts?/i,
      /\btrigger-?based\s+(?:automation|scripts?)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // Agent Workflows
  {
    tool: 'agent_workflows',
    patterns: [
      /\bai\s+(?:agent\s+)?workflows?/i,
      /\b(create|build|design)\s+(?:an?\s+)?(?:ai\s+)?workflow/i,
      /\bworkflow\s+(?:builder|designer|editor|automation)/i,
      /\bopen\s+(?:the\s+)?(?:agent\s+)?workflows?/i,
      /\borchestrate\s+(?:ai\s+)?(?:agents?|tasks?)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // Model Fine-Tuning
  {
    tool: 'model_fine_tuning',
    patterns: [
      /\b(fine[- ]?tune|train|customize)\s+(?:a\s+|the\s+)?(?:ai\s+)?model/i,
      /\bmodel\s+(?:fine[- ]?tuning|training|customization)/i,
      /\b(create|build)\s+(?:a\s+)?custom\s+(?:ai\s+)?model/i,
      /\btrain\s+(?:my\s+)?(?:own\s+)?(?:ai|model)/i,
      /\bopen\s+(?:the\s+)?(?:model\s+)?(?:fine[- ]?tun|train)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // White-Label Branding
  {
    tool: 'white_label',
    patterns: [
      /\bwhite[- ]?label/i,
      /\b(custom|change|update)\s+(?:the\s+)?branding/i,
      /\bbrand\s+(?:customization|settings|manager)/i,
      /\b(customize|change)\s+(?:the\s+)?(?:logo|theme|colors?|appearance)/i,
      /\bopen\s+(?:the\s+)?branding/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Gemini Analytics
  {
    tool: 'gemini_analytics',
    patterns: [
      /\b(gemini|api)\s+(?:key\s+)?analytics/i,
      /\bapi\s+(?:key\s+)?(?:usage|stats|statistics|metrics)/i,
      /\b(show|view|check)\s+(?:my\s+)?(?:gemini|api)\s+(?:key\s+)?(?:usage|analytics)/i,
      /\bkey\s+(?:rotation|health|performance)/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Google Integration
  {
    tool: 'google_integration',
    patterns: [
      /\bgoogle\s+(?:integration|connect|workspace|drive|calendar|docs|sheets)/i,
      /\bconnect\s+(?:to\s+)?google/i,
      /\b(sync|link|connect)\s+(?:my\s+)?(?:google\s+)?(?:drive|calendar|docs|gmail|sheets)/i,
      /\bopen\s+(?:the\s+)?google\s+(?:integration|panel)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // Sovereign Models
  {
    tool: 'sovereign_models',
    patterns: [
      /\bsovereign\s+(?:model|ai|mode)/i,
      /\blocal\s+(?:ai|model|inference)/i,
      /\boffline\s+(?:ai|model|inference)/i,
      /\b(download|install|manage)\s+(?:local\s+)?(?:ai\s+)?models?/i,
      /\bon[- ]?device\s+(?:ai|model|inference)/i,
      /\brun\s+(?:ai\s+)?(?:locally|offline)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // Security Audit
  {
    tool: 'security_audit',
    patterns: [
      /\bsecurity\s+(?:audit|scan|check|analysis|review)/i,
      /\b(scan|audit|check|analyze)\s+(?:for\s+)?(?:security\s+)?(?:vulnerabilities|threats|risks|issues)/i,
      /\bvulnerability\s+(?:scan|check|assessment)/i,
      /\bpenetration\s+test/i,
      /\bpen[- ]?test/i,
      /\bfind\s+(?:security\s+)?(?:vulnerabilities|bugs|flaws)/i,
      /\bsecurity\s+(?:report|assessment)/i,
      /\bhsca/i,
    ],
    priority: 7,
    autoExecute: false,
    extractParams: (msg) => ({ query: msg }),
  },

  // Eco / Planetary Actions
  {
    tool: 'eco_actions',
    patterns: [
      /\b(eco|green|carbon|sustainability|environmental|climate)\s+(actions?|impact|footprint|tracker)/i,
      /\b(track|log|record)\s+(?:my\s+)?(?:eco|carbon|green|environmental)\s+(?:actions?|impact)/i,
      /\bcarbon\s+(?:footprint|offset|tracker|savings?)/i,
      /\bplanetary\s+(?:action|impact|dashboard)/i,
      /\bsustainability\s+(?:dashboard|tracker|report)/i,
      /\beco\s+(?:leaderboard|stats|dashboard)/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Vision Agent (real-time camera AI)
  {
    tool: 'vision_agent',
    patterns: [
      /\bvision\s+agent/i,
      /\b(start|open|launch|enable)\s+(?:the\s+)?vision\s+(?:agent|mode)/i,
      /\breal[- ]?time\s+(?:camera|video|vision)\s+(?:analysis|ai|mode)/i,
      /\b(analyze|watch|observe)\s+(?:me|my\s+face|my\s+room)\s+(?:in\s+)?real[- ]?time/i,
      /\blive\s+(?:camera|vision|video)\s+(?:ai|analysis|mode)/i,
    ],
    priority: 7,
    autoExecute: false,
  },

  // Command Palette
  {
    tool: 'command_palette',
    patterns: [
      /\bcommand\s+palette/i,
      /\bopen\s+(?:the\s+)?command\s+(?:palette|menu)/i,
      /\bshow\s+(?:me\s+)?(?:all\s+)?(?:commands?|shortcuts?|features?|tools?)/i,
      /\bwhat\s+(?:can\s+you|tools?\s+(?:do\s+you|are))/i,
      /\blist\s+(?:all\s+)?(?:available\s+)?(?:tools?|features?|commands?)/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Analytics Dashboard
  {
    tool: 'analytics',
    patterns: [
      /\b(show|view|open|check)\s+(?:my\s+)?(?:usage\s+)?analytics/i,
      /\banalytics\s+(?:dashboard|panel|report)/i,
      /\b(show|view)\s+(?:my\s+)?(?:usage|stats|statistics|metrics)/i,
      /\bhow\s+(?:much\s+)?(?:have\s+)?i\s+(?:used|chatted)/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Multi-Model Orchestrator
  {
    tool: 'multi_model',
    patterns: [
      /\bmulti[- ]?model/i,
      /\b(compare|use)\s+(?:multiple\s+)?(?:ai\s+)?models/i,
      /\bmodel\s+(?:comparison|consensus|orchestrat)/i,
      /\bask\s+(?:multiple|all|several)\s+(?:ai|models?)/i,
      /\bconsensus\s+mode/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // API Marketplace
  {
    tool: 'api_marketplace',
    patterns: [
      /\bapi\s+marketplace/i,
      /\b(manage|view|check)\s+(?:my\s+)?api\s+keys?/i,
      /\bdeveloper\s+(?:portal|tools|dashboard)/i,
      /\bopen\s+(?:the\s+)?(?:api\s+)?marketplace/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // ========== FULL FEATURE ACCESS ==========

  // Knowledge Vault
  {
    tool: 'knowledge_vault',
    patterns: [
      /\bknowledge\s+(?:vault|base|graph)/i,
      /\b(open|show|manage)\s+(?:my\s+)?knowledge/i,
      /\bsave\s+(?:this\s+)?(?:to\s+)?knowledge/i,
      /\brag\s+(?:search|query)/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Memory Panel
  {
    tool: 'memory_panel',
    patterns: [
      /\b(open|show|manage)\s+(?:my\s+)?(?:ai\s+)?memory/i,
      /\bmemory\s+(?:panel|vault|manager)/i,
      /\bwhat\s+do\s+you\s+(?:remember|know)\s+about\s+me/i,
      /\bbusiness\s+(?:memory|context|profile)/i,
      /\bremember\s+(?:this|that|my)/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Mission Control (S.E.E.)
  {
    tool: 'mission_control',
    patterns: [
      /\bmission\s+(?:control|dashboard|center)/i,
      /\b(create|start|launch|run)\s+(?:a\s+)?mission/i,
      /\bs\.?e\.?e\.?\s+(?:engine|missions?)/i,
      /\bbackground\s+(?:task|agent|mission)/i,
      /\bautonomous\s+(?:task|mission|execution)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // Custom Instructions
  {
    tool: 'custom_instructions',
    patterns: [
      /\bcustom\s+instructions?/i,
      /\bset\s+(?:my\s+)?(?:ai\s+)?(?:instructions?|rules?|preferences?)/i,
      /\bsystem\s+prompt/i,
      /\bhow\s+should\s+(?:you|ai)\s+(?:behave|respond|act)/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Conversation Branching
  {
    tool: 'conversation_branching',
    patterns: [
      /\b(branch|fork|split)\s+(?:this\s+)?conversation/i,
      /\bconversation\s+(?:branch|tree|fork)/i,
      /\b(create|make)\s+(?:a\s+)?(?:conversation\s+)?branch/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Bunker Mode
  {
    tool: 'bunker_mode',
    patterns: [
      /\bbunker\s+mode/i,
      /\bgo\s+(?:completely\s+)?offline/i,
      /\bair[- ]?gap(?:ped)?\s+(?:mode|ai)/i,
      /\b(enable|activate|start)\s+(?:full\s+)?(?:bunker|offline|sovereign)\s+mode/i,
    ],
    priority: 7,
    autoExecute: false,
  },

  // Strategy Agent
  {
    tool: 'strategy_agent',
    patterns: [
      /\bstrategy\s+(?:agent|advisor|consultant)/i,
      /\bbusiness\s+(?:strategy|plan|analysis)/i,
      /\bswot\s+analysis/i,
      /\b(open|launch)\s+(?:the\s+)?strategy/i,
      /\bcompetitive\s+(?:analysis|intelligence)/i,
    ],
    priority: 6,
    autoExecute: false,
  },

  // Cognitive Loop
  {
    tool: 'cognitive_loop',
    patterns: [
      /\bcognitive\s+loop/i,
      /\bmulti[- ]?agent\s+(?:debate|reasoning|consensus)/i,
      /\b(enable|activate)\s+(?:the\s+)?cognitive/i,
      /\bdebate\s+mode/i,
    ],
    priority: 5,
    autoExecute: false,
  },

  // Canvas Document
  {
    tool: 'canvas_document',
    patterns: [
      /\bopen\s+(?:the\s+)?(?:document\s+)?canvas/i,
      /\b(create|new)\s+(?:a\s+)?(?:document|canvas)/i,
      /\bdocument\s+editor/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Referral
  {
    tool: 'referral',
    patterns: [
      /\breferral\s+(?:program|code|link)/i,
      /\binvite\s+(?:a\s+)?friend/i,
      /\b(share|get)\s+(?:my\s+)?referral/i,
      /\bearn\s+(?:rewards?|credits?)/i,
    ],
    priority: 3,
    autoExecute: false,
  },

  // Workspace
  {
    tool: 'workspace',
    patterns: [
      /\b(open|go\s+to|show)\s+(?:my\s+)?workspace/i,
      /\bai\s+workspace/i,
      /\bpersistent\s+(?:workspace|context)/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Marketplace
  {
    tool: 'marketplace',
    patterns: [
      /\b(open|browse|show)\s+(?:the\s+)?marketplace/i,
      /\bplugins?\s+(?:store|marketplace|manager)/i,
      /\b(install|browse)\s+(?:plugins?|extensions?)/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Privacy Score
  {
    tool: 'privacy_score',
    patterns: [
      /\bprivacy\s+(?:score|rating|check)/i,
      /\b(check|show|view)\s+(?:my\s+)?privacy/i,
      /\bdigital\s+(?:privacy|footprint)/i,
    ],
    priority: 4,
    autoExecute: false,
  },

  // Presentation Builder
  {
    tool: 'presentation_builder',
    patterns: [
      /\b(create|make|build|generate|design)\s+(?:a\s+|an\s+)?(?:presentation|ppt|pptx|slides?|slide\s*deck|deck|powerpoint|pitch\s*deck)/i,
      /\bpresentation\s+(?:builder|creator|maker|generator)/i,
      /\b(build|create)\s+(?:me\s+)?(?:a\s+)?(?:slide\s*)?deck/i,
      /\bpitch\s*deck/i,
      /\bpowerpoint/i,
      /\bslide\s*show/i,
    ],
    priority: 9,
    autoExecute: false,
    extractParams: (msg: string) => {
      const cleaned = msg
        .replace(/^(create|make|build|generate|design)\s+(me\s+)?(a\s+|an\s+)?(presentation|ppt|pptx|slides?|slide\s*deck|deck|powerpoint|pitch\s*deck)\s*(about|on|for)?\s*/i, '')
        .trim();
      return { topic: cleaned || msg };
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
          break;
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
