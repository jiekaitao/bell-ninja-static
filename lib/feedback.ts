/*
 * The rules for the optional "does today's schedule look correct?" prompt.
 * Nothing is sent anywhere: it opens an email draft on the visitor's device.
 */

export const FEEDBACK_KEY = 'bell-ninja:schedule-feedback:last-shown';
export const FEEDBACK_EMAIL = 'jack@lecturehat.com';

const COOLDOWN = 3 * 24 * 60 * 60 * 1000;
const RATE = 0.1;

export interface PromptStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Called once per page visit. Shows the prompt to one visitor in ten, at most
 * once every 72 hours. The time is saved before the prompt appears, and if
 * storage is blocked the prompt stays hidden, since it could not be rate limited.
 */
export function drawPrompt(storage: PromptStorage, nowMs: number, random: () => number): boolean {
  try {
    const last = Number(storage.getItem(FEEDBACK_KEY));
    if (Number.isFinite(last) && last > 0 && nowMs - last < COOLDOWN) return false;
    if (random() >= RATE) return false;
    storage.setItem(FEEDBACK_KEY, String(nowMs));
    return true;
  } catch {
    return false;
  }
}

export interface DraftContext {
  now: Date;
  period: string;
  caption: string;
  version: string;
}

export function draftBody({ now, period, caption, version }: DraftContext): string {
  return [
    'Hi Jack,',
    '',
    'Something looks wrong with the Bell Ninja schedule.',
    '',
    'Date and device time: ' + now.toString(),
    'Displayed period: ' + period,
    'Displayed bell times: ' + caption,
    'Site version: ' + (version || 'Not available'),
    '',
    "What's wrong: [please describe]",
    '',
    "Today's actual schedule: [attach schedule here]",
  ].join('\r\n');
}

export function draftLink(body: string): string {
  return 'mailto:' + FEEDBACK_EMAIL +
    '?subject=' + encodeURIComponent('Bell Ninja schedule correction') +
    '&body=' + encodeURIComponent(body);
}
