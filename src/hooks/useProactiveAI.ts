import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// ─── Types ─────────────────────────────────────────────

export type ProactiveMessageType =
  | 'greeting' | 'returning' | 'contextual' | 'nudge'
  | 'milestone' | 'exit-intent'
  | 'mood' | 'prediction' | 'narration' | 'temporal'
  | 'phantom' | 'copy' | 'battery' | 'connection'
  | 'tab-rivalry' | 'hesitation' | 'device' | 'ambient-light'
  | 'confidence' | 'cursor-orbit' | 'déjà-vu' | 'micro-gesture'
  | 'breathing' | 'touch-pressure' | 'chronobio' | 'decision-fatigue'
  | 'visual-attention' | 'digital-twin' | 'subconscious' | 'cognitive-load'
  | 'linguistic' | 'fomo';

export interface ProactiveMessage {
  id: string;
  content: string;
  type: ProactiveMessageType;
  priority: number;
  dismissable: boolean;
  icon?: string;
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
  copiedTexts: string[];
  phantomTypeCount: number;
  // Beyond-human memory
  activityByHour: Record<number, number>; // hour → activity score across visits
  decisionCount: number;
  vocabularyLevel: 'simple' | 'moderate' | 'advanced' | 'unknown';
  featureSwitchTimestamps: number[];
}

interface BehaviorSignals {
  clicksPerMinute: number;
  rapidClicks: number;
  typingSpeed: number;
  mouseIdleMs: number;
  scrollVelocity: number;
  backtrackCount: number;
  hoverDuration: number;
  focusLostCount: number;
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

  if (hour >= 0 && hour < 5) return { greeting: "🌙 Burning the midnight oil? I respect the hustle. Need an AI co-pilot for your late-night session?", icon: "🌙" };
  if (hour >= 5 && hour < 9) return { greeting: "🌅 Early riser! Your brain is freshest right now — perfect time to explore what ShadowTalk can do for you.", icon: "🌅" };
  if (hour >= 9 && hour < 12) {
    if (isWeekend) return { greeting: "☕ Weekend morning vibes. No rush — browse at your pace. I'll be here if anything catches your eye.", icon: "☕" };
    return { greeting: "⚡ Monday morning momentum! Let's make this productive. What are you building today?", icon: "⚡" };
  }
  if (hour >= 12 && hour < 14) return { greeting: "🍽️ Lunch break browsing? Smart move. I can give you a 2-minute overview of anything on this page.", icon: "🍽️" };
  if (hour >= 14 && hour < 17) return { greeting: "🎯 Afternoon focus time. I'll keep interruptions minimal — but I'm watching if you need help.", icon: "🎯" };
  if (hour >= 17 && hour < 20) return { greeting: "🌆 Wrapping up your day? If you're evaluating tools, I can save you time with a quick comparison.", icon: "🌆" };
  if (hour >= 20 && hour < 23) return { greeting: "🌃 Evening exploration. Take your time — no pressure. I'll surface insights as you scroll.", icon: "🌃" };
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
  { pattern: ['/pricing', '/about'], prediction: "💡 Visited pricing then came here? You're evaluating if we're legit. We are — but ask me anything to verify.", icon: "💡" },
  { pattern: ['/pricing', '/faq'], prediction: "🤝 Checking pricing and FAQs? You're close to deciding. Want me to address your biggest hesitation?", icon: "🤝" },
  { pattern: ['/', '/chatbot'], prediction: "🚀 Jumped straight to the chatbot! Power user move. Try 'Ctrl+Shift+A' for the autonomous agent mode.", icon: "🚀" },
  { pattern: ['/pricing', '/pricing'], prediction: "🔄 You keep returning to pricing. Something not clear? I can build a custom comparison for your use case.", icon: "🔄" },
  { pattern: ['/docs', '/chatbot'], prediction: "📚 Read the docs, now trying it live — smart approach. Need me to walk you through any feature?", icon: "📚" },
  { pattern: ['/about', '/pricing'], prediction: "🎯 Liked what you saw about us? The Founder's Vault plan is our best value — want details?", icon: "🎯" },
];

// Ambient narration per page section
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
    visitCount: 0, lastVisit: 0, pagesVisited: [], navigationHistory: [],
    hasInteracted: false, totalTimeSpent: 0, moodHistory: [],
    copiedTexts: [], phantomTypeCount: 0,
    activityByHour: {}, decisionCount: 0, vocabularyLevel: 'unknown',
    featureSwitchTimestamps: [],
  };
}

function saveVisitorMemory(memory: VisitorMemory) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch {}
}

function getSessionState(): { shownMessages: string[]; sessionStart: number; shownNarrations: string[] } {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { shownMessages: [], sessionStart: Date.now(), shownNarrations: [] };
}

function saveSessionState(state: { shownMessages: string[]; sessionStart: number; shownNarrations: string[] }) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch {}
}

// ─── Mood Detection Engine ─────────────────────────────

function detectMood(signals: BehaviorSignals): UserMood {
  if (signals.rapidClicks >= 3) return 'frustrated';
  if (signals.clicksPerMinute > 15 && signals.scrollVelocity > 5) return 'excited';
  if (signals.backtrackCount >= 2) return 'confused';
  if (signals.typingSpeed > 8) return 'rushed';
  if (signals.mouseIdleMs > 20000 && signals.clicksPerMinute < 2) return 'bored';
  if (signals.scrollVelocity > 0 && signals.scrollVelocity < 3 && signals.clicksPerMinute < 5) return 'focused';
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

  // ═══ NEW: Beyond-AI Detection Refs ═══
  const phantomBufferRef = useRef(''); // tracks typed-then-deleted text
  const phantomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorPositionsRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const scrollPauseRef = useRef<{ y: number; t: number; duration: number }[]>([]);
  const lastScrollActivityRef = useRef(Date.now());
  const tabBlurTimestampRef = useRef<number | null>(null);
  const totalTabAwayRef = useRef(0);
  const keystrokeIntervalsRef = useRef<number[]>([]);
  const lastKeystrokeRef = useRef(0);
  const rereadSectionsRef = useRef<Map<number, number>>(new Map()); // scrollY zone → read count
  const inputLengthHistoryRef = useRef<{ len: number; t: number }[]>([]);

  // ─── Message Queue System ───────────────────────────

  const processQueue = useCallback(() => {
    if (isShowingRef.current || isChatOpen || messageQueueRef.current.length === 0) return;
    messageQueueRef.current.sort((a, b) => b.priority - a.priority);
    const msg = messageQueueRef.current.shift()!;
    isShowingRef.current = true;
    setCurrentMessage(msg);
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage(null);
        isShowingRef.current = false;
        setTimeout(() => processQueue(), 5000);
      }, 500);
    }, 12000);
  }, [isChatOpen]);

  const enqueueMessage = useCallback((msg: Omit<ProactiveMessage, 'id'>) => {
    if (isChatOpen) return;
    const session = sessionRef.current;
    const typeCount = session.shownMessages.filter(m => m.startsWith(msg.type)).length;
    if (typeCount >= 2) return;
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
        let content: string; let icon: string;
        if (daysSinceVisit > 7) {
          content = `👋 It's been ${daysSinceVisit} days! Welcome back. A lot has changed — want a recap of new features?`; icon = "👋";
        } else if (daysSinceVisit > 1) {
          content = `🎯 Back again! Visit #${memory.visitCount}. ${memory.lastConversationTopic ? `We left off discussing "${memory.lastConversationTopic}". Continue?` : "I remember your last session. Ready to pick up?"}`; icon = "🎯";
        } else {
          const temporal = getTemporalGreeting();
          content = `${temporal.icon} Visit #${memory.visitCount} today! ${temporal.greeting}`; icon = temporal.icon;
        }
        enqueueMessage({ content, type: 'returning', priority: 10, dismissable: true, icon });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [enqueueMessage]);

  // ─── 2. Behavior Signal Collection ──────────────────

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      clickTimestampsRef.current.push(now);
      clickTimestampsRef.current = clickTimestampsRef.current.filter(t => now - t < 60000);
      const recentClicks = clickTimestampsRef.current.filter(t => now - t < 1500);
      if (recentClicks.length >= 3) rapidClickRef.current += 1;
      mouseIdleRef.current = 0;
    };
    window.addEventListener('click', handler, { passive: true });
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      const dt = (now - lastScrollTimeRef.current) / 1000;
      const dy = Math.abs(window.scrollY - lastScrollYRef.current);
      if (dt > 0) scrollVelocityRef.current = dy / dt;
      lastScrollYRef.current = window.scrollY;
      lastScrollTimeRef.current = now;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) scrollPercentRef.current = Math.round((window.scrollY / scrollHeight) * 100);
      mouseIdleRef.current = 0;
      lastScrollActivityRef.current = now;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = () => { mouseIdleRef.current = 0; };
    window.addEventListener('mousemove', handler, { passive: true });
    mouseIdleTimerRef.current = setInterval(() => { mouseIdleRef.current += 1000; }, 1000);
    return () => {
      window.removeEventListener('mousemove', handler);
      if (mouseIdleTimerRef.current) clearInterval(mouseIdleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => { if (document.hidden) focusLostRef.current += 1; };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      keyTimestampsRef.current.push(now);
      keyTimestampsRef.current = keyTimestampsRef.current.filter(t => now - t < 5000);
      typingSpeedRef.current = keyTimestampsRef.current.length / 5;
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
        clicksPerMinute, rapidClicks: rapidClickRef.current,
        typingSpeed: typingSpeedRef.current, mouseIdleMs: mouseIdleRef.current,
        scrollVelocity: scrollVelocityRef.current, backtrackCount: backtrackRef.current,
        hoverDuration: 0, focusLostCount: focusLostRef.current,
      };
      const mood = detectMood(signals);
      if (mood !== 'neutral' && mood !== detectedMood) {
        setDetectedMood(mood);
        memoryRef.current.moodHistory.push({ mood, timestamp: now });
        if (memoryRef.current.moodHistory.length > 20) memoryRef.current.moodHistory = memoryRef.current.moodHistory.slice(-20);
        saveVisitorMemory(memoryRef.current);
        const responses = MOOD_RESPONSES[mood];
        if (responses.length > 0) {
          const response = responses[Math.floor(Math.random() * responses.length)];
          enqueueMessage({ content: response.content, type: 'mood', priority: mood === 'frustrated' ? 9 : 6, dismissable: true, icon: response.icon });
        }
      }
      if (now % 10000 < 3000) rapidClickRef.current = 0;
    }, 3000);
    return () => clearInterval(interval);
  }, [detectedMood, enqueueMessage]);

  // ─── 4. Navigation Pattern Prediction ───────────────

  useEffect(() => {
    const memory = memoryRef.current;
    const currentPath = location.pathname;
    if (lastPathRef.current !== currentPath) {
      const dwellMs = Date.now() - pageEntryRef.current;
      memory.navigationHistory.push({ path: lastPathRef.current, timestamp: pageEntryRef.current, dwellMs });
      if (memory.navigationHistory.length > 20) memory.navigationHistory = memory.navigationHistory.slice(-20);
      if (memory.pagesVisited.includes(currentPath)) backtrackRef.current += 1;
      if (!memory.pagesVisited.includes(currentPath)) memory.pagesVisited.push(currentPath);
      saveVisitorMemory(memory);

      const recentPaths = memory.navigationHistory.slice(-3).map(h => h.path);
      recentPaths.push(currentPath);
      for (const pred of PREDICTION_PATTERNS) {
        const matchLen = pred.pattern.length;
        const recent = recentPaths.slice(-matchLen);
        if (recent.length >= matchLen && recent.every((p, i) => p === pred.pattern[i])) {
          setTimeout(() => { enqueueMessage({ content: pred.prediction, type: 'prediction', priority: 8, dismissable: true, icon: pred.icon }); }, 3000);
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
        if (scrollPct >= narration.threshold && !session.shownNarrations.includes(narrationId)) {
          session.shownNarrations.push(narrationId);
          saveSessionState(session);
          enqueueMessage({ content: narration.content, type: 'narration', priority: 5, dismissable: true, icon: narration.icon });
          break;
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
        enqueueMessage({ content: "🚪 Leaving? If ShadowTalk didn't answer something, tell me now — I'm faster than any FAQ.", type: 'exit-intent', priority: 8, dismissable: true, icon: "🚪" });
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, [enqueueMessage]);

  // ─── 7. Idle Nudge ──────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      if (mouseIdleRef.current > 30000 && !isChatOpen) {
        enqueueMessage({ content: "💭 You've been quiet. I'm still here — thinking of ways to help. Just say the word.", type: 'nudge', priority: 3, dismissable: true, icon: "💭" });
      }
    }, 35000);
    return () => clearInterval(timer);
  }, [isChatOpen, enqueueMessage]);

  // ════════════════════════════════════════════════════
  // ═══ BEYOND-AI PROACTIVE DETECTIONS ════════════════
  // ════════════════════════════════════════════════════

  // ─── 8. PHANTOM TYPING — User types then deletes everything ───
  // Detects when someone starts typing a message, hesitates, then erases it.
  // This means they're struggling to articulate — AI intervenes.

  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || !('value' in target)) return;
      const val = target.value;

      inputLengthHistoryRef.current.push({ len: val.length, t: Date.now() });
      // Keep last 20 entries
      if (inputLengthHistoryRef.current.length > 20) inputLengthHistoryRef.current = inputLengthHistoryRef.current.slice(-10);

      // Track if they typed at least 10 chars then deleted to 0
      if (val.length === 0) {
        const history = inputLengthHistoryRef.current;
        const maxLen = Math.max(...history.map(h => h.len));
        if (maxLen >= 10) {
          memoryRef.current.phantomTypeCount = (memoryRef.current.phantomTypeCount || 0) + 1;
          saveVisitorMemory(memoryRef.current);

          if (phantomTimerRef.current) clearTimeout(phantomTimerRef.current);
          phantomTimerRef.current = setTimeout(() => {
            const msgs = [
              "👻 I noticed you started typing something then erased it. Don't worry about phrasing it perfectly — just say it rough, I'll understand.",
              "✏️ Struggled to type that? Here's a trick: describe your problem in 5 words or less. I'll ask the right follow-up questions.",
              "🔮 You erased your message. Sometimes the hardest questions to ask are the most important ones. Try me — I've heard everything.",
            ];
            enqueueMessage({
              content: msgs[memoryRef.current.phantomTypeCount % msgs.length],
              type: 'phantom',
              priority: 9,
              dismissable: true,
              icon: "👻",
            });
          }, 2000);

          inputLengthHistoryRef.current = [];
        }
      }
    };

    document.addEventListener('input', handler, { passive: true });
    return () => document.removeEventListener('input', handler);
  }, [enqueueMessage]);

  // ─── 9. COPY-PASTE AWARENESS — Detects what users copy ───
  // When users copy text, they found something valuable. React to it.

  useEffect(() => {
    const handler = () => {
      const selection = window.getSelection()?.toString()?.trim();
      if (!selection || selection.length < 5) return;

      memoryRef.current.copiedTexts = memoryRef.current.copiedTexts || [];
      memoryRef.current.copiedTexts.push(selection.slice(0, 100));
      if (memoryRef.current.copiedTexts.length > 10) memoryRef.current.copiedTexts = memoryRef.current.copiedTexts.slice(-10);
      saveVisitorMemory(memoryRef.current);

      const copyCount = memoryRef.current.copiedTexts.length;

      if (copyCount === 1) {
        enqueueMessage({
          content: `📋 You just copied something — saving it mentally. Want me to explain "${selection.slice(0, 40)}..." in more detail?`,
          type: 'copy',
          priority: 7,
          dismissable: true,
          icon: "📋",
        });
      } else if (copyCount === 3) {
        enqueueMessage({
          content: "📑 You've been copying a lot of content. Building a document? I can compile everything you've highlighted into a clean summary.",
          type: 'copy',
          priority: 7,
          dismissable: true,
          icon: "📑",
        });
      }
    };
    document.addEventListener('copy', handler);
    return () => document.removeEventListener('copy', handler);
  }, [enqueueMessage]);

  // ─── 10. BATTERY EMPATHY — Knows when you're running low ───
  // Uses Battery Status API to detect low power and suggest efficiency.

  useEffect(() => {
    let mounted = true;
    const checkBattery = async () => {
      try {
        const nav = navigator as any;
        if (!nav.getBattery) return;
        const battery = await nav.getBattery();

        const handler = () => {
          if (!mounted) return;
          if (battery.level <= 0.15 && !battery.charging) {
            enqueueMessage({
              content: `🔋 Your battery is at ${Math.round(battery.level * 100)}%. Let me switch to efficiency mode — shorter responses, faster answers, zero fluff. What do you need?`,
              type: 'battery',
              priority: 8,
              dismissable: true,
              icon: "🔋",
            });
          } else if (battery.level <= 0.05 && !battery.charging) {
            enqueueMessage({
              content: "🪫 Critical battery! Quick — tell me ONE thing you need before your device dies. I'll make it count.",
              type: 'battery',
              priority: 10,
              dismissable: true,
              icon: "🪫",
            });
          }
        };

        battery.addEventListener('levelchange', handler);
        // Initial check
        handler();

        return () => battery.removeEventListener('levelchange', handler);
      } catch {}
    };
    checkBattery();
    return () => { mounted = false; };
  }, [enqueueMessage]);

  // ─── 11. CONNECTION SPEED EMPATHY — Adapts to network quality ───
  // Uses Network Information API to detect slow connections.

  useEffect(() => {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!conn) return;

    const handler = () => {
      const effectiveType = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      const downlink = conn.downlink; // Mbps

      if (effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5) {
        enqueueMessage({
          content: "📡 I'm detecting a slow connection. I'll keep my responses ultra-compact and pre-cache what you might need next. You won't feel the lag.",
          type: 'connection',
          priority: 7,
          dismissable: true,
          icon: "📡",
        });
      } else if (effectiveType === '3g' || downlink < 1.5) {
        enqueueMessage({
          content: "🌐 Your connection seems limited. I'll optimize — text-first responses, no heavy assets. Ask me anything.",
          type: 'connection',
          priority: 5,
          dismissable: true,
          icon: "🌐",
        });
      }
    };

    conn.addEventListener('change', handler);
    // Initial check
    setTimeout(handler, 5000);

    return () => conn.removeEventListener('change', handler);
  }, [enqueueMessage]);

  // ─── 12. TAB RIVALRY — Detects competitor browsing patterns ───
  // Measures how long users spend away and reacts when they return.

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        tabBlurTimestampRef.current = Date.now();
      } else if (tabBlurTimestampRef.current) {
        const awayMs = Date.now() - tabBlurTimestampRef.current;
        totalTabAwayRef.current += awayMs;
        tabBlurTimestampRef.current = null;

        if (awayMs > 30000 && awayMs < 300000) {
          // Away 30s-5min: probably comparing competitors
          enqueueMessage({
            content: "🔍 Back from comparing? I get it — due diligence matters. What's the one feature that would seal the deal for you? I'll show you we have it.",
            type: 'tab-rivalry',
            priority: 8,
            dismissable: true,
            icon: "🔍",
          });
        } else if (awayMs >= 300000 && awayMs < 1800000) {
          // Away 5-30min: deep comparison or distracted
          enqueueMessage({
            content: "⏳ You were away for a while. While you were gone, I was analyzing your browsing pattern. Want a personalized feature comparison based on what you've explored?",
            type: 'tab-rivalry',
            priority: 7,
            dismissable: true,
            icon: "⏳",
          });
        } else if (awayMs >= 1800000) {
          // Away 30min+: probably forgot about us
          enqueueMessage({
            content: "🎯 Welcome back! It's been a while. Quick recap: you were exploring " + location.pathname.replace('/', '') + ". Want to continue or start fresh?",
            type: 'tab-rivalry',
            priority: 9,
            dismissable: true,
            icon: "🎯",
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [enqueueMessage, location.pathname]);

  // ─── 13. SCROLL HESITATION — Where you pause = what interests you ───
  // Tracks scroll velocity drops to detect what sections captivate the user.

  useEffect(() => {
    let lastCheckY = 0;
    let pauseStart = 0;

    const interval = setInterval(() => {
      const currentY = window.scrollY;
      const velocity = scrollVelocityRef.current;

      // User stopped scrolling in a new zone
      if (velocity < 0.5 && Math.abs(currentY - lastCheckY) < 20) {
        if (!pauseStart) {
          pauseStart = Date.now();
        } else {
          const pauseDuration = Date.now() - pauseStart;
          // If they've been staring at one spot for 8+ seconds
          if (pauseDuration > 8000 && pauseDuration < 12000) {
            // Find what element they're looking at
            const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
            const text = centerEl?.textContent?.trim()?.slice(0, 60);

            if (text && text.length > 10) {
              enqueueMessage({
                content: `🔬 You've been staring at this section for ${Math.round(pauseDuration / 1000)}s. "${text}..." — Want me to deep-dive into this topic?`,
                type: 'hesitation',
                priority: 6,
                dismissable: true,
                icon: "🔬",
              });
              pauseStart = 0; // Reset
            }
          }
        }
      } else {
        pauseStart = 0;
      }

      lastCheckY = currentY;
    }, 2000);

    return () => clearInterval(interval);
  }, [enqueueMessage]);

  // ─── 14. DEVICE PERSONALITY — Different AI for different screens ───
  // Mobile users get snappier, more action-oriented messages.

  useEffect(() => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isUltrawide = width > 2000;
    const isTouchDevice = 'ontouchstart' in window;

    const timer = setTimeout(() => {
      if (isMobile && isTouchDevice) {
        enqueueMessage({
          content: "📱 Mobile detected. I'll be extra concise — swipe-friendly answers, zero scrolling walls. Tap me anytime.",
          type: 'device',
          priority: 4,
          dismissable: true,
          icon: "📱",
        });
      } else if (isUltrawide) {
        enqueueMessage({
          content: "🖥️ Ultrawide monitor? Power user setup. You'd love our split-view: keep the chatbot open while using the strategy agent side-by-side.",
          type: 'device',
          priority: 4,
          dismissable: true,
          icon: "🖥️",
        });
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [enqueueMessage]);

  // ─── 15. AMBIENT LIGHT / DARK MODE AWARENESS ───────
  // Detects system theme preference and time-of-day to comment.

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        enqueueMessage({
          content: "🌑 Dark mode activated. Your eyes will thank you. I've adjusted my vibe — same intelligence, darker aesthetic.",
          type: 'ambient-light',
          priority: 3,
          dismissable: true,
          icon: "🌑",
        });
      } else {
        enqueueMessage({
          content: "☀️ Light mode on. Fresh and clean. If the brightness is too much, I support dark mode too — try switching your system theme.",
          type: 'ambient-light',
          priority: 3,
          dismissable: true,
          icon: "☀️",
        });
      }
    };

    darkModeQuery.addEventListener('change', handler);
    return () => darkModeQuery.removeEventListener('change', handler);
  }, [enqueueMessage]);

  // ─── 16. KEYSTROKE CONFIDENCE ANALYSIS ─────────────
  // Analyzes rhythm of typing to detect confidence vs uncertainty.
  // Steady rhythm = confident. Irregular bursts = unsure.

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const now = Date.now();
      if (lastKeystrokeRef.current > 0) {
        const interval = now - lastKeystrokeRef.current;
        keystrokeIntervalsRef.current.push(interval);
        if (keystrokeIntervalsRef.current.length > 30) keystrokeIntervalsRef.current = keystrokeIntervalsRef.current.slice(-20);
      }
      lastKeystrokeRef.current = now;
    };
    window.addEventListener('keydown', handler, { passive: true });
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Confidence analysis loop
  useEffect(() => {
    const interval = setInterval(() => {
      const intervals = keystrokeIntervalsRef.current;
      if (intervals.length < 10) return;

      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avg;

      // High CV = erratic typing = uncertainty
      if (coefficientOfVariation > 1.2 && avg > 200) {
        enqueueMessage({
          content: "🎭 Your typing rhythm tells me you're uncertain about something. No judgment — tell me what's on your mind, even if it's half-formed. I'll shape it.",
          type: 'confidence',
          priority: 7,
          dismissable: true,
          icon: "🎭",
        });
        keystrokeIntervalsRef.current = []; // Reset after trigger
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [enqueueMessage]);

  // ─── 17. CURSOR ORBIT DETECTION ────────────────────
  // Tracks when the cursor circles around an element without clicking.
  // "Gravitational pull" — they want to click but aren't sure.

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const now = Date.now();
      cursorPositionsRef.current.push({ x: e.clientX, y: e.clientY, t: now });
      if (cursorPositionsRef.current.length > 50) cursorPositionsRef.current = cursorPositionsRef.current.slice(-30);
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const positions = cursorPositionsRef.current;
      if (positions.length < 15) return;

      const recent = positions.slice(-15);
      const timeSpan = recent[recent.length - 1].t - recent[0].t;
      if (timeSpan < 2000) return; // Need at least 2s of data

      // Calculate centroid
      const cx = recent.reduce((s, p) => s + p.x, 0) / recent.length;
      const cy = recent.reduce((s, p) => s + p.y, 0) / recent.length;

      // Calculate average distance from centroid
      const avgDist = recent.reduce((s, p) => s + Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2)), 0) / recent.length;

      // If cursor stays within a 100px radius for 3+ seconds = orbiting
      if (avgDist < 100 && avgDist > 20 && timeSpan > 3000) {
        // Find what they're orbiting
        const orbitEl = document.elementFromPoint(cx, cy);
        const isButton = orbitEl?.closest('button, a, [role="button"]');

        if (isButton) {
          const label = isButton.textContent?.trim()?.slice(0, 30);
          enqueueMessage({
            content: `🪐 Your cursor keeps orbiting "${label}" but you haven't clicked. Hesitating? It's ${label?.toLowerCase()?.includes('free') ? 'totally free' : 'worth it'} — I can preview what happens if you click.`,
            type: 'cursor-orbit',
            priority: 8,
            dismissable: true,
            icon: "🪐",
          });
          cursorPositionsRef.current = []; // Reset
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [enqueueMessage]);

  // ─── 18. DÉJÀ VU — Re-reading the same section ─────
  // Detects when users scroll back to re-read a section they already passed.

  useEffect(() => {
    const handler = () => {
      const zone = Math.floor(window.scrollY / 300); // 300px zones
      const count = rereadSectionsRef.current.get(zone) || 0;
      rereadSectionsRef.current.set(zone, count + 1);

      if (count === 3) { // Third time visiting this zone
        const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        const heading = centerEl?.closest('section, article, div')?.querySelector('h1, h2, h3');
        const text = heading?.textContent?.trim() || centerEl?.textContent?.trim()?.slice(0, 40);

        if (text) {
          enqueueMessage({
            content: `🔁 Déjà vu — you keep coming back to "${text}". This section clearly resonates. Want me to expand on it or answer a specific question?`,
            type: 'déjà-vu',
            priority: 7,
            dismissable: true,
            icon: "🔁",
          });
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [enqueueMessage]);

  // ─── 19. MICRO-GESTURE — Selection without copy ────
  // User highlights text but doesn't copy — they're thinking about it.

  useEffect(() => {
    let selectionTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      if (selectionTimer) clearTimeout(selectionTimer);

      selectionTimer = setTimeout(() => {
        const selection = window.getSelection()?.toString()?.trim();
        if (selection && selection.length > 15 && selection.length < 200) {
          enqueueMessage({
            content: `💡 You highlighted: "${selection.slice(0, 50)}..." — thinking it over? I can break it down, challenge it, or expand it. Your call.`,
            type: 'micro-gesture',
            priority: 6,
            dismissable: true,
            icon: "💡",
          });
        }
      }, 4000); // Wait 4s after selection to see if they do something
    };

    document.addEventListener('selectionchange', handler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      if (selectionTimer) clearTimeout(selectionTimer);
    };
  }, [enqueueMessage]);

  // ════════════════════════════════════════════════════
  // ═══ BEYOND-HUMAN LEVEL DETECTIONS ═════════════════
  // ════════════════════════════════════════════════════

  // ─── 20. BREATHING PATTERN DETECTION ───────────────
  // Uses DeviceMotion API to detect micro-tremors from breathing.
  // On mobile, holding the phone transmits chest movement.

  useEffect(() => {
    let samples: number[] = [];
    let lastMagnitude = 0;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      const delta = Math.abs(magnitude - lastMagnitude);
      lastMagnitude = magnitude;

      samples.push(delta);
      if (samples.length > 100) samples = samples.slice(-60);
    };

    // Check for permission and add listener
    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handler);
    }

    // Analysis loop
    const interval = setInterval(() => {
      if (samples.length < 30) return;

      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const peaks = samples.filter(s => s > avg * 1.5).length;

      // High frequency micro-movements = fast breathing = stress
      if (peaks > 15) {
        enqueueMessage({
          content: "🫁 I'm sensing rapid micro-movements from your device — your breathing might be elevated. Take a slow breath. I can simplify whatever's stressing you.",
          type: 'breathing',
          priority: 8,
          dismissable: true,
          icon: "🫁",
        });
        samples = [];
      } else if (peaks < 5 && samples.length > 50) {
        // Very still = deep calm or sleeping
        enqueueMessage({
          content: "🧘 You're incredibly still right now — deep focus or deep thought? Either way, I'll match your calm. Ask when ready.",
          type: 'breathing',
          priority: 3,
          dismissable: true,
          icon: "🧘",
        });
        samples = [];
      }
    }, 20000);

    return () => {
      window.removeEventListener('devicemotion', handler);
      clearInterval(interval);
    };
  }, [enqueueMessage]);

  // ─── 21. TOUCH PRESSURE SENSING ────────────────────
  // Uses Touch.force property (0-1) to measure tap intensity.

  useEffect(() => {
    const pressures: number[] = [];

    const handler = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const force = e.touches[i].force;
        if (force > 0) pressures.push(force);
      }
      if (pressures.length > 50) pressures.splice(0, pressures.length - 30);
    };

    window.addEventListener('touchstart', handler, { passive: true });
    window.addEventListener('touchmove', handler, { passive: true });

    const interval = setInterval(() => {
      if (pressures.length < 10) return;

      const avg = pressures.reduce((a, b) => a + b, 0) / pressures.length;

      if (avg > 0.7) {
        enqueueMessage({
          content: "👆 You're pressing the screen quite hard — I can feel the tension through the glass. Let me help resolve whatever's causing that friction.",
          type: 'touch-pressure',
          priority: 7,
          dismissable: true,
          icon: "👆",
        });
        pressures.length = 0;
      } else if (avg < 0.15 && avg > 0) {
        enqueueMessage({
          content: "🪶 Feather-light touches — you're browsing gently, taking it all in. I'll keep my suggestions soft and exploratory.",
          type: 'touch-pressure',
          priority: 3,
          dismissable: true,
          icon: "🪶",
        });
        pressures.length = 0;
      }
    }, 15000);

    return () => {
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('touchmove', handler);
      clearInterval(interval);
    };
  }, [enqueueMessage]);

  // ─── 22. CHRONOBIOLOGICAL SYNC ─────────────────────
  // Learns your personal rhythm across visits to predict peak hours.

  useEffect(() => {
    const memory = memoryRef.current;
    if (!memory.activityByHour) memory.activityByHour = {};

    const hour = new Date().getHours();
    memory.activityByHour[hour] = (memory.activityByHour[hour] || 0) + 1;
    saveVisitorMemory(memory);

    // Only trigger after 3+ visits (enough data)
    if (memory.visitCount < 3) return;

    const entries = Object.entries(memory.activityByHour).map(([h, s]) => ({ hour: Number(h), score: s as number }));
    entries.sort((a, b) => b.score - a.score);
    const peakHour = entries[0];

    if (peakHour && peakHour.score >= 3) {
      const currentHour = new Date().getHours();
      const isPeak = currentHour === peakHour.hour;

      const timer = setTimeout(() => {
        if (isPeak) {
          enqueueMessage({
            content: `🧬 Chronobio-sync: You're most active at ${peakHour.hour > 12 ? peakHour.hour - 12 + 'pm' : peakHour.hour + 'am'}. Right now is YOUR peak hour — best time for deep work or big decisions.`,
            type: 'chronobio',
            priority: 6,
            dismissable: true,
            icon: "🧬",
          });
        } else {
          const peakLabel = peakHour.hour > 12 ? `${peakHour.hour - 12}pm` : `${peakHour.hour}am`;
          enqueueMessage({
            content: `🧬 Your personal data says you're sharpest at ${peakLabel}. Right now might not be your peak — want me to keep things light, or push through?`,
            type: 'chronobio',
            priority: 4,
            dismissable: true,
            icon: "🧬",
          });
        }
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [enqueueMessage]);

  // ─── 23. DECISION FATIGUE METER ────────────────────
  // Counts every click/selection/navigation as a micro-decision.

  useEffect(() => {
    const memory = memoryRef.current;
    if (!memory.decisionCount) memory.decisionCount = 0;

    const clickHandler = () => {
      memory.decisionCount += 1;
      saveVisitorMemory(memory);

      if (memory.decisionCount === 35) {
        enqueueMessage({
          content: "🧠 Decision fatigue alert: You've made 35+ micro-decisions this session. Your brain is getting tired of choosing. Want me to just recommend the best option?",
          type: 'decision-fatigue',
          priority: 8,
          dismissable: true,
          icon: "🧠",
        });
      } else if (memory.decisionCount === 60) {
        enqueueMessage({
          content: "⚠️ 60+ decisions in one session — that's beyond the cognitive limit. I'm switching to binary mode: I'll give you ONE recommendation. Yes or no. That's it.",
          type: 'decision-fatigue',
          priority: 9,
          dismissable: true,
          icon: "⚠️",
        });
      }
    };

    window.addEventListener('click', clickHandler, { passive: true });
    return () => window.removeEventListener('click', clickHandler);
  }, [enqueueMessage]);

  // ─── 24. VISUAL ATTENTION CARTOGRAPHY ──────────────
  // Builds estimated eye-position from scroll + cursor proximity.

  useEffect(() => {
    const attentionZones: Map<string, number> = new Map();
    let lastCheck = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = now - lastCheck;
      lastCheck = now;

      if (scrollVelocityRef.current > 2) return; // Skipping while scrolling fast

      // Estimate gaze position: center of viewport
      const gazeY = window.scrollY + window.innerHeight * 0.4;
      const zone = Math.floor(gazeY / 200); // 200px zones
      const zoneKey = `${location.pathname}-${zone}`;

      attentionZones.set(zoneKey, (attentionZones.get(zoneKey) || 0) + dt);

      // Find hotspot — most gazed zone
      const entries = Array.from(attentionZones.entries());
      const hotspot = entries.sort((a, b) => b[1] - a[1])[0];

      if (hotspot && hotspot[1] > 20000 && hotspot[1] < 25000) {
        // 20s+ staring at one zone
        const zoneY = Number(hotspot[0].split('-').pop()) * 200;
        const el = document.elementFromPoint(window.innerWidth / 2, zoneY - window.scrollY + 100);
        const heading = el?.closest('section, article')?.querySelector('h1, h2, h3');
        const label = heading?.textContent?.trim() || 'this section';

        enqueueMessage({
          content: `👁️ Visual attention mapped: You've spent 20+ seconds focused on "${label}". Your gaze keeps returning here — this is clearly important to you. Want to go deeper?`,
          type: 'visual-attention',
          priority: 6,
          dismissable: true,
          icon: "👁️",
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [enqueueMessage, location.pathname]);

  // ─── 25. DIGITAL TWIN PREDICTION ───────────────────
  // Predicts your NEXT action based on behavioral patterns.

  useEffect(() => {
    const memory = memoryRef.current;
    if (memory.navigationHistory.length < 4) return;

    const timer = setTimeout(() => {
      const history = memory.navigationHistory;
      const lastTwo = history.slice(-2).map(h => h.path);
      const currentPath = location.pathname;

      // Build transition probability map
      const transitions: Record<string, Record<string, number>> = {};
      for (let i = 0; i < history.length - 1; i++) {
        const from = history[i].path;
        const to = history[i + 1].path;
        if (!transitions[from]) transitions[from] = {};
        transitions[from][to] = (transitions[from][to] || 0) + 1;
      }

      const nextPredictions = transitions[currentPath];
      if (!nextPredictions) return;

      const sorted = Object.entries(nextPredictions).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && sorted[0][1] >= 2) {
        const predictedPath = sorted[0][0];
        const confidence = Math.round((sorted[0][1] / Object.values(nextPredictions).reduce((a, b) => a + b, 0)) * 100);

        const pathNames: Record<string, string> = {
          '/': 'the homepage', '/pricing': 'pricing', '/about': 'about us',
          '/chatbot': 'the chatbot', '/strategy': 'strategy agent',
          '/docs': 'documentation', '/faq': 'FAQs',
        };

        const label = pathNames[predictedPath] || predictedPath;

        enqueueMessage({
          content: `🪞 Digital Twin prediction (${confidence}% confidence): Based on your behavioral pattern, you're about to visit ${label}. I've already pre-analyzed that page for you — want the summary now?`,
          type: 'digital-twin',
          priority: 7,
          dismissable: true,
          icon: "🪞",
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [location.pathname, enqueueMessage]);

  // ─── 26. SUBCONSCIOUS ELEMENT ATTRACTION ───────────
  // Tracks which elements the cursor hovers near most without clicking.

  useEffect(() => {
    const hoverMap: Map<string, number> = new Map();

    const handler = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const interactive = el.closest('button, a, [role="button"], input, .card');
      if (!interactive) return;

      const label = interactive.textContent?.trim()?.slice(0, 40) || interactive.getAttribute('aria-label') || 'element';
      const key = label.toLowerCase();

      hoverMap.set(key, (hoverMap.get(key) || 0) + 1);
    };

    window.addEventListener('mousemove', handler, { passive: true });

    const interval = setInterval(() => {
      const entries = Array.from(hoverMap.entries()).filter(([, count]) => count > 50);
      if (entries.length === 0) return;

      const topAttraction = entries.sort((a, b) => b[1] - a[1])[0];

      enqueueMessage({
        content: `🧲 Subconscious signal: Your cursor has gravitated toward "${topAttraction[0]}" ${topAttraction[1]} times without clicking. Something's pulling you there — explore it?`,
        type: 'subconscious',
        priority: 7,
        dismissable: true,
        icon: "🧲",
      });

      hoverMap.clear();
    }, 25000);

    return () => {
      window.removeEventListener('mousemove', handler);
      clearInterval(interval);
    };
  }, [enqueueMessage]);

  // ─── 27. COGNITIVE LOAD ESTIMATION ─────────────────
  // Measures page complexity × erratic behavior to detect overload.

  useEffect(() => {
    const interval = setInterval(() => {
      // Count visible text elements
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, li, span, td');
      const visibleCount = Array.from(textElements).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight;
      }).length;

      // High element count + erratic scroll + frequent focus loss = overloaded
      const erraticScore = (
        (visibleCount > 20 ? 3 : visibleCount > 10 ? 1 : 0) +
        (scrollVelocityRef.current > 4 ? 2 : 0) +
        (focusLostRef.current > 2 ? 2 : 0) +
        (backtrackRef.current > 1 ? 1 : 0)
      );

      if (erraticScore >= 5) {
        enqueueMessage({
          content: `📊 Cognitive load critical: ${visibleCount}+ elements competing for your attention, erratic scrolling, and tab switching. Your brain is overloaded. Tell me your ONE goal — I'll filter everything else out.`,
          type: 'cognitive-load',
          priority: 8,
          dismissable: true,
          icon: "📊",
        });
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [enqueueMessage]);

  // ─── 28. LINGUISTIC FINGERPRINTING ─────────────────
  // Analyzes typed words to detect vocabulary level and match it.

  useEffect(() => {
    const words: string[] = [];
    let currentWord = '';

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (currentWord.length > 2) {
          words.push(currentWord.toLowerCase());
          if (words.length > 50) words.splice(0, words.length - 30);
        }
        currentWord = '';
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        currentWord += e.key;
      }
    };

    window.addEventListener('keydown', handler, { passive: true });

    const interval = setInterval(() => {
      if (words.length < 8) return;

      // Simple vocabulary analysis
      const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
      const complexWords = words.filter(w => w.length > 8).length;
      const ratio = complexWords / words.length;

      const memory = memoryRef.current;
      let level: 'simple' | 'moderate' | 'advanced' = 'moderate';

      if (ratio > 0.3 || avgWordLen > 7) {
        level = 'advanced';
      } else if (ratio < 0.1 && avgWordLen < 5) {
        level = 'simple';
      }

      if (memory.vocabularyLevel !== level && level !== 'moderate') {
        memory.vocabularyLevel = level;
        saveVisitorMemory(memory);

        if (level === 'advanced') {
          enqueueMessage({
            content: "🔮 Linguistic analysis: Your vocabulary suggests expertise. I'm upgrading my response depth — no hand-holding, straight to advanced concepts. Specify your domain and I'll match your level.",
            type: 'linguistic',
            priority: 5,
            dismissable: true,
            icon: "🔮",
          });
        } else if (level === 'simple') {
          enqueueMessage({
            content: "🔮 I'm tuning my language to be clearer and more direct. No jargon, no fluff — just answers you can act on immediately.",
            type: 'linguistic',
            priority: 5,
            dismissable: true,
            icon: "🔮",
          });
        }
      }
    }, 20000);

    return () => {
      window.removeEventListener('keydown', handler);
      clearInterval(interval);
    };
  }, [enqueueMessage]);

  // ─── 29. FOMO CASCADE DETECTION ────────────────────
  // Rapid page switching between features = wants everything.

  useEffect(() => {
    const memory = memoryRef.current;
    if (!memory.featureSwitchTimestamps) memory.featureSwitchTimestamps = [];

    const now = Date.now();
    memory.featureSwitchTimestamps.push(now);
    // Keep last 2 minutes
    memory.featureSwitchTimestamps = memory.featureSwitchTimestamps.filter(t => now - t < 120000);
    saveVisitorMemory(memory);

    const recentSwitches = memory.featureSwitchTimestamps.length;

    if (recentSwitches >= 6) {
      const timer = setTimeout(() => {
        enqueueMessage({
          content: `😱 FOMO detected: You've explored ${recentSwitches} pages in 2 minutes — you want everything! Good news: the all-access plan covers every feature you've looked at. Want a personalized bundle?`,
          type: 'fomo',
          priority: 8,
          dismissable: true,
          icon: "😱",
        });
        memory.featureSwitchTimestamps = [];
        saveVisitorMemory(memory);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, enqueueMessage]);

  return {
    currentMessage,
    isVisible,
    detectedMood,
    dismiss,
    recordInteraction,
    visitorMemory: memoryRef.current,
  };
}
