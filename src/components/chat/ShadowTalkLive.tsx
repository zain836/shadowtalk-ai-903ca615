import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mic, MicOff, Volume2, VolumeX,
  Phone, PhoneOff, MessageSquare, Sparkles, Loader2, AudioLines, AlertCircle,
  Download, Zap, Shield, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useConversation } from "@elevenlabs/react";

/* ── Orbital Ring Visualizer ─────────────────────────────── */
const OrbitalVisualizer: React.FC<{ isActive: boolean; isSpeaking: boolean }> = ({ isActive, isSpeaking }) => {
  const ringCount = 3;
  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      {/* Particle field */}
      {isActive && Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute w-1 h-1 rounded-full bg-violet-400/60"
          animate={{
            x: [0, Math.cos(i * 0.3) * (80 + i * 3), 0],
            y: [0, Math.sin(i * 0.3) * (80 + i * 3), 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}

      {/* Orbital rings */}
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border"
          style={{
            width: 140 + i * 40,
            height: 140 + i * 40,
            borderColor: isSpeaking
              ? `hsla(${280 + i * 20}, 80%, 65%, ${0.4 - i * 0.1})`
              : `hsla(${260 + i * 15}, 60%, 50%, ${0.2 - i * 0.05})`,
          }}
          animate={{
            rotate: [0, i % 2 === 0 ? 360 : -360],
            scale: isSpeaking ? [1, 1.08, 1] : [1, 1.02, 1],
          }}
          transition={{
            rotate: { duration: 8 + i * 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {/* Ring dot */}
          <motion.div
            className="absolute w-2 h-2 rounded-full -top-1 left-1/2 -ml-1"
            style={{
              background: `hsl(${280 + i * 20}, 80%, 65%)`,
              boxShadow: `0 0 8px hsl(${280 + i * 20}, 80%, 65%)`,
            }}
          />
        </motion.div>
      ))}

      {/* Core orb */}
      <motion.div
        className="relative z-10 w-28 h-28 rounded-full flex items-center justify-center"
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : [1, 1.03, 1],
        }}
        transition={{ duration: isSpeaking ? 0.5 : 2.5, repeat: Infinity }}
      >
        {/* Glow layer */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-xl transition-all duration-500",
            isSpeaking
              ? "bg-gradient-to-br from-fuchsia-500/50 to-rose-500/50"
              : "bg-gradient-to-br from-violet-500/30 to-purple-500/30"
          )}
        />
        {/* Surface */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-500 shadow-2xl",
            isSpeaking
              ? "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500"
              : "bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-500"
          )}
        />
        {/* Icon */}
        <div className="relative z-10">
          {isSpeaking ? (
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
              <AudioLines className="h-12 w-12 text-white drop-shadow-lg" />
            </motion.div>
          ) : (
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Sparkles className="h-12 w-12 text-white drop-shadow-lg" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ── Waveform Bar Visualizer ─────────────────────────────── */
const WaveformBars: React.FC<{ isActive: boolean; isSpeaking: boolean }> = ({ isActive, isSpeaking }) => {
  const barCount = 32;
  return (
    <div className="flex items-end justify-center gap-[2px] h-12 w-full max-w-xs mx-auto">
      {Array.from({ length: barCount }).map((_, i) => {
        const center = barCount / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const maxH = (1 - distFromCenter * 0.6) * 40;
        return (
          <motion.div
            key={i}
            className={cn(
              "w-[3px] rounded-full",
              isSpeaking
                ? "bg-gradient-to-t from-fuchsia-500 to-pink-300"
                : "bg-gradient-to-t from-violet-500/60 to-violet-300/40"
            )}
            animate={
              isActive
                ? { height: [4, maxH, 6, maxH * 0.6, 4] }
                : { height: 4 }
            }
            transition={{
              duration: 0.9 + Math.random() * 0.3,
              repeat: isActive ? Infinity : 0,
              delay: i * 0.02,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

/* ── Types ────────────────────────────────────────────────── */
interface ShadowTalkLiveProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (content: string) => void;
}

interface TranscriptItem {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  isInterrupted?: boolean;
}

/* ── Main Component ──────────────────────────────────────── */
export const ShadowTalkLive = ({ isOpen, onClose, onInsertToChat }: ShadowTalkLiveProps) => {
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
      toast({ title: "Connected", description: "ShadowTalk Live is ready" });
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

  const startConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');
      if (error) throw new Error(error.message || "Failed to get conversation token");
      if (!data?.token) throw new Error(data?.error || "No token received.");
      await conversation.startSession({ conversationToken: data.token, connectionType: "webrtc" });
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Could not start voice session");
      toast({ title: "Connection Failed", description: error instanceof Error ? error.message : "Could not start voice session", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConnection = useCallback(async () => {
    try { await conversation.endSession(); } catch { /* */ }
    setTranscript([]);
    lastUserTranscriptRef.current = "";
    lastAgentResponseRef.current = "";
    toast({ title: "Disconnected" });
  }, [conversation, toast]);

  const toggleMic = useCallback(() => setIsMicOn(v => !v), []);

  const toggleSpeaker = useCallback(async () => {
    const newValue = !isSpeakerOn;
    setIsSpeakerOn(newValue);
    try { await conversation.setVolume({ volume: newValue ? 1 : 0 }); } catch { /* */ }
  }, [isSpeakerOn, conversation]);

  const exportTranscript = () => {
    if (transcript.length === 0) return;
    const content = transcript.map(t =>
      `[${t.timestamp.toLocaleTimeString()}] ${t.role === 'user' ? 'You' : 'ShadowTalk'}: ${t.text}`
    ).join('\n\n');
    if (onInsertToChat) {
      onInsertToChat(`## ShadowTalk Live Transcript\n\n${content}`);
      toast({ title: "Transcript exported to chat" });
    }
  };

  const handleClose = useCallback(() => {
    if (isConnected) conversation.endSession();
    onClose();
  }, [isConnected, conversation, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Cinematic background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#0d0b1a] to-[#090814]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsla(270,60%,30%,0.15)_0%,_transparent_70%)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsla(0,0%,100%,0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="relative h-full flex flex-col">
          {/* ── Header ────────────────────────────────────── */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                {isConnected && (
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0a12]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-white/90 text-lg tracking-tight">ShadowTalk Live</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isConnected ? "bg-emerald-400" : isConnecting ? "bg-amber-400 animate-pulse" : "bg-white/20"
                  )} />
                  <span className="text-xs text-white/40">
                    {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Ready"}
                  </span>
                  {isConnected && (
                    <>
                      <span className="text-white/10">·</span>
                      <span className="text-xs text-white/30 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(elapsed)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportTranscript}
                  className="text-white/40 hover:text-white hover:bg-white/5 gap-2 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white/30 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* ── Main Content ──────────────────────────────── */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center: Visualization */}
            <div className="flex-1 flex items-center justify-center relative">
              {!isConnected ? (
                /* ── Start Screen ──────────────────────────── */
                <motion.div
                  className="text-center max-w-lg px-6"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 20 }}
                >
                  {/* Idle orbital */}
                  <div className="flex justify-center mb-8">
                    <OrbitalVisualizer isActive={false} isSpeaking={false} />
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                    Start a Live Conversation
                  </h3>
                  <p className="text-white/40 mb-2 text-sm leading-relaxed max-w-sm mx-auto">
                    Real-time voice powered by neural synthesis. Speak naturally, interrupt anytime.
                  </p>

                  {/* Feature badges */}
                  <div className="flex items-center justify-center gap-3 mb-8 mt-4">
                    {[
                      { icon: Zap, label: "Low Latency" },
                      { icon: Shield, label: "Private" },
                      { icon: AudioLines, label: "HD Voice" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                        <Icon className="h-3 w-3 text-violet-400" />
                        <span className="text-[11px] text-white/50">{label}</span>
                      </div>
                    ))}
                  </div>

                  {connectionError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-red-300 font-medium">Connection Error</p>
                          <p className="text-xs text-red-400/60 mt-1">{connectionError}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    size="lg"
                    onClick={startConnection}
                    disabled={isConnecting}
                    className="gap-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-500/20 px-8 h-12 text-sm font-medium rounded-xl border-0"
                  >
                    {isConnecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
                    ) : (
                      <><Phone className="h-4 w-4" /> Begin Session</>
                    )}
                  </Button>

                  <p className="text-white/20 text-[10px] mt-4">Press Shift+L to toggle · Esc to close</p>
                </motion.div>
              ) : (
                /* ── Connected Visualizer ─────────────────── */
                <motion.div
                  className="flex flex-col items-center gap-6 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <OrbitalVisualizer isActive={isConnected} isSpeaking={isSpeaking} />

                  {/* Status label */}
                  <motion.div
                    className="text-center"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <p className={cn(
                      "text-sm font-medium tracking-wide",
                      isSpeaking ? "text-fuchsia-400" : "text-violet-400/80"
                    )}>
                      {isSpeaking ? "Speaking" : "Listening"}
                    </p>
                    <p className="text-[11px] text-white/20 mt-1">
                      {canInterrupt ? "Interrupt anytime" : "Processing..."}
                    </p>
                  </motion.div>

                  {/* Waveform */}
                  <div className="w-full px-12">
                    <WaveformBars isActive={isSpeaking || !!currentUserSpeech} isSpeaking={isSpeaking} />
                  </div>

                  {/* Live speech bubble */}
                  <AnimatePresence>
                    {currentUserSpeech && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="max-w-md"
                      >
                        <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl px-5 py-3 text-white/80 text-sm border border-white/[0.08]">
                          <span className="text-violet-400 mr-2 text-xs font-medium">You</span>
                          {currentUserSpeech}
                          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-violet-400">|</motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* ── Transcript Panel ────────────────────────── */}
            <AnimatePresence>
              {isConnected && showTranscript && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="border-l border-white/[0.06] flex flex-col bg-white/[0.02] overflow-hidden"
                >
                  <div className="p-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-medium text-white/70">Transcript</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/30">Auto-interrupt</span>
                      <Switch
                        checked={canInterrupt}
                        onCheckedChange={setCanInterrupt}
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {transcript.length === 0 ? (
                        <div className="text-center py-12">
                          <Mic className="h-8 w-8 text-white/10 mx-auto mb-3" />
                          <p className="text-white/20 text-sm">Start speaking...</p>
                          <p className="text-white/10 text-xs mt-1">Your conversation will appear here</p>
                        </div>
                      ) : (
                        transcript.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: item.role === "user" ? 12 : -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className={cn(
                              "rounded-xl p-3",
                              item.role === "user"
                                ? "bg-violet-500/10 border border-violet-500/10 ml-6"
                                : "bg-white/[0.04] border border-white/[0.06] mr-6"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                item.role === "user"
                                  ? "bg-violet-500/20 text-violet-400"
                                  : "bg-fuchsia-500/20 text-fuchsia-400"
                              )}>
                                {item.role === "user" ? "Y" : "S"}
                              </div>
                              <span className="text-[11px] font-medium text-white/40">
                                {item.role === "user" ? "You" : "ShadowTalk"}
                              </span>
                              <span className="text-[10px] text-white/15 ml-auto">
                                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {item.isInterrupted && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400/70 border-amber-400/20">
                                  cut
                                </Badge>
                              )}
                            </div>
                            <p className="text-[13px] text-white/75 leading-relaxed">{item.text}</p>
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

          {/* ── Bottom Controls ───────────────────────────── */}
          {isConnected && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="px-6 py-5 border-t border-white/[0.06]"
            >
              <div className="flex items-center justify-center gap-3">
                {/* Mic */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMic}
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all",
                    isMicOn
                      ? "bg-white/[0.06] hover:bg-white/[0.1] text-white/80"
                      : "bg-red-500/20 hover:bg-red-500/30 text-red-400 ring-1 ring-red-500/30"
                  )}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                {/* Speaker */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSpeaker}
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all",
                    isSpeakerOn
                      ? "bg-white/[0.06] hover:bg-white/[0.1] text-white/80"
                      : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 ring-1 ring-amber-500/30"
                  )}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>

                {/* Transcript toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all",
                    showTranscript
                      ? "bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 ring-1 ring-violet-500/30"
                      : "bg-white/[0.06] hover:bg-white/[0.1] text-white/80"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                {/* Divider */}
                <div className="w-px h-8 bg-white/[0.06] mx-1" />

                {/* End call */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={endConnection}
                  className="w-14 h-14 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-400 ring-1 ring-red-500/20 transition-all hover:scale-105"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
