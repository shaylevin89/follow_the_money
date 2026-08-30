import { describe, it, expect, vi } from 'vitest';
import { createApiClient, AuthError } from '../../src/lib/data/api.js';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('createApiClient', () => {
  it('me() GETs /api/me with credentials and returns the body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ username: 'a', mustChangePassword: false }));
    const api = createApiClient({ fetchFn });
    const result = await api.me();
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' })
    );
    expect(result).toEqual({ username: 'a', mustChangePassword: false });
  });

  it('login() POSTs username/password as JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true, mustChangePassword: true }));
    const api = createApiClient({ fetchFn });
    const result = await api.login('bob', 'secret');
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username: 'bob', password: 'secret' }),
      })
    );
    expect(result).toEqual({ ok: true, mustChangePassword: true });
  });

  it('login() 401 rejects with AuthError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: 'Invalid username or password' }, 401));
    const api = createApiClient({ fetchFn });
    await expect(api.login('bob', 'wrong')).rejects.toBeInstanceOf(AuthError);
  });

  it('logout() POSTs to /api/logout', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const api = createApiClient({ fetchFn });
    await api.logout();
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/logout',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' })
    );
  });

  it('changePassword() POSTs current/next to /api/password', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const api = createApiClient({ fetchFn });
    await api.changePassword('old', 'newpassword');
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/password',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ current: 'old', next: 'newpassword' }),
      })
    );
  });

  it('loadPortfolio() GETs /api/portfolio and returns investments/metadata', async () => {
    const body = { investments: [{ id: '1' }], metadata: { investment_types: [] } };
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(body));
    const api = createApiClient({ fetchFn });
    const result = await api.loadPortfolio();
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/portfolio',
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' })
    );
    expect(result).toEqual(body);
  });

  it('loadPortfolio() 401 rejects with AuthError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: 'Not authenticated' }, 401));
    const api = createApiClient({ fetchFn });
    await expect(api.loadPortfolio()).rejects.toBeInstanceOf(AuthError);
  });

  it('createAsset() POSTs fields to /api/assets and returns the investment', async () => {
    const investment = { id: '123', name: 'New' };
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(investment));
    const api = createApiClient({ fetchFn });
    const fields = { name: 'New', initial_amount: 500 };
    const result = await api.createAsset(fields);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/assets',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify(fields),
      })
    );
    expect(result).toEqual(investment);
  });

  it('patchAsset() PATCHes /api/assets/:id with fields', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const api = createApiClient({ fetchFn });
    await api.patchAsset('42', { name: 'Renamed' });
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/assets/42',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'same-origin',
        body: JSON.stringify({ name: 'Renamed' }),
      })
    );
  });

  it('deleteAsset() DELETEs /api/assets/:id', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const api = createApiClient({ fetchFn });
    await api.deleteAsset('42');
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/assets/42',
      expect.objectContaining({ method: 'DELETE', credentials: 'same-origin' })
    );
  });

  it('postUpdates() POSTs the items array to /api/updates', async () => {
    const items = [{ asset_id: '1', date: '2024-01-01', amount: 100 }];
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ inserted: 1 }));
    const api = createApiClient({ fetchFn });
    const result = await api.postUpdates(items);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/updates',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify(items),
      })
    );
    expect(result).toEqual({ inserted: 1 });
  });

  it('addType() POSTs name/exclude to /api/types', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ name: 'gold', exclude_periodical_profit: true }));
    const api = createApiClient({ fetchFn });
    await api.addType('gold', true);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/types',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ name: 'gold', exclude_periodical_profit: true }),
      })
    );
  });

  it('patchType() PATCHes /api/types/:name with fields', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const api = createApiClient({ fetchFn });
    await api.patchType('gold', { exclude_periodical_profit: false });
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/types/gold',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'same-origin',
        body: JSON.stringify({ exclude_periodical_profit: false }),
      })
    );
  });

  it('propagates the server error message for non-401 failures', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: 'Name is required' }, 400));
    const api = createApiClient({ fetchFn });
    await expect(api.addType('', false)).rejects.toThrow('Name is required');
  });

  it('falls back to statusText when body has no error field', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('not json');
      },
    });
    const api = createApiClient({ fetchFn });
    await expect(api.loadPortfolio()).rejects.toThrow('Internal Server Error');
  });
});
