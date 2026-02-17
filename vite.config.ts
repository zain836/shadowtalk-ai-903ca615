import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Use environment variables with fallbacks for both dev and prod
  // Lovable Cloud auto-injects these at build time
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://axsudmhjpfzffcicfvuj.supabase.co';
  const supabaseAnon = env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4c3VkbWhqcGZ6ZmZjaWNmdnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzY2NTgsImV4cCI6MjA4MDg1MjY1OH0.Jdbo00BVo0QqChuZCxwHYwzdyJK4oBzCxelv1hILEZ4';
  
   const isProduction = mode === 'production';
 
  return {
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseAnon),
    },
     build: {
       // Production optimizations
       target: 'es2020',
       minify: isProduction ? 'esbuild' : false,
       sourcemap: isProduction ? 'hidden' : true,
       rollupOptions: {
         output: {
           // Chunk splitting for better caching
           manualChunks: {
             // Vendor chunks
             'react-vendor': ['react', 'react-dom', 'react-router-dom'],
             'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
             'query-vendor': ['@tanstack/react-query'],
             'chart-vendor': ['recharts'],
             // Feature chunks
             'monaco': ['@monaco-editor/react'],
           },
           // Asset naming for long-term caching
           assetFileNames: (assetInfo) => {
             const info = assetInfo.name?.split('.') || [];
             const ext = info[info.length - 1];
             if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
               return `assets/images/[name]-[hash][extname]`;
             }
             if (/woff2?|eot|ttf|otf/i.test(ext)) {
               return `assets/fonts/[name]-[hash][extname]`;
             }
             return `assets/[name]-[hash][extname]`;
           },
           chunkFileNames: 'assets/js/[name]-[hash].js',
           entryFileNames: 'assets/js/[name]-[hash].js',
         },
       },
       // Performance hints
       chunkSizeWarningLimit: 1000,
     },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
        manifest: {
          name: "ShadowTalk AI",
          short_name: "ShadowTalk",
          description: "Advanced AI chatbot with multimodal capabilities",
          theme_color: "#050508",
          background_color: "#050508",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ],
          categories: ["productivity", "utilities", "business"],
          shortcuts: [
            {
              name: "New Chat",
              short_name: "Chat",
              description: "Start a new conversation",
              url: "/chatbot",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
