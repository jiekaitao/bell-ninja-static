'use client';

import { useEffect, useRef, useState } from 'react';
import { drawPrompt } from '@/lib/feedback';
import { openRoute } from '@/lib/use-route';

/* The occasional accuracy check. Answers aren't recorded anywhere: "Something's
   wrong" leads to the same report sheet as the link on the page. */
export default function FeedbackPrompt() {
  const [shown, setShown] = useState(false);
  const checked = useRef(false);

  /* One random draw per visit, never per tick, and only once someone can see it. */
  useEffect(() => {
    const check = () => {
      if (checked.current || document.hidden) return;
      checked.current = true;
      try {
        if (drawPrompt(window.localStorage, Date.now(), Math.random)) setShown(true);
      } catch {
        /* Storage is blocked, so the prompt stays hidden. */
      }
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);

  if (!shown) return null;

  const dismiss = () => setShown(false);

  return (
    <div className="feedback" role="region" aria-label="Schedule feedback">
      <h3>Does today&apos;s bell schedule look correct?</h3>
      <div className="feedback-actions">
        <button type="button" onClick={dismiss}>Looks correct</button>
        <button type="button" onClick={() => { dismiss(); openRoute('#report'); }}>Something&apos;s wrong</button>
        <button type="button" onClick={dismiss}>Dismiss</button>
      </div>
    </div>
  );
}
