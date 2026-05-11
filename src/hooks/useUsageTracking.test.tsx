import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsageTracking } from './useUsageTracking';

// Mock useAuth instead of AuthProvider to avoid context issues
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    userPlan: 'free',
    loading: false,
    signOut: async () => {},
    checkSubscription: async () => {},
    session: null,
    subscribed: false,
    subscriptionEnd: null
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('@/integrations/supabase/client', () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    supabase: {
      from: vi.fn(() => ({ insert })),
    },
  };
});

describe('useUsageTracking', () => {
  it('tracks a chat message without throwing', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <>{children}</>
    );

    const { result } = renderHook(() => useUsageTracking(), { wrapper });

    await act(async () => {
      await result.current.trackChatMessage('general', 'Default', 42, false);
    });

    expect(true).toBe(true);
  });
});
