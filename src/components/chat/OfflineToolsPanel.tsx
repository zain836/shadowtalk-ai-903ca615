import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, MicOff, Volume2, VolumeX, Search, Calculator, 
  Languages, FileText, Code, Image, Database, RefreshCw,
  Download, Play, Square, Loader2, X, Sparkles, FolderOpen,
  Brain, Zap, Shield
} from "lucide-react";
import { useOfflineVoice } from "@/hooks/useOfflineVoice";
import { useOfflineCodeExecution } from "@/hooks/useOfflineCodeExecution";
import { useOfflineSearch } from "@/hooks/useOfflineSearch";
import { useOfflineMath } from "@/hooks/useOfflineMath";
import { useOfflineTranslation } from "@/hooks/useOfflineTranslation";
import { useOfflineTemplates } from "@/hooks/useOfflineTemplates";
import { useModelManager } from "@/hooks/useModelManager";
import { useOfflineChat } from "@/hooks/useOfflineChat";
import { useOfflineRAG } from "@/hooks/useOfflineRAG";
import { useToast } from "@/hooks/use-toast";

interface OfflineToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
}

export const OfflineToolsPanel = ({ isOpen, onClose, onInsertToChat }: OfflineToolsPanelProps) => {
  const { toast } = useToast();
  
  // Hooks
  const voice = useOfflineVoice();
  const codeExec = useOfflineCodeExecution();
  const search = useOfflineSearch();
  const math = useOfflineMath();
  const translation = useOfflineTranslation();
  const templates = useOfflineTemplates();
  const modelManager = useModelManager();
  const offlineChat = useOfflineChat();
  const rag = useOfflineRAG();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [mathExpression, setMathExpression] = useState("");
  const [mathResult, setMathResult] = useState<string | null>(null);
  const [translateText, setTranslateText] = useState("");
  const [translateFrom, setTranslateFrom] = useState("en");
  const [translateTo, setTranslateTo] = useState("es");
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);
  const [codeToRun, setCodeToRun] = useState("console.log('Hello, World!');");
  const [codeLanguage, setCodeLanguage] = useState<"javascript" | "python">("javascript");

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await search.search(searchQuery);
  };

  const handleMathSolve = () => {
    if (!mathExpression.trim()) return;
    const result = math.evaluate(mathExpression);
    setMathResult(result.error || result.result);
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    const result = await translation.translate(translateText, translateFrom, translateTo);
    setTranslatedResult(result.translatedText);
  };

  const handleRunCode = async () => {
    if (codeLanguage === 'javascript') {
      await codeExec.executeJavaScript(codeToRun);
    } else {
      await codeExec.executeTypeScript(codeToRun);
    }
  };

  const handleVoiceToggle = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  const handleSpeak = (text: string) => {
    if (voice.isSpeaking) {
      voice.stopSpeaking();
    } else {
      voice.speak(text);
    }
  };

  const handleUseTemplate = (content: string) => {
    if (onInsertToChat) {
      onInsertToChat(content);
      toast({ title: "Template inserted", description: "Template added to chat input" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Offline AI Tools</h2>
            <Badge variant="outline" className="text-xs">Works without internet</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="sovereign" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start px-4 py-2 bg-muted/50 rounded-none border-b border-border flex-wrap">
            <TabsTrigger value="sovereign" className="gap-2">
              <Brain className="h-4 w-4" /> Sovereign AI
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="h-4 w-4" /> Voice
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" /> Search
            </TabsTrigger>
            <TabsTrigger value="math" className="gap-2">
              <Calculator className="h-4 w-4" /> Math
            </TabsTrigger>
            <TabsTrigger value="translate" className="gap-2">
              <Languages className="h-4 w-4" /> Translate
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" /> Code
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Database className="h-4 w-4" /> Models
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            {/* Sovereign AI Tab */}
            <TabsContent value="sovereign" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Sovereign AI Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={offlineChat.isReady ? "default" : "secondary"}>
                        {offlineChat.isReady ? "🟢 Ready" : 
                         offlineChat.isInitializing ? "⏳ Loading..." : 
                         "⚪ Not initialized"}
                      </Badge>
                      {offlineChat.activeModel && (
                        <Badge variant="outline">{offlineChat.activeModel}</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {offlineChat.modelTier} Tier
                    </Badge>
                  </div>
                  
                  {offlineChat.isInitializing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{offlineChat.loadStage}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${offlineChat.loadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {!offlineChat.isReady && !offlineChat.isInitializing && (
                    <Button onClick={() => offlineChat.initialize()} className="w-full gap-2">
                      <Brain className="h-4 w-4" />
                      Initialize Llama 3 Offline AI
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Battery</p>
                      <p className="font-medium">
                        {offlineChat.batteryLevel !== null ? `${offlineChat.batteryLevel}%` : 'N/A'}
                        {offlineChat.isPluggedIn && " ⚡"}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Documents</p>
                      <p className="font-medium">{rag.documentCount} indexed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {offlineChat.capabilities.map(cap => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap === 'chat' && '💬 Chat'}
                          {cap === 'reasoning' && '🧠 Reasoning'}
                          {cap === 'code' && '💻 Code Generation'}
                          {cap === 'math' && '🔢 Math'}
                          {cap === 'multilingual' && '🌍 100+ Languages'}
                          {cap === 'rag' && '📚 Document Analysis'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <strong>🛡️ Zero-Server Promise:</strong> All processing happens on your device. 
                      Your data never leaves your browser. Perfect for sensitive documents and private conversations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Private Document Vault
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload documents for offline AI analysis. The AI will cite specific sections when answering questions.
                  </p>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Documents indexed:</span>
                    <Badge variant="secondary">{rag.documentCount}</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Supported Features:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>✓ PDF, TXT, MD, CSV, JSON files</li>
                      <li>✓ AI-powered semantic search</li>
                      <li>✓ Citations from your documents</li>
                      <li>✓ Zero-cloud privacy guarantee</li>
                    </ul>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => {
                      // This will be handled by the OfflineDocumentUpload component
                      toast({ 
                        title: "Document Upload", 
                        description: "Use the Document Vault button in the chat header to upload files." 
                      });
                    }}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Open Document Vault
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Voice Input & Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={handleVoiceToggle}
                      variant={voice.isListening ? "destructive" : "default"}
                      className="gap-2"
                    >
                      {voice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {voice.isListening ? "Stop Listening" : "Start Listening"}
                    </Button>
                    <Badge variant={voice.isSupported ? "default" : "destructive"}>
                      {voice.isSupported ? "Voice Supported" : "Not Supported"}
                    </Badge>
                  </div>
                  
                  {voice.transcript && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Transcript:</p>
                      <p className="text-sm text-muted-foreground">{voice.transcript}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleSpeak(voice.transcript)}>
                          <Volume2 className="h-3 w-3 mr-1" /> Speak
                        </Button>
                        {onInsertToChat && (
                          <Button size="sm" onClick={() => onInsertToChat(voice.transcript)}>
                            Use in Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Text-to-Speech Test:</p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter text to speak..." 
                        id="tts-input"
                      />
                      <Button 
                        onClick={() => {
                          const input = document.getElementById('tts-input') as HTMLInputElement;
                          if (input.value) handleSpeak(input.value);
                        }}
                        variant="outline"
                      >
                        {voice.isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Offline Conversation Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your conversations..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={search.isSearching}>
                      {search.isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {search.results.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Results ({search.results.length}):</p>
                      {search.results.map((result, i) => (
                        <div key={i} className="p-2 bg-muted rounded-lg text-sm">
                          <p className="font-medium">{result.conversationTitle}</p>
                          <p className="text-muted-foreground line-clamp-2">{result.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Math Tab */}
            <TabsContent value="math" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Offline Math Solver
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={mathExpression}
                      onChange={(e) => setMathExpression(e.target.value)}
                      placeholder="Enter expression (e.g., 2+2, sqrt(16), sin(pi/2))"
                      onKeyDown={(e) => e.key === 'Enter' && handleMathSolve()}
                    />
                    <Button onClick={handleMathSolve}>
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {mathResult !== null && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Result:</p>
                      <p className="text-2xl font-mono">{mathResult}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Supported operations:</p>
                    <p>Basic: +, -, *, /, ^, %, ()</p>
                    <p>Functions: sqrt, sin, cos, tan, log, ln, abs, round, floor, ceil</p>
                    <p>Constants: pi, e</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Translate Tab */}
            <TabsContent value="translate" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Offline Translation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={translateFrom}
                      onChange={(e) => setTranslateFrom(e.target.value)}
                      className="p-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                    <select 
                      value={translateTo}
                      onChange={(e) => setTranslateTo(e.target.value)}
                      className="p-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="es">Spanish</option>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                  
                  <Textarea 
                    value={translateText}
                    onChange={(e) => setTranslateText(e.target.value)}
                    placeholder="Enter text to translate..."
                    rows={3}
                  />
                  
                  <Button onClick={handleTranslate} disabled={translation.isLoading} className="w-full">
                    {translation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Languages className="h-4 w-4 mr-2" />}
                    Translate
                  </Button>
                  
                  {translatedResult && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Translation:</p>
                      <p className="text-sm">{translatedResult}</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Basic offline translation with common phrases. For full translation, an internet connection is recommended.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Offline Code Execution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <select 
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value as "javascript" | "python")}
                      className="p-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python (Pyodide)</option>
                    </select>
                    <Button onClick={handleRunCode} disabled={codeExec.isExecuting} className="gap-2">
                      {codeExec.isExecuting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Run
                    </Button>
                  </div>
                  
                  <Textarea 
                    value={codeToRun}
                    onChange={(e) => setCodeToRun(e.target.value)}
                    placeholder="Enter code to execute..."
                    className="font-mono text-sm"
                    rows={6}
                  />
                  
                  {codeExec.lastResult && (
                    <div className={`p-3 rounded-lg ${codeExec.lastResult.error ? 'bg-destructive/10' : 'bg-muted'}`}>
                      <p className="text-sm font-medium mb-1">{codeExec.lastResult.error ? 'Error:' : 'Output:'}</p>
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {codeExec.lastResult.error || codeExec.lastResult.output || codeExec.lastResult.logs.join('\n')}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Prompt Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {templates.categories.map(cat => (
                      <Badge 
                        key={cat}
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {}}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid gap-3">
                    {templates.templates.slice(0, 8).map(template => (
                      <div 
                        key={template.id}
                        className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{template.icon} {template.name}</p>
                          <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUseTemplate(template.prompt)}
                        >
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Models Tab */}
            <TabsContent value="models" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    AI Model Manager
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {modelManager.models.map(model => (
                      <div 
                        key={model.id}
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.description}</p>
                          </div>
                          <Badge variant={model.isDownloaded ? "default" : "secondary"}>
                            {model.isDownloaded ? "Ready" : `${model.size}`}
                          </Badge>
                        </div>
                        
                        {modelManager.downloadProgress?.modelId === model.id && (
                          <div className="mb-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${modelManager.downloadProgress.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Downloading... {modelManager.downloadProgress.progress.toFixed(0)}%
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {!model.isDownloaded ? (
                            <Button 
                              size="sm" 
                              onClick={() => modelManager.downloadModel(model.id)}
                              disabled={modelManager.isDownloading}
                            >
                              <Download className="h-3 w-3 mr-1" /> Download
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant={modelManager.activeModel?.id === model.id ? "default" : "outline"}
                                onClick={() => modelManager.activateModel(model.id)}
                              >
                                {modelManager.activeModel?.id === model.id ? "Active" : "Activate"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => modelManager.deleteModel(model.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default OfflineToolsPanel;
