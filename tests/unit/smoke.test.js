import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import TokenGate from '../../src/lib/components/TokenGate.svelte';

const children = createRawSnippet(() => ({
  render: () => '<p>app content</p>',
}));

describe('TokenGate', () => {
  it('shows the token form when there is no token', () => {
    render(TokenGate, { hasToken: false, onsave: vi.fn(), children });
    expect(screen.getByText('Connect to GitHub')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('renders children when a token exists', () => {
    render(TokenGate, { hasToken: true, onsave: vi.fn(), children });
    expect(screen.getByText('app content')).toBeInTheDocument();
  });

  it('submits the entered token', async () => {
    const onsave = vi.fn();
    render(TokenGate, { hasToken: false, onsave, children });
    await userEvent.type(screen.getByLabelText(/personal access token/i), 'ghp_test');
    await userEvent.click(screen.getByRole('button', { name: /save token/i }));
    expect(onsave).toHaveBeenCalledWith('ghp_test');
  });
});
