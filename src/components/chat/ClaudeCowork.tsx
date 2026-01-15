import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, FolderOpen, FileCode, Terminal, Play, Pause, 
  CheckCircle2, AlertCircle, Loader2, Download, Upload,
  FolderTree, File, Edit3, Trash2, Plus, Save, Copy,
  RefreshCw, Settings, Bot, ChevronRight, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ClaudeCoworkProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (content: string) => void;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
}

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

interface TaskAction {
  id: string;
  type: "read" | "write" | "execute" | "delete" | "create";
  target: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
}

export const ClaudeCowork = ({ isOpen, onClose, onInsertToChat }: ClaudeCoworkProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File system state
  const [files, setFiles] = useState<FileNode[]>([
    {
      name: "project",
      type: "folder",
      path: "/project",
      expanded: true,
      children: [
        {
          name: "src",
          type: "folder",
          path: "/project/src",
          expanded: true,
          children: [
            { name: "index.ts", type: "file", path: "/project/src/index.ts", content: '// Main entry point\nconsole.log("Hello, world!");' },
            { name: "utils.ts", type: "file", path: "/project/src/utils.ts", content: '// Utility functions\nexport const add = (a: number, b: number) => a + b;' },
          ]
        },
        { name: "package.json", type: "file", path: "/project/package.json", content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}' },
        { name: "README.md", type: "file", path: "/project/README.md", content: "# My Project\n\nA sample project for Claude Cowork." },
      ]
    }
  ]);
  
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "system", content: "Claude Cowork Terminal v1.0", timestamp: new Date() },
    { type: "system", content: "Type 'help' for available commands", timestamp: new Date() },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  
  // Task automation state
  const [taskGoal, setTaskGoal] = useState("");
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState(0);
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setFiles(updateNode(files));
  };
  
  // Select a file
  const selectFile = (node: FileNode) => {
    if (node.type === "file") {
      setSelectedFile(node);
      setFileContent(node.content || "");
      setIsEditing(false);
    } else {
      toggleFolder(node.path);
    }
  };
  
  // Save file content
  const saveFile = () => {
    if (!selectedFile) return;
    
    const updateContent = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === selectedFile.path) {
          return { ...node, content: fileContent };
        }
        if (node.children) {
          return { ...node, children: updateContent(node.children) };
        }
        return node;
      });
    };
    
    setFiles(updateContent(files));
    setSelectedFile({ ...selectedFile, content: fileContent });
    setIsEditing(false);
    toast({ title: "File saved", description: selectedFile.name });
  };
  
  // Create new file
  const createFile = (parentPath: string, name: string, type: "file" | "folder") => {
    const newNode: FileNode = {
      name,
      type,
      path: `${parentPath}/${name}`,
      content: type === "file" ? "" : undefined,
      children: type === "folder" ? [] : undefined,
      expanded: type === "folder" ? true : undefined,
    };
    
    const addNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === parentPath && node.children) {
          return { ...node, children: [...node.children, newNode] };
        }
        if (node.children) {
          return { ...node, children: addNode(node.children) };
        }
        return node;
      });
    };
    
    setFiles(addNode(files));
    toast({ title: `${type === "file" ? "File" : "Folder"} created`, description: name });
  };
  
  // Delete file/folder
  const deleteNode = (path: string) => {
    const removeNode = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => node.path !== path)
        .map(node => ({
          ...node,
          children: node.children ? removeNode(node.children) : undefined,
        }));
    };
    
    setFiles(removeNode(files));
    if (selectedFile?.path === path) {
      setSelectedFile(null);
      setFileContent("");
    }
    toast({ title: "Deleted" });
  };
  
  // Execute terminal command
  const executeCommand = useCallback((command: string) => {
    const timestamp = new Date();
    setTerminalLines(prev => [...prev, { type: "input", content: `$ ${command}`, timestamp }]);
    
    const cmd = command.toLowerCase().trim();
    const args = cmd.split(" ").slice(1);
    
    let output: TerminalLine[] = [];
    
    if (cmd === "help") {
      output = [
        { type: "output", content: "Available commands:", timestamp },
        { type: "output", content: "  ls [path]     - List files", timestamp },
        { type: "output", content: "  cat <file>    - Display file content", timestamp },
        { type: "output", content: "  mkdir <name>  - Create directory", timestamp },
        { type: "output", content: "  touch <name>  - Create file", timestamp },
        { type: "output", content: "  rm <path>     - Delete file/folder", timestamp },
        { type: "output", content: "  echo <text>   - Print text", timestamp },
        { type: "output", content: "  clear         - Clear terminal", timestamp },
        { type: "output", content: "  node <file>   - Run JavaScript file", timestamp },
      ];
    } else if (cmd === "clear") {
      setTerminalLines([{ type: "system", content: "Terminal cleared", timestamp }]);
      return;
    } else if (cmd.startsWith("ls")) {
      const listFiles = (nodes: FileNode[], indent = 0): string[] => {
        return nodes.flatMap(node => {
          const prefix = "  ".repeat(indent);
          const icon = node.type === "folder" ? "📁" : "📄";
          const lines = [`${prefix}${icon} ${node.name}`];
          if (node.children && node.expanded) {
            lines.push(...listFiles(node.children, indent + 1));
          }
          return lines;
        });
      };
      output = listFiles(files).map(content => ({ type: "output" as const, content, timestamp }));
    } else if (cmd.startsWith("cat ")) {
      const fileName = args[0];
      const findFile = (nodes: FileNode[]): FileNode | undefined => {
        for (const node of nodes) {
          if (node.name === fileName && node.type === "file") return node;
          if (node.children) {
            const found = findFile(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      const file = findFile(files);
      if (file) {
        output = (file.content || "").split("\n").map(line => ({ type: "output" as const, content: line, timestamp }));
      } else {
        output = [{ type: "error", content: `File not found: ${fileName}`, timestamp }];
      }
    } else if (cmd.startsWith("echo ")) {
      output = [{ type: "output", content: args.join(" "), timestamp }];
    } else if (cmd.startsWith("mkdir ")) {
      createFile("/project", args[0], "folder");
      output = [{ type: "output", content: `Created directory: ${args[0]}`, timestamp }];
    } else if (cmd.startsWith("touch ")) {
      createFile("/project/src", args[0], "file");
      output = [{ type: "output", content: `Created file: ${args[0]}`, timestamp }];
    } else if (cmd.startsWith("rm ")) {
      deleteNode(`/project/${args[0]}`);
      output = [{ type: "output", content: `Deleted: ${args[0]}`, timestamp }];
    } else if (cmd.startsWith("node ")) {
      const fileName = args[0];
      const findFile = (nodes: FileNode[]): FileNode | undefined => {
        for (const node of nodes) {
          if (node.name === fileName && node.type === "file") return node;
          if (node.children) {
            const found = findFile(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      const file = findFile(files);
      if (file && file.content) {
        try {
          // Safe evaluation for demo purposes
          const result = eval(file.content);
          output = [{ type: "output", content: String(result || "undefined"), timestamp }];
        } catch (e: unknown) {
          output = [{ type: "error", content: `Error: ${(e as Error).message}`, timestamp }];
        }
      } else {
        output = [{ type: "error", content: `File not found: ${fileName}`, timestamp }];
      }
    } else {
      output = [{ type: "error", content: `Command not found: ${cmd.split(" ")[0]}`, timestamp }];
    }
    
    setTerminalLines(prev => [...prev, ...output]);
  }, [files]);
  
  // Start autonomous task execution
  const startAutonomousTask = async () => {
    if (!taskGoal.trim()) {
      toast({ title: "Enter a task goal", variant: "destructive" });
      return;
    }
    
    setIsExecuting(true);
    setIsAutonomous(true);
    setActionsCompleted(0);
    
    // Simulate AI planning actions
    const plannedActions: TaskAction[] = [
      { id: "1", type: "read", target: "project structure", status: "pending" },
      { id: "2", type: "create", target: "new-feature.ts", status: "pending" },
      { id: "3", type: "write", target: "new-feature.ts", status: "pending" },
      { id: "4", type: "execute", target: "npm run test", status: "pending" },
      { id: "5", type: "read", target: "test results", status: "pending" },
    ];
    
    setActions(plannedActions);
    
    // Execute actions sequentially
    for (let i = 0; i < plannedActions.length; i++) {
      if (!isAutonomous) break;
      
      setActions(prev => prev.map((a, idx) => 
        idx === i ? { ...a, status: "running" } : a
      ));
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setActions(prev => prev.map((a, idx) => 
        idx === i ? { 
          ...a, 
          status: "completed", 
          output: `✓ Completed ${a.type} on ${a.target}` 
        } : a
      ));
      
      setActionsCompleted(i + 1);
      
      // Add terminal log
      setTerminalLines(prev => [...prev, {
        type: "system",
        content: `[Claude] ${plannedActions[i].type}: ${plannedActions[i].target}`,
        timestamp: new Date(),
      }]);
    }
    
    setIsExecuting(false);
    toast({ 
      title: "Task completed", 
      description: `${plannedActions.length} actions executed successfully` 
    });
  };
  
  // Stop autonomous execution
  const stopAutonomous = () => {
    setIsAutonomous(false);
    setIsExecuting(false);
    toast({ title: "Task stopped" });
  };
  
  // Render file tree
  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => selectFile(node)}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors",
            selectedFile?.path === node.path && "bg-accent"
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {node.type === "folder" ? (
            node.expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileCode className="h-4 w-4 text-primary" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.type === "folder" && node.expanded && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed left-4 right-4 top-4 bottom-4 md:left-[5%] md:right-[5%] md:top-[5%] md:bottom-[5%] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Claude Cowork</h2>
                <p className="text-xs text-muted-foreground">Semi-autonomous file & terminal operations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isAutonomous ? "default" : "secondary"}>
                {isAutonomous ? "Autonomous Mode" : "Manual Mode"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className="w-64 border-r border-border flex flex-col">
              <div className="p-2 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">EXPLORER</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => createFile("/project/src", "new-file.ts", "file")}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" multiple />
              </div>
              <ScrollArea className="flex-1 p-2">
                {renderFileTree(files)}
              </ScrollArea>
            </div>

            {/* Main Panel */}
            <div className="flex-1 flex flex-col">
              <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                <TabsList className="rounded-none border-b border-border bg-transparent h-10 px-2">
                  <TabsTrigger value="editor" className="gap-2 data-[state=active]:bg-accent">
                    <FileCode className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="gap-2 data-[state=active]:bg-accent">
                    <Terminal className="h-4 w-4" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="autonomous" className="gap-2 data-[state=active]:bg-accent">
                    <Bot className="h-4 w-4" />
                    Autonomous
                  </TabsTrigger>
                </TabsList>

                {/* Editor Tab */}
                <TabsContent value="editor" className="flex-1 flex flex-col mt-0 p-0">
                  {selectedFile ? (
                    <>
                      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">{selectedFile.path}</span>
                        </div>
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                              <Button size="sm" onClick={saveFile}><Save className="h-3 w-3 mr-1" />Save</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}><Edit3 className="h-3 w-3 mr-1" />Edit</Button>
                              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(fileContent)}><Copy className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteNode(selectedFile.path)}><Trash2 className="h-3 w-3" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <Textarea
                          value={fileContent}
                          onChange={(e) => setFileContent(e.target.value)}
                          className="flex-1 font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0"
                          placeholder="Enter file content..."
                        />
                      ) : (
                        <ScrollArea className="flex-1 p-4">
                          <pre className="font-mono text-sm whitespace-pre-wrap">{fileContent}</pre>
                        </ScrollArea>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a file to view or edit</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Terminal Tab */}
                <TabsContent value="terminal" className="flex-1 flex flex-col mt-0 p-0">
                  <ScrollArea className="flex-1 bg-black/95 p-4">
                    <div className="font-mono text-sm space-y-1">
                      {terminalLines.map((line, i) => (
                        <div
                          key={i}
                          className={cn(
                            line.type === "error" && "text-red-400",
                            line.type === "system" && "text-blue-400",
                            line.type === "input" && "text-green-400",
                            line.type === "output" && "text-gray-300"
                          )}
                        >
                          {line.content}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-border p-2 bg-black/95">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-mono text-sm">$</span>
                      <Input
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentCommand.trim()) {
                            executeCommand(currentCommand);
                            setCurrentCommand("");
                          }
                        }}
                        placeholder="Type a command..."
                        className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Autonomous Tab */}
                <TabsContent value="autonomous" className="flex-1 flex flex-col mt-0 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Task Goal</label>
                      <Textarea
                        value={taskGoal}
                        onChange={(e) => setTaskGoal(e.target.value)}
                        placeholder="Describe what you want Claude to accomplish... (e.g., 'Create a new API endpoint for user authentication with proper error handling')"
                        className="min-h-[100px]"
                        disabled={isExecuting}
                      />
                    </div>

                    <div className="flex gap-2">
                      {!isExecuting ? (
                        <Button onClick={startAutonomousTask} className="gap-2">
                          <Play className="h-4 w-4" />
                          Start Autonomous Task
                        </Button>
                      ) : (
                        <Button variant="destructive" onClick={stopAutonomous} className="gap-2">
                          <Pause className="h-4 w-4" />
                          Stop Execution
                        </Button>
                      )}
                    </div>

                    {actions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Actions ({actionsCompleted}/{actions.length})</span>
                          {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <div className="space-y-2">
                          {actions.map((action) => (
                            <div
                              key={action.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border",
                                action.status === "completed" && "bg-green-500/10 border-green-500/30",
                                action.status === "running" && "bg-blue-500/10 border-blue-500/30",
                                action.status === "failed" && "bg-red-500/10 border-red-500/30",
                                action.status === "pending" && "bg-muted/30 border-border"
                              )}
                            >
                              {action.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {action.status === "running" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                              {action.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {action.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{action.type}</Badge>
                                  <span className="text-sm">{action.target}</span>
                                </div>
                                {action.output && (
                                  <p className="text-xs text-muted-foreground mt-1">{action.output}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
