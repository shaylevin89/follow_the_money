import { describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { view, navigate } from '../../src/lib/stores/ui.js';

describe('navigate', () => {
  it('sets the view and scrolls to the top of the page', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);

    navigate('assets', { foo: 1 });

    expect(get(view)).toEqual({ name: 'assets', params: { foo: 1 } });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    vi.unstubAllGlobals();
  });
});
