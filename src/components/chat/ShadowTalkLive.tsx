import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mic, MicOff, Volume2, VolumeX,
  Phone, PhoneOff, MessageSquare, Sparkles, Loader2, AudioLines, AlertCircle
} from "lucide-react";

 // Premium voice wave visualization
 const VoiceWaveform: React.FC<{ isActive: boolean; intensity?: number }> = ({ isActive, intensity = 1 }) => {
   const bars = 12;
   return (
     <div className="flex items-center justify-center gap-1 h-16">
       {Array.from({ length: bars }).map((_, i) => {
         const delay = i * 0.05;
         const maxHeight = 50 + Math.sin(i * 0.5) * 15;
         
         return (
           <motion.div
             key={i}
             className="w-1 rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400"
             animate={isActive ? {
               height: [6, maxHeight * intensity, 10, maxHeight * 0.7 * intensity, 6],
             } : { height: 6 }}
             transition={{
               duration: 0.8,
               repeat: isActive ? Infinity : 0,
               delay,
               ease: 'easeInOut',
             }}
           />
         );
       })}
     </div>
   );
 };

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
                   {/* Premium voice visualization */}
                   <div className="flex flex-col items-center gap-6">
                     {/* Waveform */}
                     <VoiceWaveform isActive={isSpeaking || Boolean(currentUserSpeech)} intensity={isSpeaking ? 1 : 0.5} />
                     
                     {/* Main avatar with glow */}
                     <div className="relative">
                       {/* Outer glow */}
                       <motion.div
                         animate={{ 
                           scale: isSpeaking ? [1, 1.3, 1] : [1, 1.1, 1],
                           opacity: isSpeaking ? [0.4, 0.1, 0.4] : [0.2, 0.1, 0.2]
                         }}
                         transition={{ duration: isSpeaking ? 1 : 3, repeat: Infinity }}
                         className={cn(
                           "absolute inset-0 rounded-full",
                           isSpeaking ? "bg-fuchsia-500/40" : "bg-violet-500/30"
                         )}
                         style={{ width: 160, height: 160, left: -16, top: -16 }}
                       />
                       
                       {/* Main circle */}
                       <motion.div
                         animate={{ 
                           scale: isSpeaking ? [1, 1.06, 1] : [1, 1.02, 1],
                         }}
                         transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity }}
                         className={cn(
                           "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl relative z-10",
                           isSpeaking 
                             ? "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500" 
                             : "bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500"
                         )}
                       >
                         {isSpeaking ? (
                           <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
                             <AudioLines className="h-14 w-14 text-white drop-shadow-lg" />
                           </motion.div>
                         ) : (
                           <Sparkles className="h-14 w-14 text-white drop-shadow-lg" />
                         )}
                       </motion.div>
                     </div>
                     
                     {/* Status */}
                     <div className="text-center">
                       <p className={cn("font-medium", isSpeaking ? "text-fuchsia-400" : "text-violet-400")}>
                         {isSpeaking ? "AI Speaking" : "Listening..."}
                       </p>
                       <p className="text-white/40 text-xs mt-1">
                         {canInterrupt ? "Interrupt anytime" : "Please wait"}
                       </p>
                     </div>
                     
                     {/* Current speech */}
                     {currentUserSpeech && (
                       <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md"
                       >
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-white/90 text-sm border border-white/10">
                           <span className="text-violet-300 mr-2">You:</span>
                           {currentUserSpeech}
                           <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span>
                         </div>
                       </motion.div>
                     )}
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
