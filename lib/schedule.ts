/*
 * The bell schedule, and everything worked out from it.
 *
 * Nothing here touches the page, so tests/run.mjs runs this exact file under
 * both V8 (Chrome) and JavaScriptCore (Safari).
 *
 * The schedule is data: each day is a list of rows, and a row runs from where
 * the previous one ended until its own end time. Gaps are impossible, and the
 * caption, the list and the countdown all read the same table.
 *
 * One rule matters across browsers: never build a Date by parsing a string.
 * `new Date("09 09, 2026  15:30:00")` works in Chrome and is Invalid Date in
 * Safari and on every iOS browser, which is why the clock once showed
 * "aN : aN : aN" on iPhones. Everything here uses the numeric Date constructor.
 */
import { SPECIAL_DAYS, type SpecialDay } from './special-days';

/** [ends at, what is happening, caption override (optional)] */
export type Row = readonly [end: string, label: string, caption?: string];

export interface Day {
  name: string;
  rows: readonly Row[];
  notice?: string;
}

/* Source: 2026-2027 Riviera Preparatory Bell Schedule. Riviera Prep is one
   school for grades 6-12, and the lunch waves are how the grades are split, so
   there is a single schedule site-wide. */

const LIBRARY = 'The library *MAY BE* open until 5:00 PM';

const MON_THU: readonly Row[] = [
  ['08:00', 'Good Morning! School Starts in...', 'Early Bird Until 8:00'],
  ['08:51', 'Period 1'],
  ['08:55', 'Class Intermission'],
  ['09:41', 'Period 2'],
  ['10:00', 'Break Time'],
  ['10:04', 'Class Intermission'],
  ['10:50', 'Period 3'],
  ['10:54', 'Class Intermission'],
  ['11:40', 'Period 4 / Lunch 6th-7th'],
  ['11:44', 'Class Intermission'],
  ['12:30', 'Period 5 / Lunch 8th-9th'],
  ['12:34', 'Class Intermission'],
  ['13:20', 'Period 6 / Lunch 10th-12th'],
  ['13:24', 'Class Intermission'],
  ['14:10', 'Period 7'],
  ['14:14', 'Class Intermission'],
  ['15:00', 'Period 8'],
  ['15:30', 'Optional Tutorial'],
  ['17:00', 'Have a great rest of your day! Library Closes in...', LIBRARY],
  ['24:00', 'Have a great rest of your day!', 'See you tomorrow!'],
];

const FRIDAY: readonly Row[] = [
  ['08:00', 'Good Morning! School Starts in...', 'Early Bird Until 8:00'],
  ['08:44', 'Period 1'],
  ['08:48', 'Class Intermission'],
  ['09:32', 'Period 2'],
  ['09:36', 'Class Intermission'],
  ['10:12', 'Thrive Time / Assembly'],
  ['10:16', 'Class Intermission'],
  ['11:00', 'Period 3'],
  ['11:04', 'Class Intermission'],
  ['11:48', 'Period 4 / Lunch 6th-7th'],
  ['11:52', 'Class Intermission'],
  ['12:36', 'Period 5 / Lunch 8th-9th'],
  ['12:40', 'Class Intermission'],
  ['13:24', 'Period 6 / Lunch 10th-12th'],
  ['13:28', 'Class Intermission'],
  ['14:12', 'Period 7'],
  ['14:16', 'Class Intermission'],
  ['15:00', 'Period 8'],
  ['15:30', 'Optional Tutorial'],
  ['17:00', 'Have a great weekend! Library Closes in...', LIBRARY],
  ['24:00', 'Have a great weekend!', 'Enjoy Your Weekend!'],
];

/* Wednesday keeps the Mon-Thurs bells; the optional tutorial runs Monday,
   Tuesday, Thursday and Friday only. */
const WEDNESDAY: readonly Row[] = MON_THU.map((row) =>
  row[1] === 'Optional Tutorial'
    ? (['15:30', "School's out!", 'No tutorial today - see you tomorrow!'] as const)
    : row,
);

const DAYS: readonly Day[] = [
  { name: 'Sunday :|', rows: [['24:00', 'Just one more day please.......', 'Enjoy Your Weekend!']] },
  { name: 'Monday :(', rows: MON_THU },
  { name: 'Tuesday', rows: MON_THU },
  { name: 'Wednesday', rows: WEDNESDAY },
  { name: 'Thursday', rows: MON_THU },
  { name: 'Friday', rows: FRIDAY },
  { name: 'Saturday!', rows: [['24:00', 'Please enjoy your weekend!', 'Enjoy Your Weekend!']] },
];

const NO_SCHOOL: readonly Row[] = [['24:00', 'No school today!', 'Enjoy your day off!']];

/* ------------------------------------------------------------------ *
 * Times, as minutes past midnight
 * ------------------------------------------------------------------ */

export function toMinutes(hhmm: string): number {
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
}

/** 8:55, 12:30, 1:20: how the printed schedule writes them. */
export function clockLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return (hours % 12 || 12) + ':' + (mins < 10 ? '0' + mins : mins);
}

const SCHOOL_STARTS = toMinutes('08:00');
const SCHOOL_ENDS = toMinutes('15:30');

/* Rows that are not a scheduled block. The printed schedule lists neither the
   intermissions between periods nor, on Wednesdays, the 3:00 slot where the
   optional tutorial would otherwise be. */
const NOT_A_BELL = /^(Class Intermission|School's out)/;

/* ------------------------------------------------------------------ *
 * Which day is it?
 * ------------------------------------------------------------------ */

function dateKey(now: Date): string {
  const month = now.getMonth() + 1;
  const date = now.getDate();
  return now.getFullYear() + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date);
}

export function dayFor(now: Date, special: readonly SpecialDay[] = SPECIAL_DAYS): Day {
  const normal = DAYS[now.getDay()];
  const key = dateKey(now);
  for (const entry of special) {
    if (key >= entry.from && key <= (entry.to ?? entry.from)) {
      return { name: normal.name, rows: entry.rows ?? NO_SCHOOL, notice: entry.notice };
    }
  }
  return normal;
}

/* ------------------------------------------------------------------ *
 * What is happening right now?
 * ------------------------------------------------------------------ */

export interface ListedBell {
  startsAt: number;
  endsAt: number;
  label: string;
}

export interface Reading {
  /** "Monday :(" */
  day: string;
  /** "Period 3", or a greeting outside school hours. */
  period: string;
  /** "Period 3 - 10:04 to 10:50": what the feedback email quotes. */
  caption: string;
  /** "10:04 to 10:50", or the written caption if the row has one. */
  detail: string;
  startsAt: number;
  endsAt: number;
  /** When the current row began and ends. */
  start: Date;
  target: Date;
  /** The next scheduled block today, if there is one. */
  next: ListedBell | null;
  /** Today's published blocks. */
  bells: ListedBell[];
  notice?: string;
}

/** The scheduled blocks, as the school publishes them. */
export function listedRows(rows: readonly Row[]): ListedBell[] {
  const listed: ListedBell[] = [];
  rows.forEach((row, i) => {
    const startsAt = i === 0 ? 0 : toMinutes(rows[i - 1][0]);
    const endsAt = toMinutes(row[0]);
    if (NOT_A_BELL.test(row[1])) return;
    if (startsAt < SCHOOL_STARTS || endsAt > SCHOOL_ENDS) return;
    listed.push({ startsAt, endsAt, label: row[1] });
  });
  return listed;
}

export function readSchedule(now: Date, special: readonly SpecialDay[] = SPECIAL_DAYS): Reading {
  const day = dayFor(now, special);
  const minutes = now.getHours() * 60 + now.getMinutes();

  /* The last row ends at hour 24, so a row always matches. */
  let index = day.rows.length - 1;
  for (let i = 0; i < day.rows.length; i++) {
    if (toMinutes(day.rows[i][0]) > minutes) {
      index = i;
      break;
    }
  }

  const row = day.rows[index];
  const startsAt = index === 0 ? 0 : toMinutes(day.rows[index - 1][0]);
  const endsAt = toMinutes(row[0]);
  const times = clockLabel(startsAt) + ' to ' + clockLabel(endsAt);
  const bells = listedRows(day.rows);

  /* Numeric constructor only. Hour 24 rolls over to midnight on its own, and
     this stays correct across a daylight-saving change. */
  const at = (total: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(total / 60), total % 60, 0, 0);

  return {
    day: day.name,
    period: row[1],
    caption: row[2] ?? row[1] + ' - ' + times,
    detail: row[2] ?? times,
    startsAt,
    endsAt,
    start: at(startsAt),
    target: at(endsAt),
    next: bells.find((bell) => bell.startsAt >= endsAt) ?? null,
    bells,
    notice: day.notice,
  };
}

/* ------------------------------------------------------------------ *
 * The countdown
 * ------------------------------------------------------------------ */

export interface ClockUnit {
  label: 'Days' | 'Hours' | 'Minutes' | 'Seconds';
  value: string;
}

const UNITS = [
  { seconds: 86400, label: 'Days' },
  { seconds: 3600, label: 'Hours' },
  { seconds: 60, label: 'Minutes' },
  { seconds: 1, label: 'Seconds' },
] as const;

export function secondsLeft(reading: Reading, nowMs: number): number {
  return Math.max(0, Math.round((reading.target.getTime() - nowMs) / 1000));
}

/**
 * A bell is never more than a class away, so Days and Hours are usually zero.
 * Units above the largest non-zero one are left out rather than showing a row
 * of zeroes. Minutes and seconds always stay.
 */
export function clockUnits(left: number): ClockUnit[] {
  const units: ClockUnit[] = [];
  let remaining = left;
  let leading = true;

  UNITS.forEach((unit, i) => {
    const value = Math.floor(remaining / unit.seconds);
    remaining -= value * unit.seconds;
    leading = leading && value === 0;
    if (leading && i < UNITS.length - 2) return;
    units.push({ label: unit.label, value: i === 0 ? String(value) : ('0' + value).slice(-2) });
  });
  return units;
}

/** How far through the current row we are, from 0 to 1. */
export function progress(reading: Reading, nowMs: number): number {
  const total = reading.target.getTime() - reading.start.getTime();
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (nowMs - reading.start.getTime()) / total));
}

/** "12:48", or "1:02:07" when hours are showing: for the browser tab. */
export function shortClock(left: number): string {
  return clockUnits(left)
    .map((unit, i) => (i === 0 ? String(Number(unit.value)) : unit.value))
    .join(':');
}

/* ------------------------------------------------------------------ *
 * The bell sound
 * ------------------------------------------------------------------ */

/* Background tabs only wake about once a minute, so a late bell still rings.
   Anything older than this is a laptop waking up hours later. */
const LATE_BELL_MS = 90 * 1000;

/**
 * Should crossing out of `previous` ring the bell? Only during the school day:
 * a tab left open should stay quiet at 5 PM, at midnight and all weekend.
 */
export function shouldRing(previous: Reading, nowMs: number): boolean {
  const late = nowMs - previous.target.getTime();
  return late >= 0 && late < LATE_BELL_MS &&
    previous.endsAt >= SCHOOL_STARTS && previous.endsAt <= SCHOOL_ENDS &&
    previous.bells.length > 0;
}
