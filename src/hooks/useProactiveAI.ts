import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export interface ProactiveMessage {
  id: string;
  content: string;
  type: 'greeting' | 'nudge' | 'contextual' | 'returning' | 'milestone' | 'exit-intent';
  priority: number;
  dismissable: boolean;
}

interface VisitorMemory {
  visitCount: number;
  lastVisit: number;
  pagesVisited: string[];
  lastConversationTopic?: string;
  hasInteracted: boolean;
  totalTimeSpent: number;
  name?: string;
}

const STORAGE_KEY = 'shadowtalk-visitor-memory';
const SESSION_KEY = 'shadowtalk-proactive-session';

const PAGE_CONTEXT: Record<string, { tip: string; delay: number }> = {
  '/': { tip: "👋 I noticed you're exploring ShadowTalk. Want me to show you what makes us different from ChatGPT, Claude, and Gemini?", delay: 5000 },
  '/pricing': { tip: "💡 Need help choosing a plan? I can compare features side-by-side based on your use case.", delay: 4000 },
  '/about': { tip: "🤝 Interested in working with us or have a question? I'm right here — no forms needed.", delay: 6000 },
  '/chatbot': { tip: "🧠 Pro tip: Try saying 'launch mission' or 'security audit' to unlock agentic capabilities most users miss.", delay: 8000 },
  '/strategy': { tip: "📊 I can generate a full business strategy report in under 60 seconds. Want to try?", delay: 5000 },
  '/docs': { tip: "📖 Looking for something specific? Ask me instead of scrolling — I know every feature inside out.", delay: 7000 },
  '/workspace': { tip: "🏢 Your workspace remembers everything. Try storing your brand voice and watch AI adapt.", delay: 6000 },
  '/faq': { tip: "❓ Can't find your answer? I probably know it. Ask me anything.", delay: 4000 },
  '/contact': { tip: "💬 Skip the form — I can answer most questions instantly, 24/7.", delay: 3000 },
  '/blog': { tip: "✍️ Want me to summarize any article or find related content? Just ask.", delay: 8000 },
  '/developers': { tip: "🔧 Need API integration help? I can generate code snippets in any language.", delay: 5000 },
};

const IDLE_NUDGES = [
  "🤔 You've been quiet for a while. Need help finding something?",
  "💭 I'm here if you need me — no question is too small.",
  "⚡ While you're thinking, did you know I can run autonomous multi-step tasks?",
  "🎯 Stuck? Tell me what you're trying to accomplish and I'll find the fastest path.",
  "🔍 I can search, analyze, code, and strategize. What's on your mind?",
];

const RETURN_GREETINGS = [
  (memory: VisitorMemory) => `Welcome back! 🎉 This is your visit #${memory.visitCount}. ${memory.lastConversationTopic ? `Last time we talked about "${memory.lastConversationTopic}". Want to pick up where we left off?` : 'What can I help you with today?'}`,
  (memory: VisitorMemory) => `Hey, good to see you again! 👋 You've spent ${Math.round(memory.totalTimeSpent / 60000)} minutes with us so far. Ready to make today productive?`,
  (memory: VisitorMemory) => `Welcome back! 🚀 You've explored ${memory.pagesVisited.length} pages so far. ${memory.pagesVisited.length < 5 ? "There's so much more to discover — want a tour?" : "You're becoming a power user!"}`,
];

const FIRST_VISIT_GREETINGS = [
  "👋 Hey! I'm not like other chatbots — I don't wait for you to ask. I watch, learn, and suggest. Try me.",
  "🚀 Welcome to ShadowTalk AI. I'm proactive, not reactive. I'll suggest things before you even think to ask.",
  "⚡ First time here? I'm your AI that thinks ahead. I'll notify you with tips, insights, and shortcuts as you explore.",
];

const SCROLL_MILESTONES = [
  { depth: 50, message: "📌 You're halfway through! Want me to summarize what you've read so far?" },
  { depth: 90, message: "🏁 You've read almost everything on this page. Ready to take action? I can help with next steps." },
];

function getVisitorMemory(): VisitorMemory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    visitCount: 0,
    lastVisit: 0,
    pagesVisited: [],
    hasInteracted: false,
    totalTimeSpent: 0,
  };
}

function saveVisitorMemory(memory: VisitorMemory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {}
}

function getSessionState(): { shownMessages: string[]; sessionStart: number } {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { shownMessages: [], sessionStart: Date.now() };
}

function saveSessionState(state: { shownMessages: string[]; sessionStart: number }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

export function useProactiveAI(isChatOpen: boolean) {
  const location = useLocation();
  const [currentMessage, setCurrentMessage] = useState<ProactiveMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const memoryRef = useRef(getVisitorMemory());
  const sessionRef = useRef(getSessionState());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollDepthRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const pageEntryRef = useRef(Date.now());

  const showMessage = useCallback((msg: Omit<ProactiveMessage, 'id'>) => {
    const id = `${msg.type}-${Date.now()}`;
    
    // Don't show if chat is open or if we've shown this type recently
    if (isChatOpen) return;
    
    const session = sessionRef.current;
    const recentSameType = session.shownMessages.filter(m => m.startsWith(msg.type)).length;
    if (recentSameType >= 2) return; // Max 2 of same type per session
    
    session.shownMessages.push(id);
    saveSessionState(session);
    
    setCurrentMessage({ ...msg, id });
    setIsVisible(true);
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentMessage(null), 500);
    }, 15000);
  }, [isChatOpen]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setCurrentMessage(null), 500);
  }, []);

  const recordInteraction = useCallback((topic?: string) => {
    const memory = memoryRef.current;
    memory.hasInteracted = true;
    if (topic) memory.lastConversationTopic = topic;
    saveVisitorMemory(memory);
  }, []);

  // Track visit on mount
  useEffect(() => {
    const memory = memoryRef.current;
    memory.visitCount += 1;
    memory.lastVisit = Date.now();
    saveVisitorMemory(memory);
  }, []);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      memoryRef.current.totalTimeSpent += 5000;
      saveVisitorMemory(memoryRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initial greeting (first visit vs returning)
  useEffect(() => {
    const session = sessionRef.current;
    if (session.shownMessages.some(m => m.startsWith('greeting') || m.startsWith('returning'))) return;
    
    const memory = memoryRef.current;
    const delay = memory.visitCount <= 1 ? 3000 : 2000;
    
    const timer = setTimeout(() => {
      if (memory.visitCount <= 1) {
        const greeting = FIRST_VISIT_GREETINGS[Math.floor(Math.random() * FIRST_VISIT_GREETINGS.length)];
        showMessage({ content: greeting, type: 'greeting', priority: 10, dismissable: true });
      } else {
        const greetingFn = RETURN_GREETINGS[Math.floor(Math.random() * RETURN_GREETINGS.length)];
        showMessage({ content: greetingFn(memory), type: 'returning', priority: 10, dismissable: true });
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [showMessage]);

  // Page-context tips
  useEffect(() => {
    pageEntryRef.current = Date.now();
    
    if (pageTimerRef.current) clearTimeout(pageTimerRef.current);
    
    const pageContext = PAGE_CONTEXT[location.pathname];
    if (!pageContext) return;
    
    // Track page visit
    const memory = memoryRef.current;
    if (!memory.pagesVisited.includes(location.pathname)) {
      memory.pagesVisited.push(location.pathname);
      saveVisitorMemory(memory);
    }
    
    pageTimerRef.current = setTimeout(() => {
      showMessage({ content: pageContext.tip, type: 'contextual', priority: 7, dismissable: true });
    }, pageContext.delay);
    
    return () => {
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current);
    };
  }, [location.pathname, showMessage]);

  // Idle detection
  useEffect(() => {
    const resetIdle = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      idleTimerRef.current = setTimeout(() => {
        const nudge = IDLE_NUDGES[Math.floor(Math.random() * IDLE_NUDGES.length)];
        showMessage({ content: nudge, type: 'nudge', priority: 5, dismissable: true });
      }, 45000); // 45 seconds idle
    };
    
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [showMessage]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const depth = Math.round((window.scrollY / scrollHeight) * 100);
      
      if (depth > scrollDepthRef.current) {
        scrollDepthRef.current = depth;
        
        for (const milestone of SCROLL_MILESTONES) {
          if (depth >= milestone.depth && scrollDepthRef.current - depth < 5) {
            const session = sessionRef.current;
            const milestoneId = `milestone-${milestone.depth}`;
            if (!session.shownMessages.includes(milestoneId)) {
              showMessage({ content: milestone.message, type: 'milestone', priority: 4, dismissable: true });
            }
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMessage]);

  // Exit intent detection (mouse leaves viewport top)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        const timeOnPage = Date.now() - pageEntryRef.current;
        if (timeOnPage > 10000) { // Only after 10s on page
          showMessage({
            content: "🚪 Leaving already? If something's missing, tell me — I might have the answer.",
            type: 'exit-intent',
            priority: 8,
            dismissable: true,
          });
        }
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showMessage]);

  return {
    currentMessage,
    isVisible,
    dismiss,
    recordInteraction,
    visitorMemory: memoryRef.current,
  };
}
