 import { useState, useEffect, useCallback, useRef } from 'react';
 import { useVisionAgent, VisionAnalysis } from '@/hooks/useVisionAgent';
 import { VisionOverlay } from './VisionOverlay';
 import { PrivacyControls } from './PrivacyControls';
 import { useToast } from '@/hooks/use-toast';
 import { Button } from '@/components/ui/button';
 import { Eye, EyeOff, Volume2, VolumeX, Settings } from 'lucide-react';
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
 } from '@/components/ui/sheet';
 
 interface VisionAgentProps {
   onMessage?: (message: string, isProactive?: boolean) => void;
   onPersonalityChange?: (personalityId: string) => void;
   onGestureCommand?: (gesture: string) => void;
   isEnabled?: boolean;
 }
 
 export const VisionAgent = ({ 
   onMessage, 
   onPersonalityChange,
   onGestureCommand,
   isEnabled = false 
 }: VisionAgentProps) => {
   const { toast } = useToast();
   const { state, actions, videoRef, personalities } = useVisionAgent();
   
   // Local state
   const [showSettings, setShowSettings] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [analysisInterval, setAnalysisInterval] = useState(3000); // 3 seconds
   const [autoSpeak, setAutoSpeak] = useState(true);
   const [showPreview, setShowPreview] = useState(true);
   
   // Refs
   const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
   const lastEmotionRef = useRef<string | null>(null);
   const lastGestureRef = useRef<string | null>(null);
   const greetedRef = useRef(false);
   
   // Start/stop based on isEnabled prop
   useEffect(() => {
     if (isEnabled && !state.isActive) {
       actions.start();
     } else if (!isEnabled && state.isActive) {
       actions.stop();
     }
   }, [isEnabled, state.isActive, actions]);
   
   // Main analysis loop
   useEffect(() => {
     if (!state.isActive) {
       if (analysisTimerRef.current) {
         clearInterval(analysisTimerRef.current);
         analysisTimerRef.current = null;
       }
       return;
     }
     
     const runAnalysis = async () => {
       const frame = await actions.captureFrame();
       if (!frame) return;
       
       const analysis = await actions.analyzeFrame(frame);
       if (!analysis) return;
       
       // Handle personality change
       if (analysis.emotion !== lastEmotionRef.current) {
         lastEmotionRef.current = analysis.emotion;
         const personality = actions.getPersonalityForEmotion(analysis.emotion);
         onPersonalityChange?.(personality.id);
         
         // Proactive greeting on significant emotion change
         if (autoSpeak && !isMuted && !greetedRef.current) {
           greetedRef.current = true;
           const greeting = personality.greetings[Math.floor(Math.random() * personality.greetings.length)];
           
           // Speak the greeting
           actions.speak(greeting);
           
           // Send to chat
           onMessage?.(greeting, true);
         }
       }
       
       // Handle gesture commands
       if (analysis.gesture_detected && analysis.gesture_detected !== lastGestureRef.current) {
         lastGestureRef.current = analysis.gesture_detected;
         
         switch (analysis.gesture_detected) {
           case 'wave':
             const waveResponse = "👋 Hey there! *waves back* What can I do for you?";
             if (!isMuted) actions.speak(waveResponse);
             onMessage?.(waveResponse, true);
             break;
           case 'thumbs_up':
             toast({ title: "👍 Got it!", description: "Proceeding as planned" });
             onGestureCommand?.('confirm');
             break;
           case 'palm_stop':
             toast({ title: "✋ Stopping", description: "Action cancelled" });
             onGestureCommand?.('stop');
             break;
           case 'thinking':
             // User is thinking - stay quiet
             break;
         }
         
         // Reset after 5 seconds
         setTimeout(() => {
           lastGestureRef.current = null;
         }, 5000);
       }
       
       // Proactive actions based on engagement
       if (analysis.engagement_level === 'distracted' && state.lastSpokenAt) {
         const timeSinceSpeak = Date.now() - state.lastSpokenAt;
         if (timeSinceSpeak > 30000) { // 30 seconds
           const checkIn = "Hey, you seem distracted. Need a break or should we refocus?";
           if (!isMuted && autoSpeak) {
             actions.speak(checkIn);
             onMessage?.(checkIn, true);
           }
         }
       }
       
       // Handle tired user
       if (analysis.emotion === 'tired' && !isMuted && autoSpeak) {
         const timeSinceSpeak = state.lastSpokenAt ? Date.now() - state.lastSpokenAt : Infinity;
         if (timeSinceSpeak > 60000) { // 1 minute
           const suggestion = "You look tired. Maybe a quick break would help? I can set a timer if you'd like.";
           actions.speak(suggestion);
           onMessage?.(suggestion, true);
         }
       }
     };
     
     // Initial analysis
     runAnalysis();
     
     // Start interval
     analysisTimerRef.current = setInterval(runAnalysis, analysisInterval);
     
     return () => {
       if (analysisTimerRef.current) {
         clearInterval(analysisTimerRef.current);
       }
     };
   }, [state.isActive, analysisInterval, autoSpeak, isMuted, actions, onMessage, onPersonalityChange, onGestureCommand, toast, state.lastSpokenAt]);
   
   // Toggle handler
   const handleToggle = useCallback(async () => {
     if (state.isActive) {
       actions.stop();
     } else {
       await actions.start();
     }
   }, [state.isActive, actions]);
   
   if (!isEnabled && !state.isActive) {
     return null;
   }
   
   return (
     <>
       {/* Main Vision Agent UI */}
       <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
         {/* Camera Preview */}
         {showPreview && state.isActive && (
           <VisionOverlay
             analysis={state.currentAnalysis}
             personality={state.currentPersonality}
             isAnalyzing={state.isAnalyzing}
             videoRef={videoRef}
           />
         )}
         
         {/* Control Buttons */}
         <div className="flex gap-2 justify-end">
           {state.isActive && (
             <>
               <Button
                 variant="outline"
                 size="icon"
                 onClick={() => setShowPreview(!showPreview)}
                 className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
               >
                 {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
               </Button>
               
               <Button
                 variant="outline"
                 size="icon"
                 onClick={() => setIsMuted(!isMuted)}
                 className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
               >
                 {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
               </Button>
               
               <Sheet open={showSettings} onOpenChange={setShowSettings}>
                 <SheetTrigger asChild>
                   <Button
                     variant="outline"
                     size="icon"
                     className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                   >
                     <Settings className="h-4 w-4" />
                   </Button>
                 </SheetTrigger>
                 <SheetContent>
                   <SheetHeader>
                     <SheetTitle>Vision Agent Settings</SheetTitle>
                   </SheetHeader>
                   <PrivacyControls
                     analysisInterval={analysisInterval}
                     onIntervalChange={setAnalysisInterval}
                     autoSpeak={autoSpeak}
                     onAutoSpeakChange={setAutoSpeak}
                     onStop={actions.stop}
                   />
                 </SheetContent>
               </Sheet>
             </>
           )}
           
           {/* Main Toggle */}
           <Button
             variant={state.isActive ? "destructive" : "default"}
             size="icon"
             onClick={handleToggle}
             className={`h-12 w-12 rounded-full shadow-lg ${state.isActive ? 'animate-pulse' : ''}`}
           >
             <Eye className="h-5 w-5" />
           </Button>
         </div>
       </div>
     </>
   );
 };
 
 export default VisionAgent;