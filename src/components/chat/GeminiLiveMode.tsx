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

interface GeminiLiveModeProps {
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

export const GeminiLiveMode = ({ isOpen, onClose, onInsertToChat }: GeminiLiveModeProps) => {
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
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

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
        throw new Error("Speech recognition not supported");
      }
      
      // Set up speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          setCurrentUserSpeech("");
          handleUserSpeech(text);
        } else {
          setCurrentUserSpeech(text);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'aborted') {
          toast({
            title: "Voice Error",
            description: "There was an issue with voice recognition",
            variant: "destructive"
          });
        }
      };
      
      recognitionRef.current.onend = () => {
        // Restart if still connected
        if (isConnected && isMicOn && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log("Recognition already started");
          }
        }
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setIsConnecting(false);
      setIsListening(true);
      
      recognitionRef.current.start();
      animationRef.current = requestAnimationFrame(updateAudioLevel);
      
      // Add initial AI greeting
      setTimeout(() => {
        addAIResponse("Hi! I'm here and ready for a live conversation. What would you like to talk about?");
      }, 500);
      
      toast({ title: "Connected", description: "Gemini Live is ready for conversation" });
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
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      window.speechSynthesis.cancel();
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

  // Handle user speech
  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;
    
    // If AI is speaking and interruption is enabled, stop it
    if (isSpeaking && canInterrupt) {
      window.speechSynthesis.cancel();
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
    
    // Call real AI backend
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [
            ...transcript.filter(t => t.role === "user" || t.role === "ai").slice(-6).map(t => ({
              role: t.role === "ai" ? "assistant" : "user",
              content: t.text
            })),
            { role: "user", content: text }
          ],
          personality: "professional",
          mode: "general"
        })
      });
      const data = await resp.json();
      const aiResponse = typeof data === 'string' ? data : (data?.response || data?.text || "I understand. Can you tell me more?");
      addAIResponse(aiResponse);
    } catch {
      addAIResponse("I'm having trouble connecting right now. Could you repeat that?");
    }
  };

  // Add AI response with text-to-speech
  const addAIResponse = (text: string) => {
    setIsProcessing(false);
    
    setTranscript(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "ai",
      text: text,
      timestamp: new Date()
    }]);
    
    if (isSpeakerOn) {
      speakText(text);
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      synthRef.current = new SpeechSynthesisUtterance(text);
      synthRef.current.rate = voiceSpeed[0];
      synthRef.current.pitch = 1.0;
      
      synthRef.current.onstart = () => setIsSpeaking(true);
      synthRef.current.onend = () => setIsSpeaking(false);
      synthRef.current.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(synthRef.current);
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
        toast({ title: "Camera enabled", description: "AI can now see what you're showing" });
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
      `[${t.timestamp.toLocaleTimeString()}] ${t.role === 'user' ? 'You' : 'AI'}: ${t.text}`
    ).join('\n\n');
    
    if (onInsertToChat) {
      onInsertToChat(`## Live Conversation Transcript\n\n${content}`);
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Gemini Live</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                    {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {isProcessing && (
                    <Badge variant="outline" className="text-xs gap-1 text-blue-400 border-blue-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking
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
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-8 flex items-center justify-center">
                    <Phone className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start Live Conversation</h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Have a natural, real-time conversation with AI. Speak naturally and interrupt anytime.
                  </p>
                  <Button
                    size="lg"
                    onClick={startConnection}
                    disabled={isConnecting}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
                            isSpeaking ? "bg-purple-500/30" : "bg-blue-500/30"
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
                            isSpeaking ? "bg-purple-500/20" : "bg-blue-500/20"
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
                    
                    {/* Main orb */}
                    <motion.div
                      animate={{
                        scale: isProcessing ? [1, 1.05, 1] : (isListening || isSpeaking ? 1 + audioLevel * 0.1 : 1),
                      }}
                      transition={{ duration: 0.1 }}
                      className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-300",
                        isProcessing && "bg-gradient-to-br from-yellow-500 to-orange-500",
                        isSpeaking && !isProcessing && "bg-gradient-to-br from-purple-500 to-pink-500",
                        isListening && !isSpeaking && !isProcessing && "bg-gradient-to-br from-blue-500 to-cyan-500",
                        !isListening && !isSpeaking && !isProcessing && "bg-gradient-to-br from-gray-500 to-gray-600"
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                      ) : isSpeaking ? (
                        <Volume2 className="h-12 w-12 text-white" />
                      ) : isListening ? (
                        <AudioLines className="h-12 w-12 text-white" />
                      ) : (
                        <MicOff className="h-12 w-12 text-white" />
                      )}
                    </motion.div>
                  </div>

                  {/* Status text */}
                  <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-xl font-medium text-white">
                      {isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Muted"}
                    </p>
                    {currentUserSpeech && (
                      <p className="text-sm text-white/60 mt-2 max-w-md">
                        "{currentUserSpeech}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Transcript */}
            {isConnected && showTranscript && (
              <div className="w-80 border-l border-white/10 flex flex-col">
                <div className="p-3 border-b border-white/10">
                  <h3 className="text-sm font-medium text-white/80">Transcript</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {transcript.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "text-sm",
                          item.role === "user" ? "text-blue-300" : "text-white/80"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {item.role === "user" ? "You" : "AI"}
                          </span>
                          <span className="text-xs text-white/40">
                            {item.timestamp.toLocaleTimeString()}
                          </span>
                          {item.isInterrupted && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/50">
                              Interrupted
                            </Badge>
                          )}
                        </div>
                        <p className="text-white/70">{item.text}</p>
                      </div>
                    ))}
                    {transcript.length === 0 && (
                      <p className="text-white/40 text-sm text-center">
                        Start speaking to see the transcript here
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          {isConnected && (
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Mic toggle */}
                <Button
                  size="lg"
                  variant={isMicOn ? "default" : "secondary"}
                  onClick={toggleMic}
                  className={cn(
                    "rounded-full w-14 h-14",
                    isMicOn && "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>

                {/* Speaker toggle */}
                <Button
                  size="lg"
                  variant={isSpeakerOn ? "default" : "secondary"}
                  onClick={toggleSpeaker}
                  className={cn(
                    "rounded-full w-14 h-14",
                    isSpeakerOn && "bg-purple-500 hover:bg-purple-600"
                  )}
                >
                  {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>

                {/* Camera toggle */}
                <Button
                  size="lg"
                  variant={isCameraOn ? "default" : "secondary"}
                  onClick={toggleCamera}
                  className={cn(
                    "rounded-full w-14 h-14",
                    isCameraOn && "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>

                {/* Share camera */}
                {isCameraOn && (
                  <Button
                    size="lg"
                    variant={isCameraSharing ? "default" : "secondary"}
                    onClick={shareCamera}
                    className={cn(
                      "rounded-full w-14 h-14",
                      isCameraSharing && "bg-red-500 hover:bg-red-600"
                    )}
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                )}

                {/* Toggle transcript */}
                <Button
                  size="lg"
                  variant={showTranscript ? "default" : "secondary"}
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="rounded-full w-14 h-14"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>

                {/* Interrupt toggle */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10">
                  <span className="text-xs text-white/60">Interrupt</span>
                  <Switch
                    checked={canInterrupt}
                    onCheckedChange={setCanInterrupt}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                {/* End call */}
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={endConnection}
                  className="rounded-full w-14 h-14"
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
