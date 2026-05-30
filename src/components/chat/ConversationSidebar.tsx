import {
  Plus,
  MessageSquare,
  Trash2,
  Trash,
  Search,
  BookOpen,
  Layers,
  Archive,
  ArchiveRestore,
  Settings2,
  ArrowLeft,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  archived_at?: string | null;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  isArchived: (conversation: Conversation) => boolean;
  onCreateNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onClearAll: () => void;
  onClearCurrent?: () => void;
  onOpenSettings: () => void;
  onOpenWorkspace?: () => void;
  onClose?: () => void;
}

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  isArchived,
  onCreateNew,
  onSelect,
  onDelete,
  onArchive,
  onUnarchive,
  onClearAll,
  onClearCurrent,
  onOpenSettings,
  onOpenWorkspace,
}: ConversationSidebarProps) => {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showArchivedView, setShowArchivedView] = useState(false);

  const activeConversations = conversations.filter((c) => !isArchived(c));
  const archivedConversations = conversations.filter((c) => isArchived(c));
  const visibleConversations = showArchivedView ? archivedConversations : activeConversations;

  const filtered = visibleConversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce(
    (acc, conv) => {
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
    },
    {} as Record<string, Conversation[]>,
  );

  const groupOrder = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Earlier"];

  return (
    <div className="w-[280px] shrink-0 glass-strong border-r border-border/50 flex flex-col max-md:absolute max-md:left-0 max-md:top-0 max-md:h-full max-md:z-50 max-md:shadow-2xl h-full">
      <div className="p-4 space-y-2 border-b border-border/40">
        {showArchivedView ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchivedView(false)}
            className="w-full h-9 rounded-full justify-start gap-2 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to chats
          </Button>
        ) : (
          <Button
            onClick={onCreateNew}
            className="w-full h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border/50 shadow-sm transition-all duration-300 text-[14px] font-medium gap-2.5 justify-center"
          >
            <Plus className="h-4 w-4 text-primary" /> New chat
          </Button>
        )}
        {!showArchivedView && onClearCurrent && currentConversationId && (
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

      <ScrollArea className="flex-1 px-3">
        <div className="pb-4 space-y-8">
          {showArchivedView ? (
            <div className="px-3 py-2">
              <span className="text-[11px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                Archived chats
              </span>
              {archivedConversations.length === 0 && (
                <p className="text-[13px] text-muted-foreground/60 mt-4 leading-relaxed">
                  No archived chats yet. Hover a conversation and use the archive icon to move it here.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                  Notebooks
                </span>
                <BookOpen className="h-3 w-3 text-muted-foreground/30" />
              </div>
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="w-full px-3 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-3 cursor-pointer hover:bg-primary/15 transition-all text-left"
              >
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-medium text-foreground/90">Project Workspace</span>
              </button>
            </div>
          )}

          <div className="space-y-6">
            {filtered.length === 0 && !showArchivedView && activeConversations.length === 0 && (
              <p className="px-3 text-[13px] text-muted-foreground/60">No conversations yet.</p>
            )}
            {groupOrder.map((group) => {
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
                        const archived = isArchived(conv);
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
                              className={cn(
                                "relative flex items-center gap-3 px-3 py-2.5 rounded-full cursor-pointer transition-all duration-200",
                                isActive
                                  ? "bg-muted text-foreground"
                                  : "hover:bg-muted/20 text-foreground/70",
                              )}
                              onClick={() => onSelect(conv.id)}
                            >
                              <MessageSquare
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  isActive ? "text-primary" : "opacity-40",
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <span
                                  className={cn(
                                    "text-[13.5px] leading-snug truncate block",
                                    isActive ? "font-medium" : "font-normal",
                                  )}
                                >
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
                                    className="flex items-center gap-0.5"
                                  >
                                    {archived ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-muted/40"
                                        title="Restore chat"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onUnarchive(conv.id);
                                        }}
                                      >
                                        <ArchiveRestore className="h-3.5 w-3.5 opacity-60 hover:opacity-100 hover:text-primary" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-muted/40"
                                        title="Archive chat"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onArchive(conv.id);
                                        }}
                                      >
                                        <Archive className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-muted/40"
                                      title="Delete chat"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(conv.id);
                                      }}
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

      <div className="p-4 border-t border-border/40 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setShowArchivedView(true);
            }}
            className={cn(
              "h-9 rounded-xl gap-2 justify-start px-3 text-[12px] hover:text-foreground hover:bg-muted/50",
              showArchivedView
                ? "bg-muted text-foreground"
                : "text-muted-foreground/60",
            )}
          >
            <Archive className="h-3.5 w-3.5" /> Archived
            {archivedConversations.length > 0 && (
              <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                {archivedConversations.length}
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="h-9 rounded-xl gap-2 justify-start px-3 text-[12px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
          >
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </Button>
        </div>

        {conversations.length > 2 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={showArchivedView ? "Search archived" : "Search chat history"}
              className="h-9 pl-10 text-[12.5px] rounded-full bg-muted/20 border-transparent focus:bg-muted/30 focus:border-transparent transition-all duration-300 placeholder:text-muted-foreground/30"
            />
          </div>
        )}

        {!showArchivedView && conversations.length > 0 && (
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
            <AlertDialogContent className="bg-card border-border rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently delete all your conversation history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-border hover:bg-muted/50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearAll}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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
