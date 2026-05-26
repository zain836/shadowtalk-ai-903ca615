 import { useState, useCallback, useRef, useEffect } from 'react';
 import { useToast } from '@/hooks/use-toast';
 
 export interface VisionAnalysis {
   face_detected: boolean;
   emotion: 'happy' | 'sad' | 'neutral' | 'confused' | 'frustrated' | 'tired' | 'excited';
   emotion_confidence: number;
   engagement_level: 'high' | 'medium' | 'low' | 'distracted';
   eye_contact: boolean;
   posture: 'attentive' | 'relaxed' | 'tense' | 'slouched';
   gesture_detected: null | 'wave' | 'thumbs_up' | 'thinking' | 'pointing' | 'palm_stop';
   environment: {
     lighting: 'bright' | 'dim' | 'dark';
     time_guess: 'morning' | 'afternoon' | 'evening' | 'night';
   };
   suggested_action: string;
   conversation_opener: string;
 }
 
 export interface AgentPersonality {
   id: string;
   name: string;
   triggerEmotions: VisionAnalysis['emotion'][];
   voiceSettings: {
     pitch: number;
     rate: number;
     voiceId: string;
   };
   systemPrompt: string;
   greetings: string[];
   conversationStyle: 'formal' | 'casual' | 'playful' | 'supportive';
 }
 
 // Personality configurations mapped to emotions
 const PERSONALITIES: AgentPersonality[] = [
   {
     id: 'energetic',
     name: 'Energetic Companion',
     triggerEmotions: ['happy', 'excited'],
     voiceSettings: { pitch: 1.1, rate: 1.15, voiceId: 'IKne3meq5aSn9XLyUdCD' }, // Charlie - upbeat
     systemPrompt: 'You are an enthusiastic, high-energy AI friend. Match the user\'s positive energy!',
     greetings: ['Hey! You look great today! 🎉', 'Someone\'s in a good mood! What\'s up?', 'Love the energy! What exciting thing are you working on?'],
     conversationStyle: 'playful'
   },
   {
     id: 'empathetic',
     name: 'Empathetic Friend',
     triggerEmotions: ['sad'],
     voiceSettings: { pitch: 0.95, rate: 0.9, voiceId: 'pFZP5JQG7iQjIQuC4Bku' }, // Lily - soft
     systemPrompt: 'You are a caring, gentle AI friend. Be supportive and understanding. Don\'t try to fix everything - just be present.',
     greetings: ['Hey... I\'m here if you want to talk.', 'I noticed you might be going through something. I\'m listening.', 'Take your time. I\'m here for you.'],
     conversationStyle: 'supportive'
   },
   {
     id: 'solver',
     name: 'Calm Problem-Solver',
     triggerEmotions: ['frustrated'],
     voiceSettings: { pitch: 1.0, rate: 0.95, voiceId: 'onwK4e9ZLuTAKqWW03F9' }, // Daniel - steady
     systemPrompt: 'You are a calm, patient AI. The user seems frustrated - help them step back and approach problems methodically.',
     greetings: ['I can see something\'s challenging you. Let\'s break it down together.', 'Take a breath - I\'m here to help.', 'Frustrating, right? Let\'s tackle this one step at a time.'],
     conversationStyle: 'supportive'
   },
   {
     id: 'teacher',
     name: 'Clear Teacher',
     triggerEmotions: ['confused'],
     voiceSettings: { pitch: 1.0, rate: 0.9, voiceId: 'JBFqnCBsd6RMkjVDRZzb' }, // George - clear
     systemPrompt: 'You are a patient teacher. The user looks confused - explain things clearly with examples.',
     greetings: ['Looks like something\'s puzzling you. What can I clarify?', 'I can see you\'re thinking hard about something. Need an explanation?', 'Questions are good! What would you like to understand better?'],
     conversationStyle: 'formal'
   },
   {
     id: 'gentle',
     name: 'Gentle Assistant',
     triggerEmotions: ['tired'],
     voiceSettings: { pitch: 0.9, rate: 0.85, voiceId: 'EXAVITQu4vr4xnSDxMaL' }, // Sarah - calm
     systemPrompt: 'You are a gentle, quiet AI. The user looks tired - keep things simple and suggest breaks if appropriate.',
     greetings: ['You look like you could use a break. Everything okay?', 'Long day? I\'ll keep things simple.', 'Hey, no rush. What do you need?'],
     conversationStyle: 'casual'
   },
   {
     id: 'efficient',
     name: 'Efficient Helper',
     triggerEmotions: ['neutral'],
     voiceSettings: { pitch: 1.0, rate: 1.0, voiceId: 'nPczCjzI2devNBz1zQrb' }, // Brian - professional
     systemPrompt: 'You are a professional, efficient AI assistant. Be helpful and focused.',
     greetings: ['Hello! Ready when you are.', 'How can I help you today?', 'What would you like to work on?'],
     conversationStyle: 'formal'
   }
 ];
 
 export interface VisionAgentState {
   isActive: boolean;
   isAnalyzing: boolean;
   currentAnalysis: VisionAnalysis | null;
   currentPersonality: AgentPersonality;
   analysisHistory: VisionAnalysis[];
   lastSpokenAt: number | null;
   permissionGranted: boolean;
 }
 
 export interface VisionAgentActions {
   start: () => Promise<boolean>;
   stop: () => void;
   captureFrame: () => Promise<string | null>;
   analyzeFrame: (imageData: string) => Promise<VisionAnalysis | null>;
   getPersonalityForEmotion: (emotion: VisionAnalysis['emotion']) => AgentPersonality;
   speak: (text: string, voiceId?: string) => Promise<void>;
   requestCameraPermission: () => Promise<boolean>;
 }
 
 export const useVisionAgent = () => {
   const { toast } = useToast();
   
   // State
   const [state, setState] = useState<VisionAgentState>({
     isActive: false,
     isAnalyzing: false,
     currentAnalysis: null,
     currentPersonality: PERSONALITIES.find(p => p.id === 'efficient')!,
     analysisHistory: [],
     lastSpokenAt: null,
     permissionGranted: false
   });
   
   // Refs
   const videoRef = useRef<HTMLVideoElement | null>(null);
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const streamRef = useRef<MediaStream | null>(null);
   const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
   const audioRef = useRef<HTMLAudioElement | null>(null);
   
   // Request camera permission
   const requestCameraPermission = useCallback(async (): Promise<boolean> => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ 
         video: { facingMode: 'user', width: 640, height: 480 } 
       });
       stream.getTracks().forEach(track => track.stop());
       setState(prev => ({ ...prev, permissionGranted: true }));
       return true;
     } catch (error) {
       console.error('Camera permission denied:', error);
       toast({
         title: "Camera Access Required",
         description: "Please enable camera access for Vision Agent",
         variant: "destructive"
       });
       return false;
     }
   }, [toast]);
   
   // Start the vision agent
   const start = useCallback(async (): Promise<boolean> => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ 
         video: { facingMode: 'user', width: 640, height: 480 } 
       });
       
       streamRef.current = stream;
       
       // Create video element if not exists
       if (!videoRef.current) {
         videoRef.current = document.createElement('video');
         videoRef.current.autoplay = true;
         videoRef.current.playsInline = true;
         videoRef.current.muted = true;
       }
       videoRef.current.srcObject = stream;
       await videoRef.current.play();
       
       // Create canvas for frame capture
       if (!canvasRef.current) {
         canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;
       }
       
       setState(prev => ({ ...prev, isActive: true, permissionGranted: true }));
       
       toast({
         title: "👁️ Vision Agent Active",
         description: "I can now see you and adapt to your mood"
       });
       
       return true;
     } catch (error) {
       console.error('Failed to start vision agent:', error);
       toast({
         title: "Camera Error",
         description: "Could not access camera",
         variant: "destructive"
       });
       return false;
     }
   }, [toast]);
   
   // Stop the vision agent
   const stop = useCallback(() => {
     if (streamRef.current) {
       streamRef.current.getTracks().forEach(track => track.stop());
       streamRef.current = null;
     }
     
     if (analysisIntervalRef.current) {
       clearInterval(analysisIntervalRef.current);
       analysisIntervalRef.current = null;
     }
     
     if (audioRef.current) {
       audioRef.current.pause();
       audioRef.current = null;
     }
     
     setState(prev => ({ 
       ...prev, 
       isActive: false, 
       isAnalyzing: false,
       currentAnalysis: null 
     }));
     
     toast({ title: "Vision Agent stopped" });
   }, [toast]);
   
   // Capture a frame from the video
   const captureFrame = useCallback(async (): Promise<string | null> => {
     if (!videoRef.current || !canvasRef.current) return null;
     
     const ctx = canvasRef.current.getContext('2d');
     if (!ctx) return null;
     
      // Draw at reduced size for faster API processing
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      // Use lower quality to reduce payload size
      return canvasRef.current.toDataURL('image/jpeg', 0.5);
   }, []);
   
   // Analyze a frame using the edge function
   const analyzeFrame = useCallback(async (imageData: string): Promise<VisionAnalysis | null> => {
     setState(prev => ({ ...prev, isAnalyzing: true }));
     
     try {
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-analyze`,
         {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
             'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
           },
           body: JSON.stringify({ 
             imageData,
             previousAnalysis: state.currentAnalysis 
           })
         }
       );
       
       if (!response.ok) {
         throw new Error('Analysis failed');
       }
       
       const data = await response.json();
       const analysis = data.analysis as VisionAnalysis;
       
       // Update personality based on detected emotion
       const newPersonality = getPersonalityForEmotion(analysis.emotion);
       
       setState(prev => ({
         ...prev,
         isAnalyzing: false,
         currentAnalysis: analysis,
         currentPersonality: newPersonality,
         analysisHistory: [...prev.analysisHistory.slice(-9), analysis]
       }));
       
       return analysis;
     } catch (error) {
       console.error('Frame analysis failed:', error);
       setState(prev => ({ ...prev, isAnalyzing: false }));
       return null;
     }
   }, [state.currentAnalysis]);
   
   // Get personality for emotion
   const getPersonalityForEmotion = useCallback((emotion: VisionAnalysis['emotion']): AgentPersonality => {
     const personality = PERSONALITIES.find(p => p.triggerEmotions.includes(emotion));
     return personality || PERSONALITIES.find(p => p.id === 'efficient')!;
   }, []);
   
   // Speak using ElevenLabs TTS
  const speak = useCallback(async (text: string, voiceId?: string): Promise<void> => {
    try {
      const { fetchElevenLabsSpeech } = await import("@/lib/elevenlabsTts");
      const result = await fetchElevenLabsSpeech({
        text,
        voiceId: voiceId || state.currentPersonality.voiceSettings.voiceId,
      });

      if (!result.ok || !result.audio) {
        console.warn("Speech synthesis skipped:", result.error);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = result.audio;
      await audioRef.current.play();
      setState((prev) => ({ ...prev, lastSpokenAt: Date.now() }));
    } catch (error) {
      console.error("Speech synthesis failed:", error);
    }
  }, [state.currentPersonality]);
   
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
       }
       if (analysisIntervalRef.current) {
         clearInterval(analysisIntervalRef.current);
       }
     };
   }, []);
   
   return {
     state,
     actions: {
       start,
       stop,
       captureFrame,
       analyzeFrame,
       getPersonalityForEmotion,
       speak,
       requestCameraPermission
     } as VisionAgentActions,
     videoRef,
     personalities: PERSONALITIES
   };
 };
 
 export default useVisionAgent;