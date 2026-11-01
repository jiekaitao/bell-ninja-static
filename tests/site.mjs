#!/usr/bin/env node
/*
 * Checks the built site in out/, the files GitHub Pages will actually serve.
 * Run it after `npm run build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../out', import.meta.url));
let failures = 0;
let passed = 0;

function check(name, ok, detail = '') {
  if (ok) passed += 1;
  else {
    failures += 1;
    console.log('  FAIL  ' + name + (detail ? '  ' + detail : ''));
  }
}

if (!existsSync(OUT)) {
  console.log('No out/ folder. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const read = (file) => readFileSync(join(OUT, file), 'utf8');
const files = walk(OUT);
const pages = files.filter((file) => file.endsWith('.html'));

/* The addresses people have saved. /legends and /darkness only keep working if
   each is a folder with an index.html. */
for (const file of ['index.html', '404.html', 'legends/index.html', 'darkness/index.html', 'lunch/index.html']) {
  check(file + ' is built', existsSync(join(OUT, file)));
}

for (const file of ['CNAME', 'ads.txt', 'favicon.ico', 'manifest.json', 'version.txt', 'audio/guitarbell.mp3', 'img/hamster.jpg']) {
  check(file + ' is published', existsSync(join(OUT, file)));
}

check('CNAME points at bell.ninja', read('CNAME').trim() === 'bell.ninja');
check('version.txt holds a stamp', /^\d{12}$/.test(read('version.txt').trim()));

const adsClient = read('index.html').match(/ca-pub-(\d+)/);
check('the page loads AdSense', Boolean(adsClient));
check('ads.txt authorizes the publisher the page uses', Boolean(adsClient) && read('ads.txt').includes('pub-' + adsClient[1]));

const manifest = JSON.parse(read('manifest.json'));
for (const icon of manifest.icons) {
  check('manifest icon exists: ' + icon.src, existsSync(join(OUT, icon.src)));
}
check('the installed app starts at the home page', manifest.start_url === '/');

for (const page of pages) {
  const name = relative(OUT, page);
  const html = readFileSync(page, 'utf8');
  const viewport = html.match(/<meta name="viewport" content="([^"]*)"/);

  check(name + ': starts with a DOCTYPE', /^\s*<!DOCTYPE html>/i.test(html));
  check(name + ': sets a device-width viewport', Boolean(viewport) && viewport[1].includes('width=device-width'));
  check(name + ': leaves pinch-zoom on', Boolean(viewport) && !/user-scalable=(no|0)|maximum-scale=1\b/.test(viewport[1]));

  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const raw = match[1];
    if (/^(?:https?:)?\/\/|^data:|^mailto:|^#/.test(raw)) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    const target = clean.startsWith('/') ? join(OUT, clean) : join(dirname(page), clean);
    const found = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    check(name + ': ' + raw + ' resolves', found);
  }
}

const home = read('index.html');
const WATERMARKED = ['legendary_ninja', 'istock'];
check('no watermarked stock art is shipped', !WATERMARKED.some((word) => files.join(' ').toLowerCase().includes(word)));
check('jQuery is gone', !/jquery/i.test(home));

console.log('site: ' + passed + ' passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
