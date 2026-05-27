import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import ChatbotPage from './ChatbotPage';
import React from 'react';

// Mock the components that might use Supabase or complex hooks
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    userPlan: 'free',
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
    isOffline: false
  }),
  AuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

// Mock heavy AI hooks
vi.mock('@/hooks/useSovereignAI', () => ({
  useSovereignAI: () => ({
    isReady: true,
    isLoading: false,
    availableModels: []
  })
}));

// Mock other components as needed
vi.mock('@/components/chat/ChatHeader', () => ({
  ChatHeader: () => <div data-testid="chat-header" />
}));

vi.mock('@/components/chat/ChatIconRail', () => ({
  ChatIconRail: () => <div data-testid="chat-icon-rail" />
}));

vi.mock('@/components/chat/ChatInput', () => ({
  ChatInput: () => <div data-testid="chat-input" />
}));

vi.mock('@/components/chat/ChatMessages', () => ({
  ChatMessages: () => <div data-testid="chat-messages" />
}));

vi.mock('@/components/chat/ConversationSidebar', () => ({
  ConversationSidebar: () => <div data-testid="conversation-sidebar" />
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
