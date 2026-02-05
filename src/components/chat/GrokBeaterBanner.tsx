 import React from 'react';
 import { motion } from 'framer-motion';
 import { 
   Sparkles, Shield, Brain, Wifi, WifiOff, 
   Zap, Eye, Lock, Server, Trophy
 } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 
 interface GrokBeaterBannerProps {
   advantages: {
     offline: boolean;
     multiModel: boolean;
     privacy: boolean;
     documents: number;
     voice: boolean;
   };
 }
 
 // Show what ShadowTalk does that Grok can't
 export const GrokBeaterBanner: React.FC<GrokBeaterBannerProps> = ({ advantages }) => {
   const activeCount = Object.values(advantages).filter(v => v === true || (typeof v === 'number' && v > 0)).length;
   
   if (activeCount === 0) return null;
 
   const features = [
     { key: 'offline', label: 'Offline AI', icon: WifiOff, active: advantages.offline, color: 'text-amber-500' },
     { key: 'multiModel', label: 'Multi-Model', icon: Brain, active: advantages.multiModel, color: 'text-violet-500' },
     { key: 'privacy', label: 'Zero-Knowledge', icon: Shield, active: advantages.privacy, color: 'text-emerald-500' },
     { key: 'documents', label: `${advantages.documents} Docs`, icon: Server, active: advantages.documents > 0, color: 'text-blue-500' },
     { key: 'voice', label: 'Voice AI', icon: Zap, active: advantages.voice, color: 'text-pink-500' },
   ].filter(f => f.active);
 
   return (
     <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       className="flex items-center justify-center gap-2 py-1.5 px-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/30"
     >
       <Trophy className="h-3.5 w-3.5 text-amber-500" />
       <span className="text-xs text-muted-foreground font-medium">Active Advantages:</span>
       
       <div className="flex items-center gap-1.5">
         {features.map((feature, idx) => (
           <motion.div
             key={feature.key}
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: idx * 0.1 }}
           >
             <Badge 
               variant="outline" 
               className={`text-[10px] h-5 gap-1 ${feature.color} border-current/30 bg-current/5`}
             >
               <feature.icon className="h-3 w-3" />
               {feature.label}
             </Badge>
           </motion.div>
         ))}
       </div>
       
       <span className="text-[10px] text-muted-foreground/70 ml-2">
         ({activeCount} features Grok doesn't have)
       </span>
     </motion.div>
   );
 };