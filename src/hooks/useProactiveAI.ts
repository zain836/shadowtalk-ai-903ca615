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
const PROACTIVE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proactive-ai`;

// ─── AI Message Generator ──────────────────────────────
// Calls the proactive-ai edge function for genuine, contextual messages.
// Falls back to a simple default if the API is unavailable.

const aiMessageCache = new Map<string, { message: string; timestamp: number }>();
const AI_CACHE_TTL = 120000; // 2 min cache per trigger type

// Global rate limiter: max 1 API call per 30 seconds
let lastApiCallTimestamp = 0;
const MIN_API_INTERVAL = 30000; // 30 seconds between API calls
let consecutiveRateLimits = 0;

async function generateAIMessage(context: {
  triggerType: string;
  currentPage: string;
  mood?: string;
  visitCount?: number;
  pagesVisited?: string[];
  scrollPercent?: number;
  extraContext?: string;
}): Promise<string | null> {
  const cacheKey = `${context.triggerType}-${context.currentPage}-${context.mood || ''}`;
  const cached = aiMessageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
    return cached.message;
  }

  // Global rate limit: skip if called too recently
  const now = Date.now();
  const backoff = MIN_API_INTERVAL * Math.pow(2, Math.min(consecutiveRateLimits, 4));
  if (now - lastApiCallTimestamp < backoff) {
    return null;
  }

  try {
    lastApiCallTimestamp = now;
    const resp = await fetch(PROACTIVE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(context),
    });
    if (resp.status === 429) {
      consecutiveRateLimits++;
      return null;
    }
    if (!resp.ok) return null;
    consecutiveRateLimits = 0;
    const data = await resp.json();
    const message = data.message;
    if (message) {
      aiMessageCache.set(cacheKey, { message, timestamp: Date.now() });
    }
    return message || null;
  } catch {
    return null;
  }
}

// Simple fallback icons per trigger type
const TRIGGER_ICONS: Record<string, string> = {
  greeting: '👋', returning: '🎯', temporal: '⏰', mood: '🧠',
  prediction: '🔮', narration: '📖', 'exit-intent': '🚪', nudge: '💭',
  phantom: '🔮', copy: '📋', battery: '🔋', connection: '📡',
  'tab-rivalry': '👀', hesitation: '⏳', device: '📱', 'ambient-light': '🌙',
  confidence: '🎯', 'cursor-orbit': '🎯', 'déjà-vu': '🔄',
  'micro-gesture': '🤔', breathing: '🫁', 'touch-pressure': '📱',
  chronobio: '⏰', 'decision-fatigue': '🧠', 'visual-attention': '👁️',
  'digital-twin': '🤖', subconscious: '💫', 'cognitive-load': '🧠',
  linguistic: '📝', fomo: '😱',
};

// ─── Storage Helpers ───────────────────────────────────

function getVisitorMemory(): VisitorMemory {
  const defaults: VisitorMemory = {
    visitCount: 0, lastVisit: 0, pagesVisited: [], navigationHistory: [],
    hasInteracted: false, totalTimeSpent: 0, moodHistory: [],
    copiedTexts: [], phantomTypeCount: 0,
    activityByHour: {}, decisionCount: 0, vocabularyLevel: 'unknown',
    featureSwitchTimestamps: [],
  };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return defaults;
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
        // Ultra-fast re-engagement: only 1.5s gap between messages
        setTimeout(() => processQueue(), 1500);
      }, 400);
    }, 8000); // Show each message for 8s instead of 12s
  }, [isChatOpen]);

  const enqueueMessage = useCallback((msg: Omit<ProactiveMessage, 'id'>) => {
    if (isChatOpen) return;
    const session = sessionRef.current;
    const typeCount = session.shownMessages.filter(m => m.startsWith(msg.type)).length;
    // Allow up to 5 messages per type for ultra-proactive behavior
    if (typeCount >= 5) return;
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
      // Quick re-engage after dismiss
      setTimeout(() => processQueue(), 1000);
    }, 300);
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
    const delay = memory.visitCount <= 1 ? 1200 : 800;
    const timer = setTimeout(async () => {
      const triggerType = memory.visitCount <= 1 ? 'greeting' : 'returning';
      const daysSinceVisit = Math.floor((Date.now() - memory.lastVisit) / 86400000);
      const extraContext = memory.visitCount > 1
        ? `Returning visitor (visit #${memory.visitCount}, ${daysSinceVisit} days since last visit). ${memory.lastConversationTopic ? `Last topic: "${memory.lastConversationTopic}"` : ''}`
        : 'First-time visitor, make them feel welcome';
      const aiMsg = await generateAIMessage({
        triggerType,
        currentPage: location.pathname,
        visitCount: memory.visitCount,
        pagesVisited: memory.pagesVisited,
        extraContext,
      });
      const icon = TRIGGER_ICONS[triggerType] || '👋';
      enqueueMessage({
        content: aiMsg || `${icon} Welcome! How can I help you today?`,
        type: triggerType === 'greeting' ? 'temporal' : 'returning',
        priority: 10, dismissable: true, icon,
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [enqueueMessage, location.pathname]);

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
    const interval = setInterval(async () => {
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
        const aiMsg = await generateAIMessage({
          triggerType: 'mood',
          currentPage: location.pathname,
          mood,
          visitCount: memoryRef.current.visitCount,
          pagesVisited: memoryRef.current.pagesVisited,
          extraContext: `User mood changed to ${mood}. Clicks/min: ${clicksPerMinute}, idle: ${mouseIdleRef.current}ms`,
        });
        const icon = TRIGGER_ICONS.mood;
        if (aiMsg) {
          enqueueMessage({ content: aiMsg, type: 'mood', priority: mood === 'frustrated' ? 9 : 6, dismissable: true, icon });
        }
      }
      if (now % 10000 < 3000) rapidClickRef.current = 0;
    }, 10000);
    return () => clearInterval(interval);
  }, [detectedMood, enqueueMessage, location.pathname]);

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
      
      // Use AI for navigation predictions instead of hardcoded patterns
      if (recentPaths.length >= 2) {
        setTimeout(async () => {
          const aiMsg = await generateAIMessage({
            triggerType: 'prediction',
            currentPage: currentPath,
            visitCount: memory.visitCount,
            pagesVisited: recentPaths,
            extraContext: `Navigation path: ${recentPaths.join(' → ')}. Dwell time on previous page: ${Math.round(dwellMs / 1000)}s`,
          });
          if (aiMsg) {
            enqueueMessage({ content: aiMsg, type: 'prediction', priority: 8, dismissable: true, icon: TRIGGER_ICONS.prediction });
          }
        }, 3000);
      }
      
      lastPathRef.current = currentPath;
      pageEntryRef.current = Date.now();
      scrollPercentRef.current = 0;
    }
  }, [location.pathname, enqueueMessage]);

  // ─── 5. Ambient Narration (Scroll-Aware) ────────────

  useEffect(() => {
    // Track scroll milestones: 25%, 50%, 75%, 90%
    const SCROLL_MILESTONES = [25, 50, 75, 90];
    let lastMilestone = 0;
    
    const handler = async () => {
      const scrollPct = scrollPercentRef.current;
      const session = sessionRef.current;
      
      for (const milestone of SCROLL_MILESTONES) {
        if (scrollPct >= milestone && milestone > lastMilestone) {
          const narrationId = `narration-${location.pathname}-${milestone}`;
          if (!session.shownNarrations.includes(narrationId)) {
            session.shownNarrations.push(narrationId);
            saveSessionState(session);
            lastMilestone = milestone;
            
            const aiMsg = await generateAIMessage({
              triggerType: 'narration',
              currentPage: location.pathname,
              scrollPercent: milestone,
              visitCount: memoryRef.current.visitCount,
              pagesVisited: memoryRef.current.pagesVisited,
              extraContext: `User scrolled to ${milestone}% of the ${location.pathname} page`,
            });
            if (aiMsg) {
              enqueueMessage({ content: aiMsg, type: 'narration', priority: 5, dismissable: true, icon: TRIGGER_ICONS.narration });
            }
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [location.pathname, enqueueMessage]);

  // ─── 6. Exit Intent ─────────────────────────────────

  useEffect(() => {
    const handler = async (e: MouseEvent) => {
      if (e.clientY <= 0 && Date.now() - pageEntryRef.current > 3000) {
        const aiMsg = await generateAIMessage({
          triggerType: 'exit-intent',
          currentPage: location.pathname,
          visitCount: memoryRef.current.visitCount,
          pagesVisited: memoryRef.current.pagesVisited,
          extraContext: `User moving mouse to leave. Time on page: ${Math.round((Date.now() - pageEntryRef.current) / 1000)}s`,
        });
        enqueueMessage({
          content: aiMsg || "🚪 Heading out? Let me know if there's anything I can help with before you go.",
          type: 'exit-intent', priority: 9, dismissable: true, icon: TRIGGER_ICONS['exit-intent'],
        });
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, [enqueueMessage, location.pathname]);

  // ─── 7. Idle Nudge ──────────────────────────────────

  useEffect(() => {
    const timer = setInterval(async () => {
      if (mouseIdleRef.current > 12000 && !isChatOpen) {
        const aiMsg = await generateAIMessage({
          triggerType: 'nudge',
          currentPage: location.pathname,
          mood: detectedMood,
          visitCount: memoryRef.current.visitCount,
          pagesVisited: memoryRef.current.pagesVisited,
          extraContext: `User has been idle for ${Math.round(mouseIdleRef.current / 1000)}s on ${location.pathname}`,
        });
        if (aiMsg) {
          enqueueMessage({ content: aiMsg, type: 'nudge', priority: 4, dismissable: true, icon: TRIGGER_ICONS.nudge });
        }
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [isChatOpen, enqueueMessage, location.pathname, detectedMood]);

  // ════════════════════════════════════════════════════
  // ═══ BEYOND-AI PROACTIVE DETECTIONS ════════════════
  // ════════════════════════════════════════════════════

  // Helper: enqueue AI-generated message for any trigger
  const enqueueAIMessage = useCallback(async (
    triggerType: string,
    priority: number,
    extraContext: string,
    fallback?: string,
  ) => {
    const aiMsg = await generateAIMessage({
      triggerType,
      currentPage: location.pathname,
      mood: detectedMood,
      visitCount: memoryRef.current.visitCount,
      pagesVisited: memoryRef.current.pagesVisited,
      extraContext,
    });
    const icon = TRIGGER_ICONS[triggerType] || '💬';
    const content = aiMsg || fallback;
    if (content) {
      enqueueMessage({
        content,
        type: triggerType as ProactiveMessageType,
        priority,
        dismissable: true,
        icon,
      });
    }
  }, [enqueueMessage, location.pathname, detectedMood]);

  // ─── 8. PHANTOM TYPING — User types then deletes everything ───

  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || !('value' in target)) return;
      const val = target.value;

      inputLengthHistoryRef.current.push({ len: val.length, t: Date.now() });
      if (inputLengthHistoryRef.current.length > 20) inputLengthHistoryRef.current = inputLengthHistoryRef.current.slice(-10);

      if (val.length === 0) {
        const history = inputLengthHistoryRef.current;
        const maxLen = Math.max(...history.map(h => h.len));
        if (maxLen >= 10) {
          memoryRef.current.phantomTypeCount = (memoryRef.current.phantomTypeCount || 0) + 1;
          saveVisitorMemory(memoryRef.current);

          if (phantomTimerRef.current) clearTimeout(phantomTimerRef.current);
          phantomTimerRef.current = setTimeout(() => {
            enqueueAIMessage('phantom', 9, `User typed ~${maxLen} characters then deleted everything. This is attempt #${memoryRef.current.phantomTypeCount}. They're struggling to articulate something.`);
          }, 2000);

          inputLengthHistoryRef.current = [];
        }
      }
    };

    document.addEventListener('input', handler, { passive: true });
    return () => document.removeEventListener('input', handler);
  }, [enqueueAIMessage]);

  // ─── 9. COPY-PASTE AWARENESS ───

  useEffect(() => {
    const handler = () => {
      const selection = window.getSelection()?.toString()?.trim();
      if (!selection || selection.length < 5) return;

      memoryRef.current.copiedTexts = memoryRef.current.copiedTexts || [];
      memoryRef.current.copiedTexts.push(selection.slice(0, 100));
      if (memoryRef.current.copiedTexts.length > 10) memoryRef.current.copiedTexts = memoryRef.current.copiedTexts.slice(-10);
      saveVisitorMemory(memoryRef.current);

      const copyCount = memoryRef.current.copiedTexts.length;

      if (copyCount === 1 || copyCount === 3) {
        enqueueAIMessage('copy', 7, `User copied text: "${selection.slice(0, 80)}". Total copies this session: ${copyCount}.`);
      }
    };
    document.addEventListener('copy', handler);
    return () => document.removeEventListener('copy', handler);
  }, [enqueueAIMessage]);

  // ─── 10. BATTERY EMPATHY ───

  useEffect(() => {
    let mounted = true;
    const checkBattery = async () => {
      try {
        const nav = navigator as any;
        if (!nav.getBattery) return;
        const battery = await nav.getBattery();

        const handler = () => {
          if (!mounted) return;
          const level = Math.round(battery.level * 100);
          if (level <= 15 && !battery.charging) {
            enqueueAIMessage('battery', level <= 5 ? 10 : 8, `User battery at ${level}%, not charging.`);
          }
        };

        battery.addEventListener('levelchange', handler);
        handler();
        return () => battery.removeEventListener('levelchange', handler);
      } catch {}
    };
    checkBattery();
    return () => { mounted = false; };
  }, [enqueueAIMessage]);

  // ─── 11. CONNECTION SPEED EMPATHY ───

  useEffect(() => {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!conn) return;

    const handler = () => {
      const effectiveType = conn.effectiveType;
      const downlink = conn.downlink;

      if (effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5) {
        enqueueAIMessage('connection', 7, `User on very slow connection: ${effectiveType}, ${downlink}Mbps`);
      } else if (effectiveType === '3g' || downlink < 1.5) {
        enqueueAIMessage('connection', 5, `User on moderate connection: ${effectiveType}, ${downlink}Mbps`);
      }
    };

    conn.addEventListener('change', handler);
    setTimeout(handler, 5000);
    return () => conn.removeEventListener('change', handler);
  }, [enqueueAIMessage]);

  // ─── 12. TAB RIVALRY ───

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        tabBlurTimestampRef.current = Date.now();
      } else if (tabBlurTimestampRef.current) {
        const awayMs = Date.now() - tabBlurTimestampRef.current;
        totalTabAwayRef.current += awayMs;
        tabBlurTimestampRef.current = null;

        if (awayMs > 30000) {
          const awayMinutes = Math.round(awayMs / 60000);
          enqueueAIMessage(
            'tab-rivalry',
            awayMs >= 1800000 ? 9 : awayMs >= 300000 ? 7 : 8,
            `User returned after being away for ${awayMinutes > 0 ? awayMinutes + ' minutes' : Math.round(awayMs / 1000) + ' seconds'}. They were browsing on ${location.pathname}.`
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [enqueueAIMessage, location.pathname]);

  // ─── 13. SCROLL HESITATION ───

  useEffect(() => {
    let lastCheckY = 0;
    let pauseStart = 0;

    const interval = setInterval(() => {
      const currentY = window.scrollY;
      const velocity = scrollVelocityRef.current;

      if (velocity < 0.5 && Math.abs(currentY - lastCheckY) < 20) {
        if (!pauseStart) {
          pauseStart = Date.now();
        } else {
          const pauseDuration = Date.now() - pauseStart;
          if (pauseDuration > 5000 && pauseDuration < 10000) {
            const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
            const text = centerEl?.textContent?.trim()?.slice(0, 60);

            if (text && text.length > 10) {
              enqueueAIMessage('hesitation', 6, `User paused scrolling for ${Math.round(pauseDuration / 1000)}s staring at: "${text}"`);
              pauseStart = 0;
            }
          }
        }
      } else {
        pauseStart = 0;
      }

      lastCheckY = currentY;
    }, 2000);

    return () => clearInterval(interval);
  }, [enqueueAIMessage]);

  // ─── 14. DEVICE PERSONALITY ───

  useEffect(() => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isUltrawide = width > 2000;
    const isTouchDevice = 'ontouchstart' in window;

    const timer = setTimeout(() => {
      if (isMobile && isTouchDevice) {
        enqueueAIMessage('device', 4, 'User on mobile touch device');
      } else if (isUltrawide) {
        enqueueAIMessage('device', 4, 'User on ultrawide monitor — power user setup');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [enqueueAIMessage]);

  // ─── 15. AMBIENT LIGHT / DARK MODE ───

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      enqueueAIMessage('ambient-light', 3, `User switched to ${e.matches ? 'dark' : 'light'} mode`);
    };

    darkModeQuery.addEventListener('change', handler);
    return () => darkModeQuery.removeEventListener('change', handler);
  }, [enqueueAIMessage]);

  // ─── 16. KEYSTROKE CONFIDENCE ANALYSIS ───

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

  useEffect(() => {
    const interval = setInterval(() => {
      const intervals = keystrokeIntervalsRef.current;
      if (intervals.length < 10) return;

      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avg;

      if (coefficientOfVariation > 1.2 && avg > 200) {
        enqueueAIMessage('confidence', 7, `Erratic typing detected: CV=${coefficientOfVariation.toFixed(2)}, avg interval=${Math.round(avg)}ms. User seems uncertain.`);
        keystrokeIntervalsRef.current = [];
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [enqueueAIMessage]);

  // ─── 17. CURSOR ORBIT DETECTION ───

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
      if (timeSpan < 2000) return;

      const cx = recent.reduce((s, p) => s + p.x, 0) / recent.length;
      const cy = recent.reduce((s, p) => s + p.y, 0) / recent.length;
      const avgDist = recent.reduce((s, p) => s + Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2)), 0) / recent.length;

      if (avgDist < 100 && avgDist > 20 && timeSpan > 3000) {
        const orbitEl = document.elementFromPoint(cx, cy);
        const isButton = orbitEl?.closest('button, a, [role="button"]');

        if (isButton) {
          const label = isButton.textContent?.trim()?.slice(0, 30);
          enqueueAIMessage('cursor-orbit', 8, `User cursor orbiting "${label}" button for ${Math.round(timeSpan / 1000)}s without clicking`);
          cursorPositionsRef.current = [];
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [enqueueAIMessage]);

  // ─── 18. DÉJÀ VU ───

  useEffect(() => {
    const handler = () => {
      const zone = Math.floor(window.scrollY / 300);
      const count = rereadSectionsRef.current.get(zone) || 0;
      rereadSectionsRef.current.set(zone, count + 1);

      if (count === 3) {
        const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        const heading = centerEl?.closest('section, article, div')?.querySelector('h1, h2, h3');
        const text = heading?.textContent?.trim() || centerEl?.textContent?.trim()?.slice(0, 40);

        if (text) {
          enqueueAIMessage('déjà-vu', 7, `User revisited section "${text}" 3+ times — it clearly resonates`);
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [enqueueAIMessage]);

  // ─── 19. MICRO-GESTURE — Selection without copy ───

  useEffect(() => {
    let selectionTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      if (selectionTimer) clearTimeout(selectionTimer);

      selectionTimer = setTimeout(() => {
        const selection = window.getSelection()?.toString()?.trim();
        if (selection && selection.length > 15 && selection.length < 200) {
          enqueueAIMessage('micro-gesture', 6, `User highlighted text without copying: "${selection.slice(0, 80)}"`);
        }
      }, 4000);
    };

    document.addEventListener('selectionchange', handler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      if (selectionTimer) clearTimeout(selectionTimer);
    };
  }, [enqueueAIMessage]);

  // ════════════════════════════════════════════════════
  // ═══ BEYOND-HUMAN LEVEL DETECTIONS ═════════════════
  // ════════════════════════════════════════════════════

  // ─── 20. BREATHING PATTERN DETECTION ───

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

    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handler);
    }

    const interval = setInterval(() => {
      if (samples.length < 30) return;
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const peaks = samples.filter(s => s > avg * 1.5).length;

      if (peaks > 15) {
        enqueueAIMessage('breathing', 8, 'Elevated device micro-movements detected — user may be stressed or breathing rapidly');
        samples = [];
      } else if (peaks < 5 && samples.length > 50) {
        enqueueAIMessage('breathing', 3, 'Very still device — user is deeply calm or focused');
        samples = [];
      }
    }, 12000);

    return () => {
      window.removeEventListener('devicemotion', handler);
      clearInterval(interval);
    };
  }, [enqueueAIMessage]);

  // ─── 21. TOUCH PRESSURE SENSING ───

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
        enqueueAIMessage('touch-pressure', 7, `Hard screen presses detected (avg force: ${avg.toFixed(2)}). User may be frustrated.`);
        pressures.length = 0;
      } else if (avg < 0.15 && avg > 0) {
        enqueueAIMessage('touch-pressure', 3, `Very light touches (avg force: ${avg.toFixed(2)}). User browsing gently.`);
        pressures.length = 0;
      }
    }, 8000);

    return () => {
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('touchmove', handler);
      clearInterval(interval);
    };
  }, [enqueueAIMessage]);

  // ─── 22. CHRONOBIOLOGICAL SYNC ───

  useEffect(() => {
    const memory = memoryRef.current;
    if (!memory.activityByHour) memory.activityByHour = {};

    const hour = new Date().getHours();
    memory.activityByHour[hour] = (memory.activityByHour[hour] || 0) + 1;
    saveVisitorMemory(memory);

    if (memory.visitCount < 3) return;

    const entries = Object.entries(memory.activityByHour).map(([h, s]) => ({ hour: Number(h), score: s as number }));
    entries.sort((a, b) => b.score - a.score);
    const peakHour = entries[0];

    if (peakHour && peakHour.score >= 3) {
      const currentHour = new Date().getHours();
      const isPeak = currentHour === peakHour.hour;
      const peakLabel = peakHour.hour > 12 ? `${peakHour.hour - 12}pm` : `${peakHour.hour}am`;

      const timer = setTimeout(() => {
        enqueueAIMessage('chronobio', isPeak ? 6 : 4, `User's peak activity hour is ${peakLabel} (based on ${memory.visitCount} visits). Currently ${isPeak ? 'at peak' : 'off-peak'}.`);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [enqueueAIMessage]);

  // ─── 23. DECISION FATIGUE METER ───

  useEffect(() => {
    const memory = memoryRef.current;
    if (!memory.decisionCount) memory.decisionCount = 0;

    const clickHandler = () => {
      memory.decisionCount += 1;
      saveVisitorMemory(memory);

      if (memory.decisionCount === 35 || memory.decisionCount === 60) {
        enqueueAIMessage('decision-fatigue', memory.decisionCount >= 60 ? 9 : 8, `User has made ${memory.decisionCount} micro-decisions this session — cognitive overload threshold reached.`);
      }
    };

    window.addEventListener('click', clickHandler, { passive: true });
    return () => window.removeEventListener('click', clickHandler);
  }, [enqueueAIMessage]);

  // ─── 24. VISUAL ATTENTION CARTOGRAPHY ───

  useEffect(() => {
    const attentionZones: Map<string, number> = new Map();
    let lastCheck = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = now - lastCheck;
      lastCheck = now;

      if (scrollVelocityRef.current > 2) return;

      const gazeY = window.scrollY + window.innerHeight * 0.4;
      const zone = Math.floor(gazeY / 200);
      const zoneKey = `${location.pathname}-${zone}`;

      attentionZones.set(zoneKey, (attentionZones.get(zoneKey) || 0) + dt);

      const entries = Array.from(attentionZones.entries());
      const hotspot = entries.sort((a, b) => b[1] - a[1])[0];

      if (hotspot && hotspot[1] > 12000 && hotspot[1] < 18000) {
        const zoneY = Number(hotspot[0].split('-').pop()) * 200;
        const el = document.elementFromPoint(window.innerWidth / 2, zoneY - window.scrollY + 100);
        const heading = el?.closest('section, article')?.querySelector('h1, h2, h3');
        const label = heading?.textContent?.trim() || 'this section';

        enqueueAIMessage('visual-attention', 6, `User spent 20+ seconds focused on "${label}" — high visual attention zone`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [enqueueAIMessage, location.pathname]);

  // ─── 25. DIGITAL TWIN PREDICTION ───

  useEffect(() => {
    const memory = memoryRef.current;
    if (memory.navigationHistory.length < 4) return;

    const timer = setTimeout(() => {
      const history = memory.navigationHistory;
      const currentPath = location.pathname;

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

        enqueueAIMessage('digital-twin', 7, `Based on navigation history, predicting user will visit ${predictedPath} next (${confidence}% confidence).`);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname, enqueueAIMessage]);

  // ─── 26. SUBCONSCIOUS ELEMENT ATTRACTION ───

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
      const entries = Array.from(hoverMap.entries()).filter(([, count]) => count > 30);
      if (entries.length === 0) return;
      const topAttraction = entries.sort((a, b) => b[1] - a[1])[0];

      enqueueAIMessage('subconscious', 7, `User cursor gravitated toward "${topAttraction[0]}" ${topAttraction[1]} times without clicking — subconscious attraction detected`);
      hoverMap.clear();
    }, 12000);

    return () => {
      window.removeEventListener('mousemove', handler);
      clearInterval(interval);
    };
  }, [enqueueAIMessage]);

  // ─── 27. COGNITIVE LOAD ESTIMATION ───

  useEffect(() => {
    const interval = setInterval(() => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, li, span, td');
      const visibleCount = Array.from(textElements).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight;
      }).length;

      const erraticScore = (
        (visibleCount > 20 ? 3 : visibleCount > 10 ? 1 : 0) +
        (scrollVelocityRef.current > 4 ? 2 : 0) +
        (focusLostRef.current > 2 ? 2 : 0) +
        (backtrackRef.current > 1 ? 1 : 0)
      );

      if (erraticScore >= 5) {
        enqueueAIMessage('cognitive-load', 8, `Cognitive overload: ${visibleCount}+ visible elements, erratic scrolling, tab switching. User needs focus.`);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [enqueueAIMessage]);

  // ─── 28. LINGUISTIC FINGERPRINTING ───

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

      const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
      const complexWords = words.filter(w => w.length > 8).length;
      const ratio = complexWords / words.length;

      const memory = memoryRef.current;
      let level: 'simple' | 'moderate' | 'advanced' = 'moderate';

      if (ratio > 0.3 || avgWordLen > 7) level = 'advanced';
      else if (ratio < 0.1 && avgWordLen < 5) level = 'simple';

      if (memory.vocabularyLevel !== level && level !== 'moderate') {
        memory.vocabularyLevel = level;
        saveVisitorMemory(memory);
        enqueueAIMessage('linguistic', 5, `User vocabulary level detected as "${level}" (avg word length: ${avgWordLen.toFixed(1)}, complex ratio: ${(ratio * 100).toFixed(0)}%). Adjust communication style.`);
      }
    }, 10000);

    return () => {
      window.removeEventListener('keydown', handler);
      clearInterval(interval);
    };
  }, [enqueueAIMessage]);

  // ─── 29. FOMO CASCADE DETECTION ───

  useEffect(() => {
    const memory = memoryRef.current;
    if (!memory.featureSwitchTimestamps) memory.featureSwitchTimestamps = [];

    const now = Date.now();
    memory.featureSwitchTimestamps.push(now);
    memory.featureSwitchTimestamps = memory.featureSwitchTimestamps.filter(t => now - t < 120000);
    saveVisitorMemory(memory);

    const recentSwitches = memory.featureSwitchTimestamps.length;

    if (recentSwitches >= 4) {
      const timer = setTimeout(() => {
        enqueueAIMessage('fomo', 8, `User explored ${recentSwitches} pages in 2 minutes — rapid feature switching, FOMO pattern.`);
        memory.featureSwitchTimestamps = [];
        saveVisitorMemory(memory);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, enqueueAIMessage]);

  return {
    currentMessage,
    isVisible,
    detectedMood,
    dismiss,
    recordInteraction,
    visitorMemory: memoryRef.current,
  };
}
