/*
 * tests/entry-jsc.js -- run the core suite inside JavaScriptCore (Safari's engine).
 *
 * Invoked as:
 *   jsc -e "var TARGET='bell-hs.js'; var ENTRY='scheduleA'; var CLOCK='clockdiv1';
 *            var SUFFIX='A'; var DEMO='demo-a'; load('tests/entry-jsc.js');"
 *
 * Each script gets its own jsc process because bell-hs.js and bell-ms.js both
 * define a global `regularSchedule` and would clobber each other.
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
