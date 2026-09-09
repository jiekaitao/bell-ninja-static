#!/usr/bin/env node
/*
 * tests/run.js -- Bell Ninja compatibility test suite.
 *
 *   node tests/run.js
 *
 * Zero dependencies. Three groups of checks:
 *
 *   1. Behaviour, run twice: once on V8 (stands in for Chrome) and once on
 *      JavaScriptCore via the `jsc` binary that ships with macOS (stands in
 *      for Safari / iOS). Same assertions, both engines.
 *   2. Static markup checks for mobile viewport + browser-shaming.
 *   3. Static CSS checks for the responsive layout and iOS viewport units.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc';

const results = [];
function record(group, name, ok, detail) {
    results.push({ group, name, ok: !!ok, detail: detail || '' });
}
function check(group, name, fn) {
    try {
        const r = fn();
        record(group, name, r.ok, r.detail);
    } catch (err) {
        record(group, name, false, 'threw: ' + (err && err.message ? err.message : String(err)));
    }
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* Source with comments blanked out, so a check never trips over prose that
 * quotes the very pattern it is banning. */
const stripComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/* Pages a student actually loads. Vendor/demo scratch files are out of scope. */
const PAGES = [
    'index.html', '404.html', 'bracelets.html', 'classtime.html', 'legends.html',
    'lunch.html', 'old-days.html', 'schedule-b.html', 'index-special.html',
    'darkness/index.html', 'darkness/404.html', 'darkness/classtime.html',
    'darkness/lunch.html', 'darkness/old-days.html', 'darkness/schedule-b.html',
    'darkness/index-special.html'
].filter((p) => fs.existsSync(path.join(ROOT, p)));

const SCHEDULE_SCRIPTS = [
    { file: 'bell-hs.js', entry: 'scheduleA', clock: 'clockdiv1', suffix: 'A', demo: 'demo-a', published: true },
    { file: 'bell-ms.js', entry: 'scheduleB', clock: 'clockdiv2', suffix: 'B', demo: 'demo-b' }
];

/* ------------------------------------------------------------------ *
 * 1a. Behaviour on V8
 * ------------------------------------------------------------------ */
function runOnV8(spec) {
    const ctx = vm.createContext({});
    vm.runInContext(read('tests/lib/shim.js'), ctx, { filename: 'shim.js' });
    vm.runInContext(read('tests/lib/core-suite.js'), ctx, { filename: 'core-suite.js' });
    vm.runInContext('BellTest.installAll(this);', ctx);
    vm.runInContext(read(spec.file), ctx, { filename: spec.file });
    const json = vm.runInContext(
        `JSON.stringify(BellTest.runCoreSuite([{name:${JSON.stringify(spec.file)},` +
        `entry:this[${JSON.stringify(spec.entry)}],clockId:${JSON.stringify(spec.clock)},` +
        `suffix:${JSON.stringify(spec.suffix)},demoId:${JSON.stringify(spec.demo)},stepMinutes:1,` +
        `publishedSchedule:${spec.published ? 'BellTest.PUBLISHED_SCHEDULE' : 'null'}}]))`,
        ctx
    );
    return JSON.parse(json);
}

for (const spec of SCHEDULE_SCRIPTS) {
    let suite;
    try {
        suite = runOnV8(spec);
    } catch (err) {
        record('V8 / Chrome', spec.file + ': loads', false, String(err && err.message || err));
        continue;
    }
    for (const t of suite) record('V8 / Chrome', t.name, t.ok, t.detail);
}

/* ------------------------------------------------------------------ *
 * 1b. Behaviour on JavaScriptCore -- the engine Safari and every iOS
 *     browser actually use.
 * ------------------------------------------------------------------ */
const hasJsc = fs.existsSync(JSC);
if (!hasJsc) {
    record('JSC / Safari', 'jsc binary available', false,
        'not found at ' + JSC + ' (Safari-engine checks skipped)');
} else {
    for (const spec of SCHEDULE_SCRIPTS) {
        const prelude =
            `var TARGET=${JSON.stringify(spec.file)};` +
            `var ENTRY=${JSON.stringify(spec.entry)};` +
            `var CLOCK=${JSON.stringify(spec.clock)};` +
            `var SUFFIX=${JSON.stringify(spec.suffix)};` +
            `var DEMO=${JSON.stringify(spec.demo)};` +
            `var PUBLISHED=${spec.published ? 'true' : 'false'};` +
            `load('tests/entry-jsc.js');`;
        let out;
        try {
            out = execFileSync(JSC, ['-e', prelude], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
        } catch (err) {
            const msg = (err.stdout || '') + (err.stderr || '') || String(err.message);
            record('JSC / Safari', spec.file + ': loads', false, msg.trim().split('\n').slice(0, 4).join(' / '));
            continue;
        }
        const marker = out.indexOf('__BELLTEST_JSON__');
        if (marker === -1) {
            record('JSC / Safari', spec.file + ': loads', false, 'no result payload: ' + out.slice(0, 200));
            continue;
        }
        const suite = JSON.parse(out.slice(marker + '__BELLTEST_JSON__'.length).trim());
        for (const t of suite) record('JSC / Safari', t.name, t.ok, t.detail);
    }

    /* Direct evidence of the Date-parsing divergence, so a regression is
     * reported as a cause rather than as a mysterious NaN. */
    check('JSC / Safari', 'no shipped script builds a Date from a hand-made string', () => {
        const offenders = [];
        for (const spec of SCHEDULE_SCRIPTS) {
            const src = stripComments(read(spec.file));
            if (/new\s+Date\s*\(\s*today\s*\+/.test(src)) offenders.push(spec.file + ': new Date(today + ...)');
            if (/Date\.parse\s*\(\s*new\s+Date\s*\(\s*\)\s*\)/.test(src)) offenders.push(spec.file + ': Date.parse(new Date())');
        }
        return { ok: offenders.length === 0, detail: offenders.join(' | ') || 'all targets built numerically' };
    });
}

check('JSC / Safari', 'co-loaded schedule scripts do not clobber each other', () => {
    /* darkness/index.html loads bell-hs.js and bell-ms.js into the same global
     * scope. Any name they share means whichever loads last silently wins, so
     * one of the two clocks runs on the wrong school's schedule. */
    const names = SCHEDULE_SCRIPTS.map((spec) => {
        const decls = stripComments(read(spec.file)).match(/^function\s+([A-Za-z_$][\w$]*)/gm) || [];
        return new Set(decls.map((d) => d.replace(/^function\s+/, '')));
    });
    const shared = [...names[0]].filter((n) => names[1].has(n));
    return {
        ok: shared.length === 0,
        detail: shared.length ? 'both define: ' + shared.join(', ') : 'no shared global function names'
    };
});

/* ------------------------------------------------------------------ *
 * 2. Mobile markup
 * ------------------------------------------------------------------ */
const VIEWPORT_RE = /<meta\s+name=["']viewport["']\s+content=["']([^"']*)["']\s*\/?>/i;

for (const page of PAGES) {
    const src = read(page);
    check('Mobile markup', page + ': has a viewport meta', () => {
        const m = src.match(VIEWPORT_RE);
        if (!m) return { ok: false, detail: 'no <meta name="viewport"> -- iOS renders at 980px and zooms out' };
        if (!/width\s*=\s*device-width/i.test(m[1])) {
            return { ok: false, detail: 'viewport does not set width=device-width: ' + m[1] };
        }
        return { ok: true, detail: m[1] };
    });

    check('Mobile markup', page + ': viewport allows pinch-zoom', () => {
        const m = src.match(VIEWPORT_RE);
        const content = m ? m[1] : '';
        const blocked = /user-scalable\s*=\s*(no|0)/i.test(content) || /maximum-scale\s*=\s*1(\.0)?\b/i.test(content);
        return { ok: !blocked, detail: blocked ? 'zoom disabled: ' + content : 'zoom permitted' };
    });

    check('Mobile markup', page + ': renders in standards mode', () => {
        /* Anything other than comments or whitespace ahead of the DOCTYPE puts
         * the browser in quirks mode, where unitless lengths, box sizing and
         * line-height all change -- a classic source of "it looks different on
         * Safari". */
        const head = src
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<\?php[\s\S]*?\?>/g, '')
            .replace(/^\s+/, '');
        const ok = /^<!DOCTYPE\s+html\s*>/i.test(head);
        return { ok, detail: ok ? 'DOCTYPE comes first' : 'content before the DOCTYPE: ' + head.slice(0, 70).replace(/\n/g, ' ') };
    });

    check('Mobile markup', page + ': no unitless CSS lengths', () => {
        /* Only quirks mode accepts these, and it reads "0.5" as 0.5px. */
        const bad = src.match(/font-size\s*:\s*(?:0?\.\d+|[1-9]\d*)\s*[;"']/g) || [];
        return { ok: bad.length === 0, detail: bad.slice(0, 3).join(' | ') || 'all lengths carry units' };
    });

    check('Mobile markup', page + ': no malformed meta tags', () => {
        const bad = src.match(/<meta[^>]*--\s*>/g) || [];
        return { ok: bad.length === 0, detail: bad.slice(0, 2).join(' | ') || 'clean' };
    });

    check('Mobile markup', page + ': does not shame or block Safari users', () => {
        const hits = (src.match(/alert\s*\([^)]*Safari[^)]*\)/gi) || [])
            .concat(src.match(/least\s+compatible\s+browser/gi) || []);
        return {
            ok: hits.length === 0,
            detail: hits.length ? hits[0].slice(0, 90) : 'no Safari-blocking modal or copy'
        };
    });

    check('Mobile markup', page + ': loads its own scripts by relative path', () => {
        /* Pulling bell-*.js off the production domain means a phone on a
         * captive-portal school network, a local preview, or a staging copy
         * silently runs whatever is deployed rather than what is here -- and
         * a fix cannot be tested before it ships. */
        const abs = src.match(/<script[^>]*\ssrc=["'](?:https?:)?\/\/bell\.ninja\/[^"']+["']/gi) || [];
        return {
            ok: abs.length === 0,
            detail: abs.length ? abs.slice(0, 3).join(' | ') : 'own scripts loaded relatively'
        };
    });
}

/* ------------------------------------------------------------------ *
 * 3. Responsive + iOS CSS
 * ------------------------------------------------------------------ */
const STYLESHEETS = ['index.css', 'darkness/index.css'].filter((p) => fs.existsSync(path.join(ROOT, p)));

for (const sheet of STYLESHEETS) {
    const css = read(sheet);

    check('Responsive CSS', sheet + ': has a phone breakpoint', () => {
        const queries = css.match(/@media[^{]*max-width:\s*([\d.]+)(px|em|rem)/gi) || [];
        const phone = queries.some((q) => {
            const m = q.match(/max-width:\s*([\d.]+)(px|em|rem)/i);
            const n = parseFloat(m[1]);
            const px = m[2].toLowerCase() === 'px' ? n : n * 16;
            return px <= 800;
        });
        return { ok: phone, detail: phone ? queries.join(', ') : 'no <=800px breakpoint: ' + (queries.join(', ') || 'none') };
    });

    check('Responsive CSS', sheet + ': stacks the panel layout on phones', () => {
        /* The desktop layout is six 20%-wide columns inside a 125%-wide strip.
         * On a phone that is ~75px per column, so it has to be re-flowed. */
        const mobileBlocks = css.match(/@media[^{]*max-width[^{]*\{[\s\S]*?\n\}/g) || [];
        const stacks = mobileBlocks.some((b) =>
            /\.bl-main\s*>\s*section/.test(b) && /(width\s*:\s*100%|position\s*:\s*(static|relative))/.test(b));
        return { ok: stacks, detail: stacks ? 'sections reflow on small screens' : '.bl-main > section keeps its 20%-wide desktop geometry on phones' };
    });

    check('Responsive CSS', sheet + ': page is scrollable on touch devices', () => {
        /* `html, body { overflow: hidden }` makes anything below the fold
         * unreachable on a phone, where there is no other way to pan. */
        const traps = [];
        const rules = css.match(/(^|\})\s*([^{}@]+)\{([^}]*)\}/g) || [];
        for (const rule of rules) {
            const sel = rule.replace(/^[\s}]*/, '').split('{')[0].trim();
            const body = rule.slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'));
            if (/^(html|body)\b/.test(sel) && /overflow\s*:\s*hidden/.test(body)) traps.push(sel);
        }
        const escaped = /@media[^{]*max-width[\s\S]*?overflow\s*:\s*auto/i.test(css) ||
            /overflow-y\s*:\s*auto/i.test(css) === false;
        const hasMobileEscape = (css.match(/@media[^{]*max-width[^{]*\{[\s\S]*?\n\}/g) || [])
            .some((b) => /(html|body)[^{]*\{[^}]*overflow[^}]*:\s*(auto|visible|scroll)/.test(b));
        return {
            ok: traps.length === 0 || hasMobileEscape,
            detail: traps.length && !hasMobileEscape
                ? 'overflow:hidden on ' + traps.join(', ') + ' with no mobile override -- content below the fold is unreachable'
                : 'scrollable'
        };
    });

    check('Responsive CSS', sheet + ': viewport heights survive the iOS toolbars', () => {
        /* 100vh on iOS Safari is the height *without* the toolbars, so the
         * bottom of a 100vh box sits behind the address bar. */
        const uses100vh = /height\s*:\s*100vh/i.test(css);
        const guarded = /-webkit-fill-available/i.test(css) || /100dvh/i.test(css);
        return {
            ok: !uses100vh || guarded,
            detail: !uses100vh ? 'no bare 100vh' : (guarded ? '100vh has a dvh / fill-available fallback' : '100vh with no iOS fallback')
        };
    });
}

/* ------------------------------------------------------------------ *
 * 3b. Fixed pixel widths that cannot fit a phone
 * ------------------------------------------------------------------ */
const NARROWEST_PHONE = 320;   /* iPhone SE / older Android */

for (const page of PAGES) {
    const src = read(page);

    check('No sideways scroll', page + ': no embed wider than a phone', () => {
        /* A hard-coded width on an <iframe> or <img> drags the whole document
         * sideways; on a phone there is no scrollbar to show what ran off. */
        const offenders = [];
        const tags = src.match(/<(?:iframe|img|table|video|embed|object)\b[^>]*>/gi) || [];
        for (const tag of tags) {
            const attr = tag.match(/\swidth\s*=\s*["']?(\d+)(?:px)?["']?/i);
            const style = tag.match(/style\s*=\s*["'][^"']*?\bwidth\s*:\s*(\d+)px/i);
            const px = attr ? +attr[1] : (style ? +style[1] : 0);
            if (px > NARROWEST_PHONE) offenders.push(px + 'px: ' + tag.slice(0, 60));
        }
        /* A stylesheet that caps every embed at the viewport width neutralises
         * the attribute, so only flag pages that have no such guard. */
        const guarded = /mobile-fixes\.css/.test(src) || /max-width\s*:\s*100%/.test(src);
        return {
            ok: offenders.length === 0 || guarded,
            detail: offenders.length === 0
                ? 'no oversized embeds'
                : (guarded ? offenders.length + ' oversized embed(s), capped by a max-width rule'
                           : offenders.slice(0, 3).join(' | '))
        };
    });

    check('No sideways scroll', page + ': no desktop-only padding on the header', () => {
        /* The bundled theme pads the sticky header by 200px a side, which is
         * 400px of chrome before any content on a 390px screen. */
        if (!/main-header-area/.test(src)) return { ok: true, detail: 'no themed header' };
        const ok = /mobile-fixes\.css/.test(src);
        return { ok, detail: ok ? 'mobile-fixes.css loaded' : 'themed header with no small-screen override' };
    });
}

check('No sideways scroll', 'css/mobile-fixes.css caps oversized embeds', () => {
    if (!fs.existsSync(path.join(ROOT, 'css/mobile-fixes.css'))) {
        return { ok: false, detail: 'css/mobile-fixes.css is missing' };
    }
    const css = read('css/mobile-fixes.css');
    const capsIframes = /iframe[^{]*\{[^}]*max-width\s*:\s*100%/.test(css);
    const fixesHeader = /main-header-area[^{]*\{[^}]*padding-left/.test(css);
    return {
        ok: capsIframes && fixesHeader,
        detail: (capsIframes ? '' : 'iframes uncapped; ') + (fixesHeader ? '' : 'header padding unfixed; ') || 'embeds and header handled'
    };
});

/* ------------------------------------------------------------------ *
 * 4. iOS interaction quirks
 * ------------------------------------------------------------------ */
for (const spec of SCHEDULE_SCRIPTS) {
    const src = stripComments(read(spec.file));
    check('iOS behaviour', spec.file + ': audio playback failure is handled', () => {
        /* iOS refuses to play audio that was not started by a user gesture and
         * rejects the play() promise; unhandled, that kills the callback. */
        const plays = src.match(/\.play\s*\(\s*\)/g) || [];
        if (!plays.length) return { ok: true, detail: 'no audio playback' };
        const guarded = /\.play\s*\(\s*\)[\s\S]{0,120}?\.catch\s*\(/.test(src) ||
            /try\s*\{[^}]*\.play\s*\(/.test(src);
        return { ok: guarded, detail: guarded ? 'play() rejection handled' : 'play() rejection unhandled -- throws on iOS' };
    });

    check('iOS behaviour', spec.file + ': no calls into undefined globals', () => {
        const bad = src.match(/\bProgram\s*\.\s*\w+\s*\(/g) || [];
        return { ok: bad.length === 0, detail: bad.join(', ') || 'clean' };
    });
}

check('iOS behaviour', 'tappable panels are marked clickable for iOS Safari', () => {
    /* iOS Safari only dispatches click on a non-interactive element when it
     * looks clickable (cursor:pointer, or a real control). */
    const css = read('index.css');
    const ok = /\.bl-main\s*>\s*section[^{]*\{[^}]*cursor\s*:\s*pointer/.test(css) ||
        /\.bl-box[^{]*\{[^}]*cursor\s*:\s*pointer/.test(css);
    return { ok, detail: ok ? 'cursor:pointer present' : 'no cursor:pointer on the tappable panels' };
});

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
const groups = [];
for (const r of results) {
    let g = groups.find((x) => x.name === r.group);
    if (!g) { g = { name: r.group, items: [] }; groups.push(g); }
    g.items.push(r);
}

let passed = 0, failed = 0;
for (const g of groups) {
    console.log('\n\x1b[1m' + g.name + '\x1b[0m');
    for (const item of g.items) {
        if (item.ok) { passed++; console.log('  \x1b[32mPASS\x1b[0m  ' + item.name + (item.detail ? '  \x1b[2m(' + item.detail + ')\x1b[0m' : '')); }
        else { failed++; console.log('  \x1b[31mFAIL\x1b[0m  ' + item.name + '\n          \x1b[31m' + item.detail + '\x1b[0m'); }
    }
}
console.log('\n' + (failed === 0 ? '\x1b[32m' : '\x1b[31m') + passed + ' passed, ' + failed + ' failed\x1b[0m\n');
process.exit(failed === 0 ? 0 : 1);
