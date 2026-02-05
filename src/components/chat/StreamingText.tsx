 import React, { useEffect, useState, useRef } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 
 interface StreamingTextProps {
   text: string;
   isStreaming: boolean;
   speed?: number; // chars per frame
 }
 
 // Premium typing animation effect
 export const StreamingText: React.FC<StreamingTextProps> = ({ 
   text, 
   isStreaming,
   speed = 3 
 }) => {
   const [displayedText, setDisplayedText] = useState('');
   const [showCursor, setShowCursor] = useState(false);
   const textRef = useRef(text);
   const indexRef = useRef(0);
 
   useEffect(() => {
     if (isStreaming) {
       setShowCursor(true);
       textRef.current = text;
       
       const animate = () => {
         if (indexRef.current < textRef.current.length) {
           const nextChunk = textRef.current.slice(0, indexRef.current + speed);
           setDisplayedText(nextChunk);
           indexRef.current += speed;
           requestAnimationFrame(animate);
         }
       };
       
       requestAnimationFrame(animate);
     } else {
       setDisplayedText(text);
       setShowCursor(false);
       indexRef.current = text.length;
     }
   }, [text, isStreaming, speed]);
 
   // Reset when text changes completely
   useEffect(() => {
     if (!text.startsWith(displayedText.slice(0, 20))) {
       indexRef.current = 0;
       setDisplayedText('');
     }
   }, [text]);
 
   return (
     <span className="relative">
       {displayedText}
       <AnimatePresence>
         {showCursor && isStreaming && (
           <motion.span
             initial={{ opacity: 0 }}
             animate={{ opacity: [0, 1, 0] }}
             transition={{ duration: 0.8, repeat: Infinity }}
             className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
           />
         )}
       </AnimatePresence>
     </span>
   );
 };
 
 // Thinking dots animation
 export const ThinkingDots: React.FC<{ className?: string }> = ({ className }) => {
   return (
     <span className={className}>
       <motion.span
         animate={{ opacity: [0.3, 1, 0.3] }}
         transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
       >
         .
       </motion.span>
       <motion.span
         animate={{ opacity: [0.3, 1, 0.3] }}
         transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
       >
         .
       </motion.span>
       <motion.span
         animate={{ opacity: [0.3, 1, 0.3] }}
         transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
       >
         .
       </motion.span>
     </span>
   );
 };
 
 // AI Thinking indicator with stages
 interface ThinkingStageProps {
   stage: 'understanding' | 'reasoning' | 'generating' | 'refining';
 }
 
 const STAGE_INFO = {
   understanding: { text: 'Understanding', icon: '🧠' },
   reasoning: { text: 'Reasoning', icon: '⚡' },
   generating: { text: 'Generating', icon: '✨' },
   refining: { text: 'Refining', icon: '🎯' },
 };
 
 export const ThinkingStage: React.FC<ThinkingStageProps> = ({ stage }) => {
   const info = STAGE_INFO[stage];
   
   return (
     <motion.div
       initial={{ opacity: 0, y: 5 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -5 }}
       className="flex items-center gap-2 text-sm text-muted-foreground"
     >
       <motion.span
         animate={{ scale: [1, 1.2, 1] }}
         transition={{ duration: 0.5, repeat: Infinity }}
       >
         {info.icon}
       </motion.span>
       <span>{info.text}</span>
       <ThinkingDots />
     </motion.div>
   );
 };