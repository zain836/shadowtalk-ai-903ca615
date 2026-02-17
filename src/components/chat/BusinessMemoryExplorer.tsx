import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useBusinessMemory,
  MEMORY_CATEGORIES,
  type MemoryCategory,
  type MemoryFormData,
} from '@/hooks/useBusinessMemory';

const BusinessMemoryExplorer = () => {
  const {
    memories,
    loading,
    saving,
    addMemory,
    updateMemory,
    deleteMemory,
    toggleMemory,
  } = useBusinessMemory();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemoryFormData>({
    category: 'facts',
    title: '',
    content: '',
    priority: 0,
  });

  const filtered = filterCategory === 'all'
    ? memories
    : memories.filter(m => m.category === filterCategory);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const ok = await addMemory(form);
    if (ok) {
      setIsAdding(false);
      setForm({ category: 'facts', title: '', content: '', priority: 0 });
    }
  };

  const handleUpdate = async (id: string) => {
    const ok = await updateMemory(id, form);
    if (ok) {
      setEditingId(null);
      setForm({ category: 'facts', title: '', content: '', priority: 0 });
    }
  };

  const startEdit = (memory: typeof memories[0]) => {
    setEditingId(memory.id);
    setForm({
      category: memory.category as MemoryCategory,
      title: memory.title,
      content: memory.content,
      priority: memory.priority,
    });
  };

  const getCategoryMeta = (cat: string) =>
    MEMORY_CATEGORIES.find(c => c.id === cat) || MEMORY_CATEGORIES[3];

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Business Memory</h3>
            <p className="text-xs text-muted-foreground">
              {memories.length} memories stored
            </p>
          </div>
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          <Badge
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer text-[10px]"
            onClick={() => setFilterCategory('all')}
          >
            All
          </Badge>
          {MEMORY_CATEGORIES.map(cat => (
            <Badge
              key={cat.id}
              variant={filterCategory === cat.id ? 'default' : 'outline'}
              className="cursor-pointer text-[10px]"
              onClick={() => setFilterCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Add form */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/20 rounded-lg p-3 border border-border/20 space-y-2"
              >
                <Select
                  value={form.category}
                  onValueChange={v => setForm(p => ({ ...p, category: v as MemoryCategory }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Title"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="h-8 text-sm"
                />
                <Textarea
                  placeholder="Content..."
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  className="text-sm min-h-[60px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleAdd} disabled={saving}>
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Memory list */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((memory, i) => {
              const cat = getCategoryMeta(memory.category);
              const isEditing = editingId === memory.id;

              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-muted/15 rounded-lg p-3 border border-border/15 space-y-2"
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <Textarea
                        value={form.content}
                        onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                        className="text-sm min-h-[60px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleUpdate(memory.id)} disabled={saving}>
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {cat.icon} {cat.label}
                            </Badge>
                            {!memory.is_active && (
                              <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {memory.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {memory.content}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleMemory(memory.id)}
                            title={memory.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {memory.is_active ? (
                              <ToggleRight className="w-4 h-4 text-primary" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(memory)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/60 hover:text-destructive"
                            onClick={() => deleteMemory(memory.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <Brain className="w-8 h-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">No business memories yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Add memories to personalize AI responses
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BusinessMemoryExplorer;
