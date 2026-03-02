import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, Command } from "lucide-react";
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

// Special voice commands
const SCROLL_COMMANDS = ["scroll down", "scroll up", "go to top", "go to bottom"];
const BACK_COMMANDS = ["go back", "back", "previous page"];
const THEME_COMMANDS = ["dark mode", "light mode", "toggle theme"];

const VoiceCommandSystem: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pulseLevel, setPulseLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(""), 3000);
  }, []);

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();

    // Navigation commands: "open X", "go to X", "launch X", "navigate to X"
    const navPrefixes = ["open ", "go to ", "launch ", "navigate to ", "take me to ", "show me ", "switch to "];
    let target = lower;
    for (const prefix of navPrefixes) {
      if (lower.startsWith(prefix)) {
        target = lower.slice(prefix.length).trim();
        break;
      }
    }

    // Match route
    for (const route of VOICE_ROUTES) {
      for (const name of route.names) {
        if (target === name || target.includes(name)) {
          if (location.pathname !== route.path) {
            navigate(route.path);
            showFeedback(`Opening ${route.names[0]}...`);
            return true;
          } else {
            showFeedback(`Already on ${route.names[0]}`);
            return true;
          }
        }
      }
    }

    // Scroll commands
    if (lower.includes("scroll down")) {
      window.scrollBy({ top: 400, behavior: "smooth" });
      showFeedback("Scrolling down...");
      return true;
    }
    if (lower.includes("scroll up")) {
      window.scrollBy({ top: -400, behavior: "smooth" });
      showFeedback("Scrolling up...");
      return true;
    }
    if (lower.includes("go to top") || lower.includes("scroll to top")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showFeedback("Going to top...");
      return true;
    }
    if (lower.includes("go to bottom") || lower.includes("scroll to bottom")) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      showFeedback("Going to bottom...");
      return true;
    }

    // Back command
    if (BACK_COMMANDS.some(cmd => lower.includes(cmd))) {
      window.history.back();
      showFeedback("Going back...");
      return true;
    }

    // Theme toggle
    if (lower.includes("dark mode")) {
      document.documentElement.classList.add("dark");
      showFeedback("Dark mode activated");
      return true;
    }
    if (lower.includes("light mode")) {
      document.documentElement.classList.remove("dark");
      showFeedback("Light mode activated");
      return true;
    }

    // Stop listening
    if (lower === "stop" || lower === "stop listening" || lower === "close") {
      setIsActive(false);
      showFeedback("Voice control stopped");
      return true;
    }

    showFeedback(`"${text}" — command not recognized`);
    return false;
  }, [navigate, location.pathname, showFeedback]);

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
      
      // Simulate pulse from audio
      setPulseLevel(Math.random() * 100);
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
      // Auto-restart on non-fatal errors
      if (event.error === "no-speech" || event.error === "aborted") {
        if (isActive) {
          try { recognition.start(); } catch {}
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still active
      if (isActive) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setIsActive(true);
      showFeedback("Listening... Say a command!");
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Restart recognition when isActive changes
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
        title={isActive ? "Stop voice control" : "Start voice control"}
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
        
        {/* Pulse rings when active */}
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
                </div>
                <button
                  onClick={stopListening}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Waveform visualizer */}
              <div className="px-4 py-3 flex items-center gap-1 justify-center h-12">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-primary"
                    animate={{
                      height: isListening 
                        ? [4, Math.random() * 24 + 4, 4]
                        : 4,
                    }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.3,
                      repeat: Infinity,
                      delay: i * 0.05,
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
                    Try: "Open chatbot", "Go to pricing", "Scroll down"...
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

              {/* Quick Commands */}
              <div className="px-4 py-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Quick Commands</p>
                <div className="flex flex-wrap gap-1">
                  {["Open chatbot", "Go back", "Scroll down", "Stop"].map((cmd) => (
                    <span
                      key={cmd}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
                    >
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceCommandSystem;
