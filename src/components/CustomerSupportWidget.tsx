import { useState, useCallback, useEffect } from "react";
import { MessageCircle, X, Mic, Phone, PhoneOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@elevenlabs/react";

const CustomerSupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [agentConfigured, setAgentConfigured] = useState(true);
  const { toast } = useToast();

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setTranscript(prev => [...prev, "🎙️ Connected to AI Support Agent"]);
      toast({
        title: "Connected!",
        description: "You're now connected to our AI support agent."
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setTranscript(prev => [...prev, "📞 Call ended"]);
    },
    onMessage: (message) => {
      console.log("Message from agent:", message);
      // Handle different message types - cast to unknown first for type safety
      const msg = message as unknown as Record<string, unknown>;
      if (msg.user_transcription_event) {
        const event = msg.user_transcription_event as { user_transcript?: string };
        if (event.user_transcript) {
          setTranscript(prev => [...prev, `You: ${event.user_transcript}`]);
        }
      } else if (msg.agent_response_event) {
        const event = msg.agent_response_event as { agent_response?: string };
        if (event.agent_response) {
          setTranscript(prev => [...prev, `Agent: ${event.agent_response}`]);
        }
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to voice agent. Please try again."
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function (agent ID is configured server-side)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes("not configured") || errorData.error?.includes("Agent ID")) {
          setAgentConfigured(false);
        }
        throw new Error(errorData.error || "Failed to get conversation token");
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error("No token received from server");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
      });

    } catch (err) {
      console.error("Failed to start conversation:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to connect to support agent.";
      if (errMsg.includes("not configured") || errMsg.includes("Agent ID")) {
        setAgentConfigured(false);
      }
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errMsg
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    toast({
      title: "Disconnected",
      description: "Your support session has ended."
    });
  }, [conversation, toast]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [conversation]);

  const isConnected = conversation.status === 'connected';

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105"
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
        >
          <MessageCircle className="h-7 w-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96">
      <Card className="bg-card/95 backdrop-blur-lg border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full bg-primary flex items-center justify-center ${conversation.isSpeaking ? 'animate-pulse' : ''}`}>
                <Volume2 className={`h-5 w-5 text-primary-foreground ${conversation.isSpeaking ? 'animate-bounce' : ''}`} />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">24/7 AI Support</h3>
              <p className="text-xs text-muted-foreground">
                {isConnected ? (conversation.isSpeaking ? 'Agent speaking...' : 'Listening...') : 'Ready to help'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Call
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Ready
                </>
              )}
            </Badge>
          </div>

          {/* Visual indicator */}
          <div className="flex justify-center">
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isConnected 
                ? 'bg-primary/20 border-2 border-primary' 
                : 'bg-muted border-2 border-muted-foreground/20'
            }`}>
              {isConnecting ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : isConnected ? (
                <>
                  <Mic className={`h-10 w-10 text-primary ${conversation.isSpeaking ? 'animate-pulse' : ''}`} />
                  {/* Sound waves animation */}
                  {conversation.isSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" />
                      <div className="absolute inset-2 rounded-full border border-primary/30 animate-pulse" />
                    </>
                  )}
                </>
              ) : (
                <Phone className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted/50 rounded-lg">
              {transcript.slice(-5).map((text, i) => (
                <p key={i} className="text-xs text-muted-foreground">{text}</p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={startConversation} 
                disabled={isConnecting}
                className="flex-1 gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4" />
                    Start Voice Call
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={endConversation} 
                variant="destructive"
                className="flex-1 gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
            )}
          </div>

          {/* Info */}
          {!agentConfigured && (
            <p className="text-xs text-center text-amber-500">
              Voice support is being configured. Try again later.
            </p>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Powered by ElevenLabs AI • Available 24/7
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CustomerSupportWidget;
