import { useUpdateNotifications } from "@/hooks/useUpdateNotifications";

/** Global listener for product updates, changelog broadcasts, and PWA refreshes */
export function UpdateNotificationProvider() {
  useUpdateNotifications();
  return null;
}
