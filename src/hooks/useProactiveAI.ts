import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// ─── Types ─────────────────────────────────────────────

export type ProactiveMessageType =
  | 'greeting' | 'returning' | 'contextual' | 'nudge'
  | 'milestone' | 'exit-intent'
  | 'mood' | 'prediction' | 'narration' | 'temporal';

export interface ProactiveMessage {
  id: string;
  content: string;
  type: ProactiveMessageType;
  priority: number;
  dismissable: boolean;
  icon?: string; // emoji
}

type UserMood = 'neutral' | 'frustrated' | 'excited' | 'confused' | 'focused' | 'bored' | 'rushed';

interface VisitorMemory {
  visitCount: number;
  lastVisit: number;
  pagesVisited: string[];
  navigationHistory: { path: string; timestamp: number; dwellMs: number }[];
  lastConversationTopic?: string;
  hasInteracted: boolean;
  totalTimeSpent: number;
  moodHistory: { mood: UserMood; timestamp: number }[];
}

interface BehaviorSignals {
  clicksPerMinute: number;
  rapidClicks: number; // "rage clicks"
  typingSpeed: number; // chars per second
  mouseIdleMs: number;
  scrollVelocity: number;
  backtrackCount: number; // times user went back to a previously visited page
  hoverDuration: number;
  focusLostCount: number; // tab switches
}

// ─── Constants ─────────────────────────────────────────

const STORAGE_KEY = 'shadowtalk-visitor-memory';
const SESSION_KEY = 'shadowtalk-proactive-session';

// Time-aware greetings
function getTemporalGreeting(): { greeting: string; icon: string } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  if (hour >= 0 && hour < 5) {
    return { greeting: "🌙 Burning the midnight oil? I respect the hustle. Need an AI co-pilot for your late-night session?", icon: "🌙" };
  }
  if (hour >= 5 && hour < 9) {
    return { greeting: "🌅 Early riser! Your brain is freshest right now — perfect time to explore what ShadowTalk can do for you.", icon: "🌅" };
  }
  if (hour >= 9 && hour < 12) {
    if (isWeekend) {
      return { greeting: "☕ Weekend morning vibes. No rush — browse at your pace. I'll be here if anything catches your eye.", icon: "☕" };
    }
    return { greeting: "⚡ Monday morning momentum! Let's make this productive. What are you building today?", icon: "⚡" };
  }
  if (hour >= 12 && hour < 14) {
    return { greeting: "🍽️ Lunch break browsing? Smart move. I can give you a 2-minute overview of anything on this page.", icon: "🍽️" };
  }
  if (hour >= 14 && hour < 17) {
    return { greeting: "🎯 Afternoon focus time. I'll keep interruptions minimal — but I'm watching if you need help.", icon: "🎯" };
  }
  if (hour >= 17 && hour < 20) {
    return { greeting: "🌆 Wrapping up your day? If you're evaluating tools, I can save you time with a quick comparison.", icon: "🌆" };
  }
  if (hour >= 20 && hour < 23) {
    return { greeting: "🌃 Evening exploration. Take your time — no pressure. I'll surface insights as you scroll.", icon: "🌃" };
  }
  return { greeting: "🌙 Night owl session! I'm fully awake and ready whenever you are.", icon: "🌙" };
}

// Mood-based responses
const MOOD_RESPONSES: Record<UserMood, { content: string; icon: string }[]> = {
  frustrated: [
    { content: "😤 I sense some friction. Tell me what's not working — I'll cut straight to the answer.", icon: "😤" },
    { content: "🔧 Something seem off? I'm watching your frustration signals. Let me help before you bounce.", icon: "🔧" },
  ],
  excited: [
    { content: "🔥 You're exploring fast — love the energy! Want me to fast-track you to the best features?", icon: "🔥" },
    { content: "⚡ Your click pattern tells me you're excited about what you're seeing. Ready to try it live?", icon: "⚡" },
  ],
  confused: [
    { content: "🤔 You've been going back and forth. Need me to explain something more clearly?", icon: "🤔" },
    { content: "🧭 Looks like you're searching for something specific. Tell me what and I'll find it instantly.", icon: "🧭" },
  ],
  focused: [
    { content: "📖 Deep reading mode detected. I'll stay quiet — but flag me if you want a summary.", icon: "📖" },
  ],
  bored: [
    { content: "😴 You seem to be losing interest. Want me to show you something you haven't discovered yet?", icon: "😴" },
    { content: "💎 Here's a hidden feature most people miss: try saying 'launch mission' in the chatbot. Game changer.", icon: "💎" },
  ],
  rushed: [
    { content: "⏱️ Short on time? Tell me what you need in one sentence. I'll get it for you in 10 seconds.", icon: "⏱️" },
  ],
  neutral: [],
};

// Navigation pattern predictions
const PREDICTION_PATTERNS: { pattern: string[]; prediction: string; icon: string }[] = [
  {
    pattern: ['/pricing', '/about'],
    prediction: "💡 Visited pricing then came here? You're evaluating if we're legit. We are — but ask me anything to verify.",
    icon: "💡",
  },
  {
    pattern: ['/pricing', '/faq'],
    prediction: "🤝 Checking pricing and FAQs? You're close to deciding. Want me to address your biggest hesitation?",
    icon: "🤝",
  },
  {
    pattern: ['/', '/chatbot'],
    prediction: "🚀 Jumped straight to the chatbot! Power user move. Try 'Ctrl+Shift+A' for the autonomous agent mode.",
    icon: "🚀",
  },
  {
    pattern: ['/pricing', '/pricing'],
    prediction: "🔄 You keep returning to pricing. Something not clear? I can build a custom comparison for your use case.",
    icon: "🔄",
  },
  {
    pattern: ['/docs', '/chatbot'],
    prediction: "📚 Read the docs, now trying it live — smart approach. Need me to walk you through any feature?",
    icon: "📚",
  },
  {
    pattern: ['/about', '/pricing'],
    prediction: "🎯 Liked what you saw about us? The Founder's Vault plan is our best value — want details?",
    icon: "🎯",
  },
];

// Ambient narration per page section (based on scroll %)
const PAGE_NARRATIONS: Record<string, { threshold: number; content: string; icon: string }[]> = {
  '/about': [
    { threshold: 15, content: "👀 Reading about the architect? Zain built this entire platform solo at 17. The AI you're using right now? He designed it.", icon: "👀" },
    { threshold: 40, content: "📊 You're exploring the tech stack section. Fun fact: ShadowTalk runs 30+ AI tools orchestrated by a single cognitive loop.", icon: "📊" },
    { threshold: 70, content: "🤝 Seeing the forms section? You can skip those — just tell me what you need right here.", icon: "🤝" },
  ],
  '/pricing': [
    { threshold: 20, content: "💰 Pro tip: The free tier includes agentic tasks that competitors charge $20/mo for.", icon: "💰" },
    { threshold: 60, content: "🏆 The Lifetime Deal at the bottom? Only 50 spots. Most users don't scroll this far.", icon: "🏆" },
  ],
  '/': [
    { threshold: 25, content: "🎬 You're past the hero section. The features below are what make us incomparable — keep scrolling.", icon: "🎬" },
    { threshold: 50, content: "📈 Halfway through the homepage. Most visitors who reach this point end up signing up. Just saying.", icon: "📈" },
    { threshold: 85, content: "🏁 You've seen almost everything. The chatbot is where the real magic happens — want to try it?", icon: "🏁" },
  ],
  '/chatbot': [
    { threshold: 10, content: "🧠 You're in the AI cockpit. Try: 'analyze my business', 'security audit', or 'creative synthesis' for power features.", icon: "🧠" },
  ],
  '/strategy': [
    { threshold: 20, content: "📊 The Strategy Agent can generate investor-grade reports. Most users don't realize it's free for the first report.", icon: "📊" },
  ],
};

// ─── Storage Helpers ───────────────────────────────────

function getVisitorMemory(): VisitorMemory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    visitCount: 0,
    lastVisit: 0,
    pagesVisited: [],
    navigationHistory: [],
    hasInteracted: false,
    totalTimeSpent: 0,
    moodHistory: [],
  };
}

function saveVisitorMemory(memory: VisitorMemory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {}
}

function getSessionState(): { shownMessages: string[]; sessionStart: number; shownNarrations: string[] } {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { shownMessages: [], sessionStart: Date.now(), shownNarrations: [] };
}

function saveSessionState(state: { shownMessages: string[]; sessionStart: number; shownNarrations: string[] }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Mood Detection Engine ─────────────────────────────

function detectMood(signals: BehaviorSignals): UserMood {
  // Rage clicks = frustrated
  if (signals.rapidClicks >= 3) return 'frustrated';
  // Very fast clicks + high scroll = excited
  if (signals.clicksPerMinute > 15 && signals.scrollVelocity > 5) return 'excited';
  // Going back and forth = confused
  if (signals.backtrackCount >= 2) return 'confused';
  // Fast typing = rushed
  if (signals.typingSpeed > 8) return 'rushed';
  // Minimal input, slow scroll = bored
  if (signals.mouseIdleMs > 20000 && signals.clicksPerMinute < 2) return 'bored';
  // Steady reading, moderate scroll = focused
  if (signals.scrollVelocity > 0 && signals.scrollVelocity < 3 && signals.clicksPerMinute < 5) return 'focused';
  // Tab switching = confused or bored
  if (signals.focusLostCount >= 3) return 'bored';
  return 'neutral';
}

// ─── Main Hook ─────────────────────────────────────────

export function useProactiveAI(isChatOpen: boolean) {
  const location = useLocation();
  const [currentMessage, setCurrentMessage] = useState<ProactiveMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [detectedMood, setDetectedMood] = useState<UserMood>('neutral');

  const memoryRef = useRef(getVisitorMemory());
  const sessionRef = useRef(getSessionState());
  const messageQueueRef = useRef<ProactiveMessage[]>([]);
  const isShowingRef = useRef(false);

  // Behavior tracking refs
  const clickTimestampsRef = useRef<number[]>([]);
  const rapidClickRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const mouseIdleRef = useRef(0);
  const mouseIdleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusLostRef = useRef(0);
  const backtrackRef = useRef(0);
  const lastPathRef = useRef(location.pathname);
  const pageEntryRef = useRef(Date.now());
  const scrollPercentRef = useRef(0);
  const typingSpeedRef = useRef(0);
  const keyTimestampsRef = useRef<number[]>([]);

  // ─── Message Queue System ───────────────────────────

  const processQueue = useCallback(() => {
    if (isShowingRef.current || isChatOpen || messageQueueRef.current.length === 0) return;

    // Sort by priority (higher first)
    messageQueueRef.current.sort((a, b) => b.priority - a.priority);
    const msg = messageQueueRef.current.shift()!;

    isShowingRef.current = true;
    setCurrentMessage(msg);
    setIsVisible(true);

    // Auto-dismiss after 12 seconds
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage(null);
        isShowingRef.current = false;
        // Process next in queue after a 5s cooldown
        setTimeout(() => processQueue(), 5000);
      }, 500);
    }, 12000);
  }, [isChatOpen]);

  const enqueueMessage = useCallback((msg: Omit<ProactiveMessage, 'id'>) => {
    if (isChatOpen) return;

    const session = sessionRef.current;
    const typeCount = session.shownMessages.filter(m => m.startsWith(msg.type)).length;
    if (typeCount >= 2) return; // Max 2 per type per session

    const id = `${msg.type}-${Date.now()}`;
    session.shownMessages.push(id);
    saveSessionState(session);

    messageQueueRef.current.push({ ...msg, id });
    processQueue();
  }, [isChatOpen, processQueue]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentMessage(null);
      isShowingRef.current = false;
      setTimeout(() => processQueue(), 3000);
    }, 500);
  }, [processQueue]);

  const recordInteraction = useCallback((topic?: string) => {
    const memory = memoryRef.current;
    memory.hasInteracted = true;
    if (topic) memory.lastConversationTopic = topic;
    saveVisitorMemory(memory);
  }, []);

  // ─── Visit Tracking ─────────────────────────────────

  useEffect(() => {
    const memory = memoryRef.current;
    memory.visitCount += 1;
    memory.lastVisit = Date.now();
    saveVisitorMemory(memory);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      memoryRef.current.totalTimeSpent += 5000;
      saveVisitorMemory(memoryRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── 1. Temporal + Initial Greeting ─────────────────

  useEffect(() => {
    const session = sessionRef.current;
    if (session.shownMessages.some(m => m.startsWith('greeting') || m.startsWith('returning') || m.startsWith('temporal'))) return;

    const memory = memoryRef.current;
    const delay = memory.visitCount <= 1 ? 2500 : 1500;

    const timer = setTimeout(() => {
      if (memory.visitCount <= 1) {
        const temporal = getTemporalGreeting();
        enqueueMessage({ content: temporal.greeting, type: 'temporal', priority: 10, dismissable: true, icon: temporal.icon });
      } else {
        const daysSinceVisit = Math.floor((Date.now() - memory.lastVisit) / 86400000);
        let content: string;
        let icon: string;

        if (daysSinceVisit > 7) {
          content = `👋 It's been ${daysSinceVisit} days! Welcome back. A lot has changed — want a recap of new features?`;
          icon = "👋";
        } else if (daysSinceVisit > 1) {
          content = `🎯 Back again! Visit #${memory.visitCount}. ${memory.lastConversationTopic ? `We left off discussing "${memory.lastConversationTopic}". Continue?` : "I remember your last session. Ready to pick up?"}`;
          icon = "🎯";
        } else {
          const temporal = getTemporalGreeting();
          content = `${temporal.icon} Visit #${memory.visitCount} today! ${temporal.greeting}`;
          icon = temporal.icon;
        }

        enqueueMessage({ content, type: 'returning', priority: 10, dismissable: true, icon });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [enqueueMessage]);

  // ─── 2. Behavior Signal Collection ──────────────────

  // Click tracking
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const now = Date.now();
      clickTimestampsRef.current.push(now);
      // Keep last 60s of clicks
      clickTimestampsRef.current = clickTimestampsRef.current.filter(t => now - t < 60000);

      // Detect rage clicks (3+ clicks within 1.5s in small area)
      const recentClicks = clickTimestampsRef.current.filter(t => now - t < 1500);
      if (recentClicks.length >= 3) {
        rapidClickRef.current += 1;
      }

      // Reset mouse idle
      mouseIdleRef.current = 0;
    };

    window.addEventListener('click', handler, { passive: true });
    return () => window.removeEventListener('click', handler);
  }, []);

  // Scroll velocity tracking
  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      const dt = (now - lastScrollTimeRef.current) / 1000;
      const dy = Math.abs(window.scrollY - lastScrollYRef.current);
      if (dt > 0) scrollVelocityRef.current = dy / dt;
      lastScrollYRef.current = window.scrollY;
      lastScrollTimeRef.current = now;

      // Scroll percentage
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        scrollPercentRef.current = Math.round((window.scrollY / scrollHeight) * 100);
      }

      mouseIdleRef.current = 0;
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Mouse idle tracking
  useEffect(() => {
    const handler = () => { mouseIdleRef.current = 0; };
    window.addEventListener('mousemove', handler, { passive: true });

    mouseIdleTimerRef.current = setInterval(() => {
      mouseIdleRef.current += 1000;
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handler);
      if (mouseIdleTimerRef.current) clearInterval(mouseIdleTimerRef.current);
    };
  }, []);

  // Tab focus tracking
  useEffect(() => {
    const handler = () => {
      if (document.hidden) focusLostRef.current += 1;
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Typing speed tracking
  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      keyTimestampsRef.current.push(now);
      keyTimestampsRef.current = keyTimestampsRef.current.filter(t => now - t < 5000);
      typingSpeedRef.current = keyTimestampsRef.current.length / 5; // chars per second
    };
    window.addEventListener('keydown', handler, { passive: true });
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── 3. Mood Detection Loop ─────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const clicksPerMinute = clickTimestampsRef.current.filter(t => now - t < 60000).length;

      const signals: BehaviorSignals = {
        clicksPerMinute,
        rapidClicks: rapidClickRef.current,
        typingSpeed: typingSpeedRef.current,
        mouseIdleMs: mouseIdleRef.current,
        scrollVelocity: scrollVelocityRef.current,
        backtrackCount: backtrackRef.current,
        hoverDuration: 0,
        focusLostCount: focusLostRef.current,
      };

      const mood = detectMood(signals);

      if (mood !== 'neutral' && mood !== detectedMood) {
        setDetectedMood(mood);

        // Store mood history
        memoryRef.current.moodHistory.push({ mood, timestamp: now });
        if (memoryRef.current.moodHistory.length > 20) memoryRef.current.moodHistory = memoryRef.current.moodHistory.slice(-20);
        saveVisitorMemory(memoryRef.current);

        // Trigger mood-based message
        const responses = MOOD_RESPONSES[mood];
        if (responses.length > 0) {
          const response = responses[Math.floor(Math.random() * responses.length)];
          enqueueMessage({
            content: response.content,
            type: 'mood',
            priority: mood === 'frustrated' ? 9 : 6,
            dismissable: true,
            icon: response.icon,
          });
        }
      }

      // Reset rapid clicks periodically
      if (now % 10000 < 3000) rapidClickRef.current = 0;
    }, 3000);

    return () => clearInterval(interval);
  }, [detectedMood, enqueueMessage]);

  // ─── 4. Navigation Pattern Prediction ───────────────

  useEffect(() => {
    const memory = memoryRef.current;
    const currentPath = location.pathname;

    // Track dwell time on previous page
    if (lastPathRef.current !== currentPath) {
      const dwellMs = Date.now() - pageEntryRef.current;
      memory.navigationHistory.push({
        path: lastPathRef.current,
        timestamp: pageEntryRef.current,
        dwellMs,
      });

      // Keep last 20 entries
      if (memory.navigationHistory.length > 20) {
        memory.navigationHistory = memory.navigationHistory.slice(-20);
      }

      // Detect backtracking
      if (memory.pagesVisited.includes(currentPath)) {
        backtrackRef.current += 1;
      }

      if (!memory.pagesVisited.includes(currentPath)) {
        memory.pagesVisited.push(currentPath);
      }

      saveVisitorMemory(memory);

      // Check prediction patterns
      const recentPaths = memory.navigationHistory.slice(-3).map(h => h.path);
      recentPaths.push(currentPath);

      for (const pred of PREDICTION_PATTERNS) {
        const matchLen = pred.pattern.length;
        const recent = recentPaths.slice(-matchLen);
        if (recent.length >= matchLen && recent.every((p, i) => p === pred.pattern[i])) {
          setTimeout(() => {
            enqueueMessage({
              content: pred.prediction,
              type: 'prediction',
              priority: 8,
              dismissable: true,
              icon: pred.icon,
            });
          }, 3000);
          break;
        }
      }

      lastPathRef.current = currentPath;
      pageEntryRef.current = Date.now();
      scrollPercentRef.current = 0;
    }
  }, [location.pathname, enqueueMessage]);

  // ─── 5. Ambient Narration (Scroll-Aware) ────────────

  useEffect(() => {
    const handler = () => {
      const narrations = PAGE_NARRATIONS[location.pathname];
      if (!narrations) return;

      const session = sessionRef.current;
      const scrollPct = scrollPercentRef.current;

      for (const narration of narrations) {
        const narrationId = `narration-${location.pathname}-${narration.threshold}`;
        if (
          scrollPct >= narration.threshold &&
          !session.shownNarrations.includes(narrationId)
        ) {
          session.shownNarrations.push(narrationId);
          saveSessionState(session);

          enqueueMessage({
            content: narration.content,
            type: 'narration',
            priority: 5,
            dismissable: true,
            icon: narration.icon,
          });
          break; // Only one narration at a time
        }
      }
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [location.pathname, enqueueMessage]);

  // ─── 6. Exit Intent ─────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 0 && Date.now() - pageEntryRef.current > 10000) {
        enqueueMessage({
          content: "🚪 Leaving? If ShadowTalk didn't answer something, tell me now — I'm faster than any FAQ.",
          type: 'exit-intent',
          priority: 8,
          dismissable: true,
          icon: "🚪",
        });
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, [enqueueMessage]);

  // ─── 7. Idle Nudge (Boredom Fallback) ───────────────

  useEffect(() => {
    const timer = setInterval(() => {
      if (mouseIdleRef.current > 30000 && !isChatOpen) {
        const temporal = getTemporalGreeting();
        enqueueMessage({
          content: "💭 You've been quiet. I'm still here — thinking of ways to help. Just say the word.",
          type: 'nudge',
          priority: 3,
          dismissable: true,
          icon: "💭",
        });
      }
    }, 35000);

    return () => clearInterval(timer);
  }, [isChatOpen, enqueueMessage]);

  return {
    currentMessage,
    isVisible,
    detectedMood,
    dismiss,
    recordInteraction,
    visitorMemory: memoryRef.current,
  };
}
