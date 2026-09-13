#!/usr/bin/env node
/*
 * tools/release.js -- stamp a new version across the site.
 *
 *   node tools/release.js
 *
 * GitHub Pages serves everything with `Cache-Control: max-age=600` and gives
 * you no way to change that. For ten minutes after a visit the browser answers
 * from its own cache without contacting the server, and a plain reload can
 * hand you fresh HTML running stale CSS and JS -- the state that feels like
 * "I have to hard refresh".
 *
 * A URL the browser has never seen cannot be served from cache, so this
 * rewrites every same-origin .css/.js reference to carry ?v=<stamp>, and
 * writes the same stamp to version.txt for js/check-for-updates.js to poll.
 *
 * Run it before committing a change you want people to get straight away.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

const pages = fs.readdirSync(ROOT)
    .filter((f) => f.endsWith('.html'))
    .concat(fs.readdirSync(path.join(ROOT, 'darkness'))
        .filter((f) => f.endsWith('.html'))
        .map((f) => path.join('darkness', f)));

/* src="foo.css" / href='bar.js', optionally already stamped. Skips anything
 * absolute (//cdn..., https://...) since we do not control those caches. */
const ASSET = /(\s(?:src|href)\s*=\s*["'])(?!https?:|\/\/|data:)([^"']+?\.(?:css|js))(?:\?v=[^"']*)?(["'])/gi;

let touched = 0;
let refs = 0;

for (const page of pages) {
    const file = path.join(ROOT, page);
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(ASSET, (_, open, url, quote) => {
        refs++;
        return open + url + '?v=' + stamp + quote;
    });
    if (after !== before) {
        fs.writeFileSync(file, after);
        touched++;
    }
}

fs.writeFileSync(path.join(ROOT, 'version.txt'), stamp + '\n');

console.log('version ' + stamp);
console.log('  stamped ' + refs + ' asset references across ' + touched + ' pages');
console.log('  wrote version.txt');
console.log('\nCommit and push; open tabs pick it up within a few minutes.');
