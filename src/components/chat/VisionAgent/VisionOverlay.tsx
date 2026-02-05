 import { RefObject, useEffect, useRef } from 'react';
 import { VisionAnalysis, AgentPersonality } from '@/hooks/useVisionAgent';
 import { Badge } from '@/components/ui/badge';
 import { Loader2, Smile, Frown, Meh, HelpCircle, Angry, Moon, Sparkles, Hand } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface VisionOverlayProps {
   analysis: VisionAnalysis | null;
   personality: AgentPersonality;
   isAnalyzing: boolean;
   videoRef: RefObject<HTMLVideoElement | null>;
 }
 
 const EMOTION_ICONS: Record<VisionAnalysis['emotion'], typeof Smile> = {
   happy: Smile,
   sad: Frown,
   neutral: Meh,
   confused: HelpCircle,
   frustrated: Angry,
   tired: Moon,
   excited: Sparkles
 };
 
 const EMOTION_COLORS: Record<VisionAnalysis['emotion'], string> = {
   happy: 'bg-green-500/20 border-green-500 text-green-500',
   sad: 'bg-blue-500/20 border-blue-500 text-blue-500',
   neutral: 'bg-gray-500/20 border-gray-500 text-gray-500',
   confused: 'bg-yellow-500/20 border-yellow-500 text-yellow-500',
   frustrated: 'bg-red-500/20 border-red-500 text-red-500',
   tired: 'bg-purple-500/20 border-purple-500 text-purple-500',
   excited: 'bg-pink-500/20 border-pink-500 text-pink-500'
 };
 
 const ENGAGEMENT_COLORS: Record<VisionAnalysis['engagement_level'], string> = {
   high: 'text-green-500',
   medium: 'text-yellow-500',
   low: 'text-orange-500',
   distracted: 'text-red-500'
 };
 
 export const VisionOverlay = ({ 
   analysis, 
   personality, 
   isAnalyzing,
   videoRef 
 }: VisionOverlayProps) => {
   const localVideoRef = useRef<HTMLVideoElement>(null);
   
   // Sync with external video stream
   useEffect(() => {
     if (videoRef.current && localVideoRef.current) {
       localVideoRef.current.srcObject = videoRef.current.srcObject;
       localVideoRef.current.play().catch(() => {});
     }
   }, [videoRef.current?.srcObject]);
   
   const EmotionIcon = analysis ? EMOTION_ICONS[analysis.emotion] : Meh;
   
   return (
     <div className="relative w-48 h-36 rounded-lg overflow-hidden shadow-xl border-2 border-primary/50 bg-black">
       {/* Video Feed */}
       <video
         ref={localVideoRef}
         autoPlay
         playsInline
         muted
         className="w-full h-full object-cover scale-x-[-1]"
       />
       
       {/* Analysis Overlay */}
       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
         {/* Status Bar */}
         <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
           {/* Recording Indicator */}
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[10px] text-white/80 font-medium">LIVE</span>
           </div>
           
           {/* Analyzing Indicator */}
           {isAnalyzing && (
             <Loader2 className="h-3 w-3 text-white animate-spin" />
           )}
         </div>
         
         {/* Analysis Results */}
         {analysis && (
           <div className="absolute bottom-2 left-2 right-2 space-y-1">
             {/* Emotion Badge */}
             <div className="flex items-center gap-1.5">
               <Badge 
                 variant="outline" 
                 className={cn(
                   "text-[10px] px-1.5 py-0 border",
                   EMOTION_COLORS[analysis.emotion]
                 )}
               >
                 <EmotionIcon className="h-2.5 w-2.5 mr-1" />
                 {analysis.emotion}
               </Badge>
               
               <Badge 
                 variant="outline"
                 className={cn(
                   "text-[10px] px-1.5 py-0 bg-background/20",
                   ENGAGEMENT_COLORS[analysis.engagement_level]
                 )}
               >
                 {analysis.engagement_level}
               </Badge>
               
               {analysis.gesture_detected && (
                 <Badge 
                   variant="outline"
                   className="text-[10px] px-1.5 py-0 bg-primary/20 border-primary text-primary animate-bounce"
                 >
                   <Hand className="h-2.5 w-2.5 mr-1" />
                   {analysis.gesture_detected}
                 </Badge>
               )}
             </div>
             
             {/* Personality Mode */}
             <div className="text-[9px] text-white/60">
               Mode: {personality.name}
             </div>
           </div>
         )}
         
         {/* No Face Detected */}
         {analysis && !analysis.face_detected && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50">
             <span className="text-xs text-white/80">No face detected</span>
           </div>
         )}
       </div>
       
       {/* Privacy Shield Animation (when no analysis) */}
       {!analysis && !isAnalyzing && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/70">
           <span className="text-xs text-white/60">Initializing...</span>
         </div>
       )}
     </div>
   );
 };
 
 export default VisionOverlay;