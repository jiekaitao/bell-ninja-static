# Bell Ninja

A simple answer to a constant question: when is the class bell going to ring?

[bell.ninja](https://bell.ninja) is a Next.js site, prebuilt to static files and
hosted on GitHub Pages. There is no server, so the schedule runs in the browser.

```sh
npm install
npm run dev          # http://localhost:3100
npm run typecheck
npm test             # schedule, bell and feedback rules, under V8 and Safari's engine
npm run build        # writes the site to out/
npm run test:site    # checks out/
npm run preview      # serves out/ the way GitHub Pages does
```

Pushing to `main` tests, builds and deploys through
`.github/workflows/deploy.yml`.

## Common edits

| To change | Edit |
| --- | --- |
| The bell schedule | `lib/schedule.ts` |
| A holiday, finals or half day | `lib/special-days.ts` |
| Help text | `components/HelpSheet.tsx` |
| About text | `components/AboutSheet.tsx` |
| Legendary Ninjas | `app/legends/page.tsx` |
| Colors and layout | `app/globals.css` |

## How it fits together

- `lib/` holds the logic. `schedule.ts`, `special-days.ts` and `feedback.ts` never
  touch the page, so they can run under both JavaScript engines in the tests.
- `components/Board.tsx` is the home page.
- Sheets are `<dialog>` elements addressed by the URL hash: `#help`,
  `#help/wrong-time`, `#about`.
- The dark theme is a set of token overrides at the top of `app/globals.css`. Old
  `/darkness` links switch it on.
- Every build stamps `version.txt`. Open tabs poll it and reload themselves when
  it changes, unless a sheet or the feedback card is open.

## Testing

`npm test` runs the real `lib/` files under V8 (Chrome, Edge, Android) and, on
macOS, JavaScriptCore (Safari, iPhone, iPad). The bug that once showed `aN` on
every Apple device was a `Date` parsing difference between those engines, so a
suite running only on Node could never catch it. Keep building dates with the
numeric `Date` constructor, never from strings.

The suite sweeps every minute of a week, pins the code to the printed 2026-2027
Riviera Preparatory schedule, and covers the bell and feedback rules.
