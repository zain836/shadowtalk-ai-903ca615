import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
  lastUpdated: number;
}

interface LiveCursorsProps {
  channelName: string;
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

const CURSOR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"
];

const getUserColor = (userId: string) => {
  const index = userId.charCodeAt(0) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

export const LiveCursors = ({ channelName, containerRef, enabled = true }: LiveCursorsProps) => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const throttleRef = useRef<number>(0);
  
  const userName = user?.email?.split('@')[0] || 'Anonymous';
  const userColor = user ? getUserColor(user.id) : CURSOR_COLORS[0];

  // Broadcast cursor position
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !user || !enabled) return;
    
    // Throttle to 30fps
    const now = Date.now();
    if (now - throttleRef.current < 33) return;
    throttleRef.current = now;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        x,
        y,
        userId: user.id,
        userName,
        color: userColor,
        lastUpdated: now,
      },
    });
  }, [user, userName, userColor, enabled]);

  // Track mouse movement
  useEffect(() => {
    if (!containerRef.current || !enabled) return;
    
    const container = containerRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      broadcastCursor(x, y);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef, broadcastCursor, enabled]);

  // Subscribe to cursor updates
  useEffect(() => {
    if (!user || !enabled) return;
    
    const channel = supabase.channel(`cursors-${channelName}`)
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.userId === user.id) return;
        
        setCursors(prev => {
          const updated = new Map(prev);
          updated.set(payload.userId, payload as CursorPosition);
          return updated;
        });
      })
      .subscribe();
    
    channelRef.current = channel;
    
    // Clean up stale cursors every 2 seconds
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const updated = new Map(prev);
        prev.forEach((cursor, id) => {
          if (now - cursor.lastUpdated > 5000) {
            updated.delete(id);
          }
        });
        return updated;
      });
    }, 2000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [user, channelName, enabled]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {Array.from(cursors.values()).map(cursor => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: `${cursor.x}%`,
              y: `${cursor.y}%`,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
            className="absolute"
            style={{ 
              left: 0, 
              top: 0,
              transform: `translate(${cursor.x}%, ${cursor.y}%)`,
            }}
          >
            {/* Cursor Arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` }}
            >
              <path
                d="M5 3L19 12L12 13L8 21L5 3Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            
            {/* User Label */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-5 top-5 px-2 py-0.5 rounded-full text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
