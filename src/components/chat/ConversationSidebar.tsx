import { Plus, MessageSquare, Trash2, Trash, Search, Sparkles, Clock, Hash, BookOpen, Layers, Archive, Settings2 } from "lucide-react";
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
  onClearAll: () => void;
  onClearCurrent?: () => void;
  onClose?: () => void;
}

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onCreateNew,
  onSelect,
  onDelete,
  onClearAll,
  onClearCurrent,
  onClose,
}: ConversationSidebarProps) => {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, conv) => {
    const date = new Date(conv.created_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let group = "Earlier";
    if (days === 0) group = "Today";
    else if (days === 1) group = "Yesterday";
    else if (days < 7) group = "Last 7 days";
    else if (days < 30) group = "Last 30 days";

    if (!acc[group]) acc[group] = [];
    acc[group].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Earlier"];

  return (
    <div className="w-[280px] shrink-0 bg-[#1e1f20]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col max-md:absolute max-md:left-0 max-md:top-0 max-md:h-full max-md:z-50 max-md:shadow-2xl h-full">
      {/* Top Section: Action Hub */}
      <div className="p-4 space-y-2 border-b border-white/5">
        <Button
          onClick={onCreateNew}
          className="w-full h-10 rounded-full bg-[#2b2c2d] hover:bg-[#333537] text-foreground border border-white/5 shadow-sm transition-all duration-300 text-[14px] font-medium gap-2.5 justify-center"
        >
          <Plus className="h-4 w-4 text-blue-400" /> New chat
        </Button>
        {onClearCurrent && currentConversationId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCurrent}
            className="w-full h-9 rounded-full text-[12px] text-muted-foreground hover:text-foreground"
          >
            <Trash className="h-3.5 w-3.5 mr-2" /> Clear this chat
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="pb-4 space-y-8">
          {/* Notebooks Section - Neural Expressive */}
          <div className="space-y-1">
            <div className="px-3 py-1 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                Notebooks
              </span>
              <BookOpen className="h-3 w-3 text-muted-foreground/30" />
            </div>
            <div className="px-3 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 cursor-pointer hover:bg-blue-500/15 transition-all">
              <Layers className="h-4 w-4 text-blue-400" />
              <span className="text-[13px] font-medium text-blue-100">Project Workspace</span>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-6">
            {groupOrder.map(group => {
              const items = grouped[group];
              if (!items || items.length === 0) return null;
              return (
                <div key={group} className="space-y-1">
                  <div className="px-3 py-1 mb-1">
                    <span className="text-[11px] font-bold text-muted-foreground/40 tracking-widest uppercase">
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
                            transition={{ delay: i * 0.01, duration: 0.2 }}
                            className="relative"
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            <div
                              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-full cursor-pointer transition-all duration-200 ${
                                isActive
                                  ? 'bg-[#2b2c2d] text-foreground'
                                  : 'hover:bg-muted/20 text-foreground/70'
                              }`}
                              onClick={() => onSelect(conv.id)}
                            >
                              <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'opacity-40'}`} />
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
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-muted/40 transition-all"
                                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 opacity-40 hover:opacity-100 hover:text-destructive" />
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
        </div>
      </ScrollArea>

      {/* Bottom Hub: Tools & Search */}
      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" className="h-9 rounded-xl gap-2 justify-start px-3 text-[12px] text-muted-foreground/60 hover:text-foreground hover:bg-white/5">
            <Archive className="h-3.5 w-3.5" /> Archived
          </Button>
          <Button variant="ghost" size="sm" className="h-9 rounded-xl gap-2 justify-start px-3 text-[12px] text-muted-foreground/60 hover:text-foreground hover:bg-white/5">
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </Button>
        </div>

        {conversations.length > 2 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chat history"
              className="h-9 pl-10 text-[12.5px] rounded-full bg-muted/20 border-transparent focus:bg-muted/30 focus:border-transparent transition-all duration-300 placeholder:text-muted-foreground/30"
            />
          </div>
        )}

        {conversations.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-9 rounded-xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all"
              >
                Clear all chats
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1e1f20] border-white/10 rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently delete all your conversation history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};
