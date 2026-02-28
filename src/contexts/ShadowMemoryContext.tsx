import React, { createContext, useContext } from 'react';
import { useShadowMemory } from '@/hooks/useShadowMemory';

type ShadowMemoryContextType = ReturnType<typeof useShadowMemory>;

const ShadowMemoryContext = createContext<ShadowMemoryContextType | null>(null);

export const ShadowMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const memory = useShadowMemory();
  return <ShadowMemoryContext.Provider value={memory}>{children}</ShadowMemoryContext.Provider>;
};

export const useShadowMemoryContext = () => {
  const ctx = useContext(ShadowMemoryContext);
  if (!ctx) throw new Error('useShadowMemoryContext must be used within ShadowMemoryProvider');
  return ctx;
};
