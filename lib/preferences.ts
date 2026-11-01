'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { THEME_KEY } from './theme-key';

const SOUND_KEY = 'bell-ninja:sound';
const SCHEDULE_KEY = 'bell-ninja:schedule';

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

/* Desktop remembers whether the schedule was left open. On a phone it would
   cover the countdown, so it always starts closed there. */
export function useScheduleDrawer() {
  const [open, setOpen] = useState(false);
  const wide = () => window.matchMedia('(min-width: 900px)').matches;

  useEffect(() => {
    if (wide() && read(SCHEDULE_KEY) === 'open') setOpen(true);
  }, []);

  const set = (value: boolean) => {
    setOpen(value);
    if (wide()) write(SCHEDULE_KEY, value ? 'open' : 'closed');
  };
  return { open, set };
}
