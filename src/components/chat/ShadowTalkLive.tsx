import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mic, MicOff, Volume2, VolumeX,
  Phone, PhoneOff, MessageSquare, Sparkles, Loader2, AudioLines, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useConversation } from "@elevenlabs/react";

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

export const ShadowTalkLive = ({ isOpen, onClose, onInsertToChat }: ShadowTalkLiveProps) => {
  const { toast } = useToast();
  
  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Media state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Transcript
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentUserSpeech, setCurrentUserSpeech] = useState("");
  const [currentAgentSpeech, setCurrentAgentSpeech] = useState("");
  
  // Settings
  const [showTranscript, setShowTranscript] = useState(true);
  const [canInterrupt, setCanInterrupt] = useState(true);
  
  // Refs for tracking partial messages
  const lastUserTranscriptRef = useRef<string>("");
  const lastAgentResponseRef = useRef<string>("");

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs: Connected to agent");
      setConnectionError(null);
      toast({ title: "Connected", description: "ShadowTalk Live is ready" });
    },
    onDisconnect: () => {
      console.log("ElevenLabs: Disconnected from agent");
      setCurrentUserSpeech("");
      setCurrentAgentSpeech("");
    },
    onMessage: (message: unknown) => {
      console.log("ElevenLabs message:", message);
      
      // Cast to record for safe property access
      const msg = message as Record<string, unknown>;
      const msgType = msg?.type as string | undefined;
      
      // Handle different message types
      if (msgType === "user_transcript") {
        const event = msg?.user_transcription_event as Record<string, unknown> | undefined;
        const userText = event?.user_transcript as string | undefined;
        if (userText && userText !== lastUserTranscriptRef.current) {
          lastUserTranscriptRef.current = userText;
          setCurrentUserSpeech("");
          setTranscript(prev => [...prev, {
            id: crypto.randomUUID(),
            role: "user",
            text: userText,
            timestamp: new Date()
          }]);
        }
      } else if (msgType === "agent_response") {
        const event = msg?.agent_response_event as Record<string, unknown> | undefined;
        const agentText = event?.agent_response as string | undefined;
        if (agentText && agentText !== lastAgentResponseRef.current) {
          lastAgentResponseRef.current = agentText;
          setCurrentAgentSpeech("");
          setTranscript(prev => [...prev, {
            id: crypto.randomUUID(),
            role: "ai",
            text: agentText,
            timestamp: new Date()
          }]);
        }
      } else if (msgType === "agent_response_correction") {
        // Agent was interrupted
        const event = msg?.agent_response_correction_event as Record<string, unknown> | undefined;
        const correctedText = event?.corrected_agent_response as string | undefined;
        if (correctedText) {
          setTranscript(prev => {
            const updated = [...prev];
            const lastAI = updated.filter(t => t.role === "ai").pop();
            if (lastAI) {
              lastAI.text = correctedText;
              lastAI.isInterrupted = true;
            }
            return updated;
          });
        }
      }
    },
    onError: (error: unknown) => {
      console.error("ElevenLabs error:", error);
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : "Connection error occurred";
      setConnectionError(errorMsg);
      toast({
        title: "Voice Error",
        description: errorMsg,
        variant: "destructive"
      });
    },
  });

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (isConnected) {
        conversation.endSession();
      }
    };
  }, []);

  // Start connection using ElevenLabs signed URL
  const startConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');
      
      if (error) {
        throw new Error(error.message || "Failed to get conversation token");
      }
      
      if (!data?.signed_url) {
        throw new Error(data?.error || "No signed URL received. Please configure ELEVENLABS_AGENT_ID.");
      }
      
      console.log("Starting ElevenLabs session with signed URL");
      
      // Start the conversation session with signed URL (WebSocket)
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
      
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionError(error instanceof Error ? error.message : "Could not start voice session");
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not start voice session",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // End connection
  const endConnection = useCallback(async () => {
    try {
      await conversation.endSession();
      setTranscript([]);
      lastUserTranscriptRef.current = "";
      lastAgentResponseRef.current = "";
    } catch (error) {
      console.error("Error ending session:", error);
    }
    toast({ title: "Disconnected" });
  }, [conversation, toast]);

  // Toggle microphone (mute/unmute the conversation)
  const toggleMic = useCallback(() => {
    setIsMicOn(!isMicOn);
    // Note: ElevenLabs SDK handles audio internally, 
    // this is mainly for UI feedback
  }, [isMicOn]);

  // Toggle speaker (volume control)
  const toggleSpeaker = useCallback(async () => {
    const newValue = !isSpeakerOn;
    setIsSpeakerOn(newValue);
    try {
      await conversation.setVolume({ volume: newValue ? 1 : 0 });
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  }, [isSpeakerOn, conversation]);

  // Export transcript
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

  // Close handler
  const handleClose = useCallback(() => {
    if (isConnected) {
      conversation.endSession();
    }
    onClose();
  }, [isConnected, conversation, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">ShadowTalk Live</h2>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isConnected ? "default" : "secondary"} 
                    className={cn(
                      "text-xs",
                      isConnected && "bg-green-500"
                    )}
                  >
                    {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {isSpeaking && (
                    <Badge variant="outline" className="text-xs gap-1 text-fuchsia-400 border-fuchsia-400">
                      <AudioLines className="h-3 w-3" />
                      Speaking
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Button variant="ghost" size="sm" onClick={exportTranscript} className="text-white/70 hover:text-white">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Left: Visual Area */}
            <div className="flex-1 relative flex items-center justify-center">
              {!isConnected ? (
                // Not connected state
                <motion.div 
                  className="text-center max-w-md px-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 mx-auto mb-8 flex items-center justify-center">
                    <Phone className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start Live Conversation</h3>
                  <p className="text-white/60 mb-4">
                    Have a natural, real-time voice conversation powered by ElevenLabs AI.
                  </p>
                  <p className="text-white/40 text-sm mb-6">
                    Speak naturally and interrupt anytime • Premium voice synthesis
                  </p>
                  
                  {connectionError && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-left">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-red-300 font-medium">Connection Error</p>
                          <p className="text-xs text-red-400/80 mt-1">{connectionError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    size="lg"
                    onClick={startConnection}
                    disabled={isConnecting}
                    className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="h-5 w-5" />
                        Start Conversation
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                // Connected state - Voice visualization
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Voice visualization */}
                  <div className="relative">
                    {/* Outer pulse rings when speaking */}
                    {isSpeaking && (
                      <>
                        <motion.div
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-fuchsia-500/30"
                          style={{ 
                            width: 256, 
                            height: 256,
                            left: -64,
                            top: -64
                          }}
                        />
                        <motion.div
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0, 0.3]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                          className="absolute inset-0 rounded-full bg-fuchsia-500/20"
                          style={{ 
                            width: 256, 
                            height: 256,
                            left: -64,
                            top: -64
                          }}
                        />
                      </>
                    )}

                    {/* Listening pulse when not speaking */}
                    {!isSpeaking && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 0.1, 0.3]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-violet-500/20"
                        style={{ 
                          width: 200, 
                          height: 200,
                          left: -36,
                          top: -36
                        }}
                      />
                    )}

                    {/* Main avatar */}
                    <motion.div
                      animate={{ 
                        scale: isSpeaking ? [1, 1.05, 1] : [1, 1.02, 1],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center",
                        isSpeaking 
                          ? "bg-gradient-to-br from-fuchsia-500 to-pink-500" 
                          : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                      )}
                    >
                      {isSpeaking ? (
                        <AudioLines className="h-12 w-12 text-white" />
                      ) : (
                        <Sparkles className="h-12 w-12 text-white" />
                      )}
                    </motion.div>
                  </div>

                  {/* Current speech indicator */}
                  {currentUserSpeech && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-md"
                    >
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 text-sm">
                        {currentUserSpeech}...
                      </div>
                    </motion.div>
                  )}

                  {/* Status indicator */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-white/60 text-sm">
                      {isSpeaking ? "AI is speaking..." : "Listening..."}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {canInterrupt ? "You can interrupt anytime" : "Wait for response to complete"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Transcript Panel */}
            {isConnected && showTranscript && (
              <div className="w-80 border-l border-white/10 flex flex-col bg-black/50">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Transcript</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Interrupt</span>
                    <Switch
                      checked={canInterrupt}
                      onCheckedChange={setCanInterrupt}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {transcript.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">
                        Start speaking to begin the conversation...
                      </p>
                    ) : (
                      transcript.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-lg p-3",
                            item.role === "user" 
                              ? "bg-violet-500/20 ml-4" 
                              : "bg-white/10 mr-4"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-white/60">
                              {item.role === "user" ? "You" : "ShadowTalk"}
                            </span>
                            {item.isInterrupted && (
                              <Badge variant="outline" className="text-xs text-orange-400 border-orange-400">
                                Interrupted
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/90">{item.text}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          {isConnected && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMic}
                  className={cn(
                    "w-12 h-12 rounded-full",
                    isMicOn 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-red-500 hover:bg-red-600 text-white"
                  )}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSpeaker}
                  className={cn(
                    "w-12 h-12 rounded-full",
                    isSpeakerOn 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={cn(
                    "w-12 h-12 rounded-full",
                    showTranscript 
                      ? "bg-violet-500 hover:bg-violet-600 text-white" 
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={endConnection}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
