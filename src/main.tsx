import { createRoot } from "react-dom/client";
import "./index.css";

// ShadowTalk AI - Pre-flight environment check
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if environment variables are available
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[ShadowTalk] Missing environment variables:', {
    VITE_SUPABASE_URL: !!SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: !!SUPABASE_KEY
  });
  
  // Show a user-friendly error message
  const root = document.getElementById("root")!;
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #050508 0%, #0a0a12 100%);
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
    ">
      <div style="
        max-width: 400px;
        text-align: center;
        color: white;
      ">
        <div style="
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s ease-in-out infinite;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">
          Loading ShadowTalk AI...
        </h1>
        <p style="color: #9ca3af; margin-bottom: 24px;">
          The application is initializing. If this takes too long, try refreshing the page.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
          "
          onmouseover="this.style.opacity='0.9'"
          onmouseout="this.style.opacity='1'"
        >
          Refresh Page
        </button>
        <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
          If the problem persists, please try clearing your browser cache.
        </p>
      </div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    </style>
  `;
} else {
  // Environment is ready, load the app
  import("./App.tsx").then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(<App />);
  }).catch((error) => {
    console.error('[ShadowTalk] Failed to load app:', error);
    const root = document.getElementById("root")!;
    root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #050508;
        color: white;
        font-family: system-ui;
        padding: 20px;
        text-align: center;
      ">
        <div>
          <h1 style="margin-bottom: 16px;">Something went wrong</h1>
          <p style="color: #9ca3af; margin-bottom: 24px;">Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" style="
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
          ">Refresh</button>
        </div>
      </div>
    `;
  });
}
