// GitHub token storage. Accepts legacy ?token= URLs once, then scrubs them.

const TOKEN_KEY = 'ftm_github_token';

export function getToken({ storage, location, history }) {
  const stored = storage.getItem(TOKEN_KEY);
  if (stored) return stored;

  const params = new URLSearchParams(location.search || '');
  const urlToken = params.get('token');
  if (urlToken) {
    storage.setItem(TOKEN_KEY, urlToken);
    params.delete('token');
    const query = params.toString();
    const cleanUrl = `${location.pathname}${query ? `?${query}` : ''}${location.hash || ''}`;
    history.replaceState(null, '', cleanUrl);
    return urlToken;
  }
  return null;
}

export function setToken(storage, value) {
  storage.setItem(TOKEN_KEY, value);
}

export function clearToken(storage) {
  storage.removeItem(TOKEN_KEY);
}
