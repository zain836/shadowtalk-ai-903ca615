import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import ChatbotPage from './ChatbotPage';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { keys: [] }, error: null }) },
  },
}));

vi.mock('@/hooks/useOfflineAuth', () => ({
  useOfflineAuth: () => ({
    getOfflineSession: () => null,
  }),
}));

vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', user_metadata: {} },
    userPlan: 'free',
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
    loading: false,
    isOffline: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ChatbotPage', () => {
  it('renders main chat layout without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <ChatbotPage />
      </MemoryRouter>,
    );

    expect(container).toBeTruthy();
  });
});
