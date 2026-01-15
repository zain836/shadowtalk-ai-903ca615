import { GitBranch, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ConversationBranch {
  id: string;
  parentMessageId: string;
  messages: Message[];
  createdAt: Date;
  title: string;
}

interface ConversationBranchingProps {
  branches: ConversationBranch[];
  currentBranchId: string | null;
  onCreateBranch: (fromMessageId: string) => void;
  onSwitchBranch: (branchId: string) => void;
  onDeleteBranch: (branchId: string) => void;
  messages: Message[];
}

export const ConversationBranching = ({
  branches,
  currentBranchId,
  onCreateBranch,
  onSwitchBranch,
  onDeleteBranch,
  messages,
}: ConversationBranchingProps) => {
  // Find fork points (messages that have multiple branches)
  const forkPoints = new Map<string, ConversationBranch[]>();
  branches.forEach(branch => {
    const existing = forkPoints.get(branch.parentMessageId) || [];
    forkPoints.set(branch.parentMessageId, [...existing, branch]);
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-xs">
          <GitBranch className="h-4 w-4" />
          <span className="hidden sm:inline">Branches</span>
          {branches.length > 0 && (
            <span className="text-[10px] bg-muted px-1 rounded">{branches.length}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Conversation Branches
          </SheetTitle>
          <SheetDescription>
            Explore different paths in your conversation. Create branches to try alternative responses.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* Main branch */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Main Conversation</h3>
            <div
              onClick={() => onSwitchBranch('main')}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                !currentBranchId || currentBranchId === 'main'
                  ? 'bg-primary/10 border-primary/30'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <span className="font-medium">Main</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {messages.length} messages
              </p>
            </div>
          </div>

          {/* Other branches */}
          {branches.length > 0 && (
            <>
              <h3 className="text-sm font-medium mb-2">Alternative Paths</h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`p-3 rounded-lg border transition-colors group ${
                        currentBranchId === branch.id
                          ? 'bg-primary/10 border-primary/30'
                          : 'hover:bg-muted cursor-pointer'
                      }`}
                      onClick={() => onSwitchBranch(branch.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{branch.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBranch(branch.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(branch.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{branch.messages.length} messages</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {branches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No branches yet</p>
              <p className="text-sm mt-1">
                Click "Branch from here" on any message to explore alternatives
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Export helper for creating branch titles
export const generateBranchTitle = (parentMessage: Message): string => {
  const preview = parentMessage.content.slice(0, 30);
  return `Branch from: "${preview}${parentMessage.content.length > 30 ? '...' : ''}"`;
};
