import { useState, useEffect } from "react";
import { Brain, Plus, Trash2, Edit2, Save, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Memory {
  id: string;
  content: string;
  category: 'preference' | 'fact' | 'instruction';
  created_at: string;
}

interface MemoryPanelProps {
  onMemoryUpdate?: (memories: Memory[]) => void;
}

export const MemoryPanel = ({ onMemoryUpdate }: MemoryPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [newCategory, setNewCategory] = useState<Memory['category']>('preference');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load memories from localStorage (could be moved to Supabase later)
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`memories_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMemories(parsed);
        onMemoryUpdate?.(parsed);
      }
    }
  }, [user]);

  const saveMemories = (newMemories: Memory[]) => {
    if (user) {
      localStorage.setItem(`memories_${user.id}`, JSON.stringify(newMemories));
      setMemories(newMemories);
      onMemoryUpdate?.(newMemories);
    }
  };

  const addMemory = () => {
    if (!newMemory.trim()) return;
    
    const memory: Memory = {
      id: crypto.randomUUID(),
      content: newMemory.trim(),
      category: newCategory,
      created_at: new Date().toISOString(),
    };
    
    const updated = [...memories, memory];
    saveMemories(updated);
    setNewMemory("");
    toast({ title: "Memory added", description: "I'll remember this for future conversations." });
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    saveMemories(updated);
    toast({ title: "Memory deleted" });
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const saveEdit = (id: string) => {
    const updated = memories.map(m => 
      m.id === id ? { ...m, content: editContent } : m
    );
    saveMemories(updated);
    setEditingId(null);
    setEditContent("");
    toast({ title: "Memory updated" });
  };

  const getCategoryColor = (category: Memory['category']) => {
    switch (category) {
      case 'preference': return 'bg-blue-500/10 text-blue-500';
      case 'fact': return 'bg-green-500/10 text-green-500';
      case 'instruction': return 'bg-purple-500/10 text-purple-500';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-xs">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Memory</span>
          {memories.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1">{memories.length}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Memory
          </SheetTitle>
          <SheetDescription>
            Teach the AI about your preferences, facts about you, and custom instructions.
            This helps personalize responses across all conversations.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Add new memory */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add something for the AI to remember... (e.g., 'I prefer Python over JavaScript' or 'My company name is Acme Corp')"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Memory['category'])}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="preference">Preference</option>
                <option value="fact">Fact about me</option>
                <option value="instruction">Custom instruction</option>
              </select>
              <Button onClick={addMemory} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Memory
              </Button>
            </div>
          </div>

          {/* Memory list */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {memories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No memories yet</p>
                  <p className="text-sm mt-1">Add preferences and facts for more personalized responses</p>
                </div>
              ) : (
                memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="p-3 rounded-lg border bg-card group"
                  >
                    {editingId === memory.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(memory.id)}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm">{memory.content}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => startEdit(memory)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                              onClick={() => deleteMemory(memory.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={getCategoryColor(memory.category)}>
                            {memory.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
