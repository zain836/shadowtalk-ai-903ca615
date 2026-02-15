import { Plus, MessageSquare, Trash2, Trash, Search, Sparkles } from "lucide-react";
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  const filtered = search.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="w-[280px] shrink-0 bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col max-md:absolute max-md:left-0 max-md:top-0 max-md:h-full max-md:z-50 max-md:shadow-2xl">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Chats</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
            {conversations.length}
          </span>
        </div>

        <Button
          onClick={onCreateNew}
          className="w-full h-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all duration-200 text-sm font-medium"
          variant="ghost"
        >
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>

        {/* Search */}
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="h-8 pl-8 text-xs rounded-lg bg-muted/50 border-border/50 focus:border-primary/50"
            />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <AnimatePresence initial={false}>
          <div className="space-y-0.5 pb-3">
            {filtered.map((conv, i) => {
              const isActive = currentConversationId === conv.id;
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 border border-primary/30 shadow-sm'
                      : 'hover:bg-muted/60 border border-transparent'
                  }`}
                  onClick={() => onSelect(conv.id)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    isActive ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : 'bg-muted-foreground/30'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm truncate block ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {conv.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      {formatDate(conv.created_at)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </ScrollArea>

      {/* Footer */}
      {conversations.length > 0 && onClearAll && (
        <div className="p-3 border-t border-border/30">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground hover:text-destructive rounded-lg"
              >
                <Trash className="h-3 w-3 mr-1.5" /> Clear all
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
