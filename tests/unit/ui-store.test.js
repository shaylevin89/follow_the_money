import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { view, navigate, initHistory } from '../../src/lib/stores/ui.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('navigate', () => {
  it('sets the view, scrolls to top, and pushes a history entry', () => {
    const scrollTo = vi.fn();
    const pushState = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('history', { pushState, replaceState: vi.fn() });

    navigate('assets', { foo: 1 });

    expect(get(view)).toEqual({ name: 'assets', params: { foo: 1 } });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(pushState).toHaveBeenCalledWith({ name: 'assets', params: { foo: 1 } }, '');
  });
});

describe('initHistory', () => {
  it('seeds the current view and restores views on popstate (back button)', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('history', { pushState: vi.fn(), replaceState });
    vi.stubGlobal('scrollTo', vi.fn());

    const cleanup = initHistory();
    expect(replaceState).toHaveBeenCalledWith(get(view), '');

    navigate('checkin');
    // Simulate Android/browser back to the dashboard entry
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: { name: 'dashboard', params: {} } })
    );
    expect(get(view)).toEqual({ name: 'dashboard', params: {} });

    // popstate with no state falls back to dashboard rather than crashing
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    expect(get(view)).toEqual({ name: 'dashboard', params: {} });

    cleanup();
  });
});
