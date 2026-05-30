import { MessageSquarePlus, History, Eraser, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatToolbarProps {
  hasActiveChat: boolean;
  conversationCount: number;
  onNewChat: () => void;
  onOpenHistory: () => void;
  onClearChat: () => void;
  onDeleteAllChats: () => void;
  className?: string;
}

export function ChatToolbar({
  hasActiveChat,
  conversationCount,
  onNewChat,
  onOpenHistory,
  onClearChat,
  onDeleteAllChats,
  className = "",
}: ChatToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`flex items-center gap-1 px-4 md:px-6 py-1.5 border-b border-border/40 glass-subtle shrink-0 ${className}`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              className="h-8 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="hidden sm:inline">New chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start a new conversation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenHistory}
              className="h-8 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View chat history</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              disabled={!hasActiveChat}
              className="h-8 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30"
            >
              <Eraser className="h-4 w-4" />
              <span className="hidden sm:inline">Clear chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear messages in this chat</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {conversationCount > 0 && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete all</span>
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Delete all conversations</TooltipContent>
            </Tooltip>
            <AlertDialogContent className="bg-card border-border rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every conversation and message in your history. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAllChats}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
}
