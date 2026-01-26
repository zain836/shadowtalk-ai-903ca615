import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useBusinessMemory, MEMORY_CATEGORIES, MemoryCategory, MemoryFormData, BusinessMemory } from '@/hooks/useBusinessMemory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, Brain, Plus, Trash2, Edit2, Building2, Mic, Users, FileText, 
  Sparkles, Check, X, Loader2 
} from 'lucide-react';

const categoryIcons: Record<MemoryCategory, React.ReactNode> = {
  profile: <Building2 className="h-5 w-5" />,
  voice: <Mic className="h-5 w-5" />,
  customers: <Users className="h-5 w-5" />,
  facts: <FileText className="h-5 w-5" />,
};

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    memories, loading, saving, addMemory, updateMemory, deleteMemory, toggleMemory, getMemoryContext 
  } = useBusinessMemory();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<BusinessMemory | null>(null);
  const [formData, setFormData] = useState<MemoryFormData>({
    category: 'profile',
    title: '',
    content: '',
    priority: 0,
  });
  const [activeTab, setActiveTab] = useState<MemoryCategory | 'all'>('all');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const resetForm = () => {
    setFormData({ category: 'profile', title: '', content: '', priority: 0 });
    setEditingMemory(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    let success: boolean;
    if (editingMemory) {
      success = await updateMemory(editingMemory.id, formData);
    } else {
      success = await addMemory(formData);
    }

    if (success) {
      resetForm();
      setIsAddDialogOpen(false);
    }
  };

  const handleEdit = (memory: BusinessMemory) => {
    setFormData({
      category: memory.category,
      title: memory.title,
      content: memory.content,
      priority: memory.priority,
    });
    setEditingMemory(memory);
    setIsAddDialogOpen(true);
  };

  const filteredMemories = activeTab === 'all' 
    ? memories 
    : memories.filter(m => m.category === activeTab);

  const activeCount = memories.filter(m => m.is_active).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI Workspace Memory</h1>
                  <p className="text-sm text-muted-foreground">
                    Teach the AI about your business
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {activeCount} Active Memories
              </Badge>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Preview Context</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>AI Context Preview</DialogTitle>
                    <DialogDescription>
                      This is what the AI will "remember" about your business during conversations
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {getMemoryContext() || 'No active memories. Add some business information to get started!'}
                    </pre>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Memory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingMemory ? 'Edit Memory' : 'Add New Memory'}</DialogTitle>
                    <DialogDescription>
                      Add information you want the AI to remember about your business
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as MemoryCategory }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEMORY_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        placeholder="e.g., Company Name, Brand Tone, Target Audience..."
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea 
                        placeholder="Describe this aspect of your business in detail..."
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority (Higher = More Important)</Label>
                      <Select 
                        value={String(formData.priority || 0)} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, priority: parseInt(v) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Normal</SelectItem>
                          <SelectItem value="5">Important</SelectItem>
                          <SelectItem value="10">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={saving || !formData.title.trim() || !formData.content.trim()}
                    >
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingMemory ? 'Update' : 'Save'} Memory
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {MEMORY_CATEGORIES.map(category => {
            const count = memories.filter(m => m.category === category.id).length;
            const activeInCategory = memories.filter(m => m.category === category.id && m.is_active).length;
            return (
              <Card 
                key={category.id} 
                className={`cursor-pointer transition-all hover:border-primary ${activeTab === category.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setActiveTab(category.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">{category.icon}</div>
                    <Badge variant={activeInCategory > 0 ? "default" : "secondary"}>
                      {activeInCategory}/{count}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{category.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Memory List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business Memories</CardTitle>
                <CardDescription>
                  Information the AI uses to personalize responses for your business
                </CardDescription>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MemoryCategory | 'all')}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {MEMORY_CATEGORIES.map(cat => (
                    <TabsTrigger key={cat.id} value={cat.id} className="hidden md:flex">
                      {categoryIcons[cat.id]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No memories yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? 'Add information about your business so the AI can personalize responses'
                    : `Add ${MEMORY_CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()} information`
                  }
                </p>
                <Button onClick={() => {
                  if (activeTab !== 'all') {
                    setFormData(prev => ({ ...prev, category: activeTab }));
                  }
                  setIsAddDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Memory
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMemories.map(memory => {
                  const category = MEMORY_CATEGORIES.find(c => c.id === memory.category);
                  return (
                    <div 
                      key={memory.id} 
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                        memory.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${memory.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        {categoryIcons[memory.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{memory.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {category?.label}
                          </Badge>
                          {memory.priority >= 10 && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                          {memory.priority >= 5 && memory.priority < 10 && (
                            <Badge variant="secondary" className="text-xs">Important</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{memory.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={memory.is_active}
                          onCheckedChange={() => toggleMemory(memory.id)}
                          aria-label="Toggle memory active state"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(memory)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Memory?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{memory.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMemory(memory.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Better AI Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Business Profile</h4>
                <p className="text-muted-foreground">
                  Include your company name, what you do, your mission, core values, and main products/services. 
                  The AI will use this for accurate representations.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Brand Voice</h4>
                <p className="text-muted-foreground">
                  Describe your communication style. Is it formal or casual? Key phrases you use? 
                  Words to avoid? The AI will match this tone.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Customer Context</h4>
                <p className="text-muted-foreground">
                  Who are your customers? What problems do they face? Common questions? 
                  This helps the AI give relevant advice.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Custom Facts</h4>
                <p className="text-muted-foreground">
                  Add any other information: pricing, policies, team details, unique processes. 
                  The AI uses these when relevant.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkspacePage;
