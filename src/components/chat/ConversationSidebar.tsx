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
    <div className="w-[280px] shrink-0 bg-[#1e1f20]/95 backdrop-blur-2xl border-r border-border/10 flex flex-col max-md:absolute max-md:left-0 max-md:top-0 max-md:h-full max-md:z-50 max-md:shadow-2xl max-md:shadow-black/40">
      {/* Header with New Chat Button */}
      <div className="p-4 space-y-4">
        <Button
          onClick={onCreateNew}
          className="w-[140px] h-10 rounded-full bg-muted/40 hover:bg-muted/60 text-foreground border border-border/10 shadow-sm transition-all duration-300 text-[14px] font-medium gap-2.5 justify-center"
        >
          <Plus className="h-4.5 w-4.5 text-muted-foreground" /> New chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-3">
        <div className="pb-4 space-y-6">
          {groupOrder.map(group => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} className="space-y-1">
                <div className="px-3 py-1 mb-1">
                  <span className="text-[12px] font-semibold text-foreground/80 tracking-wide">
                    {group}
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  <div className="space-y-0.5">
                    {items.map((conv, i) => {
                      const isActive = currentConversationId === conv.id;
                      const isHovered = hoveredId === conv.id;
                      return (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02, duration: 0.2 }}
                          className="relative"
                          onMouseEnter={() => setHoveredId(conv.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <div
                            className={`relative flex items-center gap-3 px-3 py-2 rounded-full cursor-pointer transition-all duration-200 ${
                              isActive
                                ? 'bg-muted/60 text-foreground'
                                : 'hover:bg-muted/30 text-foreground/70'
                            }`}
                            onClick={() => onSelect(conv.id)}
                          >
                            <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[13.5px] leading-snug truncate block ${
                                isActive ? 'font-medium' : 'font-normal'
                              }`}>
                                {conv.title}
                              </span>
                            </div>
                            <AnimatePresence>
                              {(isHovered || isActive) && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.1 }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-muted/80 transition-all"
                                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 opacity-60" />
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
        </div>
      </ScrollArea>

      {/* Sidebar Footer Search */}
      <div className="p-4 border-t border-border/10 space-y-3">
        {conversations.length > 2 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search history"
              className="h-9 pl-9 text-xs rounded-full bg-muted/20 border-transparent focus:bg-muted/30 focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground/30"
            />
          </div>
        )}

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
