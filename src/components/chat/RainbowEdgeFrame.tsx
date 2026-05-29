import { ReactNode } from "react";

/** Full-viewport animated rainbow border frame (Shadow Pulse) */
export function RainbowEdgeFrame({ children }: { children: ReactNode }) {
  return (
    <div className="shadow-pulse-shell min-h-screen bg-black relative overflow-hidden">
      <div className="shadow-pulse-rainbow-edges" aria-hidden />
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
