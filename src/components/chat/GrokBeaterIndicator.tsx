 import React from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { 
   Wifi, WifiOff, Shield, Zap, Brain, Sparkles, 
   Lock, Eye, Server, Globe, Cpu, HardDrive
 } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 
 interface GrokBeaterIndicatorProps {
   isOffline: boolean;
   isOfflineReady: boolean;
   activeModel?: string | null;
   isMultiModelActive: boolean;
   isPrivacyMode: boolean;
   documentsLoaded: number;
 }
 
 // Grok advantages vs our advantages
 const GROK_COMPARISON = {
   grok: ['Twitter/X data', 'Fast responses', 'Fun personality'],
   shadowtalk: ['100% Offline AI', 'Multi-Model Consensus', 'Zero-Knowledge Privacy', 'Document Intelligence', 'Custom Agents', 'Local-First Data']
 };
 
 export const GrokBeaterIndicator: React.FC<GrokBeaterIndicatorProps> = ({
   isOffline,
   isOfflineReady,
   activeModel,
   isMultiModelActive,
   isPrivacyMode,
   documentsLoaded
 }) => {
   // Calculate our edge over Grok
   const activeAdvantages: string[] = [];
   
   if (isOfflineReady) activeAdvantages.push('Offline AI');
   if (isMultiModelActive) activeAdvantages.push('Multi-Model');
   if (isPrivacyMode) activeAdvantages.push('Zero-Knowledge');
   if (documentsLoaded > 0) activeAdvantages.push('RAG Enabled');
 
   return (
     <div className="flex items-center gap-2">
       {/* Network Status */}
       <AnimatePresence mode="wait">
         {isOffline ? (
           <motion.div
             key="offline"
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             className="flex items-center gap-1.5"
           >
             <div className="relative">
               <WifiOff className="h-4 w-4 text-amber-500" />
               <motion.div
                 animate={{ scale: [1, 1.3, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-amber-500/20 rounded-full -z-10"
               />
             </div>
             {isOfflineReady && (
               <Badge variant="outline" className="text-[10px] h-5 gap-1 border-amber-500/50 text-amber-500 bg-amber-500/10">
                 <Cpu className="h-3 w-3" />
                 {activeModel || 'Local AI'}
               </Badge>
             )}
           </motion.div>
         ) : (
           <motion.div
             key="online"
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             className="flex items-center gap-1.5"
           >
             <Wifi className="h-4 w-4 text-green-500" />
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Multi-Model Indicator */}
       {isMultiModelActive && (
         <motion.div
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
         >
           <Badge variant="outline" className="text-[10px] h-5 gap-1 border-violet-500/50 text-violet-500 bg-violet-500/10">
             <Brain className="h-3 w-3" />
             Consensus
           </Badge>
         </motion.div>
       )}
 
       {/* Privacy Mode */}
       {isPrivacyMode && (
         <motion.div
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
         >
           <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-500/50 text-emerald-500 bg-emerald-500/10">
             <Shield className="h-3 w-3" />
             Private
           </Badge>
         </motion.div>
       )}
 
       {/* Documents Loaded */}
       {documentsLoaded > 0 && (
         <motion.div
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
         >
           <Badge variant="outline" className="text-[10px] h-5 gap-1 border-blue-500/50 text-blue-500 bg-blue-500/10">
             <HardDrive className="h-3 w-3" />
             {documentsLoaded} docs
           </Badge>
         </motion.div>
       )}
     </div>
   );
 };