import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUserNotifications, type UserNotification } from "@/hooks/useUserNotifications";
import {
  type AppUpdateRow,
  getLastSeenUpdateId,
  markUpdateSeen,
  hasBeenPromptedForUpdates,
  setPromptedForUpdates,
} from "@/lib/updateNotifications";

function showUpdateToast(
  title: string,
  message: string,
  actionUrl: string | null,
  navigate: ReturnType<typeof useNavigate>,
  sendBrowserNotif: (title: string, opts?: NotificationOptions) => Notification | null,
) {
  const preview = message.length > 140 ? `${message.slice(0, 140)}…` : message;

  toast(title, {
    description: preview,
    duration: 12000,
    action: actionUrl
      ? {
          label: "View",
          onClick: () => navigate(actionUrl),
        }
      : undefined,
  });

  sendBrowserNotif(title, {
    body: preview,
    tag: `shadowtalk-update-${title}`,
    requireInteraction: false,
  });
}

export function useUpdateNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { permission, requestPermission, sendNotification } = usePushNotifications();
  const { notifications } = useUserNotifications();
  const seenNotifIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const handleGuestUpdates = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_updates")
      .select("id, source, version, title, message, action_url, published_at")
      .order("published_at", { ascending: false })
      .limit(1);

    if (error || !data?.length) return;

    const latest = data[0] as AppUpdateRow;
    const lastSeen = getLastSeenUpdateId();
    if (lastSeen === latest.id) return;

    markUpdateSeen(latest.id);
    showUpdateToast(
      latest.title,
      latest.message,
      latest.action_url ?? "/changelog",
      navigate,
      sendNotification,
    );
  }, [navigate, sendNotification]);

  // Guest + fallback poll for public update feed
  useEffect(() => {
    handleGuestUpdates();
    const interval = setInterval(handleGuestUpdates, 90_000);
    return () => clearInterval(interval);
  }, [handleGuestUpdates]);

  // Soft prompt for browser notifications once
  useEffect(() => {
    if (!user || hasBeenPromptedForUpdates() || permission !== "default") return;
    const t = window.setTimeout(() => {
      setPromptedForUpdates();
      requestPermission();
    }, 8000);
    return () => window.clearTimeout(t);
  }, [user, permission, requestPermission]);

  // Seed existing notifications so we only toast new arrivals
  useEffect(() => {
    if (!user || initialized.current) return;
    const seed = () => {
      notifications.forEach((n) => seenNotifIds.current.add(n.id));
      initialized.current = true;
    };
    const t = window.setTimeout(seed, 2000);
    return () => window.clearTimeout(t);
  }, [user, notifications]);

  // Realtime: show toast when new in-app notification arrives
  useEffect(() => {
    if (!user || !initialized.current) return;

    const fresh = notifications.filter((n) => !seenNotifIds.current.has(n.id) && !n.is_read);
    fresh.forEach((n: UserNotification) => {
      seenNotifIds.current.add(n.id);
      if (n.type === "update" || n.type === "announcement" || n.metadata?.auto) {
        showUpdateToast(n.title, n.message, n.action_url, navigate, sendNotification);
        if (n.metadata?.source_id) {
          markUpdateSeen(String(n.metadata.source_id));
        }
      }
    });
  }, [notifications, user, navigate, sendNotification]);

  // PWA / service worker new version
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const notifyRefresh = () => {
      toast("Update available", {
        description: "A new version of ShadowTalk is ready. Refresh to get the latest features.",
        duration: 0,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
      sendNotification("ShadowTalk update ready", {
        body: "Refresh the page to install the latest version.",
        tag: "pwa-update",
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (sessionStorage.getItem("shadowtalk-sw-reloading") === "1") return;
      notifyRefresh();
    });

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            notifyRefresh();
          }
        });
      });
    });
  }, [sendNotification]);
}
