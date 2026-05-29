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
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'conv-1', title: 'New Chat', created_at: new Date().toISOString() }, error: null }),
    })),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { keys: [] }, error: null }) },
  },
}));

vi.mock('@/contexts/AutoImproveContext', () => ({
  useAutoImproveContext: () => ({
    profile: {
      version: 1 as const,
      updatedAt: new Date(0).toISOString(),
      eventCount: 0,
      confidence: 0,
      topCategories: [],
      recentImprovements: [],
    },
    isLoading: false,
    capture: vi.fn(),
    captureChatSend: vi.fn(),
    runAnalysis: vi.fn(),
    getChatDefaults: () => null,
    applyChatDefaultsOnce: vi.fn(),
    pendingImprovements: [],
    dismissImprovementNotice: vi.fn(),
    clearLearning: vi.fn(),
    preferSeeRouting: false,
    learningEnabled: true,
  }),
}));

vi.mock('@/hooks/useOfflineAuth', () => ({
  useOfflineAuth: () => ({
    getOfflineSession: () => null,
  }),
}));

vi.mock('@/hooks/useOfflineChatHistory', () => ({
  useOfflineChatHistory: () => ({
    isReady: false,
    getCachedConversations: vi.fn().mockResolvedValue([]),
    getCachedMessages: vi.fn().mockResolvedValue([]),
    createConversation: vi.fn(),
    cacheMessage: vi.fn(),
    touchConversation: vi.fn(),
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
