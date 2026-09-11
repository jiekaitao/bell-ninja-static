/*
 * Bell Ninja - countdown to the next bell.
 *
 * The schedule is data, not code: each day is a list of rows, and a row runs
 * from where the previous one ended until its own end time. That makes gaps
 * impossible to write by accident (the old if/else chain had three of them,
 * including every minute between midnight and 1 AM) and it means the caption
 * under the clock is generated from the times rather than typed out beside
 * them, so the two can never disagree.
 *
 * One rule matters for correctness across browsers: never build a Date by
 * parsing a string you assembled yourself. `new Date("09 09, 2026  15:30:00")`
 * works in Chrome and returns Invalid Date in Safari and on every browser on
 * iOS, which is why this clock used to render "aN : aN : aN" on iPhones.
 * Everything here goes through the numeric Date constructor.
 */
(function () {
'use strict';

/* ------------------------------------------------------------------ *
 * The schedule
 *
 * [ ends at, what is happening, caption override (optional) ]
 *
 * Source: 2026-2027 Riviera Preparatory Bell Schedule. Riviera Prep is one
 * school for grades 6-12 -- the lunch waves below are how the grades are
 * split -- so there is a single schedule site-wide.
 * ------------------------------------------------------------------ */

var LIBRARY = 'The library *MAY BE* open until 5:00 PM';

var MON_THU = [
    ['08:00', 'Good Morning! School Starts in...', 'Early Bird Until 8:00'],
    ['08:51', 'Period 1'],
    ['08:55', 'Class Intermission'],
    ['09:41', 'Period 2'],
    ['10:00', 'Break Time'],
    ['10:04', 'Class Intermission'],
    ['10:50', 'Period 3'],
    ['10:54', 'Class Intermission'],
    ['11:40', 'Period 4 / Lunch 6th-7th'],
    ['11:44', 'Class Intermission'],
    ['12:30', 'Period 5 / Lunch 8th-9th'],
    ['12:34', 'Class Intermission'],
    ['13:20', 'Period 6 / Lunch 10th-12th'],
    ['13:24', 'Class Intermission'],
    ['14:10', 'Period 7'],
    ['14:14', 'Class Intermission'],
    ['15:00', 'Period 8'],
    ['15:30', 'Optional Tutorial'],
    ['17:00', 'Have a great rest of your day! Library Closes in...', LIBRARY],
    ['24:00', 'Have a great rest of your day!', 'See you tomorrow!']
];

var FRIDAY = [
    ['08:00', 'Good Morning! School Starts in...', 'Early Bird Until 8:00'],
    ['08:44', 'Period 1'],
    ['08:48', 'Class Intermission'],
    ['09:32', 'Period 2'],
    ['09:36', 'Class Intermission'],
    ['10:12', 'Thrive Time / Assembly'],
    ['10:16', 'Class Intermission'],
    ['11:00', 'Period 3'],
    ['11:04', 'Class Intermission'],
    ['11:48', 'Period 4 / Lunch 6th-7th'],
    ['11:52', 'Class Intermission'],
    ['12:36', 'Period 5 / Lunch 8th-9th'],
    ['12:40', 'Class Intermission'],
    ['13:24', 'Period 6 / Lunch 10th-12th'],
    ['13:28', 'Class Intermission'],
    ['14:12', 'Period 7'],
    ['14:16', 'Class Intermission'],
    ['15:00', 'Period 8'],
    ['15:30', 'Optional Tutorial'],
    ['17:00', 'Have a great weekend! Library Closes in...', LIBRARY],
    ['24:00', 'Have a great weekend!', 'Enjoy Your Weekend!']
];

/* Wednesday keeps the Mon-Thurs bells; the optional tutorial runs Monday,
 * Tuesday, Thursday and Friday only. */
var WEDNESDAY = MON_THU.map(function (row) {
    return row[1] === 'Optional Tutorial'
        ? ['15:30', "School's out!", 'No tutorial today - see you tomorrow!']
        : row;
});

var DAYS = [
    { name: 'Sunday :|',  rows: [['24:00', 'Just one more day please.......', 'Enjoy Your Weekend!']] },
    { name: 'Monday :(',  rows: MON_THU },
    { name: 'Tuesday',    rows: MON_THU },
    { name: 'Wednesday',  rows: WEDNESDAY },
    { name: 'Thursday',   rows: MON_THU },
    { name: 'Friday',     rows: FRIDAY },
    { name: 'Saturday!',  rows: [['24:00', 'Please enjoy your weekend!', 'Enjoy Your Weekend!']] }
];

/* Periods a student is expected to be sitting in. classtime.html reads the
 * published flag to show its "Class is ongoing" notice. */
var IN_CLASS = /^(Period|Thrive)/;

/* ------------------------------------------------------------------ *
 * Times, as minutes past midnight
 * ------------------------------------------------------------------ */

function toMinutes(hhmm) {
    return (+hhmm.slice(0, 2)) * 60 + (+hhmm.slice(3));
}

/* 8:55, 12:30, 1:20 -- how the printed schedule writes them. */
function clockLabel(minutes) {
    var h = Math.floor(minutes / 60) % 24;
    var m = minutes % 60;
    return ((h % 12) || 12) + ':' + (m < 10 ? '0' + m : m);
}

/* The row covering `minutes`, plus where it starts. Hour 24 is the last row's
 * end, so some row always matches. */
function rowAt(rows, minutes) {
    for (var i = 0; i < rows.length; i++) {
        if (toMinutes(rows[i][0]) > minutes) {
            return { row: rows[i], startsAt: i === 0 ? 0 : toMinutes(rows[i - 1][0]) };
        }
    }
    var last = rows.length - 1;
    return { row: rows[last], startsAt: last === 0 ? 0 : toMinutes(rows[last - 1][0]) };
}

function readSchedule(now) {
    var day = DAYS[now.getDay()];
    var found = rowAt(day.rows, now.getHours() * 60 + now.getMinutes());
    var endsAt = toMinutes(found.row[0]);

    return {
        day: day.name,
        period: found.row[1],
        caption: found.row[2] ||
            found.row[1] + ' - ' + clockLabel(found.startsAt) + ' to ' + clockLabel(endsAt),
        inClass: IN_CLASS.test(found.row[1]),
        /* Numeric constructor only. Hour 24 rolls over to midnight on its own,
         * and this stays correct across a daylight-saving change. */
        target: new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                         Math.floor(endsAt / 60), endsAt % 60, 0, 0)
    };
}

/* ------------------------------------------------------------------ *
 * The page
 *
 * Two generations of markup are in the wild: index.html and the dark page use
 * ids suffixed per clock ("demo-a", "clockdiv1", ".daysA"), while
 * classtime.html, old-days.html and schedule-b.html use the original
 * unsuffixed names. Accept either, and never assume an element is there.
 * ------------------------------------------------------------------ */

function pick(ids) {
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) { return el; }
    }
    return null;
}

function write(ids, text) {
    var el = pick(ids);
    if (el) { el.innerHTML = text; }
}

function unit(clock, names) {
    if (!clock) { return null; }
    for (var i = 0; i < names.length; i++) {
        var el = clock.querySelector(names[i]);
        if (el) { return el; }
    }
    return null;
}

var UNITS = [
    { seconds: 86400, names: ['.daysA', '.days'] },
    { seconds: 3600,  names: ['.hoursA', '.hours'] },
    { seconds: 60,    names: ['.minutesA', '.minutes'] },
    { seconds: 1,     names: ['.secondsA', '.seconds'] }
];

function paintClock(left) {
    var clock = pick(['clockdiv1', 'clockdiv']);
    var remaining = left;
    var leading = true;

    for (var i = 0; i < UNITS.length; i++) {
        var span = unit(clock, UNITS[i].names);
        var value = Math.floor(remaining / UNITS[i].seconds);
        remaining -= value * UNITS[i].seconds;
        if (!span) { continue; }

        span.innerHTML = i === 0 ? String(value) : ('0' + value).slice(-2);

        /* A bell is never more than a class away, so Days and Hours read 0
         * all day. Hide the units above the largest non-zero one instead of
         * showing a row of zeroes. Minutes and seconds always stay. */
        leading = leading && value === 0;
        var box = span.parentElement;
        if (box && box !== clock) {
            box.style.display = (leading && i < UNITS.length - 2) ? 'none' : '';
        }
    }
}

function playBell() {
    var bell = document.getElementById('bell');
    if (!bell) { return; }
    try {
        /* iOS refuses audio no user gesture started, and rejects the promise.
         * Unhandled, that rejection would tear down the caller. */
        var played = bell.play();
        if (played && played.catch) { played.catch(function () {}); }
    } catch (err) { /* no audio on this page */ }
}

/* ------------------------------------------------------------------ *
 * Running
 * ------------------------------------------------------------------ */

var ticker = null;

function start() {
    /* Re-entered from the panel's onclick and from the tick that crosses a
     * bell. One clock at a time, or the countdown ticks several times a
     * second and the bell rings over itself. */
    if (ticker) { clearInterval(ticker); }

    var current = readSchedule(new Date());
    window.classis = current.inClass;

    write(['demo-a', 'demo'], current.period);
    write(['demo3-a', 'demo3'], current.day);
    write(['demo4-a', 'demo4'], current.caption);

    function tick() {
        var left = Math.round((current.target.getTime() - Date.now()) / 1000);
        if (left <= 0) {
            playBell();
            start();            // next period, new target
            return;
        }
        paintClock(left);
    }

    tick();
    ticker = setInterval(tick, 1000);
}

window.scheduleA = start;

/* index.html starts the clock when you tap the schedule panel; the older pages
 * have no such trigger and expect the script to fill itself in. */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

})();
