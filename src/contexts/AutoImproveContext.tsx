import { createContext, useContext, type ReactNode } from "react";
import { useAutoImprove } from "@/hooks/useAutoImprove";

type AutoImproveContextValue = ReturnType<typeof useAutoImprove>;

const AutoImproveContext = createContext<AutoImproveContextValue | null>(null);

export const AutoImproveProvider = ({ children }: { children: ReactNode }) => {
  const value = useAutoImprove();
  return <AutoImproveContext.Provider value={value}>{children}</AutoImproveContext.Provider>;
};

export const useAutoImproveContext = () => {
  const ctx = useContext(AutoImproveContext);
  if (!ctx) {
    throw new Error("useAutoImproveContext must be used within AutoImproveProvider");
  }
  return ctx;
};
