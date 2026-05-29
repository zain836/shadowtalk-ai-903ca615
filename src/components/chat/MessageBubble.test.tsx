import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('MessageBubble', () => {
  const baseProps = {
    message: {
      id: 'm1',
      type: 'ai' as const,
      content: 'Hello from ShadowTalk',
      timestamp: new Date(),
    },
    index: 0,
    isLoading: false,
    userPlan: 'free',
    speakingMessageId: null,
    isSpeaking: false,
    onEdit: vi.fn(),
    onRegenerate: vi.fn(),
    onTextToSpeech: vi.fn(),
    onOpenCodeCanvas: vi.fn(),
  };

  it('renders with layout shadow-pulse without throwing', () => {
    const { container } = render(
      <MessageBubble {...baseProps} layout="shadow-pulse" />,
    );
    expect(container.textContent).toContain('Hello from ShadowTalk');
  });

  it('supports legacy variant=neural without isNeural ReferenceError', () => {
    const { container } = render(
      <MessageBubble {...baseProps} variant="neural" />,
    );
    expect(container.textContent).toContain('Hello from ShadowTalk');
  });
});
