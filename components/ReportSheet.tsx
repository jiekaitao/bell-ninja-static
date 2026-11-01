'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Sheet from './Sheet';
import { draftBody, draftLink, FEEDBACK_EMAIL } from '@/lib/feedback';
import type { Reading } from '@/lib/schedule';
import { leaveRoute, type Route } from '@/lib/use-route';

const VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION ?? '';

interface ReportSheetProps {
  route: Route;
  reading: Reading | null;
}

/* The one place to report a schedule problem. There is no server behind it:
   a mailto link can't carry attachments, so the visitor adds the photo in their
   own email app. */
export default function ReportSheet({ route, reading }: ReportSheetProps) {
  const open = route.sheet === 'report';
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState('');
  const latest = useRef(reading);
  latest.current = reading;

  const makeDraft = () =>
    draftBody({
      now: new Date(),
      period: latest.current?.period ?? 'Not available',
      caption: latest.current?.caption ?? 'Not available',
      version: VERSION,
    });

  useEffect(() => {
    if (open) setBody(makeDraft());
  }, [open]);

  /* Refresh the details if someone leaves this open across a bell. */
  const send = (event: MouseEvent<HTMLAnchorElement>) => {
    const fresh = makeDraft();
    event.currentTarget.href = draftLink(fresh);
    setBody(fresh);
  };

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      /* The address and draft are on screen to select by hand. */
    }
  };

  return (
    <Sheet open={open} tone="report" label="Schedule not correct?" onDismiss={() => leaveRoute('')}>
      <div className="sheet-body">
        <h2>Schedule not correct?</h2>
        <p>Bell Ninja is updated by hand, so a quick heads-up fixes it for everyone. It takes about a minute.</p>

        <ol className="steps">
          <li>
            <h3>Get today&apos;s real schedule</h3>
            <p>Take a photo or screenshot of the correct schedule for today, like the one your teacher shared or the school sent out.</p>
          </li>
          <li>
            <h3>Open the email</h3>
            <p>Your email app opens with the bell times you&apos;re seeing already filled in.</p>
            <div className="step-actions">
              <a className="step-button" href={draftLink(body)} onClick={send}>Open email draft</a>
              <button type="button" className="step-copy" onClick={() => copy('address', FEEDBACK_EMAIL)}>
                {copied === 'address' ? 'Copied!' : 'Copy ' + FEEDBACK_EMAIL}
              </button>
            </div>
          </li>
          <li>
            <h3>Attach it and send</h3>
            <p>Add your photo to the email, say what looks wrong, and hit send. Please allow 1 to 2 days for a response.</p>
          </li>
        </ol>

        <details className="step-fallback">
          <summary>Email app didn&apos;t open?</summary>
          <p>Send an email to {FEEDBACK_EMAIL} with this draft and your photo attached.</p>
          <label htmlFor="report-draft">Email draft</label>
          <textarea id="report-draft" rows={9} readOnly value={body} />
          <button type="button" className="step-copy" onClick={() => copy('draft', body)}>
            {copied === 'draft' ? 'Copied!' : 'Copy draft'}
          </button>
        </details>
      </div>
    </Sheet>
  );
}
