#!/usr/bin/env node
/*
 * Runs tests/suite.js against the real lib/ files under two JavaScript engines.
 *
 *   V8              node        stands in for Chrome, Edge, Android
 *   JavaScriptCore  macOS jsc   stands in for Safari, iPhone, iPad, Mac
 *
 * The bug that once made Bell Ninja unusable on Apple devices was a Date
 * parsing difference between these two, so a test that only runs on Node could
 * never see it. Where jsc is missing, those checks report as skipped.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

process.removeAllListeners('warning');

const ROOT = new URL('../', import.meta.url);
const JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc';

/* Order matters: schedule.ts reads SPECIAL_DAYS. They share one scope here, the
   same way a bundler would join them. */
const SOURCES = ['lib/special-days.ts', 'lib/feedback.ts', 'lib/schedule.ts'];

function plainScript(file) {
  const source = readFileSync(new URL(file, ROOT), 'utf8');
  return stripTypeScriptTypes(source, { mode: 'strip' })
    .replace(/^import\b.*$/gm, '')
    .replace(/^export\s+/gm, '');
}

const program = SOURCES.map(plainScript).join('\n') + '\n' +
  readFileSync(new URL('tests/suite.js', ROOT), 'utf8');

function inV8() {
  let output = '';
  vm.runInNewContext(program, { print: (line) => { output += line + '\n'; } }, { filename: 'suite.js' });
  return output;
}

function inJsc() {
  const dir = mkdtempSync(join(tmpdir(), 'bell-ninja-'));
  const file = join(dir, 'suite.js');
  try {
    writeFileSync(file, program);
    const run = spawnSync(JSC, [file], { encoding: 'utf8' });
    if (run.status !== 0) throw new Error('jsc failed: ' + run.stderr + run.stdout);
    return run.stdout;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function report(engine, output) {
  const line = output.split('\n').find((text) => text.startsWith('__RESULTS__'));
  if (!line) throw new Error(engine + ' produced no results:\n' + output);
  const results = JSON.parse(line.slice('__RESULTS__'.length));
  const failed = results.filter((result) => !result.ok);
  for (const result of failed) console.log('  FAIL  [' + engine + '] ' + result.name + '  ' + result.detail);
  console.log(engine + ': ' + (results.length - failed.length) + ' passed, ' + failed.length + ' failed');
  return failed.length;
}

let failures = report('V8', inV8());
if (existsSync(JSC)) failures += report('JavaScriptCore', inJsc());
else console.log('JavaScriptCore: skipped (jsc only ships with macOS)');

process.exit(failures ? 1 : 0);
