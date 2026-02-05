 import { Wifi, WifiOff, Loader2, Shield } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 import { useAutoOfflineAI } from "@/hooks/useAutoOfflineAI";
 import { cn } from "@/lib/utils";
 
 export const SovereignModeIndicator = () => {
   const { 
     isModelReady, 
     isDownloading, 
     isLoadingEngine, 
     downloadProgress,
     activeModelName,
     isEngineLoaded 
   } = useAutoOfflineAI();
   
   const isOffline = !navigator.onLine;
 
   // Don't show anything if online and not doing anything special
   if (!isOffline && !isLoadingEngine && !isDownloading) {
     return null;
   }
 
   // Show loading indicator when preparing offline AI
   if (isLoadingEngine || isDownloading) {
     return (
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Badge 
               variant="secondary" 
               className="gap-1.5 px-2 py-1 text-xs cursor-default"
             >
               <Loader2 className="h-3 w-3 animate-spin" />
               <span className="hidden sm:inline">
                 {isDownloading ? `${downloadProgress}%` : 'Loading AI...'}
               </span>
             </Badge>
           </TooltipTrigger>
           <TooltipContent>
             {isDownloading 
               ? `Downloading offline AI model (${downloadProgress}%)`
               : 'Loading local AI engine...'
             }
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
     );
   }
 
   // Show offline mode indicator
   if (isOffline) {
     return (
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Badge 
               variant={isEngineLoaded ? "default" : "secondary"}
               className={cn(
                 "gap-1.5 px-2 py-1 text-xs cursor-default",
                 isEngineLoaded && "bg-emerald-600 hover:bg-emerald-600"
               )}
             >
               {isEngineLoaded ? (
                 <>
                   <Shield className="h-3 w-3" />
                   <span className="hidden sm:inline">Offline AI</span>
                 </>
               ) : (
                 <>
                   <WifiOff className="h-3 w-3" />
                   <span className="hidden sm:inline">Offline</span>
                 </>
               )}
             </Badge>
           </TooltipTrigger>
           <TooltipContent>
             {isEngineLoaded 
               ? `🛡️ Using local AI (${activeModelName || 'SmolLM2'}). All data stays on device.`
               : isModelReady 
                 ? 'Offline - Local AI available, loading...'
                 : 'Offline - No local AI model available'
             }
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
     );
   }
 
   return null;
 };
