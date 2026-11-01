'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import AboutSheet from './AboutSheet';
import FeedbackPrompt from './FeedbackPrompt';
import HelpSheet from './HelpSheet';
import HelpWantedNote from './HelpWantedNote';
import { BellIcon, MoonIcon, SunIcon } from './icons';
import NinjaTab from './NinjaTab';
import ReportSheet from './ReportSheet';
import { useScheduleDrawer, useTheme } from '@/lib/preferences';
import { clockLabel, clockUnits, progress, readSchedule, secondsLeft, shortClock, type Reading } from '@/lib/schedule';
import { useBell } from '@/lib/use-bell';
import { useNow } from '@/lib/use-now';
import { openRoute, useRoute } from '@/lib/use-route';

const LUNCH_MENU = 'https://www.sagedining.com/sites/rivieraday/menu';
const PAGE_TITLE = 'Bell Ninja - A Simple Timer';

function Clock({ left }: { left: number | null }) {
  const units = left === null
    ? [{ label: 'Minutes', value: '--' }, { label: 'Seconds', value: '--' }]
    : clockUnits(left);

  return (
    <div className="clock" role="timer" aria-label="Time until next bell ring">
      {units.map((unit) => (
        <div className="clock-unit" key={unit.label}>
          <span>{unit.value}</span>
          <small>{unit.label}</small>
        </div>
      ))}
    </div>
  );
}

function TodaysBells({ reading, onClose, closeRef }: {
  reading: Reading | null;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
}) {
  const noClasses = reading !== null && reading.bells.length === 0;

  return (
    <aside className="bells" aria-label="Today's bells">
      <header className="bells-top">
        <h2>{noClasses ? 'No classes today' : "Today's bells"}</h2>
        <button ref={closeRef} type="button" className="bells-close" onClick={onClose} aria-label="Hide today's schedule">&times;</button>
      </header>
      {noClasses && <p className="bells-empty">{reading.detail}</p>}
      {reading && !noClasses && (
        <ol>
          {reading.bells.map((bell) => {
            const state = bell.startsAt === reading.startsAt ? 'now' : bell.endsAt <= reading.startsAt ? 'past' : '';
            return (
              <li key={bell.startsAt} className={state} aria-current={state === 'now' ? 'time' : undefined}>
                <span className="when">{clockLabel(bell.startsAt)}&ndash;{clockLabel(bell.endsAt)}</span>
                <span className="what">{bell.label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

export default function Board() {
  const now = useNow();
  const reading = useMemo(() => (now === null ? null : readSchedule(new Date(now))), [now]);
  const left = reading && now !== null ? secondsLeft(reading, now) : null;
  const bell = useBell(reading, now);
  const { theme, toggle } = useTheme();
  const route = useRoute();
  const schedule = useScheduleDrawer();
  const closeButton = useRef<HTMLButtonElement>(null);

  const movedByHand = useRef(false);

  const toggleSchedule = (open: boolean) => {
    movedByHand.current = true;
    schedule.set(open);
  };

  /* Keep keyboard users with the thing they just moved. This waits for the
     render because a closed schedule can't take focus. */
  useEffect(() => {
    if (!movedByHand.current) return;
    movedByHand.current = false;
    if (schedule.open) closeButton.current?.focus();
    else document.getElementById('schedule-toggle')?.focus();
  }, [schedule.open]);

  useEffect(() => {
    if (!schedule.open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) toggleSchedule(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* Most people keep this in a tab, so the tab itself answers the question. */
  useEffect(() => {
    if (left !== null) document.title = shortClock(left) + ' left - Bell Ninja';
  }, [left]);
  useEffect(() => () => { document.title = PAGE_TITLE; }, []);

  const done = reading && now !== null ? progress(reading, now) : 0;
  const bellLabel = !bell.on ? 'Bell off' : bell.unlocked ? 'Bell on' : 'Tap for bell';

  return (
    <main className="board">
      <div className="board-top">
        <section className="hero">
          <header className="hero-top">
            <p className="day">{reading?.day ?? 'Bell Ninja'}</p>
            <div className="hero-controls">
              <button
                type="button"
                className={'control' + (bell.on ? '' : ' control-off')}
                onClick={bell.press}
                aria-pressed={bell.on}
                aria-label={bellLabel}
                title="Plays a digital bell noise when the bell rings"
              >
                <BellIcon off={!bell.on} size={20} />
                <span>{bellLabel}</span>
              </button>
              <button
                type="button"
                className="control"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
              </button>
            </div>
          </header>

          {reading?.notice && <p className="notice">{reading.notice}</p>}

          <div className="hero-main">
            <h1 aria-live="polite">{reading?.period ?? 'When is the bell going to ring?'}</h1>
            <p className="detail">{reading?.detail ?? ' '}</p>
            <Clock left={left} />
            <div
              className="progress"
              role="progressbar"
              aria-label="Progress through the current period"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(done * 100)}
            >
              <span style={{ transform: `scaleX(${done})` }} />
            </div>
            <p className="next">
              {reading?.next ? <>Next: {reading.next.label} at {clockLabel(reading.next.startsAt)}</> : ' '}
            </p>
          </div>

          <FeedbackPrompt />

          <button type="button" className="report-link" onClick={() => openRoute('#report')}>Schedule not correct?</button>

          <HelpWantedNote hidden={schedule.open} />
        </section>

        <div className={'schedule' + (schedule.open ? ' schedule-open' : '')}>
          <NinjaTab open={schedule.open} onToggle={() => toggleSchedule(!schedule.open)} />
          <div className="schedule-clip" id="todays-bells" inert={!schedule.open}>
            <TodaysBells reading={reading} onClose={() => toggleSchedule(false)} closeRef={closeButton} />
          </div>
        </div>
      </div>

      <nav className="tiles" aria-label="More">
        <a className="tile tile-lunch" href={LUNCH_MENU} target="_blank" rel="noreferrer" title="Please enjoy this photo of my hamster :)">
          <span className="tile-text"><b>Lunch</b><small>Today&apos;s menu &#8599;</small></span>
          <span className="tile-hamster"><Image src="/img/hamster.jpg" alt="" width={480} height={333} loading="eager" /></span>
        </a>
        <button type="button" className="tile tile-help" onClick={() => openRoute('#help')}>
          <span className="tile-text"><b>Help :(</b><small>Something off?</small></span>
        </button>
        <button type="button" className="tile tile-ninja" onClick={() => openRoute('#about')}>
          <span className="tile-text"><b>Bell Ninja 2026</b><small>Legends &amp; about</small></span>
        </button>
      </nav>

      <HelpSheet route={route} />
      <AboutSheet route={route} />
      <ReportSheet route={route} reading={reading} />
    </main>
  );
}
