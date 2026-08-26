// View navigation and toast notifications.
import { writable } from 'svelte/store';

export const view = writable({ name: 'dashboard', params: {} });

export function navigate(name, params = {}) {
  view.set({ name, params });
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0);
  }
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
