# Bell Ninja compatibility tests

```sh
node tests/run.js
```

Zero dependencies. Exits non-zero on any failure.

## Why it runs the schedule scripts twice

The bug that made Bell Ninja unusable on iPhones, iPads and Macs was a
`Date` parsing difference: `new Date("09 09, 2026  15:30:00")` is accepted by
V8 (Chrome, Edge) and rejected by JavaScriptCore (Safari, and every browser on
iOS). A test suite running only on Node could never have caught it.

So `tests/run.js` executes the real `bell-hs.js` against a small DOM shim
under **both** engines:

| Engine | Binary | Stands in for |
| --- | --- | --- |
| V8 | `node` | Chrome, Edge, Android |
| JavaScriptCore | `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc` | Safari, iPhone, iPad, Mac |

`jsc` ships with macOS. On a machine without it, those checks report as skipped
rather than silently passing.

## What is covered

- **Behaviour** — every minute of a full week (10,080 per engine): the
  countdown never renders `NaN`/`undefined`, never runs negative, never points
  more than 24h out, always names a period, and never falls through every
  schedule branch.
- **Published schedule** — 26 spot-checks pinning the code to the printed
  2026-2027 Riviera Preparatory bell times, so an edit that drifts from the
  poster fails.
- **Mobile markup** — viewport meta on every page, pinch-zoom left enabled,
  standards mode (no content ahead of the DOCTYPE), no unitless CSS lengths,
  no Safari-blocking modal, scripts loaded by relative path.
- **Responsive CSS** — a phone breakpoint exists, the panel layout stacks, the
  page can actually scroll on a touch device, `100vh` has an iOS fallback, an
  expanded panel is exactly window-width, the corner badge cannot widen the
  page, and the dark theme stays a palette layer over the one shared
  stylesheet rather than a second copy of it.
- **No sideways scroll** — no embed wider than a 320px phone without a
  `max-width` guard; themed pages load `css/mobile-fixes.css`.
- **Broken references** — every local `src`/`href` resolves to a file that is
  actually in the repository.
- **iOS behaviour** — `play()` rejection handled (iOS blocks un-gestured
  audio), no calls into undefined globals, tap targets marked `cursor:pointer`.
- **Isolation** — the schedule keeps its state out of the global scope, and
  only one schedule script is shipped. Two scripts sharing implicit globals is
  how the high school clock ended up showing the middle school's periods.

## Files

- `tests/run.js` — runner and all static checks
- `tests/lib/shim.js` — minimal DOM, clock control, recorded timers
- `tests/lib/core-suite.js` — the behavioural assertions (engine-agnostic)
- `tests/entry-jsc.js` — loads the above inside `jsc`
