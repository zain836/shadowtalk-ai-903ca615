import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UserPresence {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  lastActive: string;
  isTyping?: boolean;
}

interface UseRealtimePresenceOptions {
  channelName: string;
  throttleMs?: number;
}

const generateAvatarColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export const useRealtimePresence = ({ channelName, throttleMs = 50 }: UseRealtimePresenceOptions) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const currentUserPresence: UserPresence | null = user
    ? {
        id: user.id,
        email: user.email || "",
        displayName: user.email?.split("@")[0] || "Anonymous",
        avatarColor: generateAvatarColor(user.email || user.id),
        lastActive: new Date().toISOString(),
      }
    : null;

  useEffect(() => {
    if (!user || !channelName) return;

    const channel = supabase.channel(`presence:${channelName}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserPresence>();
        const users: UserPresence[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          if (presences.length > 0) {
            users.push(presences[0] as UserPresence);
          }
        });
        
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUserPresence) {
          setIsConnected(true);
          await channel.track(currentUserPresence);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      setIsConnected(false);
    };
  }, [user, channelName]);

  const updateCursor = useCallback((position: { x: number; y: number }) => {
    if (!channelRef.current || !currentUserPresence) return;
    
    const now = Date.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    lastUpdateRef.current = now;

    channelRef.current.track({
      ...currentUserPresence,
      cursor: position,
      lastActive: new Date().toISOString(),
    });
  }, [currentUserPresence, throttleMs]);

  const updateSelection = useCallback((selection: { start: number; end: number }) => {
    if (!channelRef.current || !currentUserPresence) return;

    channelRef.current.track({
      ...currentUserPresence,
      selection,
      lastActive: new Date().toISOString(),
    });
  }, [currentUserPresence]);

  const setTypingStatus = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !currentUserPresence) return;

    channelRef.current.track({
      ...currentUserPresence,
      isTyping,
      lastActive: new Date().toISOString(),
    });
  }, [currentUserPresence]);

  const otherUsers = onlineUsers.filter((u) => u.id !== user?.id);

  return {
    onlineUsers,
    otherUsers,
    isConnected,
    updateCursor,
    updateSelection,
    setTypingStatus,
    currentUser: currentUserPresence,
  };
};

export default useRealtimePresence;
