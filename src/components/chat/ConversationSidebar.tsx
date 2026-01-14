import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onCreateNew,
  onSelect,
  onDelete,
}: ConversationSidebarProps) => {
  return (
    <div className="w-60 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
      <div className="p-3">
        <Button onClick={onCreateNew} className="w-full btn-glow" size="sm">
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-3">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === conv.id 
                  ? 'bg-primary/20 border border-primary/50' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{conv.title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
