 import React from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Sparkles, Zap, Brain, Shield, Lock } from 'lucide-react';
 
 // Floating particles effect for premium feel
 export const FloatingParticles: React.FC<{ count?: number }> = ({ count = 15 }) => {
   return (
     <div className="absolute inset-0 overflow-hidden pointer-events-none">
       {Array.from({ length: count }).map((_, i) => (
         <motion.div
           key={i}
           className="absolute w-1 h-1 rounded-full bg-primary/20"
           initial={{
             x: Math.random() * 100 + '%',
             y: '100%',
             opacity: 0,
           }}
           animate={{
             y: '-10%',
             opacity: [0, 0.5, 0],
           }}
           transition={{
             duration: 8 + Math.random() * 4,
             repeat: Infinity,
             delay: Math.random() * 5,
             ease: 'linear',
           }}
         />
       ))}
     </div>
   );
 };
 
 // Message send animation
 export const SendPulse: React.FC<{ trigger: boolean }> = ({ trigger }) => {
   return (
     <AnimatePresence>
       {trigger && (
         <motion.div
           initial={{ scale: 0.8, opacity: 1 }}
           animate={{ scale: 2, opacity: 0 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
           className="absolute inset-0 rounded-full bg-primary/30"
         />
       )}
     </AnimatePresence>
   );
 };
 
 // AI Response glow effect
 export const AIResponseGlow: React.FC<{ isActive: boolean }> = ({ isActive }) => {
   return (
     <AnimatePresence>
       {isActive && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: [0.3, 0.6, 0.3] }}
           exit={{ opacity: 0 }}
           transition={{ duration: 2, repeat: Infinity }}
           className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-lg -z-10"
         />
       )}
     </AnimatePresence>
   );
 };
 
 // Privacy shield animation
 export const PrivacyShield: React.FC<{ isActive: boolean }> = ({ isActive }) => {
   return (
     <AnimatePresence>
       {isActive && (
         <motion.div
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0, opacity: 0 }}
           className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30"
         >
           <motion.div
             animate={{ rotate: [0, 10, -10, 0] }}
             transition={{ duration: 2, repeat: Infinity }}
           >
             <Shield className="h-3.5 w-3.5 text-emerald-500" />
           </motion.div>
           <span className="text-xs text-emerald-500 font-medium">Encrypted</span>
           <Lock className="h-3 w-3 text-emerald-500/70" />
         </motion.div>
       )}
     </AnimatePresence>
   );
 };
 
 // Multi-model consensus visualization
 interface ConsensusVisualizerProps {
   models: string[];
   activeIndex: number;
   isComplete: boolean;
 }
 
 export const ConsensusVisualizer: React.FC<ConsensusVisualizerProps> = ({ 
   models, 
   activeIndex, 
   isComplete 
 }) => {
   return (
     <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
       {models.map((model, idx) => (
         <motion.div
           key={model}
           className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
             idx < activeIndex 
               ? 'bg-green-500/20 text-green-500' 
               : idx === activeIndex 
               ? 'bg-primary/20 text-primary animate-pulse' 
               : 'bg-muted text-muted-foreground'
           }`}
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: idx * 0.1 }}
         >
           {idx < activeIndex ? (
             <Sparkles className="h-3 w-3" />
           ) : idx === activeIndex ? (
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
             >
               <Zap className="h-3 w-3" />
             </motion.div>
           ) : (
             <Brain className="h-3 w-3" />
           )}
           <span className="hidden sm:inline">{model}</span>
         </motion.div>
       ))}
       
       {isComplete && (
         <motion.div
           initial={{ opacity: 0, x: 10 }}
           animate={{ opacity: 1, x: 0 }}
           className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/20 text-violet-500 text-xs font-medium"
         >
           <Sparkles className="h-3 w-3" />
           Consensus
         </motion.div>
       )}
     </div>
   );
 };
 
 // Voice wave visualization
 export const VoiceWave: React.FC<{ isActive: boolean; intensity?: number }> = ({ 
   isActive, 
   intensity = 0.5 
 }) => {
   const bars = 5;
   
   return (
     <div className="flex items-center gap-0.5 h-4">
       {Array.from({ length: bars }).map((_, i) => (
         <motion.div
           key={i}
           className="w-0.5 bg-primary rounded-full"
           animate={isActive ? {
             height: [4, 12 * intensity, 4],
           } : { height: 4 }}
           transition={{
             duration: 0.5,
             repeat: isActive ? Infinity : 0,
             delay: i * 0.1,
           }}
         />
       ))}
     </div>
   );
 };
 
 // Success checkmark animation
 export const SuccessCheck: React.FC<{ show: boolean }> = ({ show }) => {
   return (
     <AnimatePresence>
       {show && (
         <motion.svg
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0, opacity: 0 }}
           className="h-5 w-5 text-green-500"
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           strokeWidth={3}
         >
           <motion.path
             d="M5 12l5 5L19 7"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: 1 }}
             transition={{ duration: 0.3, delay: 0.1 }}
           />
         </motion.svg>
       )}
     </AnimatePresence>
   );
 };