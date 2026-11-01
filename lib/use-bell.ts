'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSoundPreference } from './preferences';
import { shouldRing, type Reading } from './schedule';

let audio: HTMLAudioElement | null = null;

function bell() {
  if (!audio) {
    audio = new Audio('/audio/guitarbell.mp3');
    audio.preload = 'none';
  }
  return audio;
}

function ring() {
  const element = bell();
  element.currentTime = 0;
  /* iOS rejects audio no tap started. Unhandled, that would surface as an error. */
  element.play()?.catch(() => {});
}

/* Browsers keep a page silent until someone interacts with it. A muted play
   from inside a tap is what lets the real bell through later. */
function unlock() {
  const element = bell();
  element.muted = true;
  const played = element.play();
  const done = () => {
    element.pause();
    element.currentTime = 0;
    element.muted = false;
  };
  if (played) played.then(done, () => { element.muted = false; });
  else done();
}

export function useBell(reading: Reading | null, nowMs: number | null) {
  const { on, set } = useSoundPreference();
  const [unlocked, setUnlocked] = useState(false);
  const unlockedRef = useRef(false);
  const previous = useRef<Reading | null>(null);

  useEffect(() => {
    if (unlockedRef.current) return;
    const onClick = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      setUnlocked(true);
      unlock();
    };
    /* A key press on a button turns into a click, which arrives here anyway. */
    const onKey = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLButtonElement)) onClick();
    };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [unlocked]);

  useEffect(() => {
    if (!reading || nowMs === null) return;
    const last = previous.current;
    previous.current = reading;
    if (!last || last.target.getTime() === reading.target.getTime()) return;
    if (on && shouldRing(last, nowMs)) ring();
  }, [reading, nowMs, on]);

  const press = useCallback(() => {
    if (!unlockedRef.current) {
      /* The first tap on the button is the tap browsers are waiting for, so
         play the bell and leave it on. */
      unlockedRef.current = true;
      setUnlocked(true);
      set(true);
      ring();
    } else if (on) {
      set(false);
    } else {
      set(true);
      ring();
    }
  }, [on, set]);

  return { on, unlocked, press };
}
