import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mic, MicOff, Volume2, VolumeX,
  Phone, PhoneOff, MessageSquare, Sparkles, Loader2, AudioLines, AlertCircle,
  Download, Zap, Shield, Clock, Waves, Radio, Settings2, ChevronRight, Signal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useConversation } from "@elevenlabs/react";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AURORA NEBULA VISUALIZER — Legendary Cinematic Core
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const AuroraVisualizer: React.FC<{ isActive: boolean; isSpeaking: boolean }> = ({ isActive, isSpeaking }) => {
  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
      
      {/* Aurora backdrop layers */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          background: isSpeaking
            ? [
                "radial-gradient(circle, hsla(280,90%,50%,0.15) 0%, transparent 70%)",
                "radial-gradient(circle, hsla(320,90%,50%,0.2) 0%, transparent 70%)",
                "radial-gradient(circle, hsla(280,90%,50%,0.15) 0%, transparent 70%)",
              ]
            : "radial-gradient(circle, hsla(260,60%,40%,0.08) 0%, transparent 70%)",
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Nebula cloud particles */}
      {isActive && Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 2;
        const radius = 90 + Math.sin(i * 0.7) * 40;
        const size = 1 + Math.random() * 2;
        const hue = isSpeaking ? 310 + i * 3 : 260 + i * 2;
        return (
          <motion.div
            key={`nebula-${i}`}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: `hsla(${hue}, 80%, 70%, 0.6)`,
              filter: `blur(${size > 2 ? 1 : 0}px)`,
            }}
            animate={{
              x: [
                Math.cos(angle) * radius * 0.3,
                Math.cos(angle + 0.5) * radius,
                Math.cos(angle + 1) * radius * 0.5,
                Math.cos(angle) * radius * 0.3,
              ],
              y: [
                Math.sin(angle) * radius * 0.3,
                Math.sin(angle + 0.5) * radius,
                Math.sin(angle + 1) * radius * 0.5,
                Math.sin(angle) * radius * 0.3,
              ],
              opacity: [0, 0.8, 0.4, 0],
              scale: [0.5, 1.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + i * 0.1,
              repeat: Infinity,
              delay: i * 0.08,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Orbital rings — 5 rings with varying angles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`orbital-${i}`}
          className="absolute rounded-full border"
          style={{
            width: 120 + i * 30,
            height: 120 + i * 30,
            borderColor: isSpeaking
              ? `hsla(${300 + i * 15}, 80%, 65%, ${0.35 - i * 0.06})`
              : `hsla(${260 + i * 10}, 60%, 50%, ${0.15 - i * 0.02})`,
            transform: `rotateX(${60 + i * 5}deg) rotateZ(${i * 30}deg)`,
          }}
          animate={{
            rotate: [0, i % 2 === 0 ? 360 : -360],
            scale: isSpeaking ? [1, 1.06, 1] : [1, 1.02, 1],
          }}
          transition={{
            rotate: { duration: 6 + i * 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {/* Orbiting dot */}
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full -top-[3px] left-1/2 -ml-[3px]"
            style={{
              background: `hsl(${300 + i * 15}, 90%, 70%)`,
              boxShadow: `0 0 12px hsl(${300 + i * 15}, 90%, 70%), 0 0 24px hsl(${300 + i * 15}, 80%, 60%)`,
            }}
          />
        </motion.div>
      ))}

      {/* Pulsing energy waves — expand outward when speaking */}
      {isSpeaking && Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute rounded-full border border-fuchsia-400/20"
          style={{ width: 110, height: 110 }}
          animate={{
            scale: [1, 2.5],
            opacity: [0.4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Core orb — multi-layered with depth */}
      <motion.div
        className="relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center"
        animate={{
          scale: isSpeaking ? [1, 1.08, 1] : [1, 1.03, 1],
        }}
        transition={{ duration: isSpeaking ? 0.6 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow corona */}
        <motion.div
          className="absolute -inset-6 rounded-full blur-2xl"
          animate={{
            opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: isSpeaking
              ? "radial-gradient(circle, hsla(310,90%,60%,0.5) 0%, hsla(280,80%,40%,0.2) 50%, transparent 100%)"
              : "radial-gradient(circle, hsla(260,70%,50%,0.3) 0%, hsla(260,60%,30%,0.1) 50%, transparent 100%)",
          }}
        />

        {/* Inner glow */}
        <div
          className={cn(
            "absolute -inset-2 rounded-full blur-xl transition-all duration-700",
            isSpeaking
              ? "bg-gradient-to-br from-fuchsia-500/40 via-rose-500/30 to-violet-500/40"
              : "bg-gradient-to-br from-violet-500/25 to-purple-500/25"
          )}
        />

        {/* Glass surface */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-700 shadow-2xl overflow-hidden",
            isSpeaking
              ? "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500"
              : "bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-500"
          )}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            animate={{ x: ["-150%", "150%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          />

          {/* Specular highlight */}
          <div className="absolute top-2 left-4 w-12 h-6 bg-white/15 rounded-full blur-md" />
        </div>

        {/* Center icon */}
        <div className="relative z-10">
          {isSpeaking ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <AudioLines className="h-12 w-12 md:h-14 md:w-14 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
            </motion.div>
          ) : isActive ? (
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Waves className="h-12 w-12 md:h-14 md:w-14 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-12 w-12 md:h-14 md:w-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SPECTRAL WAVEFORM — 48-bar HD equalizer
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const SpectralWaveform: React.FC<{ isActive: boolean; isSpeaking: boolean }> = ({ isActive, isSpeaking }) => {
  const barCount = 48;
  return (
    <div className="flex items-end justify-center gap-[2px] h-16 w-full max-w-sm mx-auto px-4">
      {Array.from({ length: barCount }).map((_, i) => {
        const center = barCount / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const maxH = (1 - distFromCenter * 0.7) * 55;
        const hue = isSpeaking ? 310 + (i / barCount) * 40 : 260 + (i / barCount) * 30;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 3,
              background: `linear-gradient(to top, hsla(${hue}, 80%, 55%, 0.8), hsla(${hue + 20}, 90%, 75%, 0.6))`,
            }}
            animate={
              isActive
                ? { height: [3, maxH, 5, maxH * 0.7, 3] }
                : { height: 3 }
            }
            transition={{
              duration: 0.8 + Math.sin(i * 0.3) * 0.3,
              repeat: isActive ? Infinity : 0,
              delay: i * 0.015,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface ShadowTalkLiveProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (content: string) => void;
  autoConnect?: boolean;
  onSessionEnd?: (transcriptMarkdown: string) => void;
}

interface TranscriptItem {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  isInterrupted?: boolean;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const ShadowTalkLive = ({ isOpen, onClose, onInsertToChat, autoConnect = false, onSessionEnd }: ShadowTalkLiveProps) => {
  const { toast } = useToast();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentUserSpeech, setCurrentUserSpeech] = useState("");
  const [currentAgentSpeech, setCurrentAgentSpeech] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [canInterrupt, setCanInterrupt] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const lastUserTranscriptRef = useRef<string>("");
  const lastAgentResponseRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setConnectionError(null);
      toast({ title: "🎙️ Connected", description: "ShadowTalk Live is ready — speak naturally" });
    },
    onDisconnect: () => {
      setCurrentUserSpeech("");
      setCurrentAgentSpeech("");
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onMessage: (message: unknown) => {
      const msg = message as Record<string, unknown>;
      const msgType = msg?.type as string | undefined;

      if (msgType === "user_transcript") {
        const event = msg?.user_transcription_event as Record<string, unknown> | undefined;
        const userText = event?.user_transcript as string | undefined;
        if (userText && userText !== lastUserTranscriptRef.current) {
          lastUserTranscriptRef.current = userText;
          setCurrentUserSpeech("");
          setTranscript(prev => [...prev, { id: crypto.randomUUID(), role: "user", text: userText, timestamp: new Date() }]);
        }
      } else if (msgType === "agent_response") {
        const event = msg?.agent_response_event as Record<string, unknown> | undefined;
        const agentText = event?.agent_response as string | undefined;
        if (agentText && agentText !== lastAgentResponseRef.current) {
          lastAgentResponseRef.current = agentText;
          setCurrentAgentSpeech("");
          setTranscript(prev => [...prev, { id: crypto.randomUUID(), role: "ai", text: agentText, timestamp: new Date() }]);
        }
      } else if (msgType === "agent_response_correction") {
        const event = msg?.agent_response_correction_event as Record<string, unknown> | undefined;
        const correctedText = event?.corrected_agent_response as string | undefined;
        if (correctedText) {
          setTranscript(prev => {
            const updated = [...prev];
            const lastAI = updated.filter(t => t.role === "ai").pop();
            if (lastAI) { lastAI.text = correctedText; lastAI.isInterrupted = true; }
            return updated;
          });
        }
      }
    },
    onError: (error: unknown) => {
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : "Connection error occurred";
      setConnectionError(errorMsg);
      toast({ title: "Voice Error", description: errorMsg, variant: "destructive" });
    },
  });

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const isConnectedRef = useRef(false);
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;
  isConnectedRef.current = isConnected;

  // Timer
  useEffect(() => {
    if (isConnected) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isConnected]);

  // Auto-scroll transcript
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        try { conversationRef.current.endSession(); } catch { /* */ }
      }
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const startConnection = useCallback(async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (error) throw new Error(error.message || "Failed to get conversation token");
      if (!data?.token) throw new Error(data?.error || "No token received.");
      await conversation.startSession({ conversationToken: data.token, connectionType: "webrtc" });
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Could not start voice session");
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not start voice session",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, isConnected, isConnecting, toast]);

  useEffect(() => {
    if (isOpen && autoConnect && !isConnected && !isConnecting) {
      void startConnection();
    }
  }, [isOpen, autoConnect, isConnected, isConnecting, startConnection]);

  const endConnection = useCallback(async () => {
    try { await conversation.endSession(); } catch { /* */ }
    setTranscript([]);
    lastUserTranscriptRef.current = "";
    lastAgentResponseRef.current = "";
    toast({ title: "Session ended" });
  }, [conversation, toast]);

  const toggleMic = useCallback(() => setIsMicOn(v => !v), []);

  const toggleSpeaker = useCallback(async () => {
    const newValue = !isSpeakerOn;
    setIsSpeakerOn(newValue);
    try { await conversation.setVolume({ volume: newValue ? 1 : 0 }); } catch { /* */ }
  }, [isSpeakerOn, conversation]);

  const buildTranscriptMarkdown = useCallback(() => {
    if (transcript.length === 0) return "";
    const content = transcript
      .map(
        (t) =>
          `[${t.timestamp.toLocaleTimeString()}] **${t.role === "user" ? "You" : "ShadowTalk"}:** ${t.text}`
      )
      .join("\n\n");
    return `## 🎙️ ShadowTalk Live Transcript\n\n${content}`;
  }, [transcript]);

  const exportTranscript = () => {
    const md = buildTranscriptMarkdown();
    if (!md) return;
    if (onInsertToChat) {
      onInsertToChat(md);
      toast({ title: "Transcript added to chat" });
    }
  };

  const handleClose = useCallback(() => {
    const md = buildTranscriptMarkdown();
    if (md && onSessionEnd) onSessionEnd(md);
    else if (md && onInsertToChat) onInsertToChat(md);
    if (isConnected) {
      try {
        void conversation.endSession();
      } catch {
        /* ignore */
      }
    }
    setTranscript([]);
    lastUserTranscriptRef.current = "";
    lastAgentResponseRef.current = "";
    onClose();
  }, [buildTranscriptMarkdown, isConnected, conversation, onClose, onInsertToChat, onSessionEnd]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50"
      >
        {/* ── Cinematic Background ────────────────────── */}
        <div className="absolute inset-0 bg-[#060610]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,_hsla(270,80%,20%,0.25)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,_hsla(300,60%,15%,0.15)_0%,_transparent_60%)]" />
        
        {/* Floating ambient particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`ambient-${i}`}
            className="absolute w-1 h-1 rounded-full bg-violet-400/20"
            style={{
              left: `${10 + (i * 6) % 80}%`,
              top: `${5 + (i * 7) % 90}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(hsla(0,0%,100%,0.08) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.08) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <div className="relative h-full flex flex-col">
          {/* ━━━━━ HEADER ━━━━━ */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
            className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-white/[0.01] backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 flex items-center justify-center shadow-xl shadow-violet-500/25"
                  animate={isConnected ? { boxShadow: ["0 10px 25px -5px hsla(270,80%,50%,0.2)", "0 10px 25px -5px hsla(310,80%,50%,0.3)", "0 10px 25px -5px hsla(270,80%,50%,0.2)"] } : {}}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Zap className="h-5 w-5 text-white" />
                </motion.div>
                {isConnected && (
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#060610]"
                    animate={{ scale: [1, 1.3, 1], boxShadow: ["0 0 0 0 hsla(155,70%,55%,0.4)", "0 0 0 6px hsla(155,70%,55%,0)", "0 0 0 0 hsla(155,70%,55%,0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <h2 className="font-bold text-white/90 text-lg tracking-tight">ShadowTalk Live</h2>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors duration-500",
                    isConnected ? "bg-emerald-400 shadow-[0_0_8px_hsla(155,70%,55%,0.5)]" 
                      : isConnecting ? "bg-amber-400 animate-pulse" 
                      : "bg-white/15"
                  )} />
                  <span className="text-[11px] text-white/35 font-medium">
                    {isConnecting ? "Initializing..." : isConnected ? "Live Session" : "Ready"}
                  </span>
                  {isConnected && (
                    <>
                      <span className="text-white/10">·</span>
                      <span className="text-[11px] text-white/25 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(elapsed)}
                      </span>
                      <span className="text-white/10">·</span>
                      <span className="text-[11px] text-emerald-400/50 flex items-center gap-1">
                        <Signal className="h-3 w-3" />
                        WebRTC
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportTranscript}
                  className="text-white/30 hover:text-white hover:bg-white/[0.04] gap-2 text-xs rounded-xl h-9 px-3"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white/20 hover:text-white hover:bg-white/[0.04] rounded-xl w-9 h-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* ━━━━━ MAIN CONTENT ━━━━━ */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center: Visualization */}
            <div className="flex-1 flex items-center justify-center relative">
              {!isConnected ? (
                /* ── START SCREEN ────────────────────────── */
                <motion.div
                  className="text-center max-w-lg px-6"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", damping: 22 }}
                >
                  <div className="flex justify-center mb-10">
                    <AuroraVisualizer isActive={false} isSpeaking={false} />
                  </div>

                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-white mb-4 tracking-tight"
                  >
                    Start a Live Session
                  </motion.h3>
                  <motion.p
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/30 mb-3 text-sm leading-relaxed max-w-xs mx-auto"
                  >
                    Real-time voice interaction with neural synthesis. Speak naturally, interrupt anytime.
                  </motion.p>

                  {/* Premium feature chips */}
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-10 mt-5"
                  >
                    {[
                      { icon: Zap, label: "Ultra-Low Latency", color: "text-amber-400/60" },
                      { icon: Shield, label: "E2E Encrypted", color: "text-emerald-400/60" },
                      { icon: Radio, label: "Neural HD Voice", color: "text-violet-400/60" },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
                        <Icon className={cn("h-3 w-3", color)} />
                        <span className="text-[10px] text-white/35 font-medium">{label}</span>
                      </div>
                    ))}
                  </motion.div>

                  {connectionError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-2xl bg-red-500/8 border border-red-500/15 text-left backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-red-300 font-medium">Connection Error</p>
                          <p className="text-xs text-red-400/50 mt-1">{connectionError}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Start button — legendary */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      size="lg"
                      onClick={startConnection}
                      disabled={isConnecting}
                      className="relative gap-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-500 shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 px-10 h-14 text-sm font-semibold rounded-2xl border-0 transition-all duration-300 hover:scale-105 active:scale-95 group"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                          animate={{ x: ["-200%", "200%"] }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        />
                      </div>
                      {isConnecting ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Initializing...</>
                      ) : (
                        <><Phone className="h-5 w-5 group-hover:rotate-12 transition-transform" /> Begin Session</>
                      )}
                    </Button>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-white/12 text-[10px] mt-5 font-mono"
                  >
                    Shift+L to toggle · Esc to close
                  </motion.p>
                </motion.div>
              ) : (
                /* ── CONNECTED VISUALIZER ─────────────────── */
                <motion.div
                  className="flex flex-col items-center gap-6 w-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 20 }}
                >
                  <AuroraVisualizer isActive={isConnected} isSpeaking={isSpeaking} />

                  {/* Status label */}
                  <motion.div className="text-center">
                    <motion.p
                      className={cn(
                        "text-base font-semibold tracking-wide",
                        isSpeaking ? "text-fuchsia-400" : "text-violet-400/70"
                      )}
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isSpeaking ? "✦ Speaking" : "⦿ Listening"}
                    </motion.p>
                    <p className="text-[11px] text-white/15 mt-1 font-mono">
                      {canInterrupt ? "interrupt anytime" : "processing..."}
                    </p>
                  </motion.div>

                  {/* Spectral waveform */}
                  <div className="w-full px-8 md:px-16">
                    <SpectralWaveform isActive={isSpeaking || !!currentUserSpeech} isSpeaking={isSpeaking} />
                  </div>

                  {/* Live speech bubble */}
                  <AnimatePresence>
                    {currentUserSpeech && (
                      <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="max-w-md"
                      >
                        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl px-5 py-3 text-white/75 text-sm border border-white/[0.06] shadow-xl shadow-violet-500/5">
                          <span className="text-violet-400/80 mr-2 text-[11px] font-semibold uppercase tracking-wider">You</span>
                          {currentUserSpeech}
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-violet-400 ml-0.5"
                          >
                            ▊
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* ━━━━━ TRANSCRIPT PANEL ━━━━━ */}
            <AnimatePresence>
              {isConnected && showTranscript && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 28, stiffness: 200 }}
                  className="border-l border-white/[0.04] flex flex-col bg-white/[0.01] backdrop-blur-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-white/25" />
                      <h3 className="text-sm font-semibold text-white/60">Transcript</h3>
                      {transcript.length > 0 && (
                        <span className="text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-md font-mono">
                          {transcript.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-white/20">Auto-interrupt</span>
                      <Switch
                        checked={canInterrupt}
                        onCheckedChange={setCanInterrupt}
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2.5">
                      {transcript.length === 0 ? (
                        <div className="text-center py-16">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Mic className="h-10 w-10 text-white/[0.06] mx-auto mb-4" />
                          </motion.div>
                          <p className="text-white/15 text-sm font-medium">Start speaking...</p>
                          <p className="text-white/[0.08] text-xs mt-1.5">Your conversation will appear here</p>
                        </div>
                      ) : (
                        transcript.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: item.role === "user" ? 16 : -16, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 25 }}
                            className={cn(
                              "rounded-2xl p-3.5 transition-all duration-300",
                              item.role === "user"
                                ? "bg-violet-500/8 border border-violet-500/10 ml-6"
                                : "bg-white/[0.03] border border-white/[0.05] mr-6"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center",
                                item.role === "user"
                                  ? "bg-violet-500/15 text-violet-400"
                                  : "bg-gradient-to-br from-fuchsia-500/20 to-rose-500/20 text-fuchsia-400"
                              )}>
                                {item.role === "user"
                                  ? <Mic className="h-3 w-3" />
                                  : <Sparkles className="h-3 w-3" />
                                }
                              </div>
                              <span className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                                {item.role === "user" ? "You" : "ShadowTalk"}
                              </span>
                              <span className="text-[10px] text-white/10 ml-auto font-mono">
                                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              {item.isInterrupted && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-400/60 border-amber-400/15 rounded-md">
                                  interrupted
                                </Badge>
                              )}
                            </div>
                            <p className="text-[13px] text-white/65 leading-relaxed pl-8">{item.text}</p>
                          </motion.div>
                        ))
                      )}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ━━━━━ BOTTOM CONTROLS ━━━━━ */}
          {isConnected && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", damping: 22 }}
              className="px-6 py-5 border-t border-white/[0.04] bg-white/[0.01] backdrop-blur-xl"
            >
              <div className="flex items-center justify-center gap-3">
                {/* Mic button */}
                <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMic}
                    className={cn(
                      "w-14 h-14 rounded-2xl transition-all duration-300",
                      isMicOn
                        ? "bg-white/[0.05] hover:bg-white/[0.08] text-white/70 border border-white/[0.06]"
                        : "bg-red-500/15 hover:bg-red-500/25 text-red-400 ring-1 ring-red-500/25"
                    )}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </motion.div>

                {/* Speaker button */}
                <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSpeaker}
                    className={cn(
                      "w-14 h-14 rounded-2xl transition-all duration-300",
                      isSpeakerOn
                        ? "bg-white/[0.05] hover:bg-white/[0.08] text-white/70 border border-white/[0.06]"
                        : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 ring-1 ring-amber-500/25"
                    )}
                  >
                    {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </motion.div>

                {/* Transcript toggle */}
                <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className={cn(
                      "w-14 h-14 rounded-2xl transition-all duration-300",
                      showTranscript
                        ? "bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 ring-1 ring-violet-500/25"
                        : "bg-white/[0.05] hover:bg-white/[0.08] text-white/70 border border-white/[0.06]"
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </motion.div>

                {/* Separator */}
                <div className="w-px h-10 bg-white/[0.04] mx-2" />

                {/* End call — premium red */}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.08 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={endConnection}
                    className="w-16 h-16 rounded-[20px] bg-red-500/12 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/15 transition-all duration-300 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
