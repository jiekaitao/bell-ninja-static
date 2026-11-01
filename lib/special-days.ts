/*
 * Days that do not follow the normal bell schedule.
 *
 * Add a row here for a holiday, a break, finals or a half day. The countdown,
 * the bell list and the bell sound all follow it.
 *
 *   { from: '2026-11-26', to: '2026-11-27', notice: 'Happy Thanksgiving!' }
 *       No school on those days.
 *
 *   { from: '2027-05-24', notice: 'Finals schedule today.', rows: [
 *       ['08:00', 'Good Morning! School Starts in...', 'Early Bird Until 8:00'],
 *       ['10:00', 'Final Exam 1'],
 *       ['10:15', 'Break Time'],
 *       ['12:15', 'Final Exam 2'],
 *       ['24:00', 'Have a great rest of your day!', 'See you tomorrow!'],
 *   ] }
 *       A different schedule for that day.
 *
 * Rows work like the ones in lib/schedule.ts: [ends at, what is happening,
 * optional caption], and the last row must end at 24:00.
 */
import type { Row } from './schedule';

export interface SpecialDay {
  /** First day, as YYYY-MM-DD. */
  from: string;
  /** Last day, as YYYY-MM-DD. Leave it out for a single day. */
  to?: string;
  /** Shown at the top of the page on those days. */
  notice?: string;
  /** That day's schedule. Leave it out when there is no school. */
  rows?: readonly Row[];
}

export const SPECIAL_DAYS: readonly SpecialDay[] = [];
