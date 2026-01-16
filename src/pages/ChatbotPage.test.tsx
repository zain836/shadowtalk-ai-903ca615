import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import ChatbotPage from './ChatbotPage';
import { AuthProvider } from '@/components/AuthProvider';

// Simple smoke test to ensure the main chat experience renders without throwing.
describe('ChatbotPage', () => {
  it('renders main chat layout without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <ChatbotPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Check that the component renders without crashing
    expect(container).toBeTruthy();
  });
});
