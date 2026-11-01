'use client';

import { useEffect } from 'react';

/*
 * Pick up a new deploy without anyone pressing refresh. Bell Ninja is a page
 * people leave open all day, so a tab opened at 8am would otherwise keep running
 * whatever it loaded at 8am.
 */
const RUNNING = process.env.NEXT_PUBLIC_BUILD_VERSION;
const POLL_MS = 5 * 60 * 1000;
const SEEN_KEY = 'bell-ninja-reloaded-for';

/* Reload at most once per version. GitHub Pages caches HTML for ten minutes, so
   a reload can come back still announcing the old build; without this the page
   would reload over and over. If storage is unavailable we never reload: a
   missed update is much cheaper than a reload loop. */
function alreadyReloadedFor(version: string) {
  try {
    if (window.sessionStorage.getItem(SEEN_KEY) === version) return true;
    window.sessionStorage.setItem(SEEN_KEY, version);
    return false;
  } catch {
    return true;
  }
}

export default function UpdateWatcher() {
  useEffect(() => {
    if (!RUNNING) return;

    const check = async () => {
      try {
        const response = await fetch('/version.txt', { cache: 'no-store' });
        if (!response.ok) return;
        const latest = (await response.text()).trim();
        if (!latest || latest === RUNNING) return;
        /* Don't yank a sheet out from under someone reading it, or a half-written
           report. The next poll will catch them. */
        if (document.querySelector('dialog[open], .feedback')) return;
        if (!alreadyReloadedFor(latest)) window.location.reload();
      } catch {
        /* Offline or blocked: try again next time. */
      }
    };

    const onVisible = () => {
      if (!document.hidden) void check();
    };

    const timer = setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
