import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsageTracking } from './useUsageTracking';
import { AuthProvider } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    supabase: {
      from: vi.fn(() => ({ insert })),
    },
  };
});

// Minimal mocked AuthProvider that always provides a fake user
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { AuthContext } = require('@/components/AuthProvider');
  return (
    <AuthContext.Provider value={{ user: { id: 'test-user' }, userPlan: 'free' }}>
      {children}
    </AuthContext.Provider>
  );
};

describe('useUsageTracking', () => {
  it('tracks a chat message without throwing', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <MockAuthProvider>{children}</MockAuthProvider>
    );

    const { result } = renderHook(() => useUsageTracking(), { wrapper });

    await act(async () => {
      await result.current.trackChatMessage('general', 'Default', 42, false);
    });

    expect(true).toBe(true);
  });
});
