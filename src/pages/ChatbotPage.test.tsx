import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import ChatbotPage from './ChatbotPage';

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

vi.mock('@/hooks/useE2EE', () => ({
  useE2EE: () => ({
    isUnlocked: true,
    isEncrypted: () => false,
    unlock: vi.fn().mockResolvedValue(true),
    encryptData: vi.fn(),
    decryptData: vi.fn(),
    unwrapEncrypted: vi.fn(),
    wrapEncrypted: vi.fn(),
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
