/*
 * tests/lib/core-suite.js
 *
 * Behavioural tests for the shipped countdown scripts. Runs unchanged under
 * node (V8 / Chrome) and jsc (JavaScriptCore / Safari), which is the whole
 * point: the historical iOS breakage is a JavaScriptCore-only Date bug, so a
 * test that only ever runs on V8 can never see it.
 */

var BellTest = (typeof BellTest !== 'undefined') ? BellTest : {};

/* Sunday 2026-09-06 .. Saturday 2026-09-12, local time. */
BellTest.WEEK_START = [2026, 8, 6];

BellTest.DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

BellTest.readClock = function (clockId, suffix) {
    var clock = BellTest.els[clockId];
    if (!clock) return null;
    function val(name) {
        var el = clock.children[name + suffix];
        return el ? el.innerHTML : undefined;
    }
    return {
        days: val('days'),
        hours: val('hours'),
        minutes: val('minutes'),
        seconds: val('seconds')
    };
};

BellTest.resetDom = function () {
    for (var k in BellTest.els) {
        if (Object.prototype.hasOwnProperty.call(BellTest.els, k)) delete BellTest.els[k];
    }
    BellTest.timers.length = 0;
    BellTest.alerts.length = 0;
};

/*
 * Drive one schedule entry point across every minute of a full week and
 * collect anything a user would see as broken.
 */
BellTest.sweep = function (opts) {
    var entry = opts.entry;          /* e.g. scheduleA */
    var clockId = opts.clockId;      /* 'clockdiv1' */
    var suffix = opts.suffix;        /* 'A' */
    var demoId = opts.demoId;        /* 'demo-a' */
    var stepMinutes = opts.stepMinutes || 1;

    var bad = {
        invalidClock: [],   /* NaN / undefined / non-numeric in the countdown */
        negative: [],       /* countdown running backwards */
        tooFar: [],         /* countdown longer than a day => wrong target */
        emptyPeriod: [],    /* nothing to show for "what period is it" */
        threw: []           /* exception escaped the schedule function */
    };
    var fallbackMinutes = [];   /* minutes that fall through every branch */
    var checked = 0;

    var RealDate = BellTest.RealDate;

    for (var dow = 0; dow < 7; dow++) {
        for (var mins = 0; mins < 24 * 60; mins += stepMinutes) {
            var d = new RealDate(
                BellTest.WEEK_START[0], BellTest.WEEK_START[1], BellTest.WEEK_START[2] + dow,
                Math.floor(mins / 60), mins % 60, 30, 0
            );
            BellTest.nowMs = d.getTime();
            BellTest.resetDom();

            var label = BellTest.DAY_NAMES[d.getDay()] + ' ' +
                ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);

            try {
                entry();
            } catch (err) {
                bad.threw.push(label + ' -> ' + (err && err.message ? err.message : String(err)));
                continue;
            }
            checked++;

            var c = BellTest.readClock(clockId, suffix);
            if (!c) { bad.invalidClock.push(label + ' -> no clock element'); continue; }

            var parts = [c.days, c.hours, c.minutes, c.seconds];
            var numeric = true;
            for (var i = 0; i < parts.length; i++) {
                var v = parts[i];
                if (v === undefined || v === null || v === '' || !/^-?\d+$/.test(String(v))) {
                    numeric = false;
                }
            }
            if (!numeric) {
                if (bad.invalidClock.length < 8) {
                    bad.invalidClock.push(label + ' -> ' + JSON.stringify(c));
                }
                continue;
            }

            var total = (parseInt(c.days, 10) * 86400) + (parseInt(c.hours, 10) * 3600) +
                (parseInt(c.minutes, 10) * 60) + parseInt(c.seconds, 10);
            if (total < 0) {
                if (bad.negative.length < 8) bad.negative.push(label + ' -> ' + total + 's');
            } else if (total > 86400) {
                if (bad.tooFar.length < 8) bad.tooFar.push(label + ' -> ' + total + 's');
            }

            var demo = BellTest.els[demoId] ? BellTest.els[demoId].innerHTML : undefined;
            if (demo === undefined || demo === null || String(demo) === '' ||
                String(demo) === 'undefined') {
                if (bad.emptyPeriod.length < 8) bad.emptyPeriod.push(label + ' -> ' + demo);
            }
            if (/Wow, devoted/.test(String(demo))) {
                if (fallbackMinutes.length < 40) fallbackMinutes.push(label);
            }
        }
    }

    return { bad: bad, checked: checked, fallbackMinutes: fallbackMinutes };
};

/*
 * Direct probe of the engine's Date parser using the exact string shapes the
 * site builds. This is the single behaviour that differs between V8 and
 * JavaScriptCore and it is why iOS was broken.
 */
BellTest.dateParserProbe = function () {
    var RealDate = BellTest.RealDate;
    var samples = [
        '09 09, 2026  15:30:00',
        '09 09, 2026  8:00:00',
        '12 25, 2026  24:00:00'
    ];
    var results = [];
    for (var i = 0; i < samples.length; i++) {
        var t = new RealDate(samples[i]).getTime();
        results.push({ input: samples[i], valid: t === t });
    }
    return results;
};

/*
 * Spot-checks against the printed 2026-2027 Riviera Preparatory bell schedule.
 * Each row is [weekday, "HH:MM", text the period line must contain,
 * "HH:MM" the countdown must be running towards].
 */
BellTest.PUBLISHED_SCHEDULE = [
    /* Monday - Thursday */
    [1, '07:30', 'School Starts', '08:00'],
    [1, '08:00', 'Period 1', '08:51'],
    [1, '08:50', 'Period 1', '08:51'],
    [1, '08:52', 'Intermission', '08:55'],
    [1, '08:55', 'Period 2', '09:41'],
    [2, '09:41', 'Break', '10:00'],
    [2, '10:00', 'Intermission', '10:04'],
    [2, '10:04', 'Period 3', '10:50'],
    [2, '10:54', 'Period 4', '11:40'],
    [4, '11:44', 'Period 5', '12:30'],
    [4, '12:34', 'Period 6', '13:20'],
    [4, '13:24', 'Period 7', '14:10'],
    [4, '14:14', 'Period 8', '15:00'],
    [1, '15:00', 'Optional Tutorial', '15:30'],
    /* Wednesday keeps the Mon-Thurs bells but has no optional tutorial. */
    [3, '08:55', 'Period 2', '09:41'],
    [3, '14:14', 'Period 8', '15:00'],
    [3, '15:00', "School's out", '15:30'],
    /* Friday */
    [5, '08:00', 'Period 1', '08:44'],
    [5, '08:48', 'Period 2', '09:32'],
    [5, '09:36', 'Thrive', '10:12'],
    [5, '10:16', 'Period 3', '11:00'],
    [5, '11:04', 'Period 4', '11:48'],
    [5, '11:52', 'Period 5', '12:36'],
    [5, '12:40', 'Period 6', '13:24'],
    [5, '13:28', 'Period 7', '14:12'],
    [5, '14:16', 'Period 8', '15:00']
];

BellTest.checkPublishedSchedule = function (spec, table) {
    var RealDate = BellTest.RealDate;
    var wrong = [];

    for (var i = 0; i < table.length; i++) {
        var row = table[i];
        var dow = row[0], hhmm = row[1], expectPeriod = row[2], expectTarget = row[3];
        var h = parseInt(hhmm.slice(0, 2), 10), m = parseInt(hhmm.slice(3), 10);

        /* WEEK_START is a Sunday, so +dow lands on the weekday we want. */
        var now = new RealDate(BellTest.WEEK_START[0], BellTest.WEEK_START[1],
            BellTest.WEEK_START[2] + dow, h, m, 15, 0);
        BellTest.nowMs = now.getTime();
        BellTest.resetDom();
        spec.entry();

        var label = BellTest.DAY_NAMES[dow] + ' ' + hhmm;
        var shownPeriod = String(BellTest.els[spec.demoId] ? BellTest.els[spec.demoId].innerHTML : '');
        if (shownPeriod.indexOf(expectPeriod) === -1) {
            wrong.push(label + ': expected "' + expectPeriod + '", got "' + shownPeriod + '"');
            continue;
        }

        var c = BellTest.readClock(spec.clockId, spec.suffix);
        var shownLeft = (parseInt(c.days, 10) * 86400) + (parseInt(c.hours, 10) * 3600) +
            (parseInt(c.minutes, 10) * 60) + parseInt(c.seconds, 10);

        var th = parseInt(expectTarget.slice(0, 2), 10), tm = parseInt(expectTarget.slice(3), 10);
        var target = new RealDate(now.getFullYear(), now.getMonth(), now.getDate(), th, tm, 0, 0);
        var expectLeft = Math.floor((target.getTime() - now.getTime()) / 1000);

        /* One second of slack: the clock renders whole seconds. */
        if (Math.abs(shownLeft - expectLeft) > 1) {
            wrong.push(label + ': counting to a target ' + (shownLeft - expectLeft) +
                's off ' + expectTarget);
        }
    }

    return wrong;
};

BellTest.runCoreSuite = function (scheduleEntries) {
    var out = [];

    function test(name, fn) {
        try {
            var r = fn();
            out.push({ name: name, ok: r.ok, detail: r.detail || '' });
        } catch (err) {
            out.push({ name: name, ok: false, detail: 'threw: ' + (err && err.message || err) });
        }
    }

    for (var i = 0; i < scheduleEntries.length; i++) {
        (function (spec) {
            var res = null;
            function sweep() {
                if (!res) res = BellTest.sweep(spec);
                return res;
            }

            test(spec.name + ': countdown never renders NaN/undefined', function () {
                var r = sweep();
                return {
                    ok: r.bad.invalidClock.length === 0 && r.bad.threw.length === 0,
                    detail: r.bad.threw.concat(r.bad.invalidClock).slice(0, 6).join(' | ') ||
                        (r.checked + ' minutes checked')
                };
            });

            test(spec.name + ': countdown never runs negative', function () {
                var r = sweep();
                return {
                    ok: r.bad.negative.length === 0,
                    detail: r.bad.negative.slice(0, 6).join(' | ') || (r.checked + ' minutes checked')
                };
            });

            test(spec.name + ': countdown target is always within 24h', function () {
                var r = sweep();
                return {
                    ok: r.bad.tooFar.length === 0,
                    detail: r.bad.tooFar.slice(0, 6).join(' | ') || (r.checked + ' minutes checked')
                };
            });

            test(spec.name + ': always names the current period', function () {
                var r = sweep();
                return {
                    ok: r.bad.emptyPeriod.length === 0,
                    detail: r.bad.emptyPeriod.slice(0, 6).join(' | ') || (r.checked + ' minutes checked')
                };
            });

            if (spec.publishedSchedule) {
                test(spec.name + ': matches the printed 2026-2027 bell schedule', function () {
                    var wrong = BellTest.checkPublishedSchedule(spec, spec.publishedSchedule);
                    return {
                        ok: wrong.length === 0,
                        detail: wrong.slice(0, 5).join(' | ') ||
                            (spec.publishedSchedule.length + ' published bell times verified')
                    };
                });
            }

            test(spec.name + ': no minute falls through every schedule branch', function () {
                var r = sweep();
                return {
                    ok: r.fallbackMinutes.length === 0,
                    detail: r.fallbackMinutes.length
                        ? r.fallbackMinutes.length + '+ gap minutes, e.g. ' + r.fallbackMinutes.slice(0, 6).join(', ')
                        : (r.checked + ' minutes checked')
                };
            });
        })(scheduleEntries[i]);
    }

    return out;
};
