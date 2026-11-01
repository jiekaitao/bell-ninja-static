'use client';

import { useMemo, useSyncExternalStore } from 'react';

/* Sheets live in the URL hash: #help, #help/wrong-time, #about, #report. That makes them
   linkable, and the phone's Back button closes them. */

export interface Route {
  sheet: 'help' | 'about' | 'report' | null;
  topic: string | null;
}

const listeners = new Set<() => void>();
let pushed = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function onPop() {
  pushed = Math.max(0, pushed - 1);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', emit);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', emit);
    }
  };
}

function url(hash: string) {
  return hash || window.location.pathname + window.location.search;
}

export function openRoute(hash: string) {
  window.history.pushState(window.history.state, '', url(hash));
  pushed += 1;
  emit();
}

export function swapRoute(hash: string) {
  window.history.replaceState(window.history.state, '', url(hash));
  emit();
}

/** Step back out, staying on the page if it was opened straight from a link. */
export function leaveRoute(fallback: string) {
  if (pushed > 0) window.history.back();
  else swapRoute(fallback);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return useMemo(() => {
    const [sheet, topic] = hash.replace(/^#/, '').split('/');
    if (sheet === 'help') return { sheet, topic: topic || null };
    if (sheet === 'about' || sheet === 'report') return { sheet, topic: null };
    return { sheet: null, topic: null };
  }, [hash]);
}
