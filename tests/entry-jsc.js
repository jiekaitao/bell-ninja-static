/*
 * tests/entry-jsc.js -- run the core suite inside JavaScriptCore (Safari's engine).
 *
 * Invoked as:
 *   jsc -e "var TARGET='bell-hs.js'; var ENTRY='scheduleA'; var CLOCK='clockdiv1';
 *            var SUFFIX='A'; var DEMO='demo-a'; load('tests/entry-jsc.js');"
 *
 * jsc is Safari's engine, so this is the only way to catch the Date-parsing
 * differences that broke the site on iPhones without an actual iPhone.
 */
load('tests/lib/shim.js');
load('tests/lib/core-suite.js');

BellTest.installAll(this);

load(TARGET);

var results = BellTest.runCoreSuite([{
    name: TARGET,
    entry: this[ENTRY],
    clockId: CLOCK,
    suffix: SUFFIX,
    demoId: DEMO,
    stepMinutes: 1,
    publishedSchedule: (typeof PUBLISHED !== 'undefined' && PUBLISHED) ? BellTest.PUBLISHED_SCHEDULE : null
}]);

print('__BELLTEST_JSON__' + JSON.stringify(results));
