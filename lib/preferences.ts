'use client';

import { useSyncExternalStore } from 'react';
import { THEME_KEY } from './theme-key';

const SOUND_KEY = 'bell-ninja:sound';

/* Preferences survive in localStorage when it is available. In a private
   window it can throw, so they also live in memory for the visit. */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* It still applies until the page closes. */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => (read(THEME_KEY) === 'dark' ? 'dark' : 'light'),
    () => 'light',
  );
  const toggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    write(THEME_KEY, nextTheme);
  };
  return { theme, toggle };
}

export function useSoundPreference() {
  const on = useSyncExternalStore(subscribe, () => read(SOUND_KEY) !== 'off', () => true);
  return { on, set: (value: boolean) => write(SOUND_KEY, value ? 'on' : 'off') };
}
