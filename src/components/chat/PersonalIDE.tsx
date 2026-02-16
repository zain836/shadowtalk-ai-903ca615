import { useState, useCallback, lazy, Suspense, useRef, useEffect } from "react";
import {
  Play, Copy, Check, RotateCcw, Maximize2, Minimize2,
  Terminal, X, Code, Download, Loader2, Bug, Eye,
  PanelLeft, Trash2, Save, FileCode, Layout,
  Plus, FolderOpen, Search, Settings, Sparkles,
  FileText, File, ChevronRight, ChevronDown,
  Columns, Monitor, Smartphone, Tablet,
  Palette, Zap, GitBranch, Package, RefreshCw,
  ExternalLink, Split, ArrowRight, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Editor = lazy(() => import("@monaco-editor/react"));

// ─── Types ───────────────────────────────────────────────────────────────────

interface IDEFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isModified: boolean;
}

interface ConsoleLog {
  type: "log" | "error" | "warn" | "info" | "system";
  message: string;
  timestamp: Date;
}

interface PersonalIDEProps {
  initialCode?: string;
  language?: string;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  js: "javascript", ts: "typescript", py: "python", html: "html",
  css: "css", jsx: "javascript", tsx: "typescript", json: "json",
  md: "markdown", sql: "sql", sh: "shell", bash: "shell",
  xml: "xml", yaml: "yaml", scss: "scss", less: "less",
  php: "php", rb: "ruby", go: "go", rs: "rust", java: "java",
};

const EXT_MAP: Record<string, string> = {
  javascript: "js", typescript: "ts", python: "py", html: "html",
  css: "css", json: "json", markdown: "md", sql: "sql",
};

const FILE_ICONS: Record<string, string> = {
  html: "🌐", css: "🎨", javascript: "⚡", typescript: "💎",
  python: "🐍", json: "📋", markdown: "📝", sql: "🗄️",
  default: "📄",
};

const THEMES = [
  { id: "vs-dark", label: "Dark (Default)" },
  { id: "vs-light", label: "Light" },
  { id: "hc-black", label: "High Contrast" },
];

const VIEWPORT_PRESETS = [
  { id: "desktop", icon: Monitor, width: "100%", label: "Desktop" },
  { id: "tablet", icon: Tablet, width: "768px", label: "Tablet" },
  { id: "mobile", icon: Smartphone, width: "375px", label: "Mobile" },
];

const PROJECT_TEMPLATES = [
  {
    id: "blank", label: "Blank Project",
    files: [{ name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>My Project</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src=\"app.js\"></script>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #0f172a;\n  color: #e2e8f0;\n}\n\nh1 {\n  font-size: 3rem;\n  background: linear-gradient(135deg, #6366f1, #a855f7);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}" },
      { name: "app.js", language: "javascript", content: "// Your JavaScript code here\nconsole.log('Hello from ShadowTalk IDE!');\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('DOM ready');\n});" }],
  },
  {
    id: "react", label: "React App",
    files: [{ name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>React App</title>\n  <script src=\"https://unpkg.com/react@18/umd/react.development.js\"></script>\n  <script src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\"></script>\n  <script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: system-ui; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n    .app { text-align: center; }\n    .app h1 { font-size: 2.5rem; margin-bottom: 1rem; }\n    .app button { padding: 0.75rem 2rem; border: none; border-radius: 8px; background: #6366f1; color: white; font-size: 1rem; cursor: pointer; transition: transform 0.2s; }\n    .app button:hover { transform: scale(1.05); }\n  </style>\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script type=\"text/babel\">\n    const { useState } = React;\n    \n    function App() {\n      const [count, setCount] = useState(0);\n      return (\n        <div className=\"app\">\n          <h1>⚛️ React App</h1>\n          <p>Count: {count}</p>\n          <button onClick={() => setCount(c => c + 1)}>Increment</button>\n        </div>\n      );\n    }\n    \n    ReactDOM.createRoot(document.getElementById('root')).render(<App />);\n  </script>\n</body>\n</html>" }],
  },
  {
    id: "dashboard", label: "Dashboard",
    files: [{ name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Dashboard</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <nav class=\"sidebar\">\n    <div class=\"logo\">📊 Dashboard</div>\n    <a href=\"#\" class=\"active\">🏠 Overview</a>\n    <a href=\"#\">📈 Analytics</a>\n    <a href=\"#\">👥 Users</a>\n    <a href=\"#\">⚙️ Settings</a>\n  </nav>\n  <main class=\"content\">\n    <header><h1>Overview</h1><input type=\"search\" placeholder=\"Search...\"></header>\n    <div class=\"cards\">\n      <div class=\"card\"><span>Revenue</span><strong>$48,200</strong><small>+12.5%</small></div>\n      <div class=\"card\"><span>Users</span><strong>2,847</strong><small>+8.2%</small></div>\n      <div class=\"card\"><span>Orders</span><strong>1,205</strong><small>+15.3%</small></div>\n      <div class=\"card\"><span>Growth</span><strong>23.1%</strong><small>+2.4%</small></div>\n    </div>\n    <div class=\"table-container\">\n      <table>\n        <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Amount</th></tr></thead>\n        <tbody>\n          <tr><td>John Doe</td><td>john@example.com</td><td><span class=\"badge active\">Active</span></td><td>$250</td></tr>\n          <tr><td>Jane Smith</td><td>jane@example.com</td><td><span class=\"badge active\">Active</span></td><td>$180</td></tr>\n          <tr><td>Bob Wilson</td><td>bob@example.com</td><td><span class=\"badge pending\">Pending</span></td><td>$320</td></tr>\n        </tbody>\n      </table>\n    </div>\n  </main>\n  <script src=\"app.js\"></script>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui; display: flex; min-height: 100vh; background: #0f172a; color: #e2e8f0; }\n.sidebar { width: 240px; background: #1e293b; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }\n.sidebar .logo { font-size: 1.25rem; font-weight: 700; padding: 0.75rem; margin-bottom: 1rem; }\n.sidebar a { text-decoration: none; color: #94a3b8; padding: 0.75rem; border-radius: 8px; transition: all 0.2s; }\n.sidebar a:hover, .sidebar a.active { background: #334155; color: #e2e8f0; }\n.content { flex: 1; padding: 2rem; overflow-y: auto; }\nheader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }\nheader input { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; }\n.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }\n.card { background: #1e293b; border-radius: 12px; padding: 1.5rem; }\n.card span { font-size: 0.875rem; color: #94a3b8; }\n.card strong { display: block; font-size: 1.75rem; margin: 0.5rem 0; }\n.card small { color: #22c55e; }\n.table-container { background: #1e293b; border-radius: 12px; overflow: hidden; }\ntable { width: 100%; border-collapse: collapse; }\nth, td { padding: 1rem; text-align: left; border-bottom: 1px solid #334155; }\nth { color: #94a3b8; font-weight: 500; }\n.badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; }\n.badge.active { background: #22c55e20; color: #22c55e; }\n.badge.pending { background: #eab30820; color: #eab308; }" },
      { name: "app.js", language: "javascript", content: "console.log('Dashboard loaded');\n\n// Add interactivity\ndocument.querySelectorAll('.sidebar a').forEach(link => {\n  link.addEventListener('click', (e) => {\n    e.preventDefault();\n    document.querySelector('.sidebar a.active')?.classList.remove('active');\n    link.classList.add('active');\n  });\n});" }],
  },
  {
    id: "landing", label: "Landing Page",
    files: [{ name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>SaaS Landing Page</title>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <nav>\n    <div class=\"nav-container\">\n      <span class=\"logo\">🚀 ProductName</span>\n      <div class=\"nav-links\">\n        <a href=\"#features\">Features</a>\n        <a href=\"#pricing\">Pricing</a>\n        <a href=\"#testimonials\">Testimonials</a>\n        <button class=\"btn-primary\">Get Started</button>\n      </div>\n    </div>\n  </nav>\n  <section class=\"hero\">\n    <div class=\"hero-badge\">✨ Now with AI-powered features</div>\n    <h1>Build faster.<br>Ship smarter.</h1>\n    <p>The all-in-one platform that helps teams build, deploy, and scale modern applications without the complexity.</p>\n    <div class=\"hero-cta\">\n      <button class=\"btn-primary btn-lg\">Start Free Trial</button>\n      <button class=\"btn-secondary btn-lg\">Watch Demo →</button>\n    </div>\n  </section>\n  <section id=\"features\" class=\"features\">\n    <h2>Everything you need</h2>\n    <div class=\"feature-grid\">\n      <div class=\"feature-card\"><span>⚡</span><h3>Lightning Fast</h3><p>Optimized for speed with edge computing and smart caching.</p></div>\n      <div class=\"feature-card\"><span>🔒</span><h3>Secure by Default</h3><p>Enterprise-grade security with E2E encryption built in.</p></div>\n      <div class=\"feature-card\"><span>📊</span><h3>Analytics</h3><p>Real-time insights and dashboards to track your metrics.</p></div>\n      <div class=\"feature-card\"><span>🤖</span><h3>AI Powered</h3><p>Intelligent automation that learns and adapts to your workflow.</p></div>\n    </div>\n  </section>\n  <section id=\"pricing\" class=\"pricing\">\n    <h2>Simple pricing</h2>\n    <div class=\"pricing-grid\">\n      <div class=\"price-card\"><h3>Free</h3><div class=\"price\">$0<span>/mo</span></div><ul><li>✓ 1,000 requests</li><li>✓ Basic analytics</li><li>✓ Community support</li></ul><button class=\"btn-secondary\">Get Started</button></div>\n      <div class=\"price-card featured\"><div class=\"popular\">Most Popular</div><h3>Pro</h3><div class=\"price\">$29<span>/mo</span></div><ul><li>✓ Unlimited requests</li><li>✓ Advanced analytics</li><li>✓ Priority support</li><li>✓ API access</li></ul><button class=\"btn-primary\">Start Trial</button></div>\n      <div class=\"price-card\"><h3>Enterprise</h3><div class=\"price\">$99<span>/mo</span></div><ul><li>✓ Everything in Pro</li><li>✓ SSO & SAML</li><li>✓ Dedicated support</li><li>✓ Custom SLA</li></ul><button class=\"btn-secondary\">Contact Sales</button></div>\n    </div>\n  </section>\n  <footer>\n    <p>© 2026 ProductName. Built with ShadowTalk IDE.</p>\n  </footer>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }\nnav { position: fixed; top: 0; width: 100%; background: #0f172a99; backdrop-filter: blur(12px); border-bottom: 1px solid #1e293b; z-index: 100; }\n.nav-container { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }\n.logo { font-size: 1.25rem; font-weight: 800; }\n.nav-links { display: flex; align-items: center; gap: 2rem; }\n.nav-links a { text-decoration: none; color: #94a3b8; font-size: 0.875rem; transition: color 0.2s; }\n.nav-links a:hover { color: #e2e8f0; }\n.btn-primary { padding: 0.625rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }\n.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px #6366f140; }\n.btn-secondary { padding: 0.625rem 1.5rem; border: 1px solid #334155; border-radius: 8px; background: transparent; color: #e2e8f0; font-weight: 500; cursor: pointer; transition: all 0.2s; }\n.btn-secondary:hover { border-color: #6366f1; background: #6366f110; }\n.btn-lg { padding: 0.875rem 2rem; font-size: 1.05rem; }\n.hero { text-align: center; padding: 12rem 2rem 6rem; max-width: 800px; margin: 0 auto; }\n.hero-badge { display: inline-block; padding: 0.375rem 1rem; border-radius: 99px; background: #6366f120; color: #a5b4fc; font-size: 0.875rem; margin-bottom: 2rem; }\n.hero h1 { font-size: 4rem; font-weight: 800; line-height: 1.1; background: linear-gradient(135deg, #e2e8f0, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.5rem; }\n.hero p { font-size: 1.25rem; color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; }\n.hero-cta { display: flex; gap: 1rem; justify-content: center; }\n.features, .pricing { max-width: 1200px; margin: 0 auto; padding: 6rem 2rem; text-align: center; }\n.features h2, .pricing h2 { font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem; }\n.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }\n.feature-card { background: #1e293b; border-radius: 16px; padding: 2rem; text-align: left; border: 1px solid #334155; transition: all 0.3s; }\n.feature-card:hover { border-color: #6366f1; transform: translateY(-4px); }\n.feature-card span { font-size: 2rem; }\n.feature-card h3 { font-size: 1.25rem; margin: 1rem 0 0.5rem; }\n.feature-card p { color: #94a3b8; line-height: 1.6; }\n.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 900px; margin: 0 auto; }\n.price-card { background: #1e293b; border-radius: 16px; padding: 2rem; border: 1px solid #334155; position: relative; }\n.price-card.featured { border-color: #6366f1; background: linear-gradient(to bottom, #1e293b, #1e1b4b40); }\n.popular { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #6366f1; padding: 0.25rem 1rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }\n.price { font-size: 3rem; font-weight: 800; margin: 1rem 0; }\n.price span { font-size: 1rem; color: #94a3b8; font-weight: 400; }\n.price-card ul { list-style: none; margin: 1.5rem 0; text-align: left; }\n.price-card li { padding: 0.5rem 0; color: #94a3b8; }\n.price-card button { width: 100%; }\nfooter { text-align: center; padding: 3rem; color: #64748b; border-top: 1px solid #1e293b; }\n@media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .nav-links a { display: none; } .hero-cta { flex-direction: column; } }" }],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createFile = (name: string, language: string, content: string): IDEFile => ({
  id: crypto.randomUUID(),
  name,
  language: LANG_MAP[language.toLowerCase()] || language.toLowerCase(),
  content,
  isModified: false,
});

const getFileIcon = (lang: string) => FILE_ICONS[lang] || FILE_ICONS.default;

// ─── Component ───────────────────────────────────────────────────────────────

export const PersonalIDE = ({ initialCode, language, onClose }: PersonalIDEProps) => {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Determine initial files
  const getInitialFiles = (): IDEFile[] => {
    if (initialCode && language) {
      const lang = LANG_MAP[language.toLowerCase()] || language.toLowerCase();
      return [createFile(`main.${EXT_MAP[lang] || "txt"}`, lang, initialCode)];
    }
    return PROJECT_TEMPLATES[0].files.map(f => createFile(f.name, f.language, f.content));
  };

  const [files, setFiles] = useState<IDEFile[]>(getInitialFiles);
  const [activeFileId, setActiveFileId] = useState(files[0]?.id || "");
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);
  const [outputPanel, setOutputPanel] = useState<"console" | "preview">("preview");
  const [theme, setTheme] = useState("vs-dark");
  const [previewHtml, setPreviewHtml] = useState("");
  const [viewportPreset, setViewportPreset] = useState("desktop");
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!initialCode);
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId);

  // ─── File Operations ──────────────────────────────────────────────────────

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content, isModified: true } : f));
  }, []);

  const addNewFile = useCallback(() => {
    const ext = prompt("File name (e.g. utils.js):");
    if (!ext) return;
    const lang = LANG_MAP[ext.split(".").pop() || ""] || "plaintext";
    const newFile = createFile(ext, lang, `// ${ext}\n`);
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId && updated.length > 0) {
        setActiveFileId(updated[0].id);
      }
      return updated;
    });
  }, [activeFileId]);

  const deleteFile = useCallback((fileId: string) => {
    if (files.length <= 1) {
      toast({ title: "Cannot delete the last file", variant: "destructive" });
      return;
    }
    closeFile(fileId);
  }, [files.length, closeFile, toast]);

  // ─── Console ──────────────────────────────────────────────────────────────

  const addLog = useCallback((type: ConsoleLog["type"], message: string) => {
    setConsoleLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  }, []);

  const clearConsole = useCallback(() => setConsoleLogs([]), []);

  // ─── Execution ────────────────────────────────────────────────────────────

  const handleRun = useCallback(() => {
    setIsRunning(true);
    clearConsole();
    addLog("system", "▶ Building project...");

    setTimeout(() => {
      // Find HTML entry point
      const htmlFile = files.find(f => f.language === "html") || files.find(f => f.name === "index.html");
      const cssFiles = files.filter(f => f.language === "css");
      const jsFiles = files.filter(f => ["javascript", "typescript"].includes(f.language));

      if (htmlFile) {
        let html = htmlFile.content;

        // Inject CSS files
        cssFiles.forEach(css => {
          const linkTag = `<link rel="stylesheet" href="${css.name}">`;
          if (html.includes(linkTag)) {
            html = html.replace(linkTag, `<style>/* ${css.name} */\n${css.content}</style>`);
          } else if (!html.includes(css.content)) {
            html = html.replace("</head>", `<style>/* ${css.name} */\n${css.content}</style>\n</head>`);
          }
        });

        // Inject JS files
        jsFiles.forEach(js => {
          if (js.id === htmlFile.id) return; // Skip if same file
          const scriptTag = `<script src="${js.name}"></script>`;
          if (html.includes(scriptTag)) {
            html = html.replace(scriptTag, `<script>/* ${js.name} */\n${js.content}</script>`);
          } else if (!html.includes(js.content)) {
            html = html.replace("</body>", `<script>/* ${js.name} */\n${js.content}</script>\n</body>`);
          }
        });

        setPreviewHtml(html);
        setOutputPanel("preview");
        addLog("system", "✅ Build successful");
        addLog("info", `📄 Entry: ${htmlFile.name} | CSS: ${cssFiles.length} files | JS: ${jsFiles.length} files`);
      } else if (jsFiles.length > 0) {
        // Execute JS directly
        const code = jsFiles.map(f => f.content).join("\n\n");
        const mockConsole = {
          log: (...args: unknown[]) => addLog("log", args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
          error: (...args: unknown[]) => addLog("error", args.map(a => String(a)).join(" ")),
          warn: (...args: unknown[]) => addLog("warn", args.map(a => String(a)).join(" ")),
          info: (...args: unknown[]) => addLog("info", args.map(a => String(a)).join(" ")),
        };
        try {
          const fn = new Function("console", code);
          const result = fn(mockConsole);
          if (result !== undefined) addLog("log", `→ ${JSON.stringify(result, null, 2)}`);
          addLog("system", "✅ Execution complete");
        } catch (error) {
          addLog("error", error instanceof Error ? error.message : "Unknown error");
        }
        setOutputPanel("console");
      } else {
        addLog("warn", "No runnable files found. Add an HTML or JS file.");
      }

      setIsRunning(false);
    }, 300);
  }, [files, addLog, clearConsole]);

  // ─── AI Code Assist ───────────────────────────────────────────────────────

  const handleAIAssist = useCallback(async () => {
    if (!activeFile) return;
    const instruction = prompt("What should the AI do with this code?");
    if (!instruction) return;

    setIsAIAssisting(true);
    addLog("system", `🤖 AI Assistant: "${instruction}"`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `You are a code assistant inside an IDE. The user is editing a ${activeFile.language} file named "${activeFile.name}". Respond ONLY with the updated code. No explanations, no markdown fences, no comments outside the code. Just the raw code.` },
            { role: "user", content: `Here is my current code:\n\n${activeFile.content}\n\nInstruction: ${instruction}` },
          ],
          personality: "professional",
          mode: "general",
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.choices?.[0]?.delta?.content;
              if (text) result += text;
            } catch {}
          }
        }
      }

      // Clean markdown fences if AI included them
      let cleanResult = result.trim();
      const fenceMatch = cleanResult.match(/^```\w*\n([\s\S]*)\n```$/);
      if (fenceMatch) cleanResult = fenceMatch[1];

      if (cleanResult) {
        updateFileContent(activeFile.id, cleanResult);
        addLog("system", "✅ AI code applied successfully");
        toast({ title: "AI code applied" });
      }
    } catch (error) {
      addLog("error", `AI assist failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast({ title: "AI assist failed", variant: "destructive" });
    } finally {
      setIsAIAssisting(false);
    }
  }, [activeFile, addLog, updateFileContent, toast]);

  // ─── Template Loading ─────────────────────────────────────────────────────

  const loadTemplate = useCallback((templateId: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const newFiles = template.files.map(f => createFile(f.name, f.language, f.content));
    setFiles(newFiles);
    setActiveFileId(newFiles[0].id);
    setShowTemplates(false);
    clearConsole();
    setPreviewHtml("");
    toast({ title: `Loaded: ${template.label}` });
  }, [clearConsole, toast]);

  // ─── Download Project ─────────────────────────────────────────────────────

  const downloadProject = useCallback(() => {
    files.forEach(file => {
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast({ title: `Downloaded ${files.length} files` });
  }, [files, toast]);

  // ─── Copy All ─────────────────────────────────────────────────────────────

  const copyActiveFile = useCallback(async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  }, [activeFile, toast]);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(s => !s);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        addNewFile();
      }
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        else if (showSettings) setShowSettings(false);
        else if (showTemplates) setShowTemplates(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun, addNewFile, showSearch, showSettings, showTemplates]);

  // ─── Log Styling ──────────────────────────────────────────────────────────

  const getLogStyle = (type: ConsoleLog["type"]) => {
    switch (type) {
      case "error": return "text-red-400 bg-red-500/10";
      case "warn": return "text-yellow-400 bg-yellow-500/10";
      case "info": return "text-blue-400 bg-blue-500/10";
      case "system": return "text-emerald-400 bg-emerald-500/10";
      default: return "text-foreground/80";
    }
  };

  const getLogIcon = (type: ConsoleLog["type"]) => {
    switch (type) {
      case "error": return "❌";
      case "warn": return "⚠️";
      case "info": return "ℹ️";
      case "system": return "⚙️";
      default: return "›";
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const viewport = VIEWPORT_PRESETS.find(v => v.id === viewportPreset)!;

  return (
    <div className={cn(
      "fixed bg-background z-50 flex flex-col overflow-hidden border border-border shadow-2xl transition-all duration-300",
      isFullscreen ? "inset-0" : "inset-3 rounded-xl"
    )}>
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer hover:bg-red-500" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 cursor-pointer hover:bg-yellow-500" onClick={() => setIsFullscreen(!isFullscreen)} />
            <div className="w-3 h-3 rounded-full bg-green-500/80 cursor-pointer hover:bg-green-500" onClick={handleRun} />
          </div>
          <Code className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">ShadowTalk IDE</span>
          <Badge variant="secondary" className="text-[10px] h-5">Pro</Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* AI Assist */}
          <Button variant="ghost" size="sm" onClick={handleAIAssist} disabled={isAIAssisting} className="h-7 px-2 gap-1 text-xs">
            {isAIAssisting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            <span className="hidden sm:inline">AI Assist</span>
          </Button>
          
          <div className="w-px h-4 bg-border mx-0.5" />

          <Button variant="default" size="sm" onClick={handleRun} disabled={isRunning} className="h-7 px-3 gap-1 text-xs">
            <Play className={cn("h-3 w-3", isRunning && "animate-pulse")} />
            {isRunning ? "Building..." : "Run"}
          </Button>

          <div className="w-px h-4 bg-border mx-0.5" />

          <Button variant="ghost" size="sm" onClick={() => setShowExplorer(!showExplorer)} className="h-7 px-2">
            <FolderOpen className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSearch(!showSearch)} className="h-7 px-2">
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyActiveFile} className="h-7 px-2">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadProject} className="h-7 px-2">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-7 px-2">
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)} className="h-7 px-2">
            <Layout className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="h-7 px-2">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Search Bar ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search in files... (Ctrl+F)"
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)} className="h-7 px-2">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Settings Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="flex items-center gap-4 px-4 py-2 bg-muted/30">
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Theme:</span>
                {THEMES.map(t => (
                  <Button key={t.id} variant={theme === t.id ? "secondary" : "ghost"} size="sm" onClick={() => setTheme(t.id)} className="h-6 px-2 text-[11px]">
                    {t.label}
                  </Button>
                ))}
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Preview:</span>
                {VIEWPORT_PRESETS.map(v => (
                  <Button key={v.id} variant={viewportPreset === v.id ? "secondary" : "ghost"} size="sm" onClick={() => setViewportPreset(v.id)} className="h-6 px-2 text-[11px] gap-1">
                    <v.icon className="h-3 w-3" />
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">

          {/* ─── File Explorer ──────────────────────────────────────────── */}
          {showExplorer && (
            <>
              <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
                <div className="h-full flex flex-col bg-muted/20">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
                    <Button variant="ghost" size="sm" onClick={addNewFile} className="h-6 w-6 p-0">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="py-1">
                      {files.map(file => (
                        <div
                          key={file.id}
                          onClick={() => setActiveFileId(file.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm group transition-colors",
                            activeFileId === file.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"
                          )}
                        >
                          <span className="text-xs">{getFileIcon(file.language)}</span>
                          <span className="flex-1 truncate text-xs">{file.name}</span>
                          {file.isModified && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Quick Info */}
                  <div className="border-t border-border px-3 py-2">
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      <div className="flex justify-between"><span>Files</span><span>{files.length}</span></div>
                      <div className="flex justify-between"><span>Lines</span><span>{files.reduce((a, f) => a + f.content.split("\n").length, 0)}</span></div>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* ─── Editor Panel ───────────────────────────────────────────── */}
          <ResizablePanel defaultSize={showExplorer ? 45 : 55} minSize={25}>
            <div className="h-full flex flex-col">
              {/* File Tabs */}
              <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto">
                {files.map(file => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-border cursor-pointer transition-colors group shrink-0",
                      activeFileId === file.id ? "bg-background text-foreground border-b-2 border-b-primary" : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-[10px]">{getFileIcon(file.language)}</span>
                    <span>{file.name}</span>
                    {file.isModified && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    {files.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); closeFile(file.id); }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addNewFile} className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full bg-background">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
                  </div>
                }>
                  {activeFile && (
                    <Editor
                      key={activeFile.id}
                      height="100%"
                      language={activeFile.language}
                      value={activeFile.content}
                      onChange={value => updateFileContent(activeFile.id, value || "")}
                      theme={theme}
                      options={{
                        minimap: { enabled: true, scale: 2 },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontLigatures: true,
                        lineNumbers: "on",
                        wordWrap: "on",
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        tabSize: 2,
                        padding: { top: 12, bottom: 12 },
                        renderWhitespace: "selection",
                        bracketPairColorization: { enabled: true },
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        folding: true,
                        foldingHighlight: true,
                        showFoldingControls: "always",
                        suggest: { showMethods: true, showFunctions: true, showConstructors: true, showFields: true, showVariables: true, showClasses: true, showStructs: true, showInterfaces: true, showModules: true, showProperties: true, showEvents: true, showOperators: true, showUnits: true, showValues: true, showConstants: true, showEnums: true, showEnumMembers: true, showKeywords: true, showWords: true, showColors: true, showFiles: true, showReferences: true, showFolders: true, showTypeParameters: true, showSnippets: true },
                        quickSuggestions: { other: true, comments: false, strings: true },
                        parameterHints: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true,
                      }}
                    />
                  )}
                </Suspense>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-3 py-1 bg-primary/10 border-t border-border text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>{activeFile?.language || "plaintext"}</span>
                  <span>UTF-8</span>
                  <span>Spaces: 2</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Ln {activeFile?.content.split("\n").length || 0}</span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> ShadowTalk IDE
                  </span>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* ─── Output / Preview Panel ──────────────────────────────────── */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full flex flex-col">
              <Tabs value={outputPanel} onValueChange={v => setOutputPanel(v as "console" | "preview")} className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
                  <TabsList className="h-7">
                    <TabsTrigger value="preview" className="text-xs gap-1 h-6 px-2">
                      <Eye className="h-3 w-3" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="console" className="text-xs gap-1 h-6 px-2">
                      <Terminal className="h-3 w-3" /> Console
                      {consoleLogs.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">{consoleLogs.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-1">
                    {outputPanel === "preview" && previewHtml && (
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => {
                        const w = window.open("", "_blank");
                        if (w) { w.document.write(previewHtml); w.document.close(); }
                      }}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { clearConsole(); setPreviewHtml(""); }} className="h-6 px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRun} className="h-6 px-2">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="preview" className="flex-1 m-0 overflow-hidden bg-white">
                  {previewHtml ? (
                    <div className="h-full flex items-start justify-center bg-zinc-800 overflow-auto p-0">
                      <iframe
                        ref={iframeRef}
                        srcDoc={previewHtml}
                        className="h-full bg-white border-0 transition-all duration-300"
                        style={{ width: viewport.width, maxWidth: "100%" }}
                        sandbox="allow-scripts allow-modals allow-forms"
                        title="Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-background">
                      <Monitor className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-sm font-medium">No preview available</p>
                      <p className="text-xs mt-1 opacity-70">Click <strong>Run</strong> or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+S</kbd> to build</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="console" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full bg-zinc-950">
                    <div className="p-3 font-mono text-xs space-y-0.5">
                      {consoleLogs.length === 0 ? (
                        <div className="text-muted-foreground text-center py-12">
                          <Terminal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Console output will appear here</p>
                          <p className="text-xs mt-1 opacity-70">Run your project to see output</p>
                        </div>
                      ) : consoleLogs.map((log, i) => (
                        <div key={i} className={cn("flex items-start gap-2 px-2 py-1 rounded", getLogStyle(log.type))}>
                          <span className="shrink-0">{getLogIcon(log.type)}</span>
                          <pre className="whitespace-pre-wrap break-all flex-1">{log.message}</pre>
                          <span className="text-[9px] opacity-40 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ─── Template Picker Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Start a New Project</h3>
                  <p className="text-sm text-muted-foreground">Choose a template or start from scratch</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PROJECT_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all group"
                  >
                    <div className="text-2xl mb-2">
                      {template.id === "blank" ? "📄" : template.id === "react" ? "⚛️" : template.id === "dashboard" ? "📊" : "🚀"}
                    </div>
                    <p className="font-medium text-sm">{template.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.files.length} file{template.files.length > 1 ? "s" : ""}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  ⌨️ Shortcuts: <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+S</kbd> Run · <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+N</kbd> New File · <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+F</kbd> Search
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersonalIDE;
