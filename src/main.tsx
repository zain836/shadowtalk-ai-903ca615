 import { StrictMode } from "react";
 import { createRoot } from "react-dom/client";
 import { HelmetProvider } from "react-helmet-async";
 import App from "./App.tsx";
 import "./index.css";
 import { initPerformanceMonitoring, deferNonCritical } from "./lib/performance";
 
 // Environment validation
 const validateEnvironment = () => {
   const requiredVars = [
     'VITE_SUPABASE_URL',
     'VITE_SUPABASE_PUBLISHABLE_KEY',
   ];
   
   const missing = requiredVars.filter(
     (key) => !import.meta.env[key]
   );
   
   if (missing.length > 0 && import.meta.env.DEV) {
     console.warn(`[ENV] Missing environment variables: ${missing.join(', ')}`);
   }
 };
 
 // Initialize performance monitoring
 initPerformanceMonitoring();
 
 // Validate environment on startup
 validateEnvironment();
 
 // Report errors to console in production (can be extended to error tracking)
 if (import.meta.env.PROD) {
   window.addEventListener('error', (event) => {
     console.error('[Global Error]', event.error);
     // Future: Send to error tracking service
   });
   
   window.addEventListener('unhandledrejection', (event) => {
     console.error('[Unhandled Promise Rejection]', event.reason);
     // Future: Send to error tracking service
   });
 }
 
 // Defer non-critical initialization
 deferNonCritical(() => {
   // Register service worker for PWA
  const isLovablePreview = window.location.hostname.endsWith("lovableproject.com");
  if ("serviceWorker" in navigator && import.meta.env.PROD && !isLovablePreview) {
     navigator.serviceWorker.register('/sw.js').catch((err) => {
       console.warn('[SW] Registration failed:', err);
     });
   }
 });
 
 const container = document.getElementById("root");
 
 if (!container) {
   throw new Error("Root element not found. Check your index.html.");
 }
 
 createRoot(container).render(
   <StrictMode>
     <HelmetProvider>
       <App />
     </HelmetProvider>
   </StrictMode>
 );
