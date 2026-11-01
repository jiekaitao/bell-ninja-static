/*
 * Assertions for the schedule, the bell and the feedback rules. tests/run.mjs
 * appends this file to the real lib/ code and runs it under V8 and
 * JavaScriptCore, so it can use nothing either engine lacks.
 */

var results = [];

function test(name, fn) {
  try {
    var detail = fn();
    results.push({ name: name, ok: true, detail: detail || '' });
  } catch (err) {
    results.push({ name: name, ok: false, detail: String(err && err.message || err) });
  }
}

function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error((label ? label + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function ok(value, label) {
  if (!value) throw new Error(label || 'expected a true value');
}

/* Sunday 2026-09-06 .. Saturday 2026-09-12, local time. */
function at(dayOfWeek, hhmm, seconds) {
  return new Date(2026, 8, 6 + dayOfWeek, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3)), seconds || 0, 0);
}

var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ------------------------------------------------------------------ *
 * Every minute of a full week
 * ------------------------------------------------------------------ */

var sweep = { bad: [], minutes: 0 };

(function () {
  for (var dow = 0; dow < 7; dow++) {
    for (var mins = 0; mins < 24 * 60; mins++) {
      var now = new Date(2026, 8, 6 + dow, Math.floor(mins / 60), mins % 60, 30, 0);
      var label = DAY_NAMES[dow] + ' ' + Math.floor(mins / 60) + ':' + (mins % 60);
      sweep.minutes++;
      try {
        var reading = readSchedule(now);
        var left = secondsLeft(reading, now.getTime());
        var units = clockUnits(left);
        var parts = units.map(function (unit) { return unit.value; });

        if (!parts.every(function (part) { return /^\d+$/.test(part); })) sweep.bad.push(label + ' clock ' + parts.join(':'));
        if (left < 0) sweep.bad.push(label + ' negative');
        if (left > 86400) sweep.bad.push(label + ' over 24h');
        if (!reading.period) sweep.bad.push(label + ' no period');
        if (!reading.day) sweep.bad.push(label + ' no day');
        if (!reading.caption || /undefined|NaN/.test(reading.caption)) sweep.bad.push(label + ' caption ' + reading.caption);
        if (isNaN(reading.target.getTime())) sweep.bad.push(label + ' invalid target');
        if (reading.target.getTime() <= now.getTime()) sweep.bad.push(label + ' target in the past');
        var share = progress(reading, now.getTime());
        if (!(share >= 0 && share <= 1)) sweep.bad.push(label + ' progress ' + share);
      } catch (err) {
        sweep.bad.push(label + ' threw ' + err.message);
      }
    }
  }
})();

test('the countdown is sound for all 10,080 minutes of a week', function () {
  equal(sweep.minutes, 10080);
  if (sweep.bad.length) throw new Error(sweep.bad.slice(0, 6).join(' | '));
  return sweep.minutes + ' minutes checked';
});

/* ------------------------------------------------------------------ *
 * The printed 2026-2027 Riviera Preparatory bell schedule
 * [weekday, time, text the period must contain, time counted towards]
 * ------------------------------------------------------------------ */

var PUBLISHED = [
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
  [3, '08:55', 'Period 2', '09:41'],
  [3, '14:14', 'Period 8', '15:00'],
  [3, '15:00', "School's out", '15:30'],
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

PUBLISHED.forEach(function (row) {
  test('published: ' + DAY_NAMES[row[0]] + ' ' + row[1] + ' is ' + row[2], function () {
    var now = at(row[0], row[1], 15);
    var reading = readSchedule(now);
    ok(reading.period.indexOf(row[2]) !== -1, 'showed "' + reading.period + '"');
    var target = at(row[0], row[3]);
    equal(reading.target.getTime(), target.getTime(), 'counting towards');
  });
});

/* ------------------------------------------------------------------ *
 * The rest of what the page shows
 * ------------------------------------------------------------------ */

test('day names keep their personality', function () {
  equal(readSchedule(at(0, '10:00')).day, 'Sunday :|');
  equal(readSchedule(at(1, '10:00')).day, 'Monday :(');
  equal(readSchedule(at(6, '10:00')).day, 'Saturday!');
  equal(readSchedule(at(6, '10:00')).period, 'Please enjoy your weekend!');
});

test('hour 24 rolls over to the next midnight', function () {
  var reading = readSchedule(at(1, '23:59', 30));
  equal(reading.target.getTime(), new Date(2026, 8, 8, 0, 0, 0, 0).getTime());
  equal(secondsLeft(reading, at(1, '23:59', 30).getTime()), 30);
});

test('captions are generated from the times', function () {
  equal(readSchedule(at(2, '10:30')).caption, 'Period 3 - 10:04 to 10:50');
  equal(readSchedule(at(2, '10:30')).detail, '10:04 to 10:50');
  equal(readSchedule(at(2, '12:45')).detail, '12:34 to 1:20');
  equal(readSchedule(at(2, '07:00')).detail, 'Early Bird Until 8:00');
  equal(readSchedule(at(3, '15:10')).detail, 'No tutorial today - see you tomorrow!');
});

test("today's list leaves out intermissions and before/after school", function () {
  var bells = readSchedule(at(2, '10:30')).bells.map(function (bell) { return bell.label; });
  equal(bells.length, 10);
  equal(bells[0], 'Period 1');
  equal(bells[2], 'Break Time');
  equal(bells[bells.length - 1], 'Optional Tutorial');
  ok(bells.indexOf('Class Intermission') === -1);
});

test('Wednesday lists no tutorial, weekends list nothing', function () {
  var wednesday = readSchedule(at(3, '10:30')).bells;
  equal(wednesday[wednesday.length - 1].label, 'Period 8');
  equal(readSchedule(at(0, '10:30')).bells.length, 0);
  equal(readSchedule(at(6, '10:30')).bells.length, 0);
});

test('"next" skips intermissions and stops after the last block', function () {
  equal(readSchedule(at(2, '10:30')).next.label, 'Period 4 / Lunch 6th-7th');
  equal(readSchedule(at(2, '10:52')).next.label, 'Period 4 / Lunch 6th-7th');
  equal(readSchedule(at(2, '07:00')).next.label, 'Period 1');
  equal(readSchedule(at(2, '15:10')).next, null);
  equal(readSchedule(at(6, '10:00')).next, null);
});

test('clock hides leading zero units but keeps minutes and seconds', function () {
  function labels(left) { return clockUnits(left).map(function (unit) { return unit.label; }).join(','); }
  equal(labels(5), 'Minutes,Seconds');
  equal(labels(3599), 'Minutes,Seconds');
  equal(labels(3600), 'Hours,Minutes,Seconds');
  equal(labels(90000), 'Days,Hours,Minutes,Seconds');
  equal(clockUnits(65)[0].value, '01');
  equal(clockUnits(65)[1].value, '05');
});

test('tab title countdown reads like a clock', function () {
  equal(shortClock(768), '12:48');
  equal(shortClock(65), '1:05');
  equal(shortClock(3727), '1:02:07');
});

test('printed times use a 12-hour clock', function () {
  equal(clockLabel(535), '8:55');
  equal(clockLabel(750), '12:30');
  equal(clockLabel(800), '1:20');
  equal(clockLabel(1440), '12:00');
});

/* ------------------------------------------------------------------ *
 * Special days
 * ------------------------------------------------------------------ */

var BREAK = [{ from: '2026-09-07', to: '2026-09-09', notice: 'Enjoy the break!' }];
var FINALS = [{
  from: '2026-09-08',
  rows: [['08:00', 'Morning'], ['10:00', 'Final Exam 1'], ['24:00', 'Evening', 'Done']]
}];

test('a date range replaces the schedule with a day off', function () {
  var reading = readSchedule(at(1, '10:00'), BREAK);
  equal(reading.period, 'No school today!');
  equal(reading.notice, 'Enjoy the break!');
  equal(reading.day, 'Monday :(');
  equal(reading.bells.length, 0);
  equal(readSchedule(at(3, '10:00'), BREAK).period, 'No school today!');
  equal(readSchedule(at(4, '10:30'), BREAK).period, 'Period 3');
  equal(readSchedule(at(0, '10:00'), BREAK).period, 'Just one more day please.......');
});

test('a single date can run its own schedule', function () {
  var reading = readSchedule(at(2, '09:00'), FINALS);
  equal(reading.period, 'Final Exam 1');
  equal(reading.target.getTime(), at(2, '10:00').getTime());
  equal(reading.bells.length, 1);
  equal(readSchedule(at(3, '09:00'), FINALS).period, 'Period 2');
});

test('no special days are filled in with guessed dates', function () {
  equal(SPECIAL_DAYS.length, 0);
});

/* ------------------------------------------------------------------ *
 * The bell sound
 * ------------------------------------------------------------------ */

function crossing(dayOfWeek, hhmm, secondsLate) {
  var before = new Date(at(dayOfWeek, hhmm).getTime() - 30000);
  return shouldRing(readSchedule(before), at(dayOfWeek, hhmm).getTime() + (secondsLate || 0) * 1000);
}

test('rings at every bell of the school day', function () {
  ['08:00', '08:51', '08:55', '10:00', '13:24', '15:00', '15:30'].forEach(function (hhmm) {
    equal(crossing(2, hhmm), true, hhmm);
  });
  equal(crossing(5, '08:44'), true, 'Friday');
});

test('stays quiet at 5 PM, midnight and weekends', function () {
  equal(crossing(2, '17:00'), false, '5 PM');
  var lastMinute = at(2, '23:59', 30);
  equal(shouldRing(readSchedule(lastMinute), at(3, '00:00').getTime()), false, 'midnight');
  equal(shouldRing(readSchedule(at(6, '23:59', 30)), at(0, '00:00').getTime()), false, 'Saturday midnight');
});

test('a throttled background tab still rings, a laptop waking up does not', function () {
  equal(crossing(2, '10:50', 60), true, '60s late');
  equal(crossing(2, '10:50', 89), true, '89s late');
  equal(crossing(2, '10:50', 90), false, '90s late');
  equal(crossing(2, '10:50', 3600), false, 'an hour late');
});

test('days off stay quiet', function () {
  var reading = readSchedule(at(1, '10:49', 30), BREAK);
  equal(shouldRing(reading, at(1, '10:50').getTime()), false);
});

/* ------------------------------------------------------------------ *
 * The feedback prompt
 * ------------------------------------------------------------------ */

var NOW = 1801756800000;
var THREE_DAYS = 259200000;

function store(last, options) {
  options = options || {};
  return {
    last: last === undefined ? null : last,
    writes: 0,
    getItem: function () { if (options.readBlocked) throw new Error('Blocked'); return this.last; },
    setItem: function (key, value) {
      if (options.writeBlocked) throw new Error('Full');
      equal(key, FEEDBACK_KEY);
      this.last = value;
      this.writes++;
    }
  };
}

function draws(value) {
  var fn = function () { fn.count++; return value; };
  fn.count = 0;
  return fn;
}

[[0, true], [0.099999, true], [0.1, false], [0.999, false]].forEach(function (row) {
  test('10% sampling boundary at ' + row[0], function () {
    var saved = store();
    equal(drawPrompt(saved, NOW, draws(row[0])), row[1]);
    equal(saved.writes, row[1] ? 1 : 0);
  });
});

[[0, false], [THREE_DAYS - 1, false], [THREE_DAYS, true], [THREE_DAYS + 1, true], [-86400000, false]].forEach(function (row) {
  test('72-hour cooldown / clock skew at age ' + row[0], function () {
    var random = draws(0);
    equal(drawPrompt(store(String(NOW - row[0])), NOW, random), row[1]);
    equal(random.count, row[1] ? 1 : 0);
  });
});

['nonsense', 'NaN', '-1', '0', 'Infinity'].forEach(function (last) {
  test('a corrupt saved time is recoverable: ' + last, function () {
    equal(drawPrompt(store(last), NOW, draws(0)), true);
  });
});

[{ readBlocked: true }, { writeBlocked: true }].forEach(function (options) {
  test('blocked storage suppresses the prompt: ' + JSON.stringify(options), function () {
    equal(drawPrompt(store(null, options), NOW, draws(0)), false);
  });
});

test('the time is saved when the prompt appears', function () {
  var saved = store();
  drawPrompt(saved, NOW, draws(0));
  equal(Number(saved.last), NOW);
  equal(drawPrompt(saved, NOW + 1000, draws(0)), false);
});

test('the email draft carries the schedule context, safely encoded', function () {
  var body = draftBody({
    now: new Date(NOW),
    period: 'Break & lunch? #1 + 2',
    caption: 'Period 4 - 10:54 to 11:40',
    version: '202610051234'
  });
  ok(body.indexOf('Hi Jack,') === 0);
  ok(body.indexOf('Displayed period: Break & lunch? #1 + 2') !== -1);
  ok(body.indexOf('Displayed bell times: Period 4 - 10:54 to 11:40') !== -1);
  ok(body.indexOf('Site version: 202610051234') !== -1);
  ok(/Today's actual schedule: \[attach schedule here\]$/.test(body));

  var link = draftLink(body);
  ok(link.indexOf('mailto:jack@lecturehat.com?subject=Bell%20Ninja%20schedule%20correction&body=') === 0);
  var encoded = link.slice(link.indexOf('&body=') + 6);
  ok(encoded.indexOf('&') === -1 && encoded.indexOf('#') === -1 && encoded.indexOf('+') === -1);
  equal(decodeURIComponent(encoded), body);
});

test('a missing build version reads as not available', function () {
  ok(draftBody({ now: new Date(NOW), period: 'p', caption: 'c', version: '' }).indexOf('Site version: Not available') !== -1);
});

print('__RESULTS__' + JSON.stringify(results));
