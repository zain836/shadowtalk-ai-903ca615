import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MessageSquare, Zap, Brain, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

const tabMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

interface ActivityTabProps {
  userId: string;
}

export const ActivityTab = ({ userId }: ActivityTabProps) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0, streak: 0, lastActive: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [convRes, msgRes, streakRes] = await Promise.all([
          supabase.from("conversations").select("id, title, created_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(10),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("user_streaks").select("*").eq("user_id", userId).maybeSingle(),
        ]);

        setConversations(convRes.data || []);
        setStats({
          totalConversations: convRes.data?.length || 0,
          totalMessages: msgRes.count || 0,
          streak: streakRes.data?.current_streak || 0,
          lastActive: streakRes.data?.last_active_date || "",
        });
      } catch (e) {
        console.error("Failed to load activity", e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [userId]);

  return (
    <motion.div {...tabMotion} className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Conversations", value: stats.totalConversations, icon: MessageSquare, color: "text-blue-400" },
          { label: "Messages Sent", value: stats.totalMessages, icon: Brain, color: "text-violet-400" },
          { label: "Day Streak", value: `${stats.streak}🔥`, icon: Zap, color: "text-amber-400" },
          { label: "Last Active", value: stats.lastActive ? formatDistanceToNow(new Date(stats.lastActive), { addSuffix: true }) : "Today", icon: Clock, color: "text-emerald-400" },
        ].map((stat, i) => (
          <Card key={i} className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Recent Activity
          </CardTitle>
          <CardDescription>Your latest conversations and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/70">Start chatting to see your activity here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div key={conv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title || "Untitled Conversation"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.updated_at), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
