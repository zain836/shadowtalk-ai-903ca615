import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// All navigable pages with aliases for voice matching
const VOICE_ROUTES = [
  { path: "/chatbot", names: ["chatbot", "chat", "chat bot", "ai chat", "talk"] },
  { path: "/", names: ["home", "landing", "main page", "homepage"] },
  { path: "/pricing", names: ["pricing", "plans", "prices", "subscription"] },
  { path: "/strategy", names: ["strategy", "strategy agent", "business strategy"] },
  { path: "/workspace", names: ["workspace", "ai workspace", "work space"] },
  { path: "/marketplace", names: ["marketplace", "market place", "store", "agents"] },
  { path: "/missioncontrol", names: ["mission control", "missions", "mission"] },
  { path: "/presentations", names: ["presentations", "slides", "presentation builder"] },
  { path: "/developers", names: ["developers", "developer tools", "dev tools"] },
  { path: "/privacy-score", names: ["privacy score", "privacy", "privacy check"] },
  { path: "/docs", names: ["docs", "documentation", "documents"] },
  { path: "/changelog", names: ["changelog", "change log", "what's new", "updates"] },
  { path: "/rooms", names: ["rooms", "chat rooms", "collaborative rooms"] },
  { path: "/api", names: ["api", "api reference", "api docs"] },
  { path: "/analytics", names: ["analytics", "dashboard", "stats", "statistics"] },
  { path: "/enterprise", names: ["enterprise", "enterprise settings"] },
  { path: "/about", names: ["about", "about us", "about page"] },
  { path: "/shadow-memory", names: ["shadow memory", "memory", "activity log", "activity"] },
  { path: "/admin", names: ["admin", "admin panel", "administration"] },
  { path: "/profile", names: ["profile", "my profile", "account", "settings"] },
  { path: "/billing", names: ["billing", "payments", "monetization"] },
  { path: "/founder-access", names: ["founder", "founder access", "founders"] },
  { path: "/lifetime-deal", names: ["lifetime deal", "lifetime", "deal"] },
  { path: "/research", names: ["research", "deep research", "deep search"] },
  { path: "/knowledge", names: ["knowledge", "knowledge graph", "knowledge base"] },
  { path: "/strategy-lab", names: ["strategy lab", "lab", "experiments"] },
  { path: "/sovereign-data", names: ["sovereign data", "data sovereignty", "sovereign"] },
  { path: "/vault", names: ["vault", "stealth vault", "encrypted vault", "secret vault"] },
  { path: "/business-memory", names: ["business memory", "business context"] },
  { path: "/wallet", names: ["wallet", "sovereign wallet", "credits"] },
  { path: "/ghost-ads", names: ["ghost ads", "ads", "advertising"] },
  { path: "/data-insights", names: ["data insights", "insights"] },
  { path: "/security-audit", names: ["security audit", "security", "audit"] },
  { path: "/command-center", names: ["command center", "automation", "commands"] },
  { path: "/help", names: ["help", "help center", "support"] },
  { path: "/faq", names: ["faq", "questions", "frequently asked"] },
  { path: "/contact", names: ["contact", "contact us", "reach out"] },
  { path: "/status", names: ["status", "system status", "uptime"] },
  { path: "/blog", names: ["blog", "articles", "posts"] },
  { path: "/referral", names: ["referral", "referrals", "refer a friend"] },
  { path: "/auth", names: ["login", "sign in", "sign up", "register", "authentication"] },
  { path: "/competitive", names: ["competitive", "comparison", "versus", "vs kimi", "vs macron"] },
  { path: "/agents", names: ["agents", "agent architecture", "distributed agents", "spawn agents"] },
  { path: "/compliance", names: ["compliance", "compliance dashboard", "gdpr", "privacy compliance"] },
];

// Command categories for the HUD
const COMMAND_CATEGORIES = [
  {
    label: "Navigation",
    commands: ["Open [page]", "Go to [page]", "Go back", "Go forward"],
  },
  {
    label: "Scrolling",
    commands: ["Scroll down", "Scroll up", "Go to top", "Go to bottom"],
  },
  {
    label: "Interaction",
    commands: ["Click [button name]", "Press [button]", "Submit form", "Close dialog"],
  },
  {
    label: "Input",
    commands: ["Type [text]", "Clear input", "Search for [query]", "Focus search"],
  },
  {
    label: "UI Control",
    commands: ["Dark mode", "Light mode", "Zoom in", "Zoom out", "Reset zoom", "Fullscreen"],
  },
  {
    label: "Actions",
    commands: ["Refresh page", "Copy page URL", "Select all", "Read page", "Stop"],
  },
];

// Helpers for DOM interaction
function findClickableByText(text: string): HTMLElement | null {
  const lower = text.toLowerCase().trim();
  const selectors = 'button, a, [role="button"], [role="tab"], [role="menuitem"], input[type="submit"], input[type="button"]';
  const elements = document.querySelectorAll<HTMLElement>(selectors);

  // Exact match first
  for (const el of elements) {
    const elText = (el.textContent || el.getAttribute("aria-label") || "").toLowerCase().trim();
    if (elText === lower && isVisible(el)) return el;
  }
  // Partial match
  for (const el of elements) {
    const elText = (el.textContent || el.getAttribute("aria-label") || "").toLowerCase().trim();
    if (elText.includes(lower) && isVisible(el)) return el;
  }
  // Check title/placeholder
  for (const el of elements) {
    const title = (el.getAttribute("title") || el.getAttribute("placeholder") || "").toLowerCase();
    if (title.includes(lower) && isVisible(el)) return el;
  }
  return null;
}

function findInputByLabel(label: string): HTMLInputElement | HTMLTextAreaElement | null {
  const lower = label.toLowerCase().trim();
  // Check for focused input first
  if (!label) {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      return active as HTMLInputElement | HTMLTextAreaElement;
    }
  }
  // Search by placeholder or label
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  for (const input of inputs) {
    const placeholder = (input.placeholder || "").toLowerCase();
    const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
    if ((placeholder.includes(lower) || ariaLabel.includes(lower)) && isVisible(input)) return input;
  }
  // Search by associated label element
  const labels = document.querySelectorAll("label");
  for (const lbl of labels) {
    if (lbl.textContent?.toLowerCase().includes(lower)) {
      const input = lbl.querySelector("input, textarea") || (lbl.htmlFor && document.getElementById(lbl.htmlFor));
      if (input && isVisible(input as HTMLElement)) return input as HTMLInputElement;
    }
  }
  // Fallback: first visible input/textarea
  for (const input of inputs) {
    if (isVisible(input) && input.type !== "hidden") return input;
  }
  return null;
}

function isVisible(el: HTMLElement): boolean {
  if (!el.offsetParent && el.tagName !== "BODY") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findAndCloseDialog(): boolean {
  // Close dialog/modal via close button or Escape
  const closeBtn = document.querySelector<HTMLElement>(
    '[data-state="open"] button[aria-label="Close"], ' +
    'dialog[open] button[aria-label="Close"], ' +
    '[role="dialog"] button[aria-label="Close"], ' +
    '[data-state="open"] button:has(svg)'
  );
  if (closeBtn && isVisible(closeBtn)) {
    closeBtn.click();
    return true;
  }
  // Try pressing Escape
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return true;
}

function speak(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }
}

const VoiceCommandSystem: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showAllCommands, setShowAllCommands] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();
  const zoomRef = useRef(100);
  const isActiveRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const showFeedback = useCallback((msg: string, speakIt = false) => {
    setFeedback(msg);
    if (speakIt) speak(msg);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(""), 4000);
  }, []);

  const addToHistory = useCallback((cmd: string) => {
    setCommandHistory(prev => [cmd, ...prev.slice(0, 9)]);
  }, []);

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return false;
    addToHistory(lower);

    // ===== NAVIGATION =====
    const navPrefixes = ["open ", "go to ", "launch ", "navigate to ", "take me to ", "show me ", "switch to "];
    let target = lower;
    for (const prefix of navPrefixes) {
      if (lower.startsWith(prefix)) {
        target = lower.slice(prefix.length).trim();
        break;
      }
    }

    for (const route of VOICE_ROUTES) {
      for (const name of route.names) {
        if (target === name || target.includes(name)) {
          if (location.pathname !== route.path) {
            navigate(route.path);
            showFeedback(`Opening ${route.names[0]}...`, true);
            return true;
          } else {
            showFeedback(`Already on ${route.names[0]}`);
            return true;
          }
        }
      }
    }

    // ===== SCROLLING =====
    if (lower.includes("scroll down") || lower === "down") {
      window.scrollBy({ top: 500, behavior: "smooth" });
      showFeedback("Scrolling down...");
      return true;
    }
    if (lower.includes("scroll up") || lower === "up") {
      window.scrollBy({ top: -500, behavior: "smooth" });
      showFeedback("Scrolling up...");
      return true;
    }
    if (lower.includes("go to top") || lower.includes("scroll to top") || lower === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showFeedback("Going to top...");
      return true;
    }
    if (lower.includes("go to bottom") || lower.includes("scroll to bottom") || lower === "bottom") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      showFeedback("Going to bottom...");
      return true;
    }
    if (lower.includes("page down")) {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
      showFeedback("Page down");
      return true;
    }
    if (lower.includes("page up")) {
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
      showFeedback("Page up");
      return true;
    }

    // ===== CLICK / PRESS BUTTONS =====
    const clickPrefixes = ["click ", "press ", "tap ", "hit ", "select "];
    for (const prefix of clickPrefixes) {
      if (lower.startsWith(prefix)) {
        const btnName = lower.slice(prefix.length).trim();
        const el = findClickableByText(btnName);
        if (el) {
          el.click();
          el.focus();
          showFeedback(`Clicked "${btnName}"`, true);
          return true;
        } else {
          showFeedback(`Could not find "${btnName}" on this page`);
          return true;
        }
      }
    }

    // ===== FORM / INPUT =====
    // "type [text]" or "type [text] in [field]"
    if (lower.startsWith("type ")) {
      const rest = lower.slice(5);
      let textToType = rest;
      let fieldName = "";
      const inMatch = rest.match(/^(.+?)\s+in\s+(.+)$/);
      if (inMatch) {
        textToType = inMatch[1];
        fieldName = inMatch[2];
      }
      const input = findInputByLabel(fieldName);
      if (input) {
        input.focus();
        // Use native input setter to trigger React state updates
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(input, input.value + textToType);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        showFeedback(`Typed "${textToType}"`, true);
        return true;
      }
      showFeedback("No input field found");
      return true;
    }

    // "clear input" / "clear field"
    if (lower.includes("clear input") || lower.includes("clear field") || lower === "clear") {
      const input = findInputByLabel("");
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(input, "");
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        showFeedback("Input cleared");
        return true;
      }
    }

    // "focus search" / "focus input"
    if (lower.includes("focus search") || lower.includes("focus input")) {
      const input = findInputByLabel("search") || findInputByLabel("");
      if (input) {
        input.focus();
        showFeedback("Input focused");
        return true;
      }
    }

    // "search for [query]"
    if (lower.startsWith("search for ") || lower.startsWith("search ")) {
      const query = lower.replace(/^search\s+(for\s+)?/, "").trim();
      const searchInput = findInputByLabel("search") || findInputByLabel("");
      if (searchInput) {
        searchInput.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(searchInput, query);
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          searchInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        showFeedback(`Searching for "${query}"`, true);
        return true;
      }
    }

    // "submit" / "submit form" / "send"
    if (lower === "submit" || lower === "submit form" || lower === "send" || lower === "send message") {
      // Try to find and click submit button
      const submit = findClickableByText("submit") || findClickableByText("send") || findClickableByText("save");
      if (submit) {
        submit.click();
        showFeedback("Form submitted", true);
        return true;
      }
      // Try pressing Enter on focused input
      const active = document.activeElement;
      if (active) {
        active.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        showFeedback("Submitted");
        return true;
      }
    }

    // ===== DIALOG / MODAL =====
    if (lower.includes("close dialog") || lower.includes("close modal") || lower.includes("close popup") || lower === "dismiss" || lower === "cancel") {
      findAndCloseDialog();
      showFeedback("Dialog closed");
      return true;
    }

    // ===== BACK / FORWARD =====
    if (lower.includes("go back") || lower === "back" || lower === "previous page") {
      window.history.back();
      showFeedback("Going back...", true);
      return true;
    }
    if (lower.includes("go forward") || lower === "forward" || lower === "next page") {
      window.history.forward();
      showFeedback("Going forward...");
      return true;
    }

    // ===== THEME =====
    if (lower.includes("dark mode")) {
      document.documentElement.classList.add("dark");
      showFeedback("Dark mode activated", true);
      return true;
    }
    if (lower.includes("light mode")) {
      document.documentElement.classList.remove("dark");
      showFeedback("Light mode activated", true);
      return true;
    }
    if (lower.includes("toggle theme")) {
      document.documentElement.classList.toggle("dark");
      showFeedback("Theme toggled");
      return true;
    }

    // ===== ZOOM =====
    if (lower.includes("zoom in")) {
      zoomRef.current = Math.min(zoomRef.current + 10, 200);
      document.body.style.zoom = `${zoomRef.current}%`;
      showFeedback(`Zoom ${zoomRef.current}%`);
      return true;
    }
    if (lower.includes("zoom out")) {
      zoomRef.current = Math.max(zoomRef.current - 10, 50);
      document.body.style.zoom = `${zoomRef.current}%`;
      showFeedback(`Zoom ${zoomRef.current}%`);
      return true;
    }
    if (lower.includes("reset zoom") || lower.includes("normal zoom")) {
      zoomRef.current = 100;
      document.body.style.zoom = "100%";
      showFeedback("Zoom reset to 100%");
      return true;
    }

    // ===== FULLSCREEN =====
    if (lower.includes("fullscreen") || lower.includes("full screen")) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        showFeedback("Fullscreen mode");
      } else {
        document.exitFullscreen?.();
        showFeedback("Exited fullscreen");
      }
      return true;
    }

    // ===== PAGE ACTIONS =====
    if (lower.includes("refresh") || lower.includes("reload")) {
      showFeedback("Refreshing...", true);
      setTimeout(() => window.location.reload(), 500);
      return true;
    }
    if (lower.includes("copy url") || lower.includes("copy link") || lower.includes("copy page url")) {
      navigator.clipboard?.writeText(window.location.href);
      showFeedback("URL copied to clipboard", true);
      return true;
    }
    if (lower === "select all") {
      document.execCommand("selectAll");
      showFeedback("All selected");
      return true;
    }

    // ===== READ PAGE =====
    if (lower.includes("read page") || lower.includes("read this") || lower.includes("read aloud")) {
      const main = document.querySelector("main") || document.querySelector("[role='main']") || document.body;
      const text = main.textContent?.slice(0, 500) || "";
      speak(text);
      showFeedback("Reading page...");
      return true;
    }
    if (lower === "stop reading" || lower === "stop speaking") {
      window.speechSynthesis?.cancel();
      showFeedback("Stopped reading");
      return true;
    }

    // ===== TAB-LIKE NAVIGATION =====
    if (lower === "next" || lower === "next item" || lower === "tab") {
      const focusable = document.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      const current = document.activeElement;
      const arr = Array.from(focusable).filter(isVisible);
      const idx = arr.indexOf(current as HTMLElement);
      const next = arr[(idx + 1) % arr.length];
      if (next) {
        next.focus();
        next.scrollIntoView({ behavior: "smooth", block: "center" });
        showFeedback(`Focused: ${next.textContent?.slice(0, 30) || next.tagName}`);
      }
      return true;
    }
    if (lower === "previous" || lower === "previous item") {
      const focusable = document.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      const arr = Array.from(focusable).filter(isVisible);
      const idx = arr.indexOf(document.activeElement as HTMLElement);
      const prev = arr[(idx - 1 + arr.length) % arr.length];
      if (prev) {
        prev.focus();
        prev.scrollIntoView({ behavior: "smooth", block: "center" });
        showFeedback(`Focused: ${prev.textContent?.slice(0, 30) || prev.tagName}`);
      }
      return true;
    }

    // ===== KEYBOARD SHORTCUTS =====
    if (lower.includes("open command") || lower.includes("command palette")) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
      showFeedback("Opening command palette...");
      return true;
    }
    if (lower.includes("open voice") || lower.includes("voice chat") || lower.includes("shadowtalk live")) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "L", shiftKey: true, bubbles: true }));
      showFeedback("Opening ShadowTalk Live...");
      return true;
    }

    // ===== HELP =====
    if (lower === "help" || lower === "what can you do" || lower === "show commands" || lower.includes("voice help")) {
      setShowAllCommands(true);
      showFeedback("Here are all available commands", true);
      return true;
    }

    // ===== STOP =====
    if (lower === "stop" || lower === "stop listening" || lower === "close" || lower === "deactivate") {
      setIsActive(false);
      showFeedback("Voice control stopped", true);
      return true;
    }

    showFeedback(`"${text}" — say "help" for commands`);
    return false;
  }, [navigate, location.pathname, showFeedback, addToHistory]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support voice recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);
      
      if (finalTranscript) {
        processCommand(finalTranscript);
        setTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice commands.",
          variant: "destructive",
        });
        setIsActive(false);
      }
      if (event.error === "no-speech" || event.error === "aborted" || event.error === "network") {
        // Use ref to check active state (avoids stale closure)
        setTimeout(() => {
          if (isActiveRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch {}
          }
        }, 300);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Use ref to avoid stale closure — always restart if still active
      setTimeout(() => {
        if (isActiveRef.current) {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            } else {
              // Recognition was destroyed, recreate
              startListening();
            }
          } catch {}
        }
      }, 200);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setIsActive(true);
      showFeedback("Listening... Say a command!", true);
    } catch (err) {
      console.error("Voice recognition error:", err);
    }
  }, [isActive, processCommand, toast, showFeedback]);

  const stopListening = useCallback(() => {
    setIsActive(false);
    setIsListening(false);
    setTranscript("");
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (isActive) {
      stopListening();
    } else {
      startListening();
    }
  }, [isActive, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isActive && !recognitionRef.current) {
      startListening();
    }
  }, [isActive, startListening]);

  return (
    <>
      {/* Floating Voice Button */}
      <motion.button
        onClick={toggleVoice}
        className={cn(
          "fixed bottom-8 left-8 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          isActive
            ? "bg-destructive text-destructive-foreground shadow-destructive/30"
            : "bg-primary text-primary-foreground shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={isActive ? "Stop voice control" : "Start voice control (control entire website)"}
      >
        {isActive ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <MicOff className="h-6 w-6" />
          </motion.div>
        ) : (
          <Mic className="h-6 w-6" />
        )}
        
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-destructive/50"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-destructive/30"
              animate={{ scale: [1, 2], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
      </motion.button>

      {/* Active Voice HUD */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-8 z-50 w-80 max-w-[calc(100vw-4rem)]"
          >
            <div className="bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/30">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-destructive"
                  />
                  <span className="text-sm font-medium">Voice Control Active</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                    Full Control
                  </span>
                </div>
                <button
                  onClick={stopListening}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Waveform visualizer */}
              <div className="px-4 py-3 flex items-center gap-0.5 justify-center h-12">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-primary"
                    animate={{
                      height: isListening 
                        ? [3, Math.random() * 28 + 3, 3]
                        : 3,
                    }}
                    transition={{
                      duration: 0.3 + Math.random() * 0.3,
                      repeat: Infinity,
                      delay: i * 0.03,
                    }}
                  />
                ))}
              </div>

              {/* Transcript */}
              <div className="px-4 py-2 min-h-[2rem]">
                {transcript ? (
                  <p className="text-sm text-foreground italic">"{transcript}"</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Say anything — navigate, click buttons, type, search, scroll, zoom...
                  </p>
                )}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 border-t border-border/30 bg-primary/5"
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-3 w-3 text-primary shrink-0" />
                      <p className="text-xs font-medium text-primary">{feedback}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Command History */}
              {commandHistory.length > 0 && !showAllCommands && (
                <div className="px-4 py-1.5 border-t border-border/30">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Recent</p>
                  <div className="flex flex-wrap gap-1">
                    {commandHistory.slice(0, 3).map((cmd, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground truncate max-w-[120px]">
                        {cmd}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Commands / All Commands */}
              <div className="border-t border-border/30">
                <button
                  onClick={() => setShowAllCommands(!showAllCommands)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider hover:bg-muted/30 transition-colors"
                >
                  <span>{showAllCommands ? "All Voice Commands" : "Quick Commands"}</span>
                  {showAllCommands ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                
                <AnimatePresence>
                  {showAllCommands ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="max-h-60 overflow-y-auto px-4 pb-3 space-y-2"
                    >
                      {COMMAND_CATEGORIES.map((cat) => (
                        <div key={cat.label}>
                          <p className="text-[10px] font-semibold text-foreground mb-1">{cat.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {cat.commands.map((cmd) => (
                              <span
                                key={cmd}
                                className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/30"
                              >
                                {cmd}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div className="px-4 pb-3">
                      <div className="flex flex-wrap gap-1">
                        {["Click [button]", "Type [text]", "Scroll down", "Open [page]", "Help"].map((cmd) => (
                          <span
                            key={cmd}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
                          >
                            {cmd}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceCommandSystem;
