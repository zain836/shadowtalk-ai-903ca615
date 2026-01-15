import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ChatbotPage from './ChatbotPage';
import { AuthProvider } from '@/components/AuthProvider';

// Simple smoke test to ensure the main chat experience renders without throwing.
describe('ChatbotPage', () => {
  it('renders main chat layout without crashing', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ChatbotPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Look for a couple of stable UI elements
    expect(screen.getByText(/ShadowTalk/i)).toBeInTheDocument();
  });
});
