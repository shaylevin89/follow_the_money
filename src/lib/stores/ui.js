// View navigation and toast notifications.
import { writable } from 'svelte/store';

export const view = writable({ name: 'dashboard', params: {} });

export function navigate(name, params = {}) {
  const next = { name, params };
  view.set(next);
  if (typeof window !== 'undefined') {
    // Each view is a history entry so the platform back button (Android PWA
    // included) returns to the previous view instead of closing the app.
    history.pushState(next, '');
    window.scrollTo(0, 0);
  }
}

// Wire browser history to the view store. Call once at app start; returns a
// cleanup function (used by tests).
export function initHistory() {
  let current;
  const unsub = view.subscribe((v) => {
    current = v;
  });
  history.replaceState(current, '');
  const onPop = (e) => {
    view.set(e.state && e.state.name ? e.state : { name: 'dashboard', params: {} });
    window.scrollTo(0, 0);
  };
  window.addEventListener('popstate', onPop);
  return () => {
    window.removeEventListener('popstate', onPop);
    unsub();
  };
}

export const toasts = writable([]);

let toastId = 0;

export function toast(message, kind = 'success', duration = 3500) {
  const id = ++toastId;
  toasts.update((list) => [...list, { id, message, kind }]);
  setTimeout(() => {
    toasts.update((list) => list.filter((t) => t.id !== id));
  }, duration);
}
