import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsageTracking } from './useUsageTracking';

vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    userPlan: 'free',
  }),
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
    const { result } = renderHook(() => useUsageTracking());

    await act(async () => {
      await result.current.trackChatMessage('general', 'Default', 42, false);
    });

    expect(true).toBe(true);
  });
});
