import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsageTracking } from './useUsageTracking';
import React from 'react';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    supabase: {
      from: vi.fn(() => ({ insert })),
    },
  };
});

// Mock AuthContext and useAuth
const mockUser = { id: 'test-user' };
const mockContextValue = {
  user: mockUser,
  userPlan: 'free',
  session: null,
  isLoading: false,
  signOut: vi.fn(),
  checkSubscription: vi.fn(),
  isOffline: false
};

vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockContextValue,
  AuthContext: {
    Provider: ({ children, value }: any) => <div data-testid="mock-provider">{children}</div>
  }
}));

describe('useUsageTracking', () => {
  it('tracks a chat message without throwing', async () => {
    const { result } = renderHook(() => useUsageTracking());

    await act(async () => {
      await result.current.trackChatMessage('general', 'Default', 42, false);
    });

    expect(true).toBe(true);
  });
});
