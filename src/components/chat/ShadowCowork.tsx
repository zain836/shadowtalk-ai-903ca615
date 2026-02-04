import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, FolderOpen, FileCode, Terminal, Play, Pause, 
  CheckCircle2, AlertCircle, Loader2, Download, Upload,
  File, Edit3, Trash2, Plus, Save, Copy,
  RefreshCw, Settings, Bot, ChevronRight, ChevronDown,
  GitBranch, GitCommit, History, RotateCcw, Archive,
  FolderPlus, MessageSquare, Sparkles, ThumbsUp, ThumbsDown,
  AlertTriangle, Lightbulb, Code, Shield, Smartphone, Monitor, Tablet, Wand2,
  Search, Split, Maximize2, Minimize2, Moon, Sun, Zap,
  PanelLeftClose, PanelLeft, Send, Braces, Hash, FileText,
  FolderTree, Undo2, Redo2, Command, ArrowRight
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Editor from "@monaco-editor/react";
import { Skeleton } from "@/components/ui/skeleton";

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
  language?: string;
}

interface TerminalLine {
  type: "input" | "output" | "error" | "system" | "success";
  content: string;
  timestamp: Date;
}

interface TaskAction {
  id: string;
  type: "read" | "write" | "execute" | "delete" | "create" | "analyze";
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

interface SearchResult {
  file: string;
  line: number;
  content: string;
  matchStart: number;
  matchEnd: number;
}

interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Language detection helper
const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp', cs: 'csharp',
    php: 'php', swift: 'swift', kt: 'kotlin', scala: 'scala',
    html: 'html', css: 'css', scss: 'scss', less: 'less', sass: 'sass',
    json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml',
    md: 'markdown', sql: 'sql', sh: 'shell', bash: 'shell',
    dockerfile: 'dockerfile', graphql: 'graphql', vue: 'vue', svelte: 'svelte'
  };
  return langMap[ext] || 'plaintext';
};

// Get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, { icon: typeof FileCode; color: string }> = {
    ts: { icon: Braces, color: "text-blue-500" },
    tsx: { icon: Braces, color: "text-blue-400" },
    js: { icon: Braces, color: "text-yellow-500" },
    jsx: { icon: Braces, color: "text-yellow-400" },
    json: { icon: Braces, color: "text-yellow-600" },
    py: { icon: FileCode, color: "text-green-500" },
    html: { icon: FileText, color: "text-orange-500" },
    css: { icon: Hash, color: "text-purple-500" },
    md: { icon: FileText, color: "text-gray-400" },
  };
  const match = iconMap[ext] || { icon: File, color: "text-muted-foreground" };
  const IconComponent = match.icon;
  return <IconComponent className={cn("h-4 w-4", match.color)} />;
};

// Default project template
const createDefaultProject = (): Project => ({
  id: "default",
  name: "My Project",
  description: "Default workspace project",
  createdAt: new Date(),
  files: [
    {
      name: "src",
      type: "folder",
      path: "/src",
      expanded: true,
      children: [
        { 
          name: "index.tsx", 
          type: "file", 
          path: "/src/index.tsx", 
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
          language: "typescript"
        },
        { 
          name: "App.tsx", 
          type: "file", 
          path: "/src/App.tsx", 
          content: `import React, { useState } from 'react';\n\ninterface Props {\n  title?: string;\n}\n\nconst App: React.FC<Props> = ({ title = "Hello World" }) => {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">\n      <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl">\n        <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>\n        <p className="text-gray-300 mb-6">Count: {count}</p>\n        <button\n          onClick={() => setCount(c => c + 1)}\n          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"\n        >\n          Increment\n        </button>\n      </div>\n    </div>\n  );\n};\n\nexport default App;`,
          language: "typescript"
        },
        { 
          name: "styles.css", 
          type: "file", 
          path: "/src/styles.css", 
          content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --primary: #3b82f6;\n  --secondary: #10b981;\n}\n\nbody {\n  font-family: 'Inter', sans-serif;\n  margin: 0;\n  padding: 0;\n}`,
          language: "css"
        },
        {
          name: "utils",
          type: "folder",
          path: "/src/utils",
          expanded: false,
          children: [
            { 
              name: "helpers.ts", 
              type: "file", 
              path: "/src/utils/helpers.ts", 
              content: `// Utility functions\n\nexport const formatDate = (date: Date): string => {\n  return new Intl.DateTimeFormat('en-US', {\n    year: 'numeric',\n    month: 'short',\n    day: 'numeric'\n  }).format(date);\n};\n\nexport const debounce = <T extends (...args: any[]) => any>(\n  fn: T,\n  delay: number\n): ((...args: Parameters<T>) => void) => {\n  let timeoutId: NodeJS.Timeout;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delay);\n  };\n};\n\nexport const cn = (...classes: (string | undefined | boolean)[]): string => {\n  return classes.filter(Boolean).join(' ');\n};`,
              language: "typescript"
            }
          ]
        }
      ]
    },
    { 
      name: "package.json", 
      type: "file", 
      path: "/package.json", 
      content: `{\n  "name": "my-project",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview",\n    "test": "vitest",\n    "lint": "eslint src --ext .ts,.tsx"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "typescript": "^5.0.0",\n    "vite": "^5.0.0",\n    "@types/react": "^18.2.0"\n  }\n}`,
      language: "json"
    },
    { 
      name: "README.md", 
      type: "file", 
      path: "/README.md", 
      content: `# My Project\n\nA modern React application built with TypeScript and Vite.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Features\n\n- ⚡ Vite for blazing fast builds\n- 🔷 TypeScript for type safety\n- ⚛️ React 18 with hooks\n- 🎨 Tailwind CSS for styling\n\n## Project Structure\n\n\`\`\`\nsrc/\n├── index.tsx      # Entry point\n├── App.tsx        # Main component\n├── styles.css     # Global styles\n└── utils/         # Utility functions\n\`\`\``,
      language: "markdown"
    },
    {
      name: "tsconfig.json",
      type: "file",
      path: "/tsconfig.json",
      content: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["src"]\n}`,
      language: "json"
    }
  ],
  commits: [
    { id: "init", message: "Initial project setup", timestamp: new Date(Date.now() - 86400000), files: ["package.json", "README.md", "src/"], snapshot: [] }
  ],
  currentBranch: "main",
  branches: ["main", "develop", "feature/new-ui"]
});

export const ShadowCowork = ({ isOpen, onClose, onInsertToChat }: ShadowCoworkProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([createDefaultProject()]);
  const [activeProjectId, setActiveProjectId] = useState("default");
  const [newProjectName, setNewProjectName] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const files = activeProject?.files || [];
  
  // UI State
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [isEditing, setIsEditing] = useState(true); // Always editing in Monaco
  const [activeTab, setActiveTab] = useState("editor");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");
  
  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "system", content: "╔══════════════════════════════════════════════════════════════╗", timestamp: new Date() },
    { type: "system", content: "║  Shadow Cowork Terminal v2.0 - Powered by AI                 ║", timestamp: new Date() },
    { type: "system", content: "╚══════════════════════════════════════════════════════════════╝", timestamp: new Date() },
    { type: "output", content: "", timestamp: new Date() },
    { type: "output", content: "Type 'help' for available commands", timestamp: new Date() },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // AI Chat state (within IDE)
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Task automation state
  const [taskGoal, setTaskGoal] = useState("");
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState(0);
  
  // Code review state
  const [codeReviews, setCodeReviews] = useState<Record<string, CodeReview>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  
  // Responsive feature state
  const [isResponsiveLoading, setIsResponsiveLoading] = useState(false);
  const [responsivePreview, setResponsivePreview] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [responsiveCode, setResponsiveCode] = useState("");
  const [responsiveChanges, setResponsiveChanges] = useState<Array<{
    type: "added" | "modified" | "suggestion";
    description: string;
    before?: string;
    after: string;
  }>>([]);
  
  // Undo/Redo stack
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Helper to update files in active project
  const setFiles = useCallback((newFiles: FileNode[] | ((prev: FileNode[]) => FileNode[])) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { 
          ...p, 
          files: typeof newFiles === 'function' ? newFiles(p.files) : newFiles 
        };
      }
      return p;
    }));
  }, [activeProjectId]);

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
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
    setFiles(updateNode);
  }, [setFiles]);

  // Select a file
  const selectFile = useCallback((node: FileNode) => {
    if (node.type === "file") {
      // Save current content to undo stack before switching
      if (selectedFile && fileContent !== selectedFile.content) {
        setUndoStack(prev => [...prev.slice(-20), fileContent]);
        setRedoStack([]);
      }
      setSelectedFile(node);
      setFileContent(node.content || "");
    } else {
      toggleFolder(node.path);
    }
  }, [selectedFile, fileContent, toggleFolder]);

  // Save file content
  const saveFile = useCallback(() => {
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
    
    setFiles(updateContent);
    setSelectedFile({ ...selectedFile, content: fileContent });
    toast({ title: "✓ Saved", description: selectedFile.name });
  }, [selectedFile, fileContent, setFiles, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
      
      // Ctrl/Cmd + F to search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.shiftKey) {
        e.preventDefault();
        setActiveTab("search");
      }
      
      // Ctrl/Cmd + ` to toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
      
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowSidebar(prev => !prev);
      }
      
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && undoStack.length > 0) {
        e.preventDefault();
        const prev = undoStack[undoStack.length - 1];
        setUndoStack(stack => stack.slice(0, -1));
        setRedoStack(stack => [...stack, fileContent]);
        setFileContent(prev);
      }
      
      // Redo: Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey && redoStack.length > 0) {
        e.preventDefault();
        const next = redoStack[redoStack.length - 1];
        setRedoStack(stack => stack.slice(0, -1));
        setUndoStack(stack => [...stack, fileContent]);
        setFileContent(next);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saveFile, undoStack, redoStack, fileContent]);

  // Create new file/folder
  const createNode = useCallback((parentPath: string, name: string, type: "file" | "folder") => {
    const newPath = parentPath ? `${parentPath}/${name}` : `/${name}`;
    const newNode: FileNode = {
      name,
      type,
      path: newPath,
      content: type === "file" ? `// ${name}\n` : undefined,
      children: type === "folder" ? [] : undefined,
      expanded: type === "folder" ? true : undefined,
      language: type === "file" ? getLanguageFromFilename(name) : undefined
    };
    
    const addNode = (nodes: FileNode[]): FileNode[] => {
      // If parentPath is empty or root, add to root
      if (!parentPath || parentPath === "/") {
        return [...nodes, newNode];
      }
      
      return nodes.map(node => {
        if (node.path === parentPath && node.children) {
          return { ...node, children: [...node.children, newNode], expanded: true };
        }
        if (node.children) {
          return { ...node, children: addNode(node.children) };
        }
        return node;
      });
    };
    
    setFiles(addNode);
    toast({ title: `${type === "file" ? "📄" : "📁"} Created`, description: name });
    
    if (type === "file") {
      setSelectedFile(newNode);
      setFileContent(newNode.content || "");
    }
  }, [setFiles, toast]);

  // Delete file/folder
  const deleteNode = useCallback((path: string) => {
    const removeNode = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => node.path !== path)
        .map(node => ({
          ...node,
          children: node.children ? removeNode(node.children) : undefined,
        }));
    };
    
    setFiles(removeNode);
    if (selectedFile?.path === path) {
      setSelectedFile(null);
      setFileContent("");
    }
    toast({ title: "🗑️ Deleted" });
  }, [setFiles, selectedFile, toast]);

  // Search across files
  const searchFiles = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    const searchInNode = (node: FileNode) => {
      if (node.type === "file" && node.content) {
        const lines = node.content.split('\n');
        lines.forEach((line, idx) => {
          const lowerLine = line.toLowerCase();
          let matchIndex = lowerLine.indexOf(lowerQuery);
          while (matchIndex !== -1) {
            results.push({
              file: node.path,
              line: idx + 1,
              content: line.trim(),
              matchStart: matchIndex,
              matchEnd: matchIndex + query.length
            });
            matchIndex = lowerLine.indexOf(lowerQuery, matchIndex + 1);
          }
        });
      }
      node.children?.forEach(searchInNode);
    };
    
    files.forEach(searchInNode);
    setSearchResults(results);
    setIsSearching(false);
  }, [files]);

  // Execute terminal command
  const executeCommand = useCallback((command: string) => {
    const timestamp = new Date();
    setTerminalLines(prev => [...prev, { type: "input", content: `❯ ${command}`, timestamp }]);
    setCommandHistory(prev => [...prev.slice(-50), command]);
    setHistoryIndex(-1);
    
    const cmd = command.toLowerCase().trim();
    const args = cmd.split(/\s+/).slice(1);
    const firstArg = args[0] || "";
    
    let output: TerminalLine[] = [];
    
    switch (cmd.split(" ")[0]) {
      case "help":
        output = [
          { type: "system", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", timestamp },
          { type: "system", content: "📋 AVAILABLE COMMANDS", timestamp },
          { type: "system", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", timestamp },
          { type: "output", content: "  ls [path]       List files and folders", timestamp },
          { type: "output", content: "  cat <file>      Display file content", timestamp },
          { type: "output", content: "  mkdir <name>    Create a new directory", timestamp },
          { type: "output", content: "  touch <name>    Create a new file", timestamp },
          { type: "output", content: "  rm <path>       Delete file or folder", timestamp },
          { type: "output", content: "  echo <text>     Print text to terminal", timestamp },
          { type: "output", content: "  clear           Clear terminal output", timestamp },
          { type: "output", content: "  node <file>     Run JavaScript/TypeScript", timestamp },
          { type: "output", content: "  npm <cmd>       Run npm commands (simulated)", timestamp },
          { type: "output", content: "  git <cmd>       Git commands (simulated)", timestamp },
          { type: "output", content: "  ai <prompt>     Ask AI for help", timestamp },
          { type: "output", content: "  pwd             Print working directory", timestamp },
          { type: "output", content: "  whoami          Show current user", timestamp },
          { type: "output", content: "  date            Show current date/time", timestamp },
          { type: "system", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", timestamp },
        ];
        break;
        
      case "clear":
        setTerminalLines([{ type: "system", content: "🧹 Terminal cleared", timestamp }]);
        return;
        
      case "ls":
        const listFiles = (nodes: FileNode[], indent = 0): string[] => {
          return nodes.flatMap(node => {
            const prefix = "  ".repeat(indent);
            const icon = node.type === "folder" ? "📁" : "📄";
            const color = node.type === "folder" ? "\x1b[34m" : "";
            const lines = [`${prefix}${icon} ${node.name}`];
            if (node.children && node.expanded) {
              lines.push(...listFiles(node.children, indent + 1));
            }
            return lines;
          });
        };
        output = listFiles(files).map(content => ({ type: "output" as const, content, timestamp }));
        break;
        
      case "cat":
        if (!firstArg) {
          output = [{ type: "error", content: "Usage: cat <filename>", timestamp }];
        } else {
          const findFile = (nodes: FileNode[]): FileNode | undefined => {
            for (const node of nodes) {
              if ((node.name === firstArg || node.path.endsWith(`/${firstArg}`)) && node.type === "file") return node;
              if (node.children) {
                const found = findFile(node.children);
                if (found) return found;
              }
            }
            return undefined;
          };
          const file = findFile(files);
          if (file) {
            output = (file.content || "").split("\n").map(line => ({ 
              type: "output" as const, 
              content: line, 
              timestamp 
            }));
          } else {
            output = [{ type: "error", content: `File not found: ${firstArg}`, timestamp }];
          }
        }
        break;
        
      case "echo":
        output = [{ type: "output", content: args.join(" "), timestamp }];
        break;
        
      case "mkdir":
        if (firstArg) {
          createNode("/src", firstArg, "folder");
          output = [{ type: "success", content: `✓ Created directory: ${firstArg}`, timestamp }];
        } else {
          output = [{ type: "error", content: "Usage: mkdir <name>", timestamp }];
        }
        break;
        
      case "touch":
        if (firstArg) {
          createNode("/src", firstArg, "file");
          output = [{ type: "success", content: `✓ Created file: ${firstArg}`, timestamp }];
        } else {
          output = [{ type: "error", content: "Usage: touch <name>", timestamp }];
        }
        break;
        
      case "rm":
        if (firstArg) {
          deleteNode(`/src/${firstArg}`);
          output = [{ type: "success", content: `✓ Deleted: ${firstArg}`, timestamp }];
        } else {
          output = [{ type: "error", content: "Usage: rm <path>", timestamp }];
        }
        break;
        
      case "pwd":
        output = [{ type: "output", content: `/home/user/${activeProject?.name || "project"}`, timestamp }];
        break;
        
      case "whoami":
        output = [{ type: "output", content: "shadow-user", timestamp }];
        break;
        
      case "date":
        output = [{ type: "output", content: new Date().toString(), timestamp }];
        break;
        
      case "npm":
        if (firstArg === "run" || firstArg === "start") {
          output = [
            { type: "system", content: "⚡ Starting development server...", timestamp },
            { type: "output", content: "", timestamp },
            { type: "success", content: "  VITE v5.0.0  ready in 234 ms", timestamp },
            { type: "output", content: "", timestamp },
            { type: "output", content: "  ➜  Local:   http://localhost:5173/", timestamp },
            { type: "output", content: "  ➜  Network: http://192.168.1.100:5173/", timestamp },
            { type: "output", content: "", timestamp },
            { type: "system", content: "  Press Ctrl+C to stop", timestamp },
          ];
        } else if (firstArg === "install" || firstArg === "i") {
          output = [
            { type: "system", content: "📦 Installing dependencies...", timestamp },
            { type: "output", content: "", timestamp },
            { type: "output", content: "added 847 packages, and audited 848 packages in 12s", timestamp },
            { type: "success", content: "✓ Packages installed successfully", timestamp },
          ];
        } else if (firstArg === "test") {
          output = [
            { type: "system", content: "🧪 Running tests...", timestamp },
            { type: "success", content: "✓ All tests passed (8 tests)", timestamp },
          ];
        } else {
          output = [{ type: "output", content: `npm ${args.join(" ")}`, timestamp }];
        }
        break;
        
      case "git":
        if (firstArg === "status") {
          output = [
            { type: "output", content: `On branch ${activeProject?.currentBranch || "main"}`, timestamp },
            { type: "output", content: "Changes not staged for commit:", timestamp },
            { type: "output", content: "  modified:   src/App.tsx", timestamp },
          ];
        } else if (firstArg === "branch") {
          output = (activeProject?.branches || ["main"]).map(b => ({
            type: "output" as const,
            content: `  ${b === activeProject?.currentBranch ? "* " : "  "}${b}`,
            timestamp
          }));
        } else if (firstArg === "log") {
          output = (activeProject?.commits || []).slice(-5).reverse().map(c => ({
            type: "output" as const,
            content: `  ${c.id.slice(0, 7)} - ${c.message} (${new Date(c.timestamp).toLocaleDateString()})`,
            timestamp
          }));
        } else {
          output = [{ type: "output", content: `git ${args.join(" ")}`, timestamp }];
        }
        break;
        
      case "node":
        if (firstArg) {
          const findFile = (nodes: FileNode[]): FileNode | undefined => {
            for (const node of nodes) {
              if ((node.name === firstArg || node.path.endsWith(`/${firstArg}`)) && node.type === "file") return node;
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
              // Safely "execute" by showing console.log outputs
              const consoleOutputs: string[] = [];
              const mockConsole = {
                log: (...args: any[]) => consoleOutputs.push(args.map(String).join(" "))
              };
              const code = file.content.replace(/console\.log/g, "mockConsole.log");
              new Function("mockConsole", code)(mockConsole);
              output = consoleOutputs.map(o => ({ type: "output" as const, content: o, timestamp }));
              if (output.length === 0) {
                output = [{ type: "success", content: "✓ Script executed (no output)", timestamp }];
              }
            } catch (e: unknown) {
              output = [{ type: "error", content: `Error: ${(e as Error).message}`, timestamp }];
            }
          } else {
            output = [{ type: "error", content: `File not found: ${firstArg}`, timestamp }];
          }
        } else {
          output = [{ type: "output", content: "Node.js v20.10.0", timestamp }];
        }
        break;
        
      case "ai":
        if (args.length > 0) {
          const prompt = args.join(" ");
          output = [{ type: "system", content: "🤖 Thinking...", timestamp }];
          setTerminalLines(prev => [...prev, ...output]);
          
          // Make AI call
          (async () => {
            try {
              const response = await supabase.functions.invoke('chat', {
                body: {
                  messages: [
                    { role: "system", content: "You are a helpful coding assistant. Keep responses concise and terminal-friendly." },
                    { role: "user", content: prompt }
                  ]
                }
              });
              
              const content = response.data?.choices?.[0]?.message?.content || 
                              response.data?.generatedText || 
                              "I couldn't process that request.";
              
              setTerminalLines(prev => [...prev, 
                { type: "output", content: "", timestamp: new Date() },
                ...content.split("\n").map((line: string) => ({ 
                  type: "output" as const, 
                  content: `  ${line}`, 
                  timestamp: new Date() 
                })),
                { type: "output", content: "", timestamp: new Date() }
              ]);
            } catch (error) {
              setTerminalLines(prev => [...prev, { 
                type: "error", 
                content: "Failed to get AI response", 
                timestamp: new Date() 
              }]);
            }
          })();
          return;
        } else {
          output = [{ type: "error", content: "Usage: ai <your question>", timestamp }];
        }
        break;
        
      default:
        output = [{ type: "error", content: `Command not found: ${cmd.split(" ")[0]}`, timestamp }];
    }
    
    setTerminalLines(prev => [...prev, ...output]);
  }, [files, activeProject, createNode, deleteNode]);

  // Handle terminal key events (history navigation)
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentCommand.trim()) {
      executeCommand(currentCommand);
      setCurrentCommand("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < 0 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  // AI Chat in IDE
  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    
    const userMessage: AIChatMessage = {
      role: "user",
      content: aiInput,
      timestamp: new Date()
    };
    
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput("");
    setIsAiLoading(true);
    
    try {
      // Include current file context
      const context = selectedFile 
        ? `Current file: ${selectedFile.name}\n\`\`\`${getLanguageFromFilename(selectedFile.name)}\n${fileContent}\n\`\`\`\n\n`
        : "";
      
      const response = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { 
              role: "system", 
              content: `You are an expert programming assistant integrated into an IDE. Help users with coding questions, debugging, and code improvements. Be concise and provide code examples when helpful.` 
            },
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: context + aiInput }
          ]
        }
      });
      
      const content = response.data?.choices?.[0]?.message?.content || 
                      response.data?.generatedText || 
                      "I couldn't process that request.";
      
      setAiMessages(prev => [...prev, {
        role: "assistant",
        content,
        timestamp: new Date()
      }]);
    } catch (error) {
      setAiMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Git operations
  const createCommit = useCallback(() => {
    if (!commitMessage.trim()) {
      toast({ title: "Enter a commit message", variant: "destructive" });
      return;
    }
    
    const getAllFileNames = (nodes: FileNode[]): string[] => {
      const names: string[] = [];
      const traverse = (node: FileNode) => {
        if (node.type === "file") names.push(node.name);
        node.children?.forEach(traverse);
      };
      nodes.forEach(traverse);
      return names;
    };
    
    const changedFiles = getAllFileNames(files);
    const newCommit: GitCommit = {
      id: crypto.randomUUID(),
      message: commitMessage,
      timestamp: new Date(),
      files: changedFiles,
      snapshot: JSON.parse(JSON.stringify(files))
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, commits: [...p.commits, newCommit] };
      }
      return p;
    }));
    
    setCommitMessage("");
    toast({ title: "✓ Committed", description: commitMessage });
    
    if (onInsertToChat) {
      onInsertToChat(`📝 **Git Commit**\n\nMessage: "${commitMessage}"\nFiles changed: ${changedFiles.join(", ")}\nBranch: ${activeProject?.currentBranch || "main"}`);
    }
  }, [commitMessage, files, activeProjectId, activeProject, toast, onInsertToChat]);

  // Render file tree recursively
  const renderFileTree = useCallback((nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => selectFile(node)}
          onContextMenu={(e) => {
            e.preventDefault();
            // Could add context menu here
          }}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-accent/50 rounded-md transition-colors group",
            selectedFile?.path === node.path && "bg-accent text-accent-foreground"
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {node.type === "folder" ? (
            <>
              {node.expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <FolderTree className={cn("h-4 w-4 shrink-0", node.expanded ? "text-amber-500" : "text-amber-600")} />
            </>
          ) : (
            <>
              <span className="w-3.5" />
              {getFileIcon(node.name)}
            </>
          )}
          <span className="truncate flex-1 text-left">{node.name}</span>
          
          {/* Action buttons on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
            {node.type === "folder" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const name = prompt("New file name:");
                  if (name) createNode(node.path, name, "file");
                }}
                className="p-0.5 hover:bg-accent rounded"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${node.name}?`)) deleteNode(node.path);
              }}
              className="p-0.5 hover:bg-destructive/20 hover:text-destructive rounded"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </button>
        
        {node.type === "folder" && node.expanded && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  }, [selectedFile, selectFile, createNode, deleteNode]);

  // Monaco editor change handler
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        <div className="h-full flex flex-col">
          {/* Top Bar */}
          <div className="h-12 border-b border-border bg-muted/30 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold leading-none">Shadow Cowork</h1>
                  <p className="text-[10px] text-muted-foreground">AI-Powered IDE</p>
                </div>
              </div>
              
              <div className="h-6 w-px bg-border mx-2" />
              
              {/* Project/Branch info */}
              <Badge variant="outline" className="gap-1.5 text-xs">
                <GitBranch className="h-3 w-3" />
                {activeProject?.currentBranch || "main"}
              </Badge>
              
              <Badge variant="secondary" className="text-xs">
                {activeProject?.name || "Project"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick actions */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(prev => !prev)}
                className="h-7 w-7 p-0"
              >
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(prev => !prev)}
                className="h-7 w-7 p-0"
              >
                <Terminal className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorTheme(t => t === "vs-dark" ? "light" : "vs-dark")}
                className="h-7 w-7 p-0"
              >
                {editorTheme === "vs-dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <div className="h-4 w-px bg-border" />
              
              <Button variant="ghost" size="sm" onClick={saveFile} className="h-7 gap-1.5 text-xs">
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              {/* Sidebar */}
              {showSidebar && (
                <>
                  <ResizablePanel defaultSize={18} minSize={15} maxSize={30}>
                    <div className="h-full flex flex-col border-r border-border bg-muted/20">
                      {/* Sidebar Tabs */}
                      <div className="border-b border-border">
                        <div className="flex">
                          {[
                            { id: "explorer", icon: FolderTree, label: "Explorer" },
                            { id: "search", icon: Search, label: "Search" },
                            { id: "git", icon: GitBranch, label: "Git" },
                            { id: "ai", icon: Sparkles, label: "AI" }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                "flex-1 py-2 flex flex-col items-center gap-0.5 text-[10px] transition-colors",
                                activeTab === tab.id 
                                  ? "text-primary border-b-2 border-primary bg-accent/30" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                              )}
                            >
                              <tab.icon className="h-4 w-4" />
                              <span>{tab.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Sidebar Content */}
                      <ScrollArea className="flex-1">
                        {activeTab === "explorer" && (
                          <div className="p-2">
                            <div className="flex items-center justify-between mb-2 px-1">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Files
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const name = prompt("New file name:");
                                    if (name) createNode("/src", name, "file");
                                  }}
                                  className="p-1 hover:bg-accent rounded"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const name = prompt("New folder name:");
                                    if (name) createNode("/src", name, "folder");
                                  }}
                                  className="p-1 hover:bg-accent rounded"
                                >
                                  <FolderPlus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {renderFileTree(files)}
                          </div>
                        )}
                        
                        {activeTab === "search" && (
                          <div className="p-3 space-y-3">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={searchQuery}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  searchFiles(e.target.value);
                                }}
                                placeholder="Search in files..."
                                className="pl-9 h-8 text-sm"
                              />
                            </div>
                            
                            {searchResults.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  {searchResults.length} results
                                </p>
                                {searchResults.slice(0, 50).map((result, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const findFile = (nodes: FileNode[]): FileNode | undefined => {
                                        for (const node of nodes) {
                                          if (node.path === result.file) return node;
                                          if (node.children) {
                                            const found = findFile(node.children);
                                            if (found) return found;
                                          }
                                        }
                                        return undefined;
                                      };
                                      const file = findFile(files);
                                      if (file) selectFile(file);
                                    }}
                                    className="w-full text-left p-2 text-xs bg-muted/30 hover:bg-accent rounded border border-border"
                                  >
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <File className="h-3 w-3" />
                                      {result.file.split('/').pop()}
                                      <span>:{result.line}</span>
                                    </div>
                                    <code className="text-[11px] line-clamp-1">
                                      {result.content}
                                    </code>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {activeTab === "git" && (
                          <div className="p-3 space-y-4">
                            {/* Commit input */}
                            <div className="space-y-2">
                              <Input
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Commit message..."
                                className="h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={createCommit}
                                disabled={!commitMessage.trim()}
                                className="w-full h-8 gap-1.5"
                              >
                                <GitCommit className="h-3.5 w-3.5" />
                                Commit
                              </Button>
                            </div>
                            
                            {/* Branches */}
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase mb-2">Branches</p>
                              <div className="space-y-1">
                                {activeProject?.branches.map(branch => (
                                  <button
                                    key={branch}
                                    onClick={() => {
                                      setProjects(prev => prev.map(p => 
                                        p.id === activeProjectId ? { ...p, currentBranch: branch } : p
                                      ));
                                      toast({ title: `Switched to ${branch}` });
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent",
                                      branch === activeProject.currentBranch && "bg-accent"
                                    )}
                                  >
                                    <GitBranch className="h-3.5 w-3.5" />
                                    {branch}
                                    {branch === activeProject.currentBranch && (
                                      <CheckCircle2 className="h-3 w-3 ml-auto text-primary" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Recent commits */}
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase mb-2">Recent Commits</p>
                              <div className="space-y-1.5">
                                {activeProject?.commits.slice(-5).reverse().map(commit => (
                                  <div
                                    key={commit.id}
                                    className="p-2 text-xs bg-muted/30 rounded border border-border"
                                  >
                                    <p className="font-medium truncate">{commit.message}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(commit.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {activeTab === "ai" && (
                          <div className="flex flex-col h-full">
                            {/* AI Messages */}
                            <ScrollArea className="flex-1 p-3">
                              <div className="space-y-3">
                                {aiMessages.length === 0 && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Ask AI for help with your code</p>
                                  </div>
                                )}
                                {aiMessages.map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "p-2.5 rounded-lg text-sm",
                                      msg.role === "user" 
                                        ? "bg-primary/10 ml-4" 
                                        : "bg-muted/50 mr-4"
                                    )}
                                  >
                                    <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                                  </div>
                                ))}
                                {isAiLoading && (
                                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Thinking...
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                            
                            {/* AI Input */}
                            <div className="p-3 border-t border-border">
                              <div className="flex gap-2">
                                <Input
                                  value={aiInput}
                                  onChange={(e) => setAiInput(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
                                  placeholder="Ask about code..."
                                  className="flex-1 h-8 text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={sendAiMessage}
                                  disabled={!aiInput.trim() || isAiLoading}
                                  className="h-8 w-8 p-0"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}
              
              {/* Editor + Terminal */}
              <ResizablePanel defaultSize={showSidebar ? 82 : 100}>
                <ResizablePanelGroup direction="vertical">
                  {/* Editor */}
                  <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                    <div className="h-full flex flex-col">
                      {/* Editor tabs */}
                      {selectedFile && (
                        <div className="h-9 border-b border-border flex items-center px-2 bg-muted/20 shrink-0">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background rounded-t-md border border-b-0 border-border -mb-px">
                            {getFileIcon(selectedFile.name)}
                            <span className="text-sm">{selectedFile.name}</span>
                            <button
                              onClick={() => {
                                setSelectedFile(null);
                                setFileContent("");
                              }}
                              className="ml-2 p-0.5 hover:bg-muted rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Monaco Editor */}
                      <div className="flex-1">
                        {selectedFile ? (
                          <Editor
                            height="100%"
                            language={getLanguageFromFilename(selectedFile.name)}
                            value={fileContent}
                            onChange={handleEditorChange}
                            theme={editorTheme}
                            loading={
                              <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            }
                            options={{
                              minimap: { enabled: true },
                              fontSize: 13,
                              lineNumbers: "on",
                              roundedSelection: true,
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              padding: { top: 12 },
                              wordWrap: "on",
                              formatOnPaste: true,
                              formatOnType: true,
                              tabSize: 2,
                              suggestOnTriggerCharacters: true,
                              acceptSuggestionOnEnter: "on",
                              quickSuggestions: true,
                              cursorBlinking: "smooth",
                              cursorSmoothCaretAnimation: "on",
                              smoothScrolling: true,
                              bracketPairColorization: { enabled: true }
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted/20">
                            <div className="text-center space-y-4">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mx-auto">
                                <Code className="h-10 w-10 text-orange-500/50" />
                              </div>
                              <div>
                                <p className="text-muted-foreground">Select a file to start editing</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                  Or create a new file with <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+N</kbd>
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                                <span className="px-2 py-1 bg-muted/50 rounded">Ctrl+S Save</span>
                                <span className="px-2 py-1 bg-muted/50 rounded">Ctrl+B Sidebar</span>
                                <span className="px-2 py-1 bg-muted/50 rounded">Ctrl+` Terminal</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                  
                  {/* Terminal */}
                  {showTerminal && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={30} minSize={15}>
                        <div className="h-full flex flex-col bg-[#0d1117] border-t border-border">
                          {/* Terminal header */}
                          <div className="h-8 flex items-center justify-between px-3 border-b border-border/50 shrink-0">
                            <div className="flex items-center gap-2">
                              <Terminal className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-xs text-muted-foreground">Terminal</span>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => setTerminalLines([{ type: "system", content: "🧹 Cleared", timestamp: new Date() }])}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button 
                                onClick={() => setShowTerminal(false)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <X className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Terminal output */}
                          <ScrollArea className="flex-1">
                            <div ref={terminalRef} className="p-3 font-mono text-xs space-y-0.5">
                              {terminalLines.map((line, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    line.type === "error" && "text-red-400",
                                    line.type === "system" && "text-cyan-400",
                                    line.type === "success" && "text-green-400",
                                    line.type === "input" && "text-yellow-300",
                                    line.type === "output" && "text-gray-300"
                                  )}
                                >
                                  {line.content}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          
                          {/* Terminal input */}
                          <div className="border-t border-border/50 p-2 shrink-0">
                            <div className="flex items-center gap-2 bg-white/5 rounded px-2">
                              <span className="text-green-400 font-mono text-sm">❯</span>
                              <input
                                value={currentCommand}
                                onChange={(e) => setCurrentCommand(e.target.value)}
                                onKeyDown={handleTerminalKeyDown}
                                placeholder="Type a command..."
                                className="flex-1 bg-transparent border-0 font-mono text-sm text-white placeholder:text-gray-500 focus:outline-none py-2"
                                autoComplete="off"
                                spellCheck={false}
                              />
                            </div>
                          </div>
                        </div>
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShadowCowork;
