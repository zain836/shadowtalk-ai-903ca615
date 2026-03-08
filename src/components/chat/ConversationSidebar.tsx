import { Plus, MessageSquare, Trash2, Trash, Search, Sparkles, Clock, Hash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onCreateNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll?: () => void;
}

const getDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This Week';
  if (days < 30) return 'This Month';
  return 'Older';
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const groupConversations = (conversations: Conversation[]) => {
  const groups: Record<string, Conversation[]> = {};
  conversations.forEach(conv => {
    const group = getDateGroup(conv.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
  });
  return groups;
};

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onCreateNew,
  onSelect,
  onDelete,
  onClearAll,
}: ConversationSidebarProps) => {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = search.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const grouped = groupConversations(filtered);
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  return (
    <div className="w-[280px] shrink-0 bg-background/70 backdrop-blur-2xl border-r border-border/15 flex flex-col max-md:absolute max-md:left-0 max-md:top-0 max-md:h-full max-md:z-50 max-md:shadow-2xl max-md:shadow-black/40">
      {/* Header */}
      <div className="p-3 pb-2 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-foreground tracking-tight">Conversations</h2>
              <p className="text-[10px] text-muted-foreground font-medium">{conversations.length} chats</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onCreateNew}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 text-[13px] font-semibold gap-2"
        >
          <Plus className="h-4 w-4" /> New Conversation
        </Button>

        {/* Search */}
        {conversations.length > 2 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="h-9 pl-9 text-xs rounded-xl bg-muted/30 border-border/30 focus:border-primary/40 focus:bg-muted/50 transition-all duration-200 placeholder:text-muted-foreground/40"
            />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <div className="pb-3 space-y-3">
          {groupOrder.map(group => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group}>
                <div className="flex items-center gap-2 px-2 py-1.5 mb-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {group}
                  </span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>
                <AnimatePresence initial={false}>
                  <div className="space-y-0.5">
                    {items.map((conv, i) => {
                      const isActive = currentConversationId === conv.id;
                      const isHovered = hoveredId === conv.id;
                      return (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25, ease: 'easeOut' }}
                          className="relative"
                          onMouseEnter={() => setHoveredId(conv.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                          <div
                            className={`relative flex items-start gap-3 pl-4 pr-2 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                              isActive
                                ? 'bg-primary/8 border border-primary/15'
                                : 'hover:bg-muted/40 border border-transparent'
                            }`}
                            onClick={() => onSelect(conv.id)}
                          >
                            <div className={`mt-0.5 w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                              isActive
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted/40 text-muted-foreground/50'
                            }`}>
                              <MessageSquare className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <span className={`text-[13px] leading-snug line-clamp-2 block transition-colors ${
                                isActive ? 'font-medium text-foreground' : 'text-foreground/70'
                              }`}>
                                {conv.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground/40 font-mono tabular-nums">
                                {formatTime(conv.created_at)}
                              </span>
                            </div>
                            <AnimatePresence>
                              {(isHovered || isActive) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground/50 font-medium">
                {search ? 'No matching conversations' : 'No conversations yet'}
              </p>
              {!search && (
                <p className="text-[10px] text-muted-foreground/30 mt-1">
                  Start a new conversation above
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {conversations.length > 0 && onClearAll && (
        <div className="p-2.5 border-t border-border/20">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-[11px] text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 rounded-lg gap-1.5 font-medium transition-all"
              >
                <Trash className="h-3 w-3" /> Clear all conversations
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
