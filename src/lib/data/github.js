// GitHub Contents API client. All network access goes through the injectable fetchFn.

export class ConflictError extends Error {
  constructor(message = 'data.json was modified elsewhere') {
    super(message);
    this.name = 'ConflictError';
  }
}

function encodeUtf8Base64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeUtf8Base64(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

export function createGithubClient({ owner, repo, path, token, fetchFn = fetch }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  async function load() {
    const res = await fetchFn(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to load ${path}: ${res.status}`);
    }
    const file = await res.json();
    let text;
    if (file.content) {
      text = decodeUtf8Base64(file.content);
    } else if (file.download_url) {
      // Contents API omits inline content for files >1MB.
      const raw = await fetchFn(file.download_url);
      if (!raw.ok) throw new Error(`Failed to download ${path}: ${raw.status}`);
      text = await raw.text();
    } else {
      throw new Error(`No content returned for ${path}`);
    }
    return { data: JSON.parse(text), sha: file.sha };
  }

  async function save(data, sha) {
    const res = await fetchFn(url, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update investment data',
        content: encodeUtf8Base64(JSON.stringify(data, null, 2)),
        sha,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 || (res.status === 422 && /sha/i.test(body.message || ''))) {
        throw new ConflictError();
      }
      throw new Error(body.message || `Failed to save ${path}: ${res.status}`);
    }
    const result = await res.json();
    return { sha: result.content?.sha };
  }

  return { load, save };
}
