 import { useState, useEffect, useCallback } from "react";
 import { App } from "@capacitor/app";
 import { useToast } from "./use-toast";
 
 // Android intent types for deep-linking and app launching
 export interface AndroidIntent {
   action: string;
   package?: string;
   data?: string;
   extras?: Record<string, unknown>;
 }
 
 export interface AppLaunchConfig {
   packageName: string;
   displayName: string;
   action?: string;
   data?: string;
 }
 
 // Common Android apps with their package names
 export const COMMON_APPS: AppLaunchConfig[] = [
   { packageName: "com.google.android.gm", displayName: "Gmail" },
   { packageName: "com.google.android.calendar", displayName: "Calendar" },
   { packageName: "com.google.android.apps.maps", displayName: "Maps" },
   { packageName: "com.whatsapp", displayName: "WhatsApp" },
   { packageName: "com.android.chrome", displayName: "Chrome" },
   { packageName: "com.google.android.youtube", displayName: "YouTube" },
   { packageName: "com.google.android.apps.photos", displayName: "Photos" },
   { packageName: "com.google.android.apps.docs", displayName: "Drive" },
   { packageName: "com.spotify.music", displayName: "Spotify" },
   { packageName: "com.twitter.android", displayName: "Twitter/X" },
   { packageName: "com.instagram.android", displayName: "Instagram" },
   { packageName: "com.linkedin.android", displayName: "LinkedIn" },
   { packageName: "com.slack", displayName: "Slack" },
   { packageName: "us.zoom.videomeetings", displayName: "Zoom" },
   { packageName: "com.microsoft.teams", displayName: "Teams" },
 ];
 
 export const useAndroidIntents = () => {
   const { toast } = useToast();
   const [isNativeApp, setIsNativeApp] = useState(false);
   const [pendingIntents, setPendingIntents] = useState<AndroidIntent[]>([]);
   
   // Check if running in Capacitor native context
   useEffect(() => {
     const checkNativeContext = async () => {
       try {
         // Check if Capacitor is available
         const isCapacitor = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
         setIsNativeApp(isCapacitor);
       } catch {
         setIsNativeApp(false);
       }
     };
     
     checkNativeContext();
   }, []);
   
   // Launch an app by package name
   const launchApp = useCallback(async (config: AppLaunchConfig): Promise<boolean> => {
     if (!isNativeApp) {
       // In web context, try to open web version or show instruction
       toast({
         title: `Open ${config.displayName}`,
         description: "App launching requires the ShadowTalk Android app. Opening web version...",
       });
       
       // Try to open web versions of common apps
       const webUrls: Record<string, string> = {
         "com.google.android.gm": "https://mail.google.com",
         "com.google.android.calendar": "https://calendar.google.com",
         "com.google.android.apps.maps": "https://maps.google.com",
         "com.google.android.youtube": "https://youtube.com",
         "com.google.android.apps.docs": "https://drive.google.com",
         "com.twitter.android": "https://twitter.com",
         "com.instagram.android": "https://instagram.com",
         "com.linkedin.android": "https://linkedin.com",
       };
       
       const webUrl = webUrls[config.packageName];
       if (webUrl) {
         window.open(webUrl, "_blank");
         return true;
       }
       
       return false;
     }
     
     // In native context, use Capacitor App plugin
     try {       
       // Try to open the app using its package URI
       const intentUri = config.data || `package:${config.packageName}`;
       
       // Use Capacitor Browser or a custom intent plugin
       // For basic URL launching, use App.getLaunchUrl as fallback indicator
       const launchUrl = await App.getLaunchUrl();
       console.log("Launch URL context:", launchUrl);
       
       // For now, open via web fallback in hybrid mode
       window.open(intentUri, "_system");
       
       toast({
         title: `Opening ${config.displayName}`,
         description: "Launching app...",
       });
       return true;
     } catch (error) {
       console.error("Failed to launch app:", error);
       toast({
         title: "App Launch Failed",
         description: `Could not open ${config.displayName}. It may not be installed.`,
         variant: "destructive",
       });
     }
     
     return false;
   }, [isNativeApp, toast]);
   
   // Send intent to native layer
   const sendIntent = useCallback(async (intent: AndroidIntent): Promise<boolean> => {
     if (!isNativeApp) {
       // Queue intent for when native is available
       setPendingIntents(prev => [...prev, intent]);
       console.log("Intent queued (not in native context):", intent);
       return false;
     }
     
       try {
       // Use Capacitor to send the intent
       // This would require a custom Capacitor plugin for full intent support
       console.log("Sending Android intent:", intent);
       
       // For basic URL/data intents, open via window
       if (intent.data) {
         window.open(intent.data, "_system");
         return true;
       }
       
       return false;
     } catch (error) {
       console.error("Failed to send intent:", error);
       return false;
     }
   }, [isNativeApp]);
   
   // Open WhatsApp with a specific contact
   const openWhatsApp = useCallback(async (phoneNumber?: string, message?: string): Promise<boolean> => {
     let url = "https://wa.me/";
     
     if (phoneNumber) {
       // Remove any non-numeric characters except +
       const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");
       url += cleanNumber;
     }
     
     if (message) {
       url += `?text=${encodeURIComponent(message)}`;
     }
     
     if (isNativeApp) {
       return launchApp({ packageName: "com.whatsapp", displayName: "WhatsApp", data: url });
     } else {
       window.open(url, "_blank");
       return true;
     }
   }, [isNativeApp, launchApp]);
   
   // Open Gmail compose
   const openGmailCompose = useCallback(async (to?: string, subject?: string, body?: string): Promise<boolean> => {
     const params = new URLSearchParams();
     if (to) params.set("to", to);
     if (subject) params.set("subject", subject);
     if (body) params.set("body", body);
     
     const url = `mailto:${to || ""}?${params.toString()}`;
     
     if (isNativeApp) {
       return launchApp({ packageName: "com.google.android.gm", displayName: "Gmail", data: url });
     } else {
       window.location.href = url;
       return true;
     }
   }, [isNativeApp, launchApp]);
   
   // Open calendar with event
   const openCalendar = useCallback(async (eventTitle?: string, startTime?: Date): Promise<boolean> => {
     if (isNativeApp) {
       return launchApp({ packageName: "com.google.android.calendar", displayName: "Calendar" });
     } else {
       const url = "https://calendar.google.com/calendar/render?action=TEMPLATE";
       const params = new URLSearchParams();
       if (eventTitle) params.set("text", eventTitle);
       if (startTime) params.set("dates", startTime.toISOString().replace(/[-:]/g, "").split(".")[0]);
       
       window.open(`${url}&${params.toString()}`, "_blank");
       return true;
     }
   }, [isNativeApp, launchApp]);
   
   // Open Maps with location
   const openMaps = useCallback(async (query: string): Promise<boolean> => {
     const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
     
     if (isNativeApp) {
       return launchApp({ packageName: "com.google.android.apps.maps", displayName: "Maps", data: url });
     } else {
       window.open(url, "_blank");
       return true;
     }
   }, [isNativeApp, launchApp]);
   
   return {
     isNativeApp,
     launchApp,
     sendIntent,
     openWhatsApp,
     openGmailCompose,
     openCalendar,
     openMaps,
     pendingIntents,
     COMMON_APPS,
   };
 };