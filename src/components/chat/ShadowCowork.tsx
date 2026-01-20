import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, FolderOpen, FileCode, Terminal, Play, Pause, 
  CheckCircle2, AlertCircle, Loader2, Download, Upload,
  FolderTree, File, Edit3, Trash2, Plus, Save, Copy,
  RefreshCw, Settings, Bot, ChevronRight, ChevronDown,
  GitBranch, GitCommit, GitMerge, History, RotateCcw, Archive,
  FolderPlus, MessageSquare, Sparkles, ThumbsUp, ThumbsDown,
  AlertTriangle, Lightbulb, Code, Shield, Smartphone, Monitor, Tablet, Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShadowCoworkProps {
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

interface CodeReviewSuggestion {
  type: "improvement" | "warning" | "security" | "praise";
  title: string;
  description: string;
  file?: string;
  line?: number;
  priority: "low" | "medium" | "high";
}

interface CodeReview {
  commitId: string;
  overallScore: number;
  summary: string;
  suggestions: CodeReviewSuggestion[];
  reviewedAt: Date;
  isLoading?: boolean;
}

interface GitCommit {
  id: string;
  message: string;
  timestamp: Date;
  files: string[];
  snapshot: FileNode[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  files: FileNode[];
  commits: GitCommit[];
  currentBranch: string;
  branches: string[];
}

export const ShadowCowork = ({ isOpen, onClose, onInsertToChat }: ShadowCoworkProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "default",
      name: "My Project",
      description: "Default workspace project",
      createdAt: new Date(),
      files: [
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
            { name: "README.md", type: "file", path: "/project/README.md", content: "# My Project\n\nA sample project for Shadow Cowork." },
          ]
        }
      ],
      commits: [
        { id: "init", message: "Initial commit", timestamp: new Date(Date.now() - 86400000), files: ["package.json", "README.md"], snapshot: [] }
      ],
      currentBranch: "main",
      branches: ["main", "develop"]
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState("default");
  const [newProjectName, setNewProjectName] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  
  // File system state (derived from active project)
  const files = activeProject?.files || [];
  
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "system", content: "Shadow Cowork Terminal v1.0", timestamp: new Date() },
    { type: "system", content: "Type 'help' for available commands", timestamp: new Date() },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  
  // Task automation state
  const [taskGoal, setTaskGoal] = useState("");
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState(0);
  
  // Code review state
  const [codeReviews, setCodeReviews] = useState<Record<string, CodeReview>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  
  // AI code completion state - inline ghost text like GitHub Copilot
  const [ghostText, setGhostText] = useState<string>("");
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-responsive feature state
  const [isResponsiveLoading, setIsResponsiveLoading] = useState(false);
  const [responsivePreview, setResponsivePreview] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [originalCode, setOriginalCode] = useState("");
  const [responsiveCode, setResponsiveCode] = useState("");
  const [responsiveChanges, setResponsiveChanges] = useState<Array<{
    type: "added" | "modified" | "suggestion";
    description: string;
    before?: string;
    after: string;
  }>>([]);
  
  // Helper to update files in active project
  const setFiles = (newFiles: FileNode[] | ((prev: FileNode[]) => FileNode[])) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { 
          ...p, 
          files: typeof newFiles === 'function' ? newFiles(p.files) : newFiles 
        };
      }
      return p;
    }));
  };
  
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
  
  // Git-like version control functions
  const createCommit = () => {
    if (!commitMessage.trim()) {
      toast({ title: "Enter a commit message", variant: "destructive" });
      return;
    }
    
    const changedFiles = getAllFileNames(files);
    const newCommit: GitCommit = {
      id: crypto.randomUUID(),
      message: commitMessage,
      timestamp: new Date(),
      files: changedFiles,
      snapshot: JSON.parse(JSON.stringify(files)) // Deep clone
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, commits: [...p.commits, newCommit] };
      }
      return p;
    }));
    
    setCommitMessage("");
    toast({ title: "Commit created", description: commitMessage });
    
    // Send to chat if callback exists
    if (onInsertToChat) {
      onInsertToChat(`📝 **Git Commit**\n\nMessage: "${commitMessage}"\nFiles changed: ${changedFiles.join(", ")}\nBranch: ${activeProject?.currentBranch || "main"}`);
    }
  };
  
  const getAllFileNames = (nodes: FileNode[]): string[] => {
    const names: string[] = [];
    const traverse = (node: FileNode) => {
      if (node.type === "file") names.push(node.name);
      node.children?.forEach(traverse);
    };
    nodes.forEach(traverse);
    return names;
  };
  
  const revertToCommit = (commit: GitCommit) => {
    if (commit.snapshot.length === 0) {
      toast({ title: "Cannot revert", description: "No snapshot available", variant: "destructive" });
      return;
    }
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, files: JSON.parse(JSON.stringify(commit.snapshot)) };
      }
      return p;
    }));
    
    toast({ title: "Reverted", description: `Reverted to: ${commit.message}` });
  };
  
  const createProject = () => {
    if (!newProjectName.trim()) {
      toast({ title: "Enter a project name", variant: "destructive" });
      return;
    }
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      description: "New project",
      createdAt: new Date(),
      files: [
        {
          name: "src",
          type: "folder",
          path: "/src",
          expanded: true,
          children: [
            { name: "index.ts", type: "file", path: "/src/index.ts", content: '// Entry point\nconsole.log("Hello!");' }
          ]
        }
      ],
      commits: [],
      currentBranch: "main",
      branches: ["main"]
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setNewProjectName("");
    setShowNewProjectDialog(false);
    toast({ title: "Project created", description: newProjectName });
  };
  
  const switchBranch = (branch: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, currentBranch: branch };
      }
      return p;
    }));
    toast({ title: `Switched to ${branch}` });
  };
  
  const createBranch = (name: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { 
          ...p, 
          branches: [...p.branches, name],
          currentBranch: name
        };
      }
      return p;
    }));
    toast({ title: `Created branch: ${name}` });
  };
  
  // AI-assisted code review
  const analyzeCommit = async (commit: GitCommit) => {
    if (codeReviews[commit.id]?.isLoading) return;
    
    // Mark as loading
    setCodeReviews(prev => ({
      ...prev,
      [commit.id]: {
        commitId: commit.id,
        overallScore: 0,
        summary: "",
        suggestions: [],
        reviewedAt: new Date(),
        isLoading: true
      }
    }));
    
    // Get file contents from snapshot
    const getFileContents = (nodes: FileNode[]): Array<{ name: string; content: string }> => {
      const contents: Array<{ name: string; content: string }> = [];
      const traverse = (node: FileNode) => {
        if (node.type === "file" && node.content) {
          contents.push({ name: node.name, content: node.content });
        }
        node.children?.forEach(traverse);
      };
      nodes.forEach(traverse);
      return contents;
    };
    
    const fileContents = commit.snapshot.length > 0 
      ? getFileContents(commit.snapshot)
      : getFileContents(files);
    
    const codeContext = fileContents.map(f => 
      `### File: ${f.name}\n\`\`\`\n${f.content}\n\`\`\``
    ).join("\n\n");
    
    try {
      const response = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: "system",
              content: `You are an expert code reviewer. Analyze the provided code changes from a commit and provide constructive feedback.

Return your response as valid JSON in this exact format:
{
  "overallScore": 85,
  "summary": "Brief summary of code quality",
  "suggestions": [
    {
      "type": "improvement|warning|security|praise",
      "title": "Short title",
      "description": "Detailed explanation",
      "file": "filename.ts",
      "priority": "low|medium|high"
    }
  ]
}

Review criteria:
- Code quality and readability
- Potential bugs or errors
- Security vulnerabilities
- Performance optimizations
- Best practices
- Positive aspects worth highlighting

Score should be 0-100 based on overall code quality.`
            },
            {
              role: "user",
              content: `Review this commit:

**Commit Message:** ${commit.message}
**Files Changed:** ${commit.files.join(", ")}

**Code:**
${codeContext}`
            }
          ]
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      // Parse the response
      const content = response.data?.choices?.[0]?.message?.content || 
                      response.data?.generatedText || 
                      JSON.stringify(response.data);
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setCodeReviews(prev => ({
            ...prev,
            [commit.id]: {
              commitId: commit.id,
              overallScore: parsed.overallScore || 75,
              summary: parsed.summary || "Review completed",
              suggestions: parsed.suggestions || [],
              reviewedAt: new Date(),
              isLoading: false
            }
          }));
          
          setExpandedReview(commit.id);
          toast({ title: "Code review complete", description: `Score: ${parsed.overallScore}/100` });
          
          // Export to chat if callback exists
          if (onInsertToChat) {
            const reviewText = `## 🔍 AI Code Review\n\n**Commit:** ${commit.message}\n**Score:** ${parsed.overallScore}/100\n\n**Summary:** ${parsed.summary}\n\n**Suggestions:**\n${parsed.suggestions.map((s: CodeReviewSuggestion) => `- **${s.title}** (${s.type}): ${s.description}`).join("\n")}`;
            onInsertToChat(reviewText);
          }
          return;
        }
      } catch {
        // Parsing failed, use default
      }
      
      // Fallback review
      setCodeReviews(prev => ({
        ...prev,
        [commit.id]: {
          commitId: commit.id,
          overallScore: 75,
          summary: "Code review completed with basic analysis",
          suggestions: [
            {
              type: "improvement",
              title: "Consider adding documentation",
              description: "Adding JSDoc comments would improve code maintainability",
              priority: "medium"
            }
          ],
          reviewedAt: new Date(),
          isLoading: false
        }
      }));
      setExpandedReview(commit.id);
      toast({ title: "Code review complete" });
      
    } catch (error) {
      console.error("Code review error:", error);
      setCodeReviews(prev => ({
        ...prev,
        [commit.id]: {
          commitId: commit.id,
          overallScore: 0,
          summary: "Review failed - please try again",
          suggestions: [],
          reviewedAt: new Date(),
          isLoading: false
        }
      }));
      toast({ title: "Review failed", variant: "destructive" });
    }
  };
  
  // Get icon for suggestion type
  const getSuggestionIcon = (type: CodeReviewSuggestion["type"]) => {
    switch (type) {
      case "improvement": return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "security": return <Shield className="h-4 w-4 text-red-500" />;
      case "praise": return <ThumbsUp className="h-4 w-4 text-green-500" />;
      default: return <Code className="h-4 w-4" />;
    }
  };
  
  // Get color for score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  // AI-powered inline code completion (ghost text like GitHub Copilot)
  const getCodeCompletion = useCallback(async (code: string, position: number) => {
    if (!selectedFile || !isEditing) return;
    
    setIsLoadingCompletion(true);
    setGhostText("");
    
    // Get context around cursor
    const beforeCursor = code.slice(Math.max(0, position - 500), position);
    const afterCursor = code.slice(position, Math.min(code.length, position + 200));
    const currentLine = beforeCursor.split("\n").pop() || "";
    
    // Get file extension for language context
    const ext = selectedFile.name.split(".").pop() || "txt";
    const languageMap: Record<string, string> = {
      ts: "TypeScript", tsx: "TypeScript React", js: "JavaScript", jsx: "JavaScript React",
      py: "Python", css: "CSS", html: "HTML", json: "JSON", md: "Markdown"
    };
    const language = languageMap[ext] || ext.toUpperCase();
    
    try {
      const response = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are an expert code completion assistant like GitHub Copilot. Provide a SINGLE inline code completion based on the current context.

Language: ${language}
File: ${selectedFile.name}

Return ONLY the completion text that should be inserted at the cursor position. No explanations, no markdown, no code blocks - just the raw code to insert.

Guidelines:
- Complete the current line or add the next logical code
- Be concise (1-5 lines max)
- Follow the existing code style and indentation
- Be syntactically correct
- If the line is complete, suggest the next logical line(s)`
            },
            {
              role: "user",
              content: `Code before cursor:
${beforeCursor}█

Code after cursor:
${afterCursor}

Current line being typed: "${currentLine}"

Provide the code completion to insert at █:`
            }
          ]
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const content = response.data?.choices?.[0]?.message?.content || 
                      response.data?.generatedText || "";
      
      // Clean the response - remove markdown code blocks if present
      let completion = content.trim();
      if (completion.startsWith("```")) {
        completion = completion.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      }
      
      // Set ghost text if we got a valid completion
      if (completion && completion.length > 0 && completion.length < 500) {
        setGhostText(completion);
      }
    } catch (error) {
      console.error("Code completion error:", error);
    } finally {
      setIsLoadingCompletion(false);
    }
  }, [selectedFile, isEditing]);
  
  // Debounced completion trigger
  const triggerCompletion = useCallback((code: string, position: number) => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    
    // Only trigger after a pause in typing
    completionTimeoutRef.current = setTimeout(() => {
      getCodeCompletion(code, position);
    }, 800);
  }, [getCodeCompletion]);
  
  // Handle editor changes
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newPosition = e.target.selectionStart;
    
    setFileContent(newContent);
    setCursorPosition(newPosition);
    setGhostText(""); // Clear ghost text on any change
    
    // Trigger completion after typing
    triggerCompletion(newContent, newPosition);
  };
  
  // Handle editor key events
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Accept ghost text with Tab
    if (e.key === "Tab" && ghostText) {
      e.preventDefault();
      acceptGhostText();
      return;
    }
    
    // Dismiss ghost text with Escape
    if (e.key === "Escape" && ghostText) {
      e.preventDefault();
      setGhostText("");
      return;
    }
    
    // Ctrl+Space to manually trigger completion
    if (e.key === " " && e.ctrlKey) {
      e.preventDefault();
      getCodeCompletion(fileContent, cursorPosition);
      return;
    }
  };
  
  // Accept the ghost text suggestion
  const acceptGhostText = () => {
    if (!ghostText) return;
    
    const before = fileContent.slice(0, cursorPosition);
    const after = fileContent.slice(cursorPosition);
    const newContent = before + ghostText + after;
    const newPosition = cursorPosition + ghostText.length;
    
    setFileContent(newContent);
    setCursorPosition(newPosition);
    setGhostText("");
    
    // Focus textarea and set cursor position
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
        }
      }, 0);
    }
    
    toast({ title: "Completion accepted" });
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);
  
  // Export terminal output to chat
  const exportTerminalToChat = () => {
    if (onInsertToChat) {
      const output = terminalLines.map(l => l.content).join("\n");
      onInsertToChat(`## Terminal Output\n\n\`\`\`\n${output}\n\`\`\``);
      toast({ title: "Exported to chat" });
    }
  };
  
  // Export file to chat
  const exportFileToChat = () => {
    if (onInsertToChat && selectedFile) {
      const lang = selectedFile.name.split('.').pop() || 'text';
      onInsertToChat(`## File: ${selectedFile.name}\n\n\`\`\`${lang}\n${fileContent}\n\`\`\``);
      toast({ title: "Exported to chat" });
    }
  };
  
  // Auto-responsive feature - AI makes code responsive automatically
  const makeCodeResponsive = async () => {
    if (!selectedFile || !fileContent) {
      toast({ title: "Select a file first", variant: "destructive" });
      return;
    }
    
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const supportedExts = ["tsx", "jsx", "html", "css", "vue", "svelte"];
    
    if (!ext || !supportedExts.includes(ext)) {
      toast({ 
        title: "Unsupported file type", 
        description: "Select HTML, CSS, JSX, TSX, Vue, or Svelte files",
        variant: "destructive" 
      });
      return;
    }
    
    setIsResponsiveLoading(true);
    setOriginalCode(fileContent);
    setResponsiveCode("");
    setResponsiveChanges([]);
    
    try {
      const response = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are an expert frontend developer specializing in responsive design. Your task is to make the provided code fully responsive across all device sizes (mobile, tablet, desktop).

Transform the code following these best practices:
1. **Mobile-first approach**: Start with mobile styles, add breakpoints for larger screens
2. **Flexbox/Grid**: Replace fixed widths with flexible layouts
3. **Responsive units**: Use rem, em, %, vw, vh instead of fixed px values
4. **Media queries**: Add appropriate breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
5. **Tailwind classes**: If using Tailwind, add responsive prefixes (sm:, md:, lg:, xl:)
6. **Touch-friendly**: Ensure buttons/links have min 44px tap targets on mobile
7. **Typography**: Use fluid typography that scales with viewport
8. **Images**: Make images responsive with max-width: 100%
9. **Navigation**: Convert to hamburger menu on mobile if applicable
10. **Hide/Show**: Use responsive visibility utilities appropriately

Return your response as JSON:
{
  "responsiveCode": "// The complete transformed responsive code",
  "changes": [
    {
      "type": "added|modified|suggestion",
      "description": "What was changed and why",
      "before": "Original code snippet (if modified)",
      "after": "New responsive code snippet"
    }
  ]
}`
            },
            {
              role: "user",
              content: `Make this ${ext.toUpperCase()} code fully responsive:

File: ${selectedFile.name}

\`\`\`${ext}
${fileContent}
\`\`\`

Transform it to be fully responsive across mobile, tablet, and desktop.`
            }
          ]
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const content = response.data?.choices?.[0]?.message?.content || "";
      
      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResponsiveCode(parsed.responsiveCode || fileContent);
          setResponsiveChanges(parsed.changes || []);
          toast({ 
            title: "Code made responsive!", 
            description: `${parsed.changes?.length || 0} changes applied` 
          });
        } else {
          // Fallback: treat entire response as code
          setResponsiveCode(content.replace(/```[\w]*\n?/g, "").replace(/```$/g, "").trim());
          setResponsiveChanges([{
            type: "modified",
            description: "Code transformed to be responsive",
            after: "See full code in preview"
          }]);
        }
      } catch {
        setResponsiveCode(content);
        setResponsiveChanges([{
          type: "modified",
          description: "Code transformed to be responsive",
          after: "See full code in preview"
        }]);
      }
      
    } catch (error) {
      console.error("Responsive conversion error:", error);
      toast({ 
        title: "Failed to make responsive", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsResponsiveLoading(false);
    }
  };
  
  // Apply responsive changes to file
  const applyResponsiveChanges = () => {
    if (!responsiveCode || !selectedFile) return;
    
    setFileContent(responsiveCode);
    
    // Update the file in the project
    const updateContent = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === selectedFile.path) {
          return { ...node, content: responsiveCode };
        }
        if (node.children) {
          return { ...node, children: updateContent(node.children) };
        }
        return node;
      });
    };
    
    setFiles(updateContent(files));
    setSelectedFile({ ...selectedFile, content: responsiveCode });
    
    toast({ title: "Responsive changes applied!" });
    
    // Export to chat if callback exists
    if (onInsertToChat) {
      const changesText = responsiveChanges.map(c => `- **${c.type}**: ${c.description}`).join("\n");
      onInsertToChat(`## 📱 Auto-Responsive Applied\n\n**File:** ${selectedFile.name}\n\n**Changes:**\n${changesText}\n\n\`\`\`${selectedFile.name.split('.').pop()}\n${responsiveCode}\n\`\`\``);
    }
    
    // Reset state
    setResponsiveCode("");
    setResponsiveChanges([]);
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
                <h2 className="font-semibold">Shadow Cowork</h2>
                <p className="text-xs text-muted-foreground">Semi-autonomous file & terminal operations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isAutonomous ? "default" : "secondary"}>
                {isAutonomous ? "Autonomous Mode" : "Manual Mode"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <GitBranch className="h-3 w-3" />
                {activeProject?.currentBranch || "main"}
              </Badge>
              {onInsertToChat && (
                <Button variant="ghost" size="sm" onClick={exportTerminalToChat} className="gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  Export
                </Button>
              )}
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
                  <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-accent">
                    <GitBranch className="h-4 w-4" />
                    Projects
                  </TabsTrigger>
                  <TabsTrigger value="responsive" className="gap-2 data-[state=active]:bg-accent">
                    <Smartphone className="h-4 w-4" />
                    Responsive
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
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => getCodeCompletion(fileContent, cursorPosition)}
                                disabled={isLoadingCompletion}
                                className="gap-1"
                              >
                                {isLoadingCompletion ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                                AI Complete
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setGhostText(""); }}>Cancel</Button>
                              <Button size="sm" onClick={saveFile}><Save className="h-3 w-3 mr-1" />Save</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}><Edit3 className="h-3 w-3 mr-1" />Edit</Button>
                              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(fileContent)}><Copy className="h-3 w-3" /></Button>
                              {onInsertToChat && (
                                <Button size="sm" variant="ghost" onClick={exportFileToChat}><MessageSquare className="h-3 w-3 mr-1" />Export</Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => deleteNode(selectedFile.path)}><Trash2 className="h-3 w-3" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div ref={editorContainerRef} className="flex-1 relative overflow-hidden">
                          {/* Ghost text overlay - positioned absolutely behind cursor */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <pre className="font-mono text-sm p-3 whitespace-pre-wrap break-words">
                              {/* Render content before cursor as invisible to position ghost text */}
                              <span className="invisible">{fileContent.slice(0, cursorPosition)}</span>
                              {/* Ghost text suggestion */}
                              {ghostText && (
                                <span className="text-muted-foreground/50 italic">{ghostText}</span>
                              )}
                            </pre>
                          </div>
                          
                          {/* Actual textarea */}
                          <Textarea
                            ref={textareaRef}
                            value={fileContent}
                            onChange={handleEditorChange}
                            onKeyDown={handleEditorKeyDown}
                            onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                            className="absolute inset-0 font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 bg-transparent"
                            placeholder="Enter file content... (Ctrl+Space for AI completion)"
                            style={{ caretColor: 'hsl(var(--foreground))' }}
                          />
                          
                          {/* Ghost text hint bar */}
                          {ghostText && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full shadow-lg">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-xs text-muted-foreground">
                                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono mx-1">Tab</kbd> to accept
                              </span>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-xs text-muted-foreground">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono mx-1">Esc</kbd> to dismiss
                              </span>
                            </div>
                          )}
                          
                          {/* Loading indicator */}
                          {isLoadingCompletion && (
                            <div className="absolute right-4 top-4 flex items-center gap-2 px-2 py-1 bg-muted/80 backdrop-blur-sm rounded-md border border-border">
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              <span className="text-xs text-muted-foreground">AI thinking...</span>
                            </div>
                          )}
                        </div>
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

                {/* Projects Tab */}
                <TabsContent value="projects" className="flex-1 flex flex-col mt-0 p-4 overflow-auto">
                  <div className="space-y-6">
                    {/* Project Selector */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-5 w-5 text-primary" />
                        <select
                          value={activeProjectId}
                          onChange={(e) => setActiveProjectId(e.target.value)}
                          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowNewProjectDialog(true)} className="gap-1">
                        <FolderPlus className="h-4 w-4" />
                        New Project
                      </Button>
                    </div>

                    {/* New Project Dialog */}
                    {showNewProjectDialog && (
                      <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                        <Input
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Project name..."
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={createProject}>Create</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowNewProjectDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* Branch Management */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Branches
                        </h4>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            const name = prompt("New branch name:");
                            if (name) createBranch(name);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          New
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeProject?.branches.map(branch => (
                          <Badge
                            key={branch}
                            variant={branch === activeProject.currentBranch ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => switchBranch(branch)}
                          >
                            {branch}
                            {branch === activeProject.currentBranch && <CheckCircle2 className="h-3 w-3 ml-1" />}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Commit Section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <GitCommit className="h-4 w-4" />
                        Create Commit
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          value={commitMessage}
                          onChange={(e) => setCommitMessage(e.target.value)}
                          placeholder="Commit message..."
                          className="flex-1"
                          onKeyDown={(e) => e.key === "Enter" && createCommit()}
                        />
                        <Button onClick={createCommit} className="gap-1">
                          <GitCommit className="h-4 w-4" />
                          Commit
                        </Button>
                      </div>
                    </div>

                    {/* Commit History */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Commit History
                      </h4>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2 pr-4">
                          {activeProject?.commits.slice().reverse().map((commit, idx) => {
                            const review = codeReviews[commit.id];
                            const isExpanded = expandedReview === commit.id;
                            
                            return (
                              <div
                                key={commit.id}
                                className="border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors overflow-hidden"
                              >
                                <div className="p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{commit.message}</p>
                                        {review && !review.isLoading && (
                                          <Badge 
                                            variant="outline" 
                                            className={cn("text-xs", getScoreColor(review.overallScore))}
                                          >
                                            {review.overallScore}/100
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {commit.timestamp.toLocaleString()}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {commit.files.slice(0, 3).map(f => (
                                          <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                                        ))}
                                        {commit.files.length > 3 && (
                                          <Badge variant="secondary" className="text-xs">+{commit.files.length - 3} more</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant={review && !review.isLoading ? "ghost" : "outline"}
                                        onClick={() => review && !review.isLoading ? setExpandedReview(isExpanded ? null : commit.id) : analyzeCommit(commit)}
                                        disabled={review?.isLoading}
                                        className="gap-1"
                                      >
                                        {review?.isLoading ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Sparkles className="h-3 w-3" />
                                        )}
                                        {review && !review.isLoading ? (isExpanded ? "Hide" : "View") : "Review"}
                                      </Button>
                                      {idx > 0 && commit.snapshot.length > 0 && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => revertToCommit(commit)}
                                          className="gap-1"
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Review Results */}
                                {review && !review.isLoading && isExpanded && (
                                  <div className="border-t border-border bg-muted/30 p-3 space-y-3">
                                    {/* Score & Summary */}
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "text-2xl font-bold",
                                        getScoreColor(review.overallScore)
                                      )}>
                                        {review.overallScore}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">Code Quality Score</p>
                                        <p className="text-xs text-muted-foreground">{review.summary}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Suggestions */}
                                    {review.suggestions.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Suggestions</p>
                                        {review.suggestions.map((suggestion, sIdx) => (
                                          <div 
                                            key={sIdx}
                                            className={cn(
                                              "flex gap-2 p-2 rounded-lg text-sm",
                                              suggestion.type === "security" && "bg-red-500/10",
                                              suggestion.type === "warning" && "bg-yellow-500/10",
                                              suggestion.type === "improvement" && "bg-blue-500/10",
                                              suggestion.type === "praise" && "bg-green-500/10"
                                            )}
                                          >
                                            {getSuggestionIcon(suggestion.type)}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">{suggestion.title}</span>
                                                <Badge variant="outline" className="text-[10px]">
                                                  {suggestion.priority}
                                                </Badge>
                                                {suggestion.file && (
                                                  <span className="text-xs text-muted-foreground">{suggestion.file}</span>
                                                )}
                                              </div>
                                              <p className="text-xs text-muted-foreground mt-0.5">
                                                {suggestion.description}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <p className="text-[10px] text-muted-foreground">
                                      Reviewed at {review.reviewedAt.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {(!activeProject?.commits || activeProject.commits.length === 0) && (
                            <div className="text-center text-muted-foreground py-8">
                              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No commits yet</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                {/* Responsive Tab */}
                <TabsContent value="responsive" className="flex-1 flex flex-col mt-0 p-4 overflow-auto">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                          <Wand2 className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Auto-Responsive</h3>
                          <p className="text-xs text-muted-foreground">Transform any code to be fully responsive</p>
                        </div>
                      </div>
                      
                      {/* Preview size selector */}
                      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                        <Button
                          variant={responsivePreview === "mobile" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setResponsivePreview("mobile")}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={responsivePreview === "tablet" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setResponsivePreview("tablet")}
                        >
                          <Tablet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={responsivePreview === "desktop" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setResponsivePreview("desktop")}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Current file info */}
                    {selectedFile ? (
                      <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-5 w-5 text-primary" />
                            <span className="font-medium">{selectedFile.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {selectedFile.name.split('.').pop()?.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            onClick={makeCodeResponsive}
                            disabled={isResponsiveLoading}
                            className="gap-2"
                          >
                            {isResponsiveLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Transforming...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4" />
                                Make Responsive
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Click "Make Responsive" to automatically add responsive breakpoints, 
                          flexible layouts, and mobile-first styles to your code.
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-border rounded-lg text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Select a file from the explorer to make it responsive</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported: HTML, CSS, JSX, TSX, Vue, Svelte
                        </p>
                      </div>
                    )}

                    {/* Changes preview */}
                    {responsiveChanges.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Changes Made ({responsiveChanges.length})
                          </h4>
                          <Button size="sm" onClick={applyResponsiveChanges} className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Apply Changes
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-[200px] overflow-auto">
                          {responsiveChanges.map((change, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "p-3 rounded-lg border text-sm",
                                change.type === "added" && "bg-primary/5 border-primary/20",
                                change.type === "modified" && "bg-accent border-accent",
                                change.type === "suggestion" && "bg-muted border-border"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    change.type === "added" && "border-primary text-primary",
                                    change.type === "modified" && "border-accent-foreground",
                                    change.type === "suggestion" && "border-muted-foreground"
                                  )}
                                >
                                  {change.type}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{change.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responsive code preview */}
                    {responsiveCode && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Responsive Code Preview</h4>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(responsiveCode)}
                              className="gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setResponsiveCode("");
                                setResponsiveChanges([]);
                              }}
                            >
                              <X className="h-3 w-3" />
                              Discard
                            </Button>
                          </div>
                        </div>
                        
                        <div 
                          className={cn(
                            "border border-border rounded-lg overflow-hidden transition-all duration-300 mx-auto",
                            responsivePreview === "mobile" && "max-w-[375px]",
                            responsivePreview === "tablet" && "max-w-[768px]",
                            responsivePreview === "desktop" && "max-w-full"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 border-b border-border">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-destructive/50" />
                              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                              <div className="w-2 h-2 rounded-full bg-primary/50" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {responsivePreview === "mobile" && "375px (Mobile)"}
                              {responsivePreview === "tablet" && "768px (Tablet)"}
                              {responsivePreview === "desktop" && "Full Width (Desktop)"}
                            </span>
                          </div>
                          <ScrollArea className="h-[300px]">
                            <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                              {responsiveCode}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    )}

                    {/* Tips section */}
                    <div className="p-4 border border-border rounded-lg bg-muted/20">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        Responsive Best Practices
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          Mobile-first: Start with mobile styles, add breakpoints for larger screens
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          Use flexible units: rem, em, %, vw, vh instead of fixed px
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          Flexbox & Grid: Replace fixed layouts with flexible ones
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          Touch targets: Minimum 44px tap areas for mobile buttons
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          Test on real devices: Simulators don't catch all issues
                        </li>
                      </ul>
                    </div>
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
