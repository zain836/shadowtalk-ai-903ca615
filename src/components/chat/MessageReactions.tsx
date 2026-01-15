import { useState } from "react";
import { ThumbsUp, ThumbsDown, Flag, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
  messageId: string;
  onReact: (messageId: string, reaction: 'like' | 'dislike') => void;
  onBookmark: (messageId: string) => void;
  onReport: (messageId: string) => void;
  onShare: (messageId: string) => void;
  currentReaction?: 'like' | 'dislike' | null;
  isBookmarked?: boolean;
}

export const MessageReactions = ({
  messageId,
  onReact,
  onBookmark,
  onReport,
  onShare,
  currentReaction,
  isBookmarked = false,
}: MessageReactionsProps) => {
  const { toast } = useToast();

  const handleLike = () => {
    onReact(messageId, 'like');
    if (currentReaction !== 'like') {
      toast({ title: "Thanks for your feedback!", description: "This helps improve AI responses." });
    }
  };

  const handleDislike = () => {
    onReact(messageId, 'dislike');
    if (currentReaction !== 'dislike') {
      toast({ title: "Thanks for your feedback!", description: "We'll use this to improve." });
    }
  };

  const handleBookmark = () => {
    onBookmark(messageId);
    toast({ 
      title: isBookmarked ? "Removed from saved" : "Saved!", 
      description: isBookmarked ? "Message removed from your saved items" : "You can find this in your saved messages" 
    });
  };

  const handleShare = () => {
    onShare(messageId);
  };

  const handleReport = () => {
    onReport(messageId);
    toast({ title: "Reported", description: "Thanks for helping keep our AI safe." });
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={cn(
          "h-7 w-7 p-0",
          currentReaction === 'like' && "text-green-500 bg-green-500/10"
        )}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDislike}
        className={cn(
          "h-7 w-7 p-0",
          currentReaction === 'dislike' && "text-red-500 bg-red-500/10"
        )}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleBookmark}>
            <Bookmark className={cn("h-4 w-4 mr-2", isBookmarked && "fill-current")} />
            {isBookmarked ? "Remove save" : "Save message"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleReport} className="text-red-500">
            <Flag className="h-4 w-4 mr-2" />
            Report issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
