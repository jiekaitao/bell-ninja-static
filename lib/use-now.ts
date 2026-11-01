'use client';

import { useSyncExternalStore } from 'react';

/* One shared clock, ticking on the second. It is null until the browser takes
   over, because the prebuilt HTML cannot know what time it is. */

let current = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function tick() {
  clearTimeout(timer);
  current = Date.now();
  listeners.forEach((listener) => listener());
  timer = setTimeout(tick, 1000 - (current % 1000));
}

function onVisible() {
  if (!document.hidden) tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', onVisible);
    tick();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

function getSnapshot() {
  if (!current) current = Date.now();
  return current;
}

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
