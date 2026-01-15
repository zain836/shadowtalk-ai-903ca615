import { useState, useEffect } from "react";
import { X, Brain, Plus, Trash2, Save, Sparkles, MessageSquare, Upload, Loader2, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface TrainingExample {
  id: string;
  userMessage: string;
  assistantResponse: string;
}

interface ModelConfig {
  id?: string;
  name: string;
  basePersonality: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  trainingExamples: TrainingExample[];
  isActive: boolean;
  syncedToCloud?: boolean;
}

interface ModelFineTuningProps {
  onClose: () => void;
}

export const ModelFineTuning = ({ onClose }: ModelFineTuningProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("config");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>(() => {
    const saved = localStorage.getItem('custom-models');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentModel, setCurrentModel] = useState<ModelConfig>({
    name: "",
    basePersonality: "helpful",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: "You are a helpful AI assistant.",
    trainingExamples: [],
    isActive: false,
  });

  const [newExample, setNewExample] = useState({ userMessage: "", assistantResponse: "" });

  // Load models from database on mount
  useEffect(() => {
    if (!user) return;

    const loadModels = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('custom_models')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const cloudModels: ModelConfig[] = data.map(model => {
            const config = model.config as Record<string, unknown>;
            const trainingExamples = (model.training_examples as Array<Record<string, string>>) || [];
            
            return {
              id: model.id,
              name: model.name,
              basePersonality: (config.basePersonality as string) || 'helpful',
              temperature: (config.temperature as number) || 0.7,
              maxTokens: (config.maxTokens as number) || 2048,
              topP: (config.topP as number) || 0.9,
              frequencyPenalty: (config.frequencyPenalty as number) || 0,
              presencePenalty: (config.presencePenalty as number) || 0,
              systemPrompt: (config.systemPrompt as string) || '',
              trainingExamples: trainingExamples.map(ex => ({
                id: ex.id || crypto.randomUUID(),
                userMessage: ex.userMessage || '',
                assistantResponse: ex.assistantResponse || '',
              })),
              isActive: model.is_active || false,
              syncedToCloud: true,
            };
          });

          // Merge with local models (prefer cloud versions)
          const localModels = models.filter(lm => 
            !cloudModels.some(cm => cm.name === lm.name)
          );

          setModels([...cloudModels, ...localModels]);
        }
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, [user]);

  const addTrainingExample = () => {
    if (!newExample.userMessage.trim() || !newExample.assistantResponse.trim()) {
      toast({ title: "Error", description: "Both fields are required", variant: "destructive" });
      return;
    }

    setCurrentModel(prev => ({
      ...prev,
      trainingExamples: [
        ...prev.trainingExamples,
        { id: crypto.randomUUID(), ...newExample }
      ]
    }));
    setNewExample({ userMessage: "", assistantResponse: "" });
    toast({ title: "Example added", description: "Training example added successfully" });
  };

  const removeExample = (id: string) => {
    setCurrentModel(prev => ({
      ...prev,
      trainingExamples: prev.trainingExamples.filter(e => e.id !== id)
    }));
  };

  const saveModel = async () => {
    if (!currentModel.name.trim()) {
      toast({ title: "Error", description: "Model name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    // Update local state and localStorage
    const existingIndex = models.findIndex(m => m.name === currentModel.name);
    let updatedModels: ModelConfig[];
    
    if (existingIndex >= 0) {
      updatedModels = models.map((m, i) => i === existingIndex ? currentModel : m);
    } else {
      updatedModels = [...models, currentModel];
    }

    setModels(updatedModels);
    localStorage.setItem('custom-models', JSON.stringify(updatedModels));

    // Save to cloud if user is authenticated
    if (user) {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        const response = await supabase.functions.invoke('save-custom-model', {
          body: {
            name: currentModel.name,
            basePersonality: currentModel.basePersonality,
            temperature: currentModel.temperature,
            maxTokens: currentModel.maxTokens,
            topP: currentModel.topP,
            frequencyPenalty: currentModel.frequencyPenalty,
            presencePenalty: currentModel.presencePenalty,
            systemPrompt: currentModel.systemPrompt,
            trainingExamples: currentModel.trainingExamples,
            isActive: currentModel.isActive,
          },
        });

        if (response.error) {
          // Check if it's a feature lock error
          if (response.error.message?.includes('Feature locked') || response.error.message?.includes('403')) {
            toast({ 
              title: "Saved locally", 
              description: "Cloud sync requires Elite or Enterprise tier" 
            });
          } else {
            throw response.error;
          }
        } else {
          // Update model with cloud sync status
          const updatedWithSync = updatedModels.map(m => 
            m.name === currentModel.name ? { ...m, syncedToCloud: true, id: response.data?.model?.id } : m
          );
          setModels(updatedWithSync);
          localStorage.setItem('custom-models', JSON.stringify(updatedWithSync));

          toast({ 
            title: "Model saved to cloud", 
            description: `"${currentModel.name}" has been synced` 
          });
        }
      } catch (error) {
        console.error('Error saving to cloud:', error);
        toast({ 
          title: "Saved locally", 
          description: "Model saved to browser. Cloud sync failed." 
        });
      }
    } else {
      toast({ title: "Model saved", description: `"${currentModel.name}" has been saved locally` });
    }

    setIsSaving(false);
  };

  const loadModel = (model: ModelConfig) => {
    setCurrentModel(model);
    setActiveTab("config");
  };

  const deleteModel = async (name: string) => {
    const modelToDelete = models.find(m => m.name === name);
    
    // Remove from local storage
    const updated = models.filter(m => m.name !== name);
    setModels(updated);
    localStorage.setItem('custom-models', JSON.stringify(updated));

    // Delete from cloud if synced
    if (user && modelToDelete?.id) {
      try {
        await supabase
          .from('custom_models')
          .delete()
          .eq('id', modelToDelete.id)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error deleting from cloud:', error);
      }
    }

    toast({ title: "Model deleted" });
  };

  const activateModel = async (name: string) => {
    const updated = models.map(m => ({ ...m, isActive: m.name === name }));
    setModels(updated);
    localStorage.setItem('custom-models', JSON.stringify(updated));
    localStorage.setItem('active-custom-model', name);

    // Update in cloud if user is authenticated
    if (user) {
      try {
        // Deactivate all models first
        await supabase
          .from('custom_models')
          .update({ is_active: false })
          .eq('user_id', user.id);

        // Activate the selected model
        const modelToActivate = models.find(m => m.name === name);
        if (modelToActivate?.id) {
          await supabase
            .from('custom_models')
            .update({ is_active: true })
            .eq('id', modelToActivate.id);
        }
      } catch (error) {
        console.error('Error updating activation in cloud:', error);
      }
    }

    toast({ title: "Model activated", description: `"${name}" is now your active model` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Model Fine-Tuning</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {user ? (
                  <>
                    <Cloud className="h-3 w-3" />
                    Cloud sync enabled
                  </>
                ) : (
                  <>
                    <CloudOff className="h-3 w-3" />
                    Local storage only
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="training">Training Data</TabsTrigger>
                <TabsTrigger value="models">Saved Models</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-6">
                {/* Model Name */}
                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input
                    value={currentModel.name}
                    onChange={e => setCurrentModel({ ...currentModel, name: e.target.value })}
                    placeholder="My Custom Assistant"
                    className="rounded-xl"
                  />
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={currentModel.systemPrompt}
                    onChange={e => setCurrentModel({ ...currentModel, systemPrompt: e.target.value })}
                    placeholder="Define your AI's personality and behavior..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Temperature</Label>
                        <span className="text-xs text-muted-foreground">{currentModel.temperature}</span>
                      </div>
                      <Slider
                        value={[currentModel.temperature]}
                        onValueChange={([v]) => setCurrentModel({ ...currentModel, temperature: v })}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">Higher = more creative, Lower = more focused</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Max Tokens</Label>
                        <span className="text-xs text-muted-foreground">{currentModel.maxTokens}</span>
                      </div>
                      <Slider
                        value={[currentModel.maxTokens]}
                        onValueChange={([v]) => setCurrentModel({ ...currentModel, maxTokens: v })}
                        min={256}
                        max={8192}
                        step={256}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Top P</Label>
                        <span className="text-xs text-muted-foreground">{currentModel.topP}</span>
                      </div>
                      <Slider
                        value={[currentModel.topP]}
                        onValueChange={([v]) => setCurrentModel({ ...currentModel, topP: v })}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Frequency Penalty</Label>
                        <span className="text-xs text-muted-foreground">{currentModel.frequencyPenalty}</span>
                      </div>
                      <Slider
                        value={[currentModel.frequencyPenalty]}
                        onValueChange={([v]) => setCurrentModel({ ...currentModel, frequencyPenalty: v })}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={saveModel} className="w-full btn-glow rounded-xl" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Model Configuration
                </Button>
              </TabsContent>

              <TabsContent value="training" className="space-y-6">
                {/* Add Example */}
                <div className="p-4 border border-border rounded-xl space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Training Example
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">User Message</Label>
                      <Input
                        value={newExample.userMessage}
                        onChange={e => setNewExample({ ...newExample, userMessage: e.target.value })}
                        placeholder="What would the user say?"
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ideal Response</Label>
                      <Textarea
                        value={newExample.assistantResponse}
                        onChange={e => setNewExample({ ...newExample, assistantResponse: e.target.value })}
                        placeholder="How should the AI respond?"
                        className="rounded-xl mt-1 min-h-[80px]"
                      />
                    </div>
                    <Button onClick={addTrainingExample} className="w-full rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Example
                    </Button>
                  </div>
                </div>

                {/* Examples List */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Training Examples ({currentModel.trainingExamples.length})
                  </h3>
                  
                  {currentModel.trainingExamples.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No training examples yet</p>
                      <p className="text-xs">Add examples to train your model's responses</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {currentModel.trainingExamples.map(example => (
                        <div key={example.id} className="p-3 bg-muted/50 rounded-xl space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-primary font-medium">User:</p>
                              <p className="text-sm truncate">{example.userMessage}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExample(example.id)}
                              className="h-6 w-6 shrink-0"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <div>
                            <p className="text-xs text-secondary font-medium">AI Response:</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{example.assistantResponse}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="models" className="space-y-4">
                {models.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No saved models</p>
                    <p className="text-sm">Create your first custom model in the Configuration tab</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {models.map(model => (
                      <div key={model.name} className={`p-4 border rounded-xl ${model.isActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{model.name}</h4>
                                {model.isActive && <Badge className="text-xs">Active</Badge>}
                                {model.syncedToCloud && (
                                  <Cloud className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {model.trainingExamples.length} examples • Temp: {model.temperature}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadModel(model)}
                              className="rounded-lg"
                            >
                              Edit
                            </Button>
                            <Button
                              variant={model.isActive ? "secondary" : "default"}
                              size="sm"
                              onClick={() => activateModel(model.name)}
                              className="rounded-lg"
                            >
                              {model.isActive ? 'Active' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteModel(model.name)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
