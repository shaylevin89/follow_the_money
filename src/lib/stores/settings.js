// User settings persisted to localStorage (token is handled in data/token.js).
import { writable } from 'svelte/store';

const SETTINGS_KEY = 'ftm_settings';
const DEFAULTS = { stalenessMonths: 3 };

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings = writable(loadSettings());

settings.subscribe((value) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
  } catch {
    // storage unavailable — settings stay in memory
  }
});
