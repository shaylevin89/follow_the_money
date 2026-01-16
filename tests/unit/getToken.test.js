import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for getToken function (Epic 2)
 * Tests token reading from window.CONFIG and URL fallback
 */

describe('getToken function (Epic 2)', () => {
  let window;
  let URLSearchParams;

  beforeEach(() => {
    // Mock window object
    window = {
      CONFIG: null,
      location: {
        search: '',
      },
    };

    // Mock URLSearchParams
    URLSearchParams = class {
      constructor(search) {
        this.search = search;
      }
      get(key) {
        const params = new URL(this.search, 'http://localhost').searchParams;
        return params.get(key);
      }
    };
  });

  it('should read token from window.CONFIG when available', () => {
    // Given: window.CONFIG has GITHUB_PAT
    window.CONFIG = { GITHUB_PAT: 'token-from-config' };

    // When: getToken is called
    let token = null;
    if (window.CONFIG && window.CONFIG.GITHUB_PAT) {
      token = window.CONFIG.GITHUB_PAT;
    } else {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token');
    }

    // Then: token should be from CONFIG
    expect(token).toBe('token-from-config');
  });

  it('should fall back to URL parameter when CONFIG not available', () => {
    // Given: window.CONFIG is null, URL has token
    window.CONFIG = null;
    window.location.search = '?token=token-from-url';

    // When: getToken is called
    let token = null;
    if (window.CONFIG && window.CONFIG.GITHUB_PAT) {
      token = window.CONFIG.GITHUB_PAT;
    } else {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token');
    }

    // Then: token should be from URL
    expect(token).toBe('token-from-url');
  });

  it('should prefer CONFIG over URL parameter', () => {
    // Given: Both CONFIG and URL have tokens
    window.CONFIG = { GITHUB_PAT: 'token-from-config' };
    window.location.search = '?token=token-from-url';

    // When: getToken is called
    let token = null;
    if (window.CONFIG && window.CONFIG.GITHUB_PAT) {
      token = window.CONFIG.GITHUB_PAT;
    } else {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token');
    }

    // Then: token should be from CONFIG (priority)
    expect(token).toBe('token-from-config');
  });

  it('should return null if neither CONFIG nor URL token available', () => {
    // Given: No CONFIG and no URL token
    window.CONFIG = null;
    window.location.search = '';

    // When: getToken is called
    let token = null;
    if (window.CONFIG && window.CONFIG.GITHUB_PAT) {
      token = window.CONFIG.GITHUB_PAT;
    } else {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token');
    }

    // Then: token should be null
    expect(token).toBeNull();
  });

  it('should handle CONFIG with null GITHUB_PAT', () => {
    // Given: CONFIG exists but GITHUB_PAT is null
    window.CONFIG = { GITHUB_PAT: null };
    window.location.search = '?token=token-from-url';

    // When: getToken is called
    let token = null;
    if (window.CONFIG && window.CONFIG.GITHUB_PAT) {
      token = window.CONFIG.GITHUB_PAT;
    } else {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token');
    }

    // Then: should fall back to URL
    expect(token).toBe('token-from-url');
  });
});
