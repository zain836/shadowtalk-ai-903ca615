import { useEffect } from "react";
import { useStealthKillSwitch } from "@/hooks/useStealthKillSwitch";

/** Global Ctrl+Shift+K (Cmd+Shift+K on macOS) toggles stealth kill switch. */
export function useStealthKeyboardShortcut(): void {
  const { toggleStealthMode, isLoading } = useStealthKillSwitch();

  useEffect(() => {
    if (isLoading) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || !e.shiftKey || e.key.toLowerCase() !== "k") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      e.preventDefault();
      toggleStealthMode();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleStealthMode, isLoading]);
}
