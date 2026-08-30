import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import LoginGate from '../../src/lib/components/LoginGate.svelte';
import ChangePassword from '../../src/lib/components/ChangePassword.svelte';

const children = createRawSnippet(() => ({
  render: () => '<p>app content</p>',
}));

describe('LoginGate', () => {
  it('shows the login form when not authed', () => {
    render(LoginGate, {
      authed: false,
      mustChange: false,
      onlogin: vi.fn(),
      onchangepassword: vi.fn(),
      children,
    });
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('submits entered credentials via onlogin', async () => {
    const onlogin = vi.fn().mockResolvedValue();
    render(LoginGate, {
      authed: false,
      mustChange: false,
      onlogin,
      onchangepassword: vi.fn(),
      children,
    });

    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onlogin).toHaveBeenCalledWith('alice', 'secret123');
  });

  it('shows the rejection message and re-enables the form', async () => {
    const onlogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(LoginGate, {
      authed: false,
      mustChange: false,
      onlogin,
      onchangepassword: vi.fn(),
      children,
    });

    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
  });

  it('forces the change-password screen when mustChange is set', () => {
    render(LoginGate, {
      authed: true,
      mustChange: true,
      onlogin: vi.fn(),
      onchangepassword: vi.fn(),
      children,
    });
    expect(screen.getByText('Choose a new password')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('renders children when authed and not required to change password', () => {
    render(LoginGate, {
      authed: true,
      mustChange: false,
      onlogin: vi.fn(),
      onchangepassword: vi.fn(),
      children,
    });
    expect(screen.getByText('app content')).toBeInTheDocument();
  });
});

describe('ChangePassword', () => {
  it('rejects a new password shorter than 8 characters without calling onsubmit', async () => {
    const onsubmit = vi.fn();
    render(ChangePassword, { onsubmit, requireCurrent: false });

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'short');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(onsubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('rejects mismatched confirmation without calling onsubmit', async () => {
    const onsubmit = vi.fn();
    render(ChangePassword, { onsubmit, requireCurrent: false });

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'longenough1');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'longenough2');
    await userEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(onsubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
  });

  it('calls onsubmit with current and next password when valid', async () => {
    const onsubmit = vi.fn().mockResolvedValue();
    render(ChangePassword, { onsubmit, requireCurrent: true });

    await userEvent.type(screen.getByLabelText(/current password/i), 'oldpass1');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'longenough1');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'longenough1');
    await userEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(onsubmit).toHaveBeenCalledWith('oldpass1', 'longenough1');
  });

  it('shows the rejection message from onsubmit', async () => {
    const onsubmit = vi.fn().mockRejectedValue(new Error('Wrong current password'));
    render(ChangePassword, { onsubmit, requireCurrent: false });

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'longenough1');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'longenough1');
    await userEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText('Wrong current password')).toBeInTheDocument();
  });
});
