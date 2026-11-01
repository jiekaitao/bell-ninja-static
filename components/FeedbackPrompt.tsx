'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { draftBody, draftLink, drawPrompt, FEEDBACK_EMAIL } from '@/lib/feedback';
import type { Reading } from '@/lib/schedule';

const VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION ?? '';

export default function FeedbackPrompt({ reading }: { reading: Reading | null }) {
  const [stage, setStage] = useState<'hidden' | 'question' | 'report'>('hidden');
  const [body, setBody] = useState('');
  const email = useRef<HTMLAnchorElement>(null);
  const checked = useRef(false);

  /* One random draw per visit, never per tick, and only once someone can see it. */
  useEffect(() => {
    const check = () => {
      if (checked.current || document.hidden) return;
      checked.current = true;
      try {
        if (drawPrompt(window.localStorage, Date.now(), Math.random)) setStage('question');
      } catch {
        /* Storage is blocked, so the prompt stays hidden. */
      }
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);

  useEffect(() => {
    if (stage === 'report') email.current?.focus();
  }, [stage]);

  if (stage === 'hidden') return null;

  const makeDraft = () =>
    draftBody({
      now: new Date(),
      period: reading?.period ?? 'Not available',
      caption: reading?.caption ?? 'Not available',
      version: VERSION,
    });

  const report = () => {
    setBody(makeDraft());
    setStage('report');
  };

  /* Refresh the details if someone leaves the report open across a bell. */
  const send = (event: MouseEvent<HTMLAnchorElement>) => {
    const fresh = makeDraft();
    event.currentTarget.href = draftLink(fresh);
    setBody(fresh);
  };

  const dismiss = () => setStage('hidden');

  return (
    <div className="feedback" role="region" aria-label="Schedule feedback">
      {stage === 'question' ? (
        <>
          <h3>Does today&apos;s bell schedule look correct?</h3>
          <div className="feedback-actions">
            <button type="button" onClick={dismiss}>Looks correct</button>
            <button type="button" onClick={report}>Something&apos;s wrong</button>
            <button type="button" onClick={dismiss}>Dismiss</button>
          </div>
        </>
      ) : (
        <>
          <h3>Help us fix the schedule</h3>
          <p>
            Email {FEEDBACK_EMAIL} with what&apos;s wrong and a link to the actual schedule. The draft includes
            the bell times you&apos;re seeing.
          </p>
          <div className="feedback-actions">
            <a ref={email} href={draftLink(body)} onClick={send}>Open email draft</a>
            <button type="button" onClick={dismiss}>Dismiss</button>
          </div>
          <details>
            <summary>Email app didn&apos;t open?</summary>
            <p>Send an email to {FEEDBACK_EMAIL}. Copy this draft, describe the mistake, and paste your schedule link at the end.</p>
            <label htmlFor="feedback-draft">Email draft</label>
            <textarea id="feedback-draft" rows={10} readOnly value={body} />
          </details>
        </>
      )}
    </div>
  );
}
