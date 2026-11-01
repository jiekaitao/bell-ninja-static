'use client';

import { useEffect, useRef } from 'react';

const STARTS = [0, 600, 1300];

/* `lines` is fixed markup from app/not-found.tsx, typed out a character at a
   time. Half-typed tags are part of the charm. */
export default function TypedCode({ lines }: { lines: string[] }) {
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const typing: ReturnType<typeof setInterval>[] = [];

    lines.forEach((line, n) => {
      const element = refs.current[n];
      if (!element) return;
      element.innerHTML = '';
      timers.push(setTimeout(() => {
        let i = 0;
        const interval = setInterval(() => {
          i += 1;
          element.innerHTML = line.slice(0, i) + '|';
          if (i === line.length) {
            clearInterval(interval);
            element.innerHTML = line;
          }
        }, 10);
        typing.push(interval);
      }, STARTS[n] ?? 0));
    });

    return () => {
      timers.forEach(clearTimeout);
      typing.forEach(clearInterval);
    };
  }, [lines]);

  return lines.map((line, n) => (
    <code key={n} ref={(element) => { refs.current[n] = element; }} dangerouslySetInnerHTML={{ __html: line }} />
  ));
}
