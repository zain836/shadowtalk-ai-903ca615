import { useStealthKeyboardShortcut } from "@/hooks/useStealthKeyboardShortcut";

/** Mount inside StealthKillSwitchProvider to register global stealth shortcut. */
export function StealthKeyboardListener() {
  useStealthKeyboardShortcut();
  return null;
}
