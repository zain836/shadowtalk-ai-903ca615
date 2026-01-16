import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mic, MicOff, Video, VideoOff, Volume2, VolumeX,
  Phone, PhoneOff, Camera, MessageSquare, Sparkles, Loader2, AudioLines
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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

// Available ElevenLabs voices
const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Professional, clear" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm, friendly" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Soft, calm" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Authoritative" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Energetic" },
];

export const ShadowTalkLive = ({ isOpen, onClose, onInsertToChat }: ShadowTalkLiveProps) => {
  const { toast } = useToast();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Media state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraSharing, setIsCameraSharing] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canInterrupt, setCanInterrupt] = useState(true);
  
  // Voice selection
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  
  // Transcript
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentUserSpeech, setCurrentUserSpeech] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Settings
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const [showTranscript, setShowTranscript] = useState(true);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  // Audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
    }
    if (isListening) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isListening]);

  // Start connection
  const startConnection = async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }
      
      // Set up speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          setCurrentUserSpeech("");
          handleUserSpeech(text);
        } else {
          setCurrentUserSpeech(text);
        }
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast({
            title: "Voice Error",
            description: "There was an issue with voice recognition",
            variant: "destructive"
          });
        }
      };
      
      recognitionRef.current.onend = () => {
        // Restart if still connected and mic is on
        if (isConnected && isMicOn && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log("Recognition already started");
          }
        }
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsConnected(true);
      setIsConnecting(false);
      setIsListening(true);
      
      recognitionRef.current.start();
      animationRef.current = requestAnimationFrame(updateAudioLevel);
      
      // Add initial AI greeting
      setTimeout(() => {
        addAIResponse("Hello! I'm ShadowTalk Live, your AI voice assistant. How can I help you today?");
      }, 500);
      
      toast({ title: "Connected", description: "ShadowTalk Live is ready" });
    } catch (error) {
      console.error("Connection error:", error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not start voice session",
        variant: "destructive"
      });
    }
  };

  // Stop all media
  const stopAllMedia = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition stop error");
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsListening(false);
    setIsSpeaking(false);
  };

  // End connection
  const endConnection = () => {
    stopAllMedia();
    setIsConnected(false);
    setIsCameraOn(false);
    setIsCameraSharing(false);
    toast({ title: "Disconnected" });
  };

  // Handle user speech and get AI response
  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;
    
    // If AI is speaking and interruption is enabled, stop it
    if (isSpeaking && canInterrupt) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsSpeaking(false);
      // Mark last AI message as interrupted
      setTranscript(prev => {
        const updated = [...prev];
        const lastAI = updated.filter(t => t.role === "ai").pop();
        if (lastAI) {
          lastAI.isInterrupted = true;
        }
        return updated;
      });
    }
    
    // Add user message to transcript
    setTranscript(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "user",
      text: text,
      timestamp: new Date()
    }]);
    
    setIsProcessing(true);
    
    try {
      // Get AI response using Lovable AI
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: "system", content: "You are ShadowTalk Live, a helpful and friendly AI voice assistant. Keep your responses concise and conversational, suitable for voice interaction. Limit responses to 2-3 sentences when possible." },
            ...transcript.map(t => ({
              role: t.role === "user" ? "user" : "assistant",
              content: t.text
            })),
            { role: "user", content: text }
          ]
        }
      });

      if (error) throw error;

      // Parse the streaming response
      let aiResponse = "";
      if (typeof data === 'string') {
        // Parse SSE format
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) aiResponse += content;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      } else if (data?.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      }

      if (!aiResponse) {
        aiResponse = "I'm sorry, I couldn't generate a response. Please try again.";
      }

      addAIResponse(aiResponse);
    } catch (error) {
      console.error("AI response error:", error);
      setIsProcessing(false);
      addAIResponse("I'm having trouble connecting right now. Please try again in a moment.");
    }
  };

  // Add AI response with ElevenLabs text-to-speech
  const addAIResponse = async (text: string) => {
    setIsProcessing(false);
    
    setTranscript(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "ai",
      text: text,
      timestamp: new Date()
    }]);
    
    if (isSpeakerOn) {
      await speakWithElevenLabs(text);
    }
  };

  // Text-to-speech using ElevenLabs
  const speakWithElevenLabs = async (text: string) => {
    try {
      setIsSpeaking(true);
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text, 
            voiceId: selectedVoice.id 
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const data = await response.json();
      
      if (data.audioContent) {
        // Use data URI for base64 audio
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
        };
        
        audioRef.current.onerror = () => {
          setIsSpeaking(false);
        };
        
        await audioRef.current.play();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("ElevenLabs TTS error:", error);
        // Fallback to browser TTS
        fallbackToWebSpeech(text);
      }
      setIsSpeaking(false);
    }
  };

  // Fallback to Web Speech API
  const fallbackToWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed[0];
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (isMicOn) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.log("Recognition start error");
      }
    }
    setIsMicOn(!isMicOn);
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (isSpeakerOn && isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setIsCameraOn(false);
      setIsCameraSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        toast({ title: "Camera enabled", description: "Camera preview is active" });
      } catch (error) {
        toast({
          title: "Camera Error",
          description: "Could not access camera",
          variant: "destructive"
        });
      }
    }
  };

  // Share camera view with AI
  const shareCamera = () => {
    if (!isCameraOn) {
      toast({ title: "Enable camera first" });
      return;
    }
    setIsCameraSharing(!isCameraSharing);
    if (!isCameraSharing) {
      addAIResponse("I can see your camera now! Show me what you'd like to discuss and I'll help you with it.");
    }
  };

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
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                    {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {isProcessing && (
                    <Badge variant="outline" className="text-xs gap-1 text-violet-400 border-violet-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice selector */}
              {isConnected && (
                <select 
                  value={selectedVoice.id}
                  onChange={(e) => setSelectedVoice(VOICES.find(v => v.id === e.target.value) || VOICES[0])}
                  className="bg-white/10 text-white text-sm rounded px-2 py-1 border border-white/20"
                >
                  {VOICES.map(voice => (
                    <option key={voice.id} value={voice.id} className="bg-gray-800">
                      {voice.name}
                    </option>
                  ))}
                </select>
              )}
              {isConnected && (
                <Button variant="ghost" size="sm" onClick={exportTranscript} className="text-white/70 hover:text-white">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Left: Video/Visual Area */}
            <div className="flex-1 relative flex items-center justify-center">
              {!isConnected ? (
                // Not connected state
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 mx-auto mb-8 flex items-center justify-center">
                    <Phone className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start Live Conversation</h3>
                  <p className="text-white/60 mb-4 max-w-md mx-auto">
                    Have a natural, real-time voice conversation powered by ElevenLabs AI voices.
                  </p>
                  <p className="text-white/40 text-sm mb-8">
                    Speak naturally and interrupt anytime • Premium voice synthesis
                  </p>
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
                // Connected state
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Camera preview */}
                  {isCameraOn && (
                    <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border border-white/20 shadow-xl">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {isCameraSharing && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-red-500 text-xs">LIVE</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice visualization */}
                  <div className="relative">
                    {/* Outer pulse rings */}
                    {(isListening || isSpeaking) && (
                      <>
                        <motion.div
                          animate={{ 
                            scale: [1, 1.5 + audioLevel * 0.5, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={cn(
                            "absolute inset-0 rounded-full",
                            isSpeaking ? "bg-fuchsia-500/30" : "bg-violet-500/30"
                          )}
                          style={{ 
                            width: 256, 
                            height: 256,
                            left: -64,
                            top: -64
                          }}
                        />
                        <motion.div
                          animate={{ 
                            scale: [1, 1.3 + audioLevel * 0.3, 1],
                            opacity: [0.3, 0, 0.3]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                          className={cn(
                            "absolute inset-0 rounded-full",
                            isSpeaking ? "bg-fuchsia-500/20" : "bg-violet-500/20"
                          )}
                          style={{ 
                            width: 256, 
                            height: 256,
                            left: -64,
                            top: -64
                          }}
                        />
                      </>
                    )}

                    {/* Main avatar */}
                    <motion.div
                      animate={{ 
                        scale: isSpeaking ? [1, 1.05, 1] : isListening ? [1, 1.02, 1] : 1,
                      }}
                      transition={{ duration: 0.5, repeat: isSpeaking || isListening ? Infinity : 0 }}
                      className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center",
                        isSpeaking 
                          ? "bg-gradient-to-br from-fuchsia-500 to-pink-500" 
                          : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                      ) : isSpeaking ? (
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
                      {isProcessing ? "Processing..." : isSpeaking ? `${selectedVoice.name} is speaking...` : isListening ? "Listening..." : "Paused"}
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
                  <Switch
                    checked={canInterrupt}
                    onCheckedChange={setCanInterrupt}
                  />
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {transcript.map((item) => (
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
                    ))}
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
                  onClick={toggleCamera}
                  className={cn(
                    "w-12 h-12 rounded-full",
                    isCameraOn 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                {isCameraOn && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={shareCamera}
                    className={cn(
                      "w-12 h-12 rounded-full",
                      isCameraSharing 
                        ? "bg-violet-500 hover:bg-violet-600 text-white" 
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                )}

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
