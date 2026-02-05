import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Brain, Plus, X, Edit2, Trash2, Search, Filter,
  ChevronDown, ChevronRight, Sparkles, Save, Clock,
  User, Briefcase, MessageSquare, Lightbulb, Star,
  Check, AlertCircle, Loader2, RefreshCw, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// =============================================================================
// MEMORY PERSISTENCE - Remember user preferences & context across sessions
// =============================================================================
// Beats Claude by maintaining persistent, user-editable memory
// Users can control exactly what the AI remembers
// =============================================================================

export type MemoryType = 'preference' | 'fact' | 'context' | 'instruction' | 'relationship';

export interface Memory {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  source: 'user' | 'ai' | 'inferred';
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsed?: string;
  tags?: string[];
}

interface MemoryPersistenceProps {
  memories: Memory[];
  onAddMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<boolean>;
  onUpdateMemory: (id: string, updates: Partial<Memory>) => Promise<boolean>;
  onDeleteMemory: (id: string) => Promise<boolean>;
  onToggleMemory: (id: string) => Promise<boolean>;
  loading?: boolean;
  compact?: boolean;
}

const MEMORY_TYPE_CONFIG = {
  preference: { 
    icon: Star, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10',
    label: 'Preference',
    description: 'How you like things done'
  },
  fact: { 
    icon: Lightbulb, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10',
    label: 'Fact',
    description: 'Information about you or your work'
  },
  context: { 
    icon: Briefcase, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10',
    label: 'Context',
    description: 'Background information'
  },
  instruction: { 
    icon: MessageSquare, 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10',
    label: 'Instruction',
    description: 'How to behave or respond'
  },
  relationship: { 
    icon: User, 
    color: 'text-pink-500', 
    bg: 'bg-pink-500/10',
    label: 'Relationship',
    description: 'People and connections'
  },
};

export const MemoryPersistence = ({ 
  memories, 
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onToggleMemory,
  loading = false,
  compact = false
}: MemoryPersistenceProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['active']));
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // New memory form state
  const [newMemory, setNewMemory] = useState<Partial<Memory>>({
    type: 'fact',
    title: '',
    content: '',
    priority: 1,
    isActive: true,
    source: 'user'
  });

  // Filter memories
  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (!showInactive && !m.isActive) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(query) || 
               m.content.toLowerCase().includes(query) ||
               m.tags?.some(t => t.toLowerCase().includes(query));
      }
      return true;
    });
  }, [memories, filterType, showInactive, searchQuery]);

  // Group by type
  const groupedMemories = useMemo(() => {
    const groups: Record<MemoryType, Memory[]> = {
      preference: [],
      fact: [],
      context: [],
      instruction: [],
      relationship: []
    };
    filteredMemories.forEach(m => groups[m.type].push(m));
    return groups;
  }, [filteredMemories]);

  // Stats
  const stats = useMemo(() => ({
    total: memories.length,
    active: memories.filter(m => m.isActive).length,
    byType: Object.entries(MEMORY_TYPE_CONFIG).map(([type, config]) => ({
      type,
      count: memories.filter(m => m.type === type).length,
      ...config
    }))
  }), [memories]);

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Handle add memory
  const handleAddMemory = async () => {
    if (!newMemory.title || !newMemory.content) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const success = await onAddMemory({
      type: newMemory.type as MemoryType,
      title: newMemory.title,
      content: newMemory.content,
      isActive: newMemory.isActive ?? true,
      priority: newMemory.priority ?? 1,
      source: 'user'
    });

    setSaving(false);
    if (success) {
      setShowAddDialog(false);
      setNewMemory({ type: 'fact', title: '', content: '', priority: 1, isActive: true, source: 'user' });
      toast({ title: 'Memory added!', description: 'AI will now remember this' });
    }
  };

  // Handle update memory
  const handleUpdateMemory = async () => {
    if (!editingMemory) return;
    
    setSaving(true);
    const success = await onUpdateMemory(editingMemory.id, editingMemory);
    setSaving(false);
    
    if (success) {
      setEditingMemory(null);
      toast({ title: 'Memory updated!' });
    }
  };

  // Render memory card
  const renderMemoryCard = (memory: Memory) => {
    const config = MEMORY_TYPE_CONFIG[memory.type];
    const Icon = config.icon;

    return (
      <motion.div
        key={memory.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "group p-3 rounded-lg border transition-all",
          memory.isActive 
            ? "bg-card hover:shadow-md" 
            : "bg-muted/30 opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            config.bg
          )}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{memory.title}</h4>
              {memory.source === 'ai' && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">AI</Badge>
              )}
              {memory.priority > 1 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  Priority {memory.priority}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {memory.content}
            </p>
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {memory.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
              <span>Used {memory.usageCount}x</span>
              {memory.lastUsed && (
                <span>• Last: {new Date(memory.lastUsed).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleMemory(memory.id)}
              className="h-7 w-7 p-0"
            >
              {memory.isActive ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingMemory(memory)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteMemory(memory.id)}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Memory</span>
            <Badge variant="secondary" className="text-xs">
              {stats.active} active
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        
        {filteredMemories.slice(0, 3).map(renderMemoryCard)}
        
        {filteredMemories.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all {filteredMemories.length} memories
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Memory & Persistence</h2>
            <p className="text-xs text-muted-foreground">
              {stats.active} of {stats.total} memories active
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Memory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(MEMORY_TYPE_CONFIG).map(([type, config]) => (
              <SelectItem key={type} value={type}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            checked={showInactive}
            onCheckedChange={setShowInactive}
            id="show-inactive"
          />
          <label htmlFor="show-inactive" className="text-xs text-muted-foreground">
            Show inactive
          </label>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        {stats.byType.map(({ type, count, icon: Icon, color, label }) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <Icon className={cn("h-3 w-3", color)} />
            <span>{count}</span>
            <span className="text-muted-foreground hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      {/* Memory groups */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No memories found</p>
          <p className="text-xs mt-1">Add memories to help the AI remember your preferences</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedMemories).map(([type, mems]) => {
            if (mems.length === 0) return null;
            const config = MEMORY_TYPE_CONFIG[type as MemoryType];
            
            return (
              <Collapsible
                key={type}
                open={expandedSections.has(type)}
                onOpenChange={() => toggleSection(type)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    {expandedSections.has(type) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <config.icon className={cn("h-4 w-4", config.color)} />
                    <span className="font-medium text-sm">{config.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {mems.length}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-2 ml-6">
                    <AnimatePresence mode="popLayout">
                      {mems.map(renderMemoryCard)}
                    </AnimatePresence>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Add Memory Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Add New Memory
            </DialogTitle>
            <DialogDescription>
              Teach the AI something it should always remember about you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={newMemory.type} 
                onValueChange={(v) => setNewMemory({ ...newMemory, type: v as MemoryType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEMORY_TYPE_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        <span>{config.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {config.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Preferred coding style"
                value={newMemory.title}
                onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="e.g., I prefer TypeScript with strict mode, functional components, and Tailwind CSS"
                value={newMemory.content}
                onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newMemory.isActive}
                  onCheckedChange={(v) => setNewMemory({ ...newMemory, isActive: v })}
                  id="new-memory-active"
                />
                <label htmlFor="new-memory-active" className="text-sm">Active</label>
              </div>
              <Select 
                value={String(newMemory.priority)} 
                onValueChange={(v) => setNewMemory({ ...newMemory, priority: parseInt(v) })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Low priority</SelectItem>
                  <SelectItem value="1">Normal</SelectItem>
                  <SelectItem value="2">High priority</SelectItem>
                  <SelectItem value="3">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMemory} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Memory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Memory Dialog */}
      <Dialog open={!!editingMemory} onOpenChange={(open) => !open && setEditingMemory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>

          {editingMemory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingMemory.title}
                  onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editingMemory.content}
                  onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMemory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMemory} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemoryPersistence;
