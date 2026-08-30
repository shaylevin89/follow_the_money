// D1-backed API client. All network access goes through the injectable fetchFn.

export class AuthError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthError';
  }
}

export function createApiClient({ fetchFn = fetch } = {}) {
  async function request(path, { method = 'GET', body } = {}) {
    const options = { method, credentials: 'same-origin' };
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetchFn(path, options);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new AuthError(errBody.error || 'Not authenticated');
      }
      throw new Error(errBody.error || res.statusText);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  return {
    me() {
      return request('/api/me');
    },

    login(username, password) {
      return request('/api/login', { method: 'POST', body: { username, password } });
    },

    logout() {
      return request('/api/logout', { method: 'POST' });
    },

    changePassword(current, next) {
      return request('/api/password', { method: 'POST', body: { current, next } });
    },

    loadPortfolio() {
      return request('/api/portfolio');
    },

    createAsset(fields) {
      return request('/api/assets', { method: 'POST', body: fields });
    },

    patchAsset(id, fields) {
      return request(`/api/assets/${id}`, { method: 'PATCH', body: fields });
    },

    deleteAsset(id) {
      return request(`/api/assets/${id}`, { method: 'DELETE' });
    },

    postUpdates(items) {
      return request('/api/updates', { method: 'POST', body: items });
    },

    addType(name, exclude = false) {
      return request('/api/types', {
        method: 'POST',
        body: { name, exclude_periodical_profit: exclude },
      });
    },

    patchType(name, fields) {
      return request(`/api/types/${name}`, { method: 'PATCH', body: fields });
    },
  };
}
