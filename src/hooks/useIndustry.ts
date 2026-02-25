import { useState, useEffect, useCallback } from "react";
import { INDUSTRIES, type IndustryConfig } from "@/lib/industries";

const STORAGE_KEY = "shadowtalk-industry";

export const useIndustry = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = INDUSTRIES.find((i) => i.id === stored);
      if (found) setSelectedIndustry(found);
    }
    setIsLoaded(true);
  }, []);

  const selectIndustry = useCallback((id: string) => {
    const found = INDUSTRIES.find((i) => i.id === id);
    if (found) {
      setSelectedIndustry(found);
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const clearIndustry = useCallback(() => {
    setSelectedIndustry(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    selectedIndustry,
    selectIndustry,
    clearIndustry,
    isLoaded,
    allIndustries: INDUSTRIES,
  };
};
