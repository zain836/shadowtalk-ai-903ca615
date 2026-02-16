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
    files: [{ name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>SaaS Landing Page</title>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <nav>\n    <div class=\"nav-container\">\n      <span class=\"logo\">🚀 ProductName</span>\n      <div class=\"nav-links\">\n        <a href=\"#features\">Features</a>\n        <a href=\"#pricing\">Pricing</a>\n        <a href=\"#testimonials\">Testimonials</a>\n        <button class=\"btn-primary\">Get Started</button>\n      </div>\n    </div>\n  </nav>\n  <section class=\"hero\">\n    <div class=\"hero-badge\">✨ Now with AI-powered features</div>\n    <h1>Build faster.<br>Ship smarter.</h1>\n    <p>The all-in-one platform that helps teams build, deploy, and scale modern applications without the complexity.</p>\n    <div class=\"hero-cta\">\n      <button class=\"btn-primary btn-lg\">Start Free Trial</button>\n      <button class=\"btn-secondary btn-lg\">Watch Demo →</button>\n    </div>\n  </section>\n  <section id=\"features\" class=\"features\">\n    <h2>Everything you need</h2>\n    <div class=\"feature-grid\">\n      <div class=\"feature-card\"><span>⚡</span><h3>Lightning Fast</h3><p>Optimized for speed with edge computing and smart caching.</p></div>\n      <div class=\"feature-card\"><span>🔒</span><h3>Secure by Default</h3><p>Enterprise-grade security with E2E encryption built in.</p></div>\n      <div class=\"feature-card\"><span>📊</span><h3>Analytics</h3><p>Real-time insights and dashboards to track your metrics.</p></div>\n      <div class=\"feature-card\"><span>🤖</span><h3>AI Powered</h3><p>Intelligent automation that learns and adapts to your workflow.</p></div>\n    </div>\n  </section>\n  <footer>\n    <p>© 2026 ProductName. Built with ShadowTalk IDE.</p>\n  </footer>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }\nnav { position: fixed; top: 0; width: 100%; background: #0f172a99; backdrop-filter: blur(12px); border-bottom: 1px solid #1e293b; z-index: 100; }\n.nav-container { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }\n.logo { font-size: 1.25rem; font-weight: 800; }\n.nav-links { display: flex; align-items: center; gap: 2rem; }\n.nav-links a { text-decoration: none; color: #94a3b8; font-size: 0.875rem; transition: color 0.2s; }\n.nav-links a:hover { color: #e2e8f0; }\n.btn-primary { padding: 0.625rem 1.5rem; border: none; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }\n.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px #6366f140; }\n.btn-secondary { padding: 0.625rem 1.5rem; border: 1px solid #334155; border-radius: 8px; background: transparent; color: #e2e8f0; font-weight: 500; cursor: pointer; transition: all 0.2s; }\n.btn-secondary:hover { border-color: #6366f1; background: #6366f110; }\n.btn-lg { padding: 0.875rem 2rem; font-size: 1.05rem; }\n.hero { text-align: center; padding: 12rem 2rem 6rem; max-width: 800px; margin: 0 auto; }\n.hero-badge { display: inline-block; padding: 0.375rem 1rem; border-radius: 99px; background: #6366f120; color: #a5b4fc; font-size: 0.875rem; margin-bottom: 2rem; }\n.hero h1 { font-size: 4rem; font-weight: 800; line-height: 1.1; background: linear-gradient(135deg, #e2e8f0, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.5rem; }\n.hero p { font-size: 1.25rem; color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; }\n.hero-cta { display: flex; gap: 1rem; justify-content: center; }\n.features { max-width: 1200px; margin: 0 auto; padding: 6rem 2rem; text-align: center; }\n.features h2 { font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem; }\n.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }\n.feature-card { background: #1e293b; border-radius: 16px; padding: 2rem; text-align: left; border: 1px solid #334155; transition: all 0.3s; }\n.feature-card:hover { border-color: #6366f1; transform: translateY(-4px); }\n.feature-card span { font-size: 2rem; }\n.feature-card h3 { font-size: 1.25rem; margin: 1rem 0 0.5rem; }\n.feature-card p { color: #94a3b8; line-height: 1.6; }\nfooter { text-align: center; padding: 3rem; color: #64748b; border-top: 1px solid #1e293b; }\n@media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .nav-links a { display: none; } .hero-cta { flex-direction: column; } }" }],
  },
  {
    id: "saas", label: "SaaS App",
    files: [
      { name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>SaaS Application</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <div id=\"app\">\n    <!-- Auth Screen -->\n    <div id=\"auth-screen\" class=\"screen active\">\n      <div class=\"auth-container\">\n        <h1>🚀 MySaaS</h1>\n        <p class=\"subtitle\">Sign in to your account</p>\n        <form id=\"auth-form\">\n          <input type=\"email\" id=\"email\" placeholder=\"Email address\" required>\n          <input type=\"password\" id=\"password\" placeholder=\"Password\" required>\n          <button type=\"submit\" class=\"btn-primary\">Sign In</button>\n          <p class=\"toggle-auth\">Don't have an account? <a href=\"#\" id=\"toggle-signup\">Sign Up</a></p>\n        </form>\n      </div>\n    </div>\n    <!-- Dashboard Screen -->\n    <div id=\"dashboard-screen\" class=\"screen\">\n      <nav class=\"top-nav\">\n        <span class=\"logo\">🚀 MySaaS</span>\n        <div class=\"nav-right\">\n          <span id=\"user-email\" class=\"user-badge\"></span>\n          <button id=\"logout-btn\" class=\"btn-ghost\">Logout</button>\n        </div>\n      </nav>\n      <div class=\"dashboard-layout\">\n        <aside class=\"sidebar\">\n          <a href=\"#\" class=\"nav-item active\" data-page=\"overview\">📊 Overview</a>\n          <a href=\"#\" class=\"nav-item\" data-page=\"projects\">📁 Projects</a>\n          <a href=\"#\" class=\"nav-item\" data-page=\"team\">👥 Team</a>\n          <a href=\"#\" class=\"nav-item\" data-page=\"settings\">⚙️ Settings</a>\n        </aside>\n        <main class=\"main-content\">\n          <div id=\"page-overview\" class=\"page active\">\n            <h2>Dashboard Overview</h2>\n            <div class=\"stats-grid\">\n              <div class=\"stat-card\"><span class=\"stat-label\">Total Projects</span><span class=\"stat-value\" id=\"stat-projects\">0</span></div>\n              <div class=\"stat-card\"><span class=\"stat-label\">Team Members</span><span class=\"stat-value\" id=\"stat-team\">0</span></div>\n              <div class=\"stat-card\"><span class=\"stat-label\">Tasks Done</span><span class=\"stat-value\" id=\"stat-tasks\">0</span></div>\n              <div class=\"stat-card\"><span class=\"stat-label\">Uptime</span><span class=\"stat-value\">99.9%</span></div>\n            </div>\n            <div class=\"recent-activity\">\n              <h3>Recent Activity</h3>\n              <div id=\"activity-feed\" class=\"activity-list\"></div>\n            </div>\n          </div>\n          <div id=\"page-projects\" class=\"page\">\n            <div class=\"page-header\"><h2>Projects</h2><button class=\"btn-primary\" id=\"new-project-btn\">+ New Project</button></div>\n            <div id=\"projects-list\" class=\"projects-grid\"></div>\n          </div>\n          <div id=\"page-team\" class=\"page\">\n            <h2>Team Members</h2>\n            <div id=\"team-list\" class=\"team-grid\"></div>\n          </div>\n          <div id=\"page-settings\" class=\"page\">\n            <h2>Settings</h2>\n            <div class=\"settings-form\">\n              <label>Display Name<input type=\"text\" id=\"setting-name\" placeholder=\"Your name\"></label>\n              <label>Notifications<select id=\"setting-notif\"><option>All</option><option>Important only</option><option>None</option></select></label>\n              <button class=\"btn-primary\" id=\"save-settings\">Save Changes</button>\n            </div>\n          </div>\n        </main>\n      </div>\n    </div>\n  </div>\n  <script src=\"app.js\"></script>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* { margin: 0; padding: 0; box-sizing: border-box; }\n:root { --bg: #0f172a; --surface: #1e293b; --border: #334155; --text: #e2e8f0; --muted: #94a3b8; --primary: #6366f1; --primary-hover: #818cf8; --success: #22c55e; --danger: #ef4444; }\nbody { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }\n.screen { display: none; } .screen.active { display: flex; }\n\n/* Auth */\n#auth-screen { min-height: 100vh; align-items: center; justify-content: center; }\n.auth-container { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 3rem; width: 100%; max-width: 400px; text-align: center; }\n.auth-container h1 { font-size: 2rem; margin-bottom: 0.5rem; }\n.subtitle { color: var(--muted); margin-bottom: 2rem; }\n#auth-form { display: flex; flex-direction: column; gap: 1rem; }\n#auth-form input { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.95rem; }\n#auth-form input:focus { outline: none; border-color: var(--primary); }\n.toggle-auth { font-size: 0.85rem; color: var(--muted); } .toggle-auth a { color: var(--primary); text-decoration: none; }\n\n/* Buttons */\n.btn-primary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; background: var(--primary); color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; }\n.btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }\n.btn-ghost { padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--text); cursor: pointer; } .btn-ghost:hover { background: var(--surface); }\n\n/* Dashboard Layout */\n.dashboard-layout { display: flex; min-height: calc(100vh - 56px); }\n.top-nav { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; background: var(--surface); border-bottom: 1px solid var(--border); }\n.logo { font-weight: 800; font-size: 1.1rem; }\n.nav-right { display: flex; align-items: center; gap: 1rem; }\n.user-badge { font-size: 0.8rem; color: var(--muted); padding: 0.25rem 0.75rem; background: var(--bg); border-radius: 99px; }\n\n/* Sidebar */\n.sidebar { width: 220px; background: var(--surface); border-right: 1px solid var(--border); padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }\n.nav-item { display: block; padding: 0.75rem 1rem; border-radius: 8px; color: var(--muted); text-decoration: none; transition: all 0.2s; font-size: 0.9rem; }\n.nav-item:hover, .nav-item.active { background: var(--bg); color: var(--text); }\n\n/* Main Content */\n.main-content { flex: 1; padding: 2rem; overflow-y: auto; }\n.page { display: none; } .page.active { display: block; }\n.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }\n\n/* Stats */\n.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }\n.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }\n.stat-label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.5rem; }\n.stat-value { font-size: 2rem; font-weight: 700; }\n\n/* Projects */\n.projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }\n.project-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; transition: all 0.2s; }\n.project-card:hover { border-color: var(--primary); transform: translateY(-2px); }\n.project-card h4 { margin-bottom: 0.5rem; } .project-card p { color: var(--muted); font-size: 0.85rem; }\n.project-card .project-meta { display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.75rem; color: var(--muted); }\n\n/* Team */\n.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }\n.team-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; text-align: center; }\n.team-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.25rem; }\n.team-card h4 { margin-bottom: 0.25rem; } .team-card .role { color: var(--muted); font-size: 0.8rem; }\n\n/* Settings */\n.settings-form { max-width: 500px; display: flex; flex-direction: column; gap: 1.25rem; }\n.settings-form label { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; font-weight: 500; }\n.settings-form input, .settings-form select { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }\n\n/* Activity */\n.recent-activity h3 { margin-bottom: 1rem; }\n.activity-list { display: flex; flex-direction: column; gap: 0.5rem; }\n.activity-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--surface); border-radius: 8px; font-size: 0.85rem; }\n.activity-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }\n.activity-time { margin-left: auto; font-size: 0.75rem; color: var(--muted); }" },
      { name: "app.js", language: "javascript", content: "// ── Mock Database ──\nconst DB = {\n  users: JSON.parse(localStorage.getItem('saas_users') || '[]'),\n  projects: JSON.parse(localStorage.getItem('saas_projects') || '[]'),\n  currentUser: JSON.parse(localStorage.getItem('saas_current') || 'null'),\n  save() { localStorage.setItem('saas_users', JSON.stringify(this.users)); localStorage.setItem('saas_projects', JSON.stringify(this.projects)); localStorage.setItem('saas_current', JSON.stringify(this.currentUser)); }\n};\n\nconst team = [\n  { name: 'Alice Chen', role: 'Lead Developer', emoji: '👩‍💻' },\n  { name: 'Bob Martinez', role: 'Designer', emoji: '🎨' },\n  { name: 'Carol Davis', role: 'PM', emoji: '📋' },\n  { name: 'David Kim', role: 'DevOps', emoji: '🔧' },\n];\n\nconst activities = [\n  { text: 'New project \"AI Dashboard\" created', time: '2m ago' },\n  { text: 'Alice pushed 3 commits to main', time: '15m ago' },\n  { text: 'Bob updated design system', time: '1h ago' },\n  { text: 'Deployment to production succeeded', time: '2h ago' },\n  { text: 'Carol closed 5 tickets', time: '3h ago' },\n];\n\n// ── Navigation ──\nfunction showScreen(id) {\n  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));\n  document.getElementById(id)?.classList.add('active');\n}\n\nfunction showPage(name) {\n  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));\n  document.getElementById('page-' + name)?.classList.add('active');\n  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === name));\n}\n\n// ── Auth ──\ndocument.getElementById('auth-form').addEventListener('submit', e => {\n  e.preventDefault();\n  const email = document.getElementById('email').value;\n  const pass = document.getElementById('password').value;\n  let user = DB.users.find(u => u.email === email);\n  if (!user) { user = { email, password: pass, name: email.split('@')[0], created: new Date().toISOString() }; DB.users.push(user); }\n  DB.currentUser = user; DB.save();\n  initDashboard();\n});\n\ndocument.getElementById('logout-btn').addEventListener('click', () => {\n  DB.currentUser = null; DB.save();\n  showScreen('auth-screen');\n});\n\n// ── Dashboard ──\nfunction initDashboard() {\n  showScreen('dashboard-screen');\n  document.getElementById('user-email').textContent = DB.currentUser.email;\n  document.getElementById('stat-projects').textContent = DB.projects.length;\n  document.getElementById('stat-team').textContent = team.length;\n  document.getElementById('stat-tasks').textContent = Math.floor(Math.random() * 50) + 10;\n  renderActivity(); renderProjects(); renderTeam();\n}\n\nfunction renderActivity() {\n  document.getElementById('activity-feed').innerHTML = activities.map(a => `<div class=\"activity-item\"><div class=\"activity-dot\"></div><span>${a.text}</span><span class=\"activity-time\">${a.time}</span></div>`).join('');\n}\n\nfunction renderProjects() {\n  const list = document.getElementById('projects-list');\n  if (DB.projects.length === 0) DB.projects = [\n    { name: 'Website Redesign', desc: 'Modern landing page with AI features', status: 'Active', tasks: 12 },\n    { name: 'Mobile App', desc: 'Cross-platform app for iOS and Android', status: 'Planning', tasks: 8 },\n    { name: 'API Gateway', desc: 'Microservices API management layer', status: 'Active', tasks: 15 },\n  ];\n  DB.save();\n  list.innerHTML = DB.projects.map(p => `<div class=\"project-card\"><h4>${p.name}</h4><p>${p.desc}</p><div class=\"project-meta\"><span>Status: ${p.status}</span><span>${p.tasks} tasks</span></div></div>`).join('');\n}\n\nfunction renderTeam() {\n  document.getElementById('team-list').innerHTML = team.map(t => `<div class=\"team-card\"><div class=\"team-avatar\">${t.emoji}</div><h4>${t.name}</h4><p class=\"role\">${t.role}</p></div>`).join('');\n}\n\n// ── Sidebar Nav ──\ndocument.querySelectorAll('.nav-item').forEach(item => {\n  item.addEventListener('click', e => { e.preventDefault(); showPage(item.dataset.page); });\n});\n\n// ── New Project ──\ndocument.getElementById('new-project-btn')?.addEventListener('click', () => {\n  const name = prompt('Project name:');\n  if (name) { DB.projects.push({ name, desc: 'New project', status: 'Planning', tasks: 0 }); DB.save(); renderProjects(); }\n});\n\n// ── Settings ──\ndocument.getElementById('save-settings')?.addEventListener('click', () => {\n  alert('Settings saved!');\n});\n\n// ── Auto-login ──\nif (DB.currentUser) initDashboard();\nelse showScreen('auth-screen');\n\nconsole.log('SaaS App initialized');" }
    ],
  },
  {
    id: "ecommerce", label: "E-Commerce Store",
    files: [
      { name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>ShopNow - E-Commerce</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <nav class=\"topbar\">\n    <span class=\"brand\">🛍️ ShopNow</span>\n    <div class=\"nav-actions\">\n      <input type=\"search\" id=\"search\" placeholder=\"Search products...\">\n      <button class=\"cart-btn\" id=\"cart-toggle\">🛒 <span id=\"cart-count\">0</span></button>\n    </div>\n  </nav>\n  <main class=\"store\">\n    <aside class=\"filters\">\n      <h3>Categories</h3>\n      <button class=\"filter-btn active\" data-cat=\"all\">All</button>\n      <button class=\"filter-btn\" data-cat=\"electronics\">Electronics</button>\n      <button class=\"filter-btn\" data-cat=\"clothing\">Clothing</button>\n      <button class=\"filter-btn\" data-cat=\"accessories\">Accessories</button>\n    </aside>\n    <section id=\"products\" class=\"product-grid\"></section>\n  </main>\n  <div id=\"cart-drawer\" class=\"cart-drawer\">\n    <div class=\"cart-header\"><h3>Your Cart</h3><button id=\"close-cart\">✕</button></div>\n    <div id=\"cart-items\" class=\"cart-items\"></div>\n    <div class=\"cart-footer\">\n      <div class=\"cart-total\">Total: <strong id=\"cart-total\">$0.00</strong></div>\n      <button class=\"btn-primary\" id=\"checkout-btn\">Checkout</button>\n    </div>\n  </div>\n  <script src=\"app.js\"></script>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }\n.topbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: #1e293b; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 50; }\n.brand { font-size: 1.3rem; font-weight: 800; }\n.nav-actions { display: flex; align-items: center; gap: 1rem; }\n.nav-actions input { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; width: 250px; }\n.cart-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #334155; background: transparent; color: #e2e8f0; cursor: pointer; font-size: 1rem; } .cart-btn:hover { background: #334155; }\n#cart-count { background: #6366f1; color: white; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; }\n.store { display: flex; max-width: 1400px; margin: 0 auto; padding: 2rem; gap: 2rem; }\n.filters { width: 200px; display: flex; flex-direction: column; gap: 0.5rem; }\n.filters h3 { margin-bottom: 0.5rem; font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }\n.filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #334155; background: transparent; color: #94a3b8; cursor: pointer; text-align: left; transition: all 0.2s; }\n.filter-btn:hover, .filter-btn.active { background: #6366f120; color: #a5b4fc; border-color: #6366f1; }\n.product-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }\n.product-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; transition: all 0.3s; }\n.product-card:hover { border-color: #6366f1; transform: translateY(-4px); box-shadow: 0 12px 40px #6366f115; }\n.product-img { height: 180px; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 4rem; }\n.product-info { padding: 1.25rem; }\n.product-info h4 { margin-bottom: 0.25rem; }\n.product-info .price { font-size: 1.25rem; font-weight: 700; color: #22c55e; margin: 0.5rem 0; }\n.product-info .desc { color: #94a3b8; font-size: 0.8rem; margin-bottom: 1rem; }\n.btn-primary { width: 100%; padding: 0.625rem; border: none; border-radius: 8px; background: #6366f1; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; }\n.btn-primary:hover { background: #818cf8; }\n.cart-drawer { position: fixed; right: -400px; top: 0; width: 380px; height: 100vh; background: #1e293b; border-left: 1px solid #334155; z-index: 100; transition: right 0.3s; display: flex; flex-direction: column; }\n.cart-drawer.open { right: 0; }\n.cart-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #334155; }\n.cart-header button { background: none; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer; }\n.cart-items { flex: 1; overflow-y: auto; padding: 1rem; }\n.cart-item { display: flex; gap: 1rem; padding: 1rem; background: #0f172a; border-radius: 8px; margin-bottom: 0.75rem; }\n.cart-item-img { width: 50px; height: 50px; background: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }\n.cart-item-info { flex: 1; }\n.cart-item-info h4 { font-size: 0.85rem; } .cart-item-info .price { color: #22c55e; font-size: 0.8rem; }\n.cart-item-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; }\n.cart-footer { padding: 1.5rem; border-top: 1px solid #334155; }\n.cart-total { display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.1rem; }\n@media (max-width: 768px) { .store { flex-direction: column; } .filters { width: 100%; flex-direction: row; flex-wrap: wrap; } .nav-actions input { width: 150px; } }" },
      { name: "app.js", language: "javascript", content: "const products = [\n  { id: 1, name: 'Wireless Earbuds', price: 79.99, cat: 'electronics', emoji: '🎧', desc: 'Premium noise-cancelling' },\n  { id: 2, name: 'Smart Watch', price: 199.99, cat: 'electronics', emoji: '⌚', desc: 'Fitness & notifications' },\n  { id: 3, name: 'Laptop Stand', price: 49.99, cat: 'accessories', emoji: '💻', desc: 'Ergonomic aluminum' },\n  { id: 4, name: 'Backpack', price: 89.99, cat: 'accessories', emoji: '🎒', desc: 'Water-resistant, 30L' },\n  { id: 5, name: 'Running Shoes', price: 129.99, cat: 'clothing', emoji: '👟', desc: 'Ultra-light performance' },\n  { id: 6, name: 'Hoodie', price: 59.99, cat: 'clothing', emoji: '🧥', desc: 'Premium cotton blend' },\n  { id: 7, name: 'Mechanical Keyboard', price: 149.99, cat: 'electronics', emoji: '⌨️', desc: 'RGB cherry MX' },\n  { id: 8, name: 'Sunglasses', price: 39.99, cat: 'accessories', emoji: '🕶️', desc: 'Polarized UV protection' },\n];\n\nlet cart = JSON.parse(localStorage.getItem('shop_cart') || '[]');\nlet activeFilter = 'all';\n\nfunction render() {\n  const filtered = activeFilter === 'all' ? products : products.filter(p => p.cat === activeFilter);\n  const search = document.getElementById('search').value.toLowerCase();\n  const results = search ? filtered.filter(p => p.name.toLowerCase().includes(search)) : filtered;\n  document.getElementById('products').innerHTML = results.map(p => `\n    <div class=\"product-card\">\n      <div class=\"product-img\">${p.emoji}</div>\n      <div class=\"product-info\">\n        <h4>${p.name}</h4>\n        <p class=\"desc\">${p.desc}</p>\n        <p class=\"price\">$${p.price.toFixed(2)}</p>\n        <button class=\"btn-primary\" onclick=\"addToCart(${p.id})\">Add to Cart</button>\n      </div>\n    </div>\n  `).join('');\n  renderCart();\n}\n\nfunction addToCart(id) {\n  const existing = cart.find(c => c.id === id);\n  if (existing) existing.qty++;\n  else cart.push({ id, qty: 1 });\n  saveCart(); renderCart();\n}\n\nfunction removeFromCart(id) {\n  cart = cart.filter(c => c.id !== id);\n  saveCart(); renderCart();\n}\n\nfunction saveCart() { localStorage.setItem('shop_cart', JSON.stringify(cart)); }\n\nfunction renderCart() {\n  document.getElementById('cart-count').textContent = cart.reduce((a, c) => a + c.qty, 0);\n  const items = document.getElementById('cart-items');\n  if (cart.length === 0) { items.innerHTML = '<p style=\"text-align:center;color:#94a3b8;padding:2rem\">Cart is empty</p>'; }\n  else { items.innerHTML = cart.map(c => { const p = products.find(x => x.id === c.id); return `<div class=\"cart-item\"><div class=\"cart-item-img\">${p.emoji}</div><div class=\"cart-item-info\"><h4>${p.name} ×${c.qty}</h4><span class=\"price\">$${(p.price * c.qty).toFixed(2)}</span></div><button class=\"cart-item-remove\" onclick=\"removeFromCart(${c.id})\">Remove</button></div>`; }).join(''); }\n  const total = cart.reduce((a, c) => { const p = products.find(x => x.id === c.id); return a + p.price * c.qty; }, 0);\n  document.getElementById('cart-total').textContent = '$' + total.toFixed(2);\n}\n\n// Filters\ndocument.querySelectorAll('.filter-btn').forEach(btn => {\n  btn.addEventListener('click', () => {\n    activeFilter = btn.dataset.cat;\n    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));\n    render();\n  });\n});\n\n// Search\ndocument.getElementById('search').addEventListener('input', render);\n\n// Cart drawer\ndocument.getElementById('cart-toggle').addEventListener('click', () => document.getElementById('cart-drawer').classList.toggle('open'));\ndocument.getElementById('close-cart').addEventListener('click', () => document.getElementById('cart-drawer').classList.remove('open'));\ndocument.getElementById('checkout-btn').addEventListener('click', () => { if (cart.length > 0) { alert('Order placed! Thank you 🎉'); cart = []; saveCart(); renderCart(); document.getElementById('cart-drawer').classList.remove('open'); } });\n\nrender();\nconsole.log('E-Commerce store loaded');" }
    ],
  },
  {
    id: "portfolio", label: "Portfolio Site",
    files: [
      { name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Portfolio</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <header class=\"hero\">\n    <nav><a href=\"#about\">About</a><a href=\"#projects\">Projects</a><a href=\"#skills\">Skills</a><a href=\"#contact\">Contact</a></nav>\n    <div class=\"hero-content\">\n      <p class=\"greeting\">Hello, I'm</p>\n      <h1>Alex Developer</h1>\n      <p class=\"tagline\">Full-Stack Developer & UI Designer</p>\n      <div class=\"cta-group\">\n        <a href=\"#projects\" class=\"btn-primary\">View Projects</a>\n        <a href=\"#contact\" class=\"btn-outline\">Get in Touch</a>\n      </div>\n    </div>\n  </header>\n  <section id=\"about\" class=\"section\">\n    <h2>About Me</h2>\n    <p>I'm a passionate developer with 5+ years of experience building modern web applications. I specialize in React, Node.js, and cloud architecture. When I'm not coding, you'll find me contributing to open-source or writing technical articles.</p>\n  </section>\n  <section id=\"projects\" class=\"section\">\n    <h2>Featured Projects</h2>\n    <div class=\"projects-grid\">\n      <div class=\"project\"><div class=\"project-icon\">🚀</div><h3>SaaS Dashboard</h3><p>Analytics platform with real-time data visualization</p><div class=\"tags\"><span>React</span><span>D3.js</span><span>Node</span></div></div>\n      <div class=\"project\"><div class=\"project-icon\">🛒</div><h3>E-Commerce App</h3><p>Full-featured online store with payment integration</p><div class=\"tags\"><span>Next.js</span><span>Stripe</span><span>PostgreSQL</span></div></div>\n      <div class=\"project\"><div class=\"project-icon\">🤖</div><h3>AI Chat Platform</h3><p>Conversational AI with multi-model support</p><div class=\"tags\"><span>TypeScript</span><span>OpenAI</span><span>WebSocket</span></div></div>\n      <div class=\"project\"><div class=\"project-icon\">📱</div><h3>Mobile Fitness</h3><p>Cross-platform fitness tracking application</p><div class=\"tags\"><span>React Native</span><span>Firebase</span><span>HealthKit</span></div></div>\n    </div>\n  </section>\n  <section id=\"skills\" class=\"section\">\n    <h2>Skills</h2>\n    <div class=\"skills-grid\">\n      <div class=\"skill\"><span class=\"skill-name\">JavaScript/TypeScript</span><div class=\"skill-bar\"><div class=\"skill-fill\" style=\"width:95%\"></div></div></div>\n      <div class=\"skill\"><span class=\"skill-name\">React & Next.js</span><div class=\"skill-bar\"><div class=\"skill-fill\" style=\"width:90%\"></div></div></div>\n      <div class=\"skill\"><span class=\"skill-name\">Node.js & Express</span><div class=\"skill-bar\"><div class=\"skill-fill\" style=\"width:88%\"></div></div></div>\n      <div class=\"skill\"><span class=\"skill-name\">Python & AI/ML</span><div class=\"skill-bar\"><div class=\"skill-fill\" style=\"width:80%\"></div></div></div>\n      <div class=\"skill\"><span class=\"skill-name\">Cloud & DevOps</span><div class=\"skill-bar\"><div class=\"skill-fill\" style=\"width:85%\"></div></div></div>\n      <div class=\"skill\"><span class=\"skill-name\">UI/UX Design</span><div class=\"skill-bar\"><div class=\"skill-fill\" style=\"width:82%\"></div></div></div>\n    </div>\n  </section>\n  <section id=\"contact\" class=\"section\">\n    <h2>Get in Touch</h2>\n    <form id=\"contact-form\">\n      <input type=\"text\" placeholder=\"Your Name\" required>\n      <input type=\"email\" placeholder=\"Your Email\" required>\n      <textarea placeholder=\"Your Message\" rows=\"5\" required></textarea>\n      <button type=\"submit\" class=\"btn-primary\">Send Message</button>\n    </form>\n  </section>\n  <footer><p>© 2026 Alex Developer. Built with ShadowTalk IDE.</p></footer>\n  <script src=\"app.js\"></script>\n</body>\n</html>" },
      { name: "style.css", language: "css", content: "* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }\nnav { position: fixed; top: 0; width: 100%; display: flex; justify-content: center; gap: 2rem; padding: 1.25rem; background: #0f172a99; backdrop-filter: blur(12px); z-index: 100; }\nnav a { text-decoration: none; color: #94a3b8; font-size: 0.9rem; transition: color 0.2s; } nav a:hover { color: #e2e8f0; }\n.hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; background: radial-gradient(ellipse at 50% 80%, #1e1b4b 0%, #0f172a 70%); }\n.greeting { font-size: 1.1rem; color: #a5b4fc; margin-bottom: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; }\n.hero h1 { font-size: 4.5rem; font-weight: 800; background: linear-gradient(135deg, #e2e8f0, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; }\n.tagline { font-size: 1.25rem; color: #94a3b8; margin-bottom: 2.5rem; }\n.cta-group { display: flex; gap: 1rem; }\n.btn-primary { padding: 0.75rem 2rem; border: none; border-radius: 10px; background: #6366f1; color: white; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s; display: inline-block; }\n.btn-primary:hover { background: #818cf8; transform: translateY(-2px); box-shadow: 0 8px 25px #6366f140; }\n.btn-outline { padding: 0.75rem 2rem; border: 1px solid #334155; border-radius: 10px; color: #e2e8f0; text-decoration: none; transition: all 0.2s; } .btn-outline:hover { border-color: #6366f1; background: #6366f110; }\n.section { max-width: 900px; margin: 0 auto; padding: 6rem 2rem; }\n.section h2 { font-size: 2rem; margin-bottom: 2rem; position: relative; }\n.section h2::after { content: ''; position: absolute; left: 0; bottom: -8px; width: 60px; height: 3px; background: #6366f1; border-radius: 99px; }\n.section > p { color: #94a3b8; line-height: 1.8; font-size: 1.05rem; }\n.projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }\n.project { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2rem; transition: all 0.3s; } .project:hover { border-color: #6366f1; transform: translateY(-4px); }\n.project-icon { font-size: 2.5rem; margin-bottom: 1rem; }\n.project h3 { margin-bottom: 0.5rem; } .project p { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem; }\n.tags { display: flex; gap: 0.5rem; flex-wrap: wrap; } .tags span { padding: 0.25rem 0.75rem; background: #6366f115; color: #a5b4fc; border-radius: 99px; font-size: 0.75rem; }\n.skills-grid { display: flex; flex-direction: column; gap: 1.25rem; }\n.skill { display: flex; align-items: center; gap: 1rem; }\n.skill-name { min-width: 180px; font-size: 0.9rem; }\n.skill-bar { flex: 1; height: 8px; background: #1e293b; border-radius: 99px; overflow: hidden; }\n.skill-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 99px; transition: width 1s ease; }\n#contact-form { display: flex; flex-direction: column; gap: 1rem; max-width: 500px; }\n#contact-form input, #contact-form textarea { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; font-size: 0.95rem; } #contact-form input:focus, #contact-form textarea:focus { outline: none; border-color: #6366f1; }\nfooter { text-align: center; padding: 3rem; color: #64748b; border-top: 1px solid #1e293b; }\n@media (max-width: 768px) { .hero h1 { font-size: 2.5rem; } .cta-group { flex-direction: column; } .skill { flex-direction: column; align-items: flex-start; gap: 0.5rem; } .skill-name { min-width: auto; } }" },
      { name: "app.js", language: "javascript", content: "// Smooth scroll\ndocument.querySelectorAll('nav a, .cta-group a').forEach(link => {\n  link.addEventListener('click', e => {\n    const href = link.getAttribute('href');\n    if (href?.startsWith('#')) {\n      e.preventDefault();\n      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });\n    }\n  });\n});\n\n// Animate skill bars on scroll\nconst observer = new IntersectionObserver(entries => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      entry.target.querySelectorAll('.skill-fill').forEach(bar => {\n        const width = bar.style.width;\n        bar.style.width = '0';\n        requestAnimationFrame(() => { bar.style.width = width; });\n      });\n    }\n  });\n}, { threshold: 0.3 });\n\nconst skillsSection = document.getElementById('skills');\nif (skillsSection) observer.observe(skillsSection);\n\n// Contact form\ndocument.getElementById('contact-form')?.addEventListener('submit', e => {\n  e.preventDefault();\n  alert('Message sent! I\\'ll get back to you soon. 🚀');\n  e.target.reset();\n});\n\n// Intersection observer for fade-in\nconst fadeObserver = new IntersectionObserver(entries => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) entry.target.style.opacity = '1';\n  });\n}, { threshold: 0.1 });\n\ndocument.querySelectorAll('.section').forEach(s => {\n  s.style.opacity = '0'; s.style.transition = 'opacity 0.8s';\n  fadeObserver.observe(s);\n});\n\nconsole.log('Portfolio loaded');" }
    ],
  },
  {
    id: "api", label: "REST API Server",
    files: [
      { name: "server.js", language: "javascript", content: "// ══════════════════════════════════════════════════════════════\n// REST API Server - Complete Backend Template\n// ══════════════════════════════════════════════════════════════\n\n// NOTE: This is a Node.js/Express server template.\n// To run: npm init -y && npm install express cors dotenv bcryptjs jsonwebtoken\n// Then: node server.js\n\nconst express = require('express');\nconst cors = require('cors');\nconst crypto = require('crypto');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\n// Middleware\napp.use(cors());\napp.use(express.json());\n\n// ── In-Memory Database ──\nconst db = {\n  users: [],\n  items: [\n    { id: '1', name: 'Widget A', price: 29.99, category: 'tools', stock: 150, created_at: new Date().toISOString() },\n    { id: '2', name: 'Gadget B', price: 49.99, category: 'electronics', stock: 75, created_at: new Date().toISOString() },\n    { id: '3', name: 'Service C', price: 99.99, category: 'services', stock: 999, created_at: new Date().toISOString() },\n  ],\n  tokens: new Map(),\n};\n\n// ── Helpers ──\nconst generateId = () => crypto.randomUUID();\nconst generateToken = () => crypto.randomBytes(32).toString('hex');\n\n// ── Auth Middleware ──\nconst authenticate = (req, res, next) => {\n  const token = req.headers.authorization?.replace('Bearer ', '');\n  if (!token) return res.status(401).json({ error: 'Unauthorized' });\n  const userId = db.tokens.get(token);\n  if (!userId) return res.status(401).json({ error: 'Invalid token' });\n  req.userId = userId;\n  next();\n};\n\n// ── Rate Limiter ──\nconst rateLimit = new Map();\nconst rateLimiter = (limit = 100, window = 60000) => (req, res, next) => {\n  const key = req.ip;\n  const now = Date.now();\n  const record = rateLimit.get(key) || { count: 0, start: now };\n  if (now - record.start > window) { record.count = 0; record.start = now; }\n  record.count++;\n  rateLimit.set(key, record);\n  res.setHeader('X-RateLimit-Limit', limit);\n  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));\n  if (record.count > limit) return res.status(429).json({ error: 'Too many requests' });\n  next();\n};\n\napp.use(rateLimiter());\n\n// ══════ AUTH ROUTES ══════\n\n// Register\napp.post('/api/auth/register', (req, res) => {\n  const { email, password, name } = req.body;\n  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });\n  if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email exists' });\n  const user = { id: generateId(), email, name: name || email.split('@')[0], created_at: new Date().toISOString() };\n  db.users.push({ ...user, password });\n  const token = generateToken();\n  db.tokens.set(token, user.id);\n  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });\n});\n\n// Login\napp.post('/api/auth/login', (req, res) => {\n  const { email, password } = req.body;\n  const user = db.users.find(u => u.email === email && u.password === password);\n  if (!user) return res.status(401).json({ error: 'Invalid credentials' });\n  const token = generateToken();\n  db.tokens.set(token, user.id);\n  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });\n});\n\n// Me\napp.get('/api/auth/me', authenticate, (req, res) => {\n  const user = db.users.find(u => u.id === req.userId);\n  if (!user) return res.status(404).json({ error: 'User not found' });\n  res.json({ id: user.id, email: user.email, name: user.name });\n});\n\n// ══════ ITEMS CRUD ══════\n\n// List (public, with pagination & filtering)\napp.get('/api/items', (req, res) => {\n  let items = [...db.items];\n  if (req.query.category) items = items.filter(i => i.category === req.query.category);\n  if (req.query.search) items = items.filter(i => i.name.toLowerCase().includes(req.query.search.toLowerCase()));\n  if (req.query.sort) { const [field, dir] = req.query.sort.split(':'); items.sort((a, b) => dir === 'desc' ? (b[field] > a[field] ? 1 : -1) : (a[field] > b[field] ? 1 : -1)); }\n  const page = parseInt(req.query.page) || 1;\n  const limit = Math.min(parseInt(req.query.limit) || 20, 100);\n  const start = (page - 1) * limit;\n  res.json({ data: items.slice(start, start + limit), total: items.length, page, limit, pages: Math.ceil(items.length / limit) });\n});\n\n// Get by ID\napp.get('/api/items/:id', (req, res) => {\n  const item = db.items.find(i => i.id === req.params.id);\n  if (!item) return res.status(404).json({ error: 'Not found' });\n  res.json(item);\n});\n\n// Create (auth required)\napp.post('/api/items', authenticate, (req, res) => {\n  const { name, price, category, stock } = req.body;\n  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });\n  const item = { id: generateId(), name, price: parseFloat(price), category: category || 'general', stock: parseInt(stock) || 0, created_at: new Date().toISOString(), created_by: req.userId };\n  db.items.push(item);\n  res.status(201).json(item);\n});\n\n// Update\napp.put('/api/items/:id', authenticate, (req, res) => {\n  const idx = db.items.findIndex(i => i.id === req.params.id);\n  if (idx === -1) return res.status(404).json({ error: 'Not found' });\n  db.items[idx] = { ...db.items[idx], ...req.body, id: req.params.id, updated_at: new Date().toISOString() };\n  res.json(db.items[idx]);\n});\n\n// Delete\napp.delete('/api/items/:id', authenticate, (req, res) => {\n  const idx = db.items.findIndex(i => i.id === req.params.id);\n  if (idx === -1) return res.status(404).json({ error: 'Not found' });\n  db.items.splice(idx, 1);\n  res.status(204).send();\n});\n\n// ══════ HEALTH ══════\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), items: db.items.length, users: db.users.length });\n});\n\n// ══════ API DOCS ══════\napp.get('/api', (req, res) => {\n  res.json({\n    name: 'REST API Server',\n    version: '1.0.0',\n    endpoints: {\n      'POST /api/auth/register': 'Register user { email, password, name }',\n      'POST /api/auth/login': 'Login { email, password } → { token }',\n      'GET /api/auth/me': 'Get current user (auth)',\n      'GET /api/items': 'List items (?category, ?search, ?sort, ?page, ?limit)',\n      'GET /api/items/:id': 'Get item',\n      'POST /api/items': 'Create item (auth) { name, price, category, stock }',\n      'PUT /api/items/:id': 'Update item (auth)',\n      'DELETE /api/items/:id': 'Delete item (auth)',\n      'GET /api/health': 'Health check',\n    }\n  });\n});\n\napp.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));\nconsole.log('Server template ready - install express to run: npm i express cors');" },
      { name: "package.json", language: "json", content: "{\n  \"name\": \"rest-api-server\",\n  \"version\": \"1.0.0\",\n  \"description\": \"RESTful API with auth, CRUD, rate limiting\",\n  \"main\": \"server.js\",\n  \"scripts\": {\n    \"start\": \"node server.js\",\n    \"dev\": \"node --watch server.js\"\n  },\n  \"dependencies\": {\n    \"express\": \"^4.18.0\",\n    \"cors\": \"^2.8.5\"\n  }\n}" },
      { name: ".env", language: "plaintext", content: "PORT=3000\nJWT_SECRET=your-secret-key-here\nNODE_ENV=development" },
      { name: "README.md", language: "markdown", content: "# REST API Server\\n\\n## Quick Start\\n```bash\\nnpm install\\nnpm start\\n```\\n\\n## Endpoints\\n\\n### Auth\\n- `POST /api/auth/register` - Register\\n- `POST /api/auth/login` - Login\\n- `GET /api/auth/me` - Current user (auth)\\n\\n### Items\\n- `GET /api/items` - List (with ?category, ?search, ?sort, ?page)\\n- `POST /api/items` - Create (auth required)\\n- `PUT /api/items/:id` - Update (auth)\\n- `DELETE /api/items/:id` - Delete (auth)\\n\\n### Health\\n- `GET /api/health` - Health check\\n- `GET /api` - API documentation\\n\\n## Auth\\nUse `Authorization: Bearer <token>` header for protected routes.\\n\\n## Rate Limiting\\n100 requests per minute per IP." }
    ],
  },
];

// AI assist actions for context menu
const AI_ACTIONS = [
  { id: "explain", label: "Explain Code", icon: "💡", prompt: "Explain this code in detail, line by line:" },
  { id: "refactor", label: "Refactor", icon: "♻️", prompt: "Refactor this code for better readability and performance:" },
  { id: "optimize", label: "Optimize", icon: "⚡", prompt: "Optimize this code for better performance:" },
  { id: "fix", label: "Fix Bugs", icon: "🐛", prompt: "Find and fix any bugs in this code:" },
  { id: "test", label: "Write Tests", icon: "🧪", prompt: "Write comprehensive unit tests for this code:" },
  { id: "document", label: "Add Docs", icon: "📝", prompt: "Add JSDoc documentation comments to this code:" },
  { id: "convert", label: "Convert to TS", icon: "💎", prompt: "Convert this JavaScript code to TypeScript with proper types:" },
  { id: "security", label: "Security Check", icon: "🔒", prompt: "Review this code for security vulnerabilities and fix them:" },
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
  const [showExplorer, setShowExplorer] = useState(false);
  const [outputPanel, setOutputPanel] = useState<"console" | "preview" | "terminal">("preview");
  const [theme, setTheme] = useState("vs-dark");
  const [previewHtml, setPreviewHtml] = useState("");
  const [viewportPreset, setViewportPreset] = useState("desktop");
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!initialCode);
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showAIMenu, setShowAIMenu] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const terminalInputRef = useRef<HTMLInputElement>(null);

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

  const runAIAction = useCallback(async (instruction: string, isCodeAction = true) => {
    if (!activeFile) return;

    setIsAIAssisting(true);
    setShowAIMenu(false);
    addLog("system", `🤖 AI: "${instruction}"`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const systemPrompt = isCodeAction
        ? `You are a code assistant inside an IDE. The user is editing a ${activeFile.language} file named "${activeFile.name}". Respond ONLY with the updated code. No explanations, no markdown fences. Just the raw code.`
        : `You are a code assistant. The user is editing a ${activeFile.language} file named "${activeFile.name}". Provide a clear, helpful explanation.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${instruction}\n\n${activeFile.content}` },
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

      let cleanResult = result.trim();
      const fenceMatch = cleanResult.match(/^```\w*\n([\s\S]*)\n```$/);
      if (fenceMatch) cleanResult = fenceMatch[1];

      if (isCodeAction && cleanResult) {
        updateFileContent(activeFile.id, cleanResult);
        addLog("system", "✅ AI code applied successfully");
        toast({ title: "AI code applied" });
      } else if (cleanResult) {
        addLog("info", cleanResult);
        setOutputPanel("console");
        toast({ title: "AI response ready — see console" });
      }
    } catch (error) {
      addLog("error", `AI failed: ${error instanceof Error ? error.message : "Unknown"}`);
      toast({ title: "AI assist failed", variant: "destructive" });
    } finally {
      setIsAIAssisting(false);
    }
  }, [activeFile, addLog, updateFileContent, toast]);

  const handleAIAssist = useCallback(async () => {
    if (!activeFile) return;
    const instruction = prompt("What should the AI do with this code?");
    if (!instruction) return;
    runAIAction(instruction);
  }, [activeFile, runAIAction]);

  // ─── Terminal Emulator ────────────────────────────────────────────────────

  const handleTerminalCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    
    setTerminalHistory(prev => [...prev, `$ ${trimmed}`]);
    
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "help":
        setTerminalHistory(prev => [...prev, "Available commands: ls, cat, touch, rm, clear, echo, pwd, whoami, date, node, npm, help"]);
        break;
      case "ls":
        setTerminalHistory(prev => [...prev, files.map(f => f.name).join("  ")]);
        break;
      case "cat":
        const file = files.find(f => f.name === args[0]);
        if (file) setTerminalHistory(prev => [...prev, file.content.slice(0, 500) + (file.content.length > 500 ? "\n..." : "")]);
        else setTerminalHistory(prev => [...prev, `cat: ${args[0]}: No such file`]);
        break;
      case "touch": {
        if (args[0]) {
          const lang = LANG_MAP[args[0].split(".").pop() || ""] || "plaintext";
          const newFile = createFile(args[0], lang, `// ${args[0]}\n`);
          setFiles(prev => [...prev, newFile]);
          setTerminalHistory(prev => [...prev, `Created ${args[0]}`]);
        } else setTerminalHistory(prev => [...prev, "Usage: touch <filename>"]);
        break;
      }
      case "rm": {
        if (args[0]) {
          const target = files.find(f => f.name === args[0]);
          if (target && files.length > 1) {
            closeFile(target.id);
            setTerminalHistory(prev => [...prev, `Removed ${args[0]}`]);
          } else if (!target) setTerminalHistory(prev => [...prev, `rm: ${args[0]}: No such file`]);
          else setTerminalHistory(prev => [...prev, "Cannot remove the last file"]);
        }
        break;
      }
      case "clear":
        setTerminalHistory([]);
        break;
      case "echo":
        setTerminalHistory(prev => [...prev, args.join(" ")]);
        break;
      case "pwd":
        setTerminalHistory(prev => [...prev, "/home/shadowtalk/project"]);
        break;
      case "whoami":
        setTerminalHistory(prev => [...prev, "shadowtalk-developer"]);
        break;
      case "date":
        setTerminalHistory(prev => [...prev, new Date().toString()]);
        break;
      case "node":
      case "npm":
        setTerminalHistory(prev => [...prev, `${command}: Use the Run button (Ctrl+S) to execute code in the browser`]);
        break;
      default:
        setTerminalHistory(prev => [...prev, `${command}: command not found. Type 'help' for available commands.`]);
    }
  }, [files, closeFile]);

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
          {/* AI Assist with dropdown */}
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={handleAIAssist} disabled={isAIAssisting} className="h-7 px-2 gap-1 text-xs">
              {isAIAssisting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              <span className="hidden sm:inline">AI</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAIMenu(!showAIMenu)} className="h-7 px-1 text-xs">
              <ChevronDown className="h-3 w-3" />
            </Button>
            <AnimatePresence>
              {showAIMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 w-48 py-1"
                >
                  {AI_ACTIONS.map(action => (
                    <button
                      key={action.id}
                      onClick={() => runAIAction(action.prompt, action.id !== "explain")}
                      disabled={isAIAssisting}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left"
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
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
          <ResizablePanel defaultSize={showExplorer ? 40 : 50} minSize={25}>
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
          <ResizablePanel defaultSize={showExplorer ? 45 : 50} minSize={20}>
            <div className="h-full flex flex-col">
              <Tabs value={outputPanel} onValueChange={v => setOutputPanel(v as "console" | "preview" | "terminal")} className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
                  <TabsList className="h-7">
                    <TabsTrigger value="preview" className="text-xs gap-1 h-6 px-2">
                      <Eye className="h-3 w-3" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="console" className="text-xs gap-1 h-6 px-2">
                      <Bug className="h-3 w-3" /> Console
                      {consoleLogs.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">{consoleLogs.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="terminal" className="text-xs gap-1 h-6 px-2">
                      <Terminal className="h-3 w-3" /> Terminal
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
                    <Button variant="ghost" size="sm" onClick={() => { clearConsole(); setPreviewHtml(""); setTerminalHistory([]); }} className="h-6 px-2">
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
                          <Bug className="h-10 w-10 mx-auto mb-3 opacity-30" />
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

                <TabsContent value="terminal" className="flex-1 m-0 overflow-hidden flex flex-col">
                  <ScrollArea className="flex-1 bg-zinc-950">
                    <div className="p-3 font-mono text-xs space-y-0.5">
                      <div className="text-emerald-400 mb-2">ShadowTalk Terminal v1.0 — Type 'help' for commands</div>
                      {terminalHistory.map((line, i) => (
                        <div key={i} className={cn("px-1", line.startsWith("$") ? "text-sky-400" : "text-foreground/80")}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-zinc-950 font-mono text-xs">
                    <span className="text-emerald-400 shrink-0">$</span>
                    <input
                      ref={terminalInputRef}
                      value={terminalInput}
                      onChange={e => setTerminalInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleTerminalCommand(terminalInput);
                          setTerminalInput("");
                        }
                      }}
                      placeholder="Type a command..."
                      className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                      autoComplete="off"
                    />
                  </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROJECT_TEMPLATES.map(template => {
                  const icons: Record<string, string> = { blank: "📄", react: "⚛️", dashboard: "📊", landing: "🚀", saas: "💼", ecommerce: "🛒", portfolio: "🎨", api: "🔌" };
                  return (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template.id)}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all group"
                    >
                      <div className="text-2xl mb-2">{icons[template.id] || "📄"}</div>
                      <p className="font-medium text-sm">{template.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{template.files.length} file{template.files.length > 1 ? "s" : ""}</p>
                    </button>
                  );
                })}
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
