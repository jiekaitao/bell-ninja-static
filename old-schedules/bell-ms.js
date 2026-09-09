/*
 * ===========================================================================
 * Everything below lives inside this function on purpose.
 * ===========================================================================
 * The schedule state -- period, bmessage, timel, the countdown target -- used
 * to be written without `var`, which made all of it global. The dark-mode page
 * loads bell-hs.js and bell-ms.js together, so the high school and middle
 * school clocks shared one set of variables and overwrote each other on every
 * tick: each one ended up displaying the other school's period and counting
 * down to the other school's bell.
 *
 * Declaring the state here keeps each file's schedule to itself. Only the
 * entry point is published, because index.html calls it from an onclick
 * attribute.
 *
 * (The body is left un-indented so this stays a small, reviewable change
 * against the original file.)
 */
(function () {

var period,
    bmessage,
    timel,
    classis,
    timex,
    dayweek,
    distance,
    deadline,
    audio,
    finalseconds,
    timeoutx;

/*
 * ---------------------------------------------------------------------------
 * bellTargetTime -- cross-browser countdown target
 * ---------------------------------------------------------------------------
 * The countdown used to build its target time like this:
 *
 *     today = mm + ' ' + dd + ', ' + yyyy + ' ';
 *     new Date(today + " " + timel);       // -> "09 09, 2026  15:30:00"
 *
 * V8 (Chrome, Edge) happily parses that non-standard shape. JavaScriptCore --
 * the engine behind Safari, and on iOS behind *every* browser including
 * Chrome and Firefox -- returns Invalid Date for it. Every number downstream
 * then became NaN and the clock rendered as "aN : aN : aN", which is the
 * whole reason Bell Ninja never worked on iPhones, iPads or Macs.
 *
 * The numeric Date constructor is the only form every engine is required to
 * support, so the target is built from numbers and never parsed from a string.
 *
 * bell-hs.js and bell-ms.js are each loaded on their own, and together on the
 * dark-mode page, so the definition is guarded: whichever file loads first
 * installs it and the second one leaves it alone.
 */
var bellTargetTime = bellTargetTime || function (timeString, from) {
    var now = from ? new Date(from.getTime()) : new Date();
    var parts = String(timeString).split(':');

    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var s = parseInt(parts[2], 10);
    if (isNaN(h)) { h = 0; }
    if (isNaN(m)) { m = 0; }
    if (isNaN(s)) { s = 0; }

    // Hour 24 is used to mean "end of today"; the numeric constructor rolls
    // that over to midnight tomorrow on its own.
    var target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s, 0);

    // A target that has already gone by belongs to tomorrow. Without this the
    // clock counts backwards whenever a period boundary is a moment behind us.
    if (target.getTime() <= now.getTime()) {
        target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m, s, 0);
    }

    return target;
};

/*
 * The countdown markup exists in two generations. index.html and the dark-mode
 * page use ids suffixed per clock ("demo-a", "clockdiv1", ".daysA"); the older
 * pages -- classtime.html, old-days.html, schedule-b.html -- use the original
 * unsuffixed names. They used to be served by a separate bell.js that is not
 * in this repository, so their clocks had been dead.
 *
 * These helpers accept either spelling and return null instead of throwing
 * when a page simply does not have one of the elements.
 */
var bellPick = bellPick || function (ids) {
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) { return el; }
    }
    return null;
};

var bellSetText = bellSetText || function (ids, value) {
    var el = bellPick(ids);
    if (el) { el.innerHTML = value; }
    return el;
};

var bellPickIn = bellPickIn || function (root, selectors) {
    if (!root) { return null; }
    for (var i = 0; i < selectors.length; i++) {
        var el = root.querySelector(selectors[i]);
        if (el) { return el; }
    }
    return null;
};



function regularScheduleMiddleSchool(timex) {
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 8.45) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 8:45"
        timel = "8:45:00";
        classis = true;
    } else if (timex >= 8.45 && timex < 8.50) {
        bmessage = "Period 1 & 2 Intermission - 8:45 to 8:50"
        period = "Class Intermission"
        timel = "8:50:00";
        classis = false;
    } else if (timex >= 8.50 && timex < 9.35) {
        period = "Period 2"
        bmessage = "Period 2 - 8:50 to 9:35"
        timel = "9:35:00";
        classis = true;
    } else if (timex >= 9.35 && timex < 9.50) {
        bmessage = "Break"
        period = "Break Time (20 min.)"
        timel = "9:50:00";
        classis = false;
    } else if (timex >= 9.50 && timex < 10.35) {
        period = "Period 3"
        bmessage = "Period 3 - 9:50 to 10:35"
        timel = "10:35:00";
        classis = true;
    } else if (timex >= 10.35 && timex < 10.40) {
        bmessage = "Period 3 & 4 Intermission - 10:35 to 10:40"
        period = "Class Intermission"
        timel = "10:40:00";
        classis = false;
    } else if (timex >= 10.40 && timex < 11.25) {
        period = "Period 4"
        bmessage = "Period 4 - 10:40 to 11:30"
        timel = "11:25:00";
        classis = true;
    }
      else if (timex >= 11.25 && timex < 11.30) {
          period = "Period 4 & 5 intermission"
          bmessage = "Class Intermission"
          timel = "11:30:00";
          classis = true;
    } else if (timex >= 11.30 && timex < 11.55) {
        bmessage = "Period 5A - 11:30 to 11:55"
        period = "Period 5a 6 and 7 Lunch"
        timel = "11:55:00";
        classis = true;
    } else if (timex >= 11.55 && timex < 12.20) {
        bmessage = "Period 5B 8 Lunch - 11:55 to 12:20"
        period = "Period 5b"
        timel = "12:20:00";
        classis = true;
    } else if (timex >= 12.20 && timex < 12.25) {
        bmessage = "Period 5 & 6 Intermission - 12:20 to 12:25"
        period = "Class Intermission"
        timel = "12:25:00";
        classis = false;
    } else if (timex >= 12.25 && timex < 12.50) {
        bmessage = "Period 6A - 12:25 to 12:50"
        period = "Period 6a"
        timel = "12:50:00";
        classis = true;
    } else if (timex >= 12.50 && timex < 13.15) {
        bmessage = "Period 6B - 12:50 to 1:15"
        period = "Period 6b"
        timel = "13:15:00";
        classis = true;
    } else if (timex >= 13.15 && timex < 13.20) {
        bmessage = "Period 6 & 7 Intermission - 1:15 to 1:20"
        period = "Class Intermission"
        timel = "13:15:00";
        classis = false;
    } else if (timex >= 13.20 && timex < 14.10) {
        bmessage = "Period 7 - 1:20 to 2:10"
        period = "Period 7"
        timel = "14:10:00";
        classis = false;
    } else if (timex >= 14.10 && timex < 14.15) {
        bmessage = "Period 7 & 8 Intermission - 2:10 to 2:15"
        period = "Class Intermission"
        timel = "14:15:00";
        classis = false;
    } else if (timex >= 14.15 && timex < 15.00) {
        bmessage = "Period 8 - 2:15 to 3:00"
        period = "Period 8"
        timel = "15:00:00";
        classis = false;
    } else if (timex >= 15.00 && timex < 15.30) {
        bmessage = "Optional Tutorial - 3:00 to 3:30"
        period = "Optional Tutorial"
        timel = "15:30:00";
        classis = false;
    } else if (timex >= 15.30 && timex < 17.00) {
        bmessage = "The library *MAY BE* open until 5:00 PM"
        period = "Have a great rest of your day! Library Closes in..."
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Wow, devoted. Get to class!"
        timel = "1:00:00";
        classis = false;
    }
};

function EvenBlock(timex) {
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 9.30) {
        period = "Period 2"
        bmessage = "Period 2 - 8:00 to 9:30"
        timel = "9:30:00";
        classis = true;
    } else if (timex >= 9.30 && timex < 9.45) {
        bmessage = "Break - 9:30 to 9:45"
        period = "Break Time (15 min.)"
        timel = "9:45:00";
        classis = false;
    } else if (timex >= 9.45 && timex < 11.15) {
        period = "Period 4"
        bmessage = "Period 4 - 9:45 to 11:15"
        timel = "11:15:00";
        classis = true;
    } else if (timex >= 11.15 && timex < 11.20) {
        bmessage = "Period 4 & 5 Intermission - 11:15 to 11:20"
        period = "Class Intermission"
        timel = "11:20:00";
        classis = false;
    } else if (timex >= 11.20 && timex < 11.45) {
        period = "Period 5A 6 and 7 Lunch"
        bmessage = "Period 5a - 11:20 to 11:45"
        timel = "11:45:00";
        classis = true;
    } else if (timex >= 11.45 && timex < 12.10) {
        period = "Period 5B 8 Lunch"
        bmessage = "Period 5b - 11:45 to 12:10"
        timel = "12:10:00";
        classis = true;
    } else if (timex >= 12.10 && timex < 12.15) {
        bmessage = "Period 5 & 6 Intermission - 12:10 to 12:15"
        period = "Class Intermission"
        timel = "12:15:00";
        classis = false;
    } else if (timex >= 12.15 && timex < 12.40) {
        bmessage = "Period 6A - 12:15 to 12:40"
        period = "Period 6a"
        timel = "12:40:00";
        classis = true;
    } else if (timex >= 12.40 && timex < 13.05) {
        bmessage = "Period 6B - 12:40 to 1:05"
        period = "Period 6b"
        timel = "13:05:00";
        classis = true;
    } else if (timex >= 13.05 && timex < 13.10) {
        bmessage = "Period 6 & 8 Intermission - 1:05 to 1:10"
        period = "Class Intermission"
        timel = "13:10:00";
        classis = false;
    } else if (timex >= 13.10 && timex < 14.45) {
        bmessage = "Period 8 - 1:10 to 2:45"
        period = "Period 8"
        timel = "14:45:00";
        classis = false;
    } else if (timex >= 14.45 && timex < 17.00) {
        bmessage = "The library *MAY BE* open until 5:00 PM"
        period = "Have a great rest of your day! Library Closes in..."
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Damn you're up late! Get to class!"
        timel = "1:00:00";
        classis = false;
    }
};

function OddBlock(timex) {
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 9.30) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 9:30"
        timel = "9:30:00";
        classis = true;
    } else if (timex >= 9.30 && timex < 9.45) {
        bmessage = "Break - 9:30 to 9:45"
        period = "Break Time (15 min.)"
        timel = "9:45:00";
        classis = false;
    } else if (timex >= 9.45 && timex < 11.15) {
        period = "Period 3"
        bmessage = "Period 3 - 9:45 to 11:15"
        timel = "11:15:00";
        classis = true;
    } else if (timex >= 11.15 && timex < 11.20) {
        bmessage = "Period 3 & 5 Intermission - 11:15 to 11:20"
        period = "Class Intermission"
        timel = "11:20:00";
        classis = false;
    } else if (timex >= 11.20 && timex < 11.50) {
        period = "Period 5A 6 and 7 Lunch"
        bmessage = "Period 5a - 11:20 to 11:50"
        timel = "11:50:00";
        classis = true;
    }  else if (timex >= 11.50 && timex < 12.20) {
        period = "Period 5B 8 Lunch"
        bmessage = "Period 5b - 11:50 to 12:20"
        timel = "12:20:00";
        classis = true;
    } else if (timex >= 12.20 && timex < 12.25) {
        bmessage = "Period 5 & 6 Intermission - 12:20 to 12:25"
        period = "Class Intermission"
        timel = "12:25:00";
        classis = false;
    } else if (timex >= 12.25 && timex < 12.55) {
        bmessage = "Period 6A - 12:25 to 12:55"
        period = "Period 6a"
        timel = "12:55:00";
        classis = true;
    } else if (timex >= 12.55 && timex < 13.20) {
        bmessage = "Period 6B - 12:55 to 1:20"
        period = "Period 6b"
        timel = "13:20:00";
        classis = true;
    } else if (timex >= 13.20 && timex < 13.25) {
        bmessage = "Period 6 & 7 Intermission - 1:20 to 1:25"
        period = "Class Intermission"
        timel = "13:25:00";
        classis = false;
    } else if (timex >= 13.25 && timex < 15.00) {
        bmessage = "Period 7 - 1:25 to 3:00"
        period = "Period 7"
        timel = "15:00:00";
        classis = false;
    } else if (timex >= 15.00 && timex < 15.30) {
        bmessage = "Optional Tutorial - 3:00 to 3:30"
        period = "Optional Tutorial"
        timel = "15:30:00";
        classis = false;
    } else if (timex >= 15.30 && timex < 17.00) {
        bmessage = "The library *MAY BE* open until 5:00 PM"
        period = "Have a great rest of your day! Library Closes in..."
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Why are you on here right now? Get to class!"
        timel = "1:00:00";
        classis = false;
    }
}


function AssemblySchedule(timex) {
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 8.40) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 8:40"
        timel = "8:40:00";
        classis = true;
    } else if (timex >= 8.40 && timex < 8.45) {
        bmessage = "Period 1 & 2 Intermission - 8:40 to 8:45"
        period = "Class Intermission"
        timel = "8:45:00";
        classis = false;
    } else if (timex >= 8.45 && timex < 9.25) {
        period = "Period 2, Class Meeting"
        bmessage = "Period 2 - 8:45 to 9:25"
        timel = "9:25:00";
        classis = true;
    } else if (timex >= 9.25 && timex < 10.10) {
        bmessage = "Break for those not in Class Meeting - 9:25 to 10:10"
        period = "Assembly"
        timel = "10:10:00";
        classis = false;
    } else if (timex >= 10.10 && timex < 10.15) {
        bmessage = "Class Intermission - 10.10 to 10:15"
        period = "Break"
        timel = "10:15:00";
        classis = false;
    } else if (timex >= 10.15 && timex < 10.55) {
        period = "Period 3"
        bmessage = "Period 3 - 10:15 to 10:55"
        timel = "10:55:00";
        classis = true;
    } else if (timex >= 10.55 && timex < 11.00) {
        bmessage = "Period 3 & 4 Intermission - 10:55 to 11:00"
        period = "Class Intermission"
        timel = "11:00:00";
        classis = false;
    } else if (timex >= 11.00 && timex < 11.40) {
        period = "Period 4"
        bmessage = "Period 4 - 11:00 to 11:40"
        timel = "11:40:00";
        classis = true;
    } else if (timex >= 11.40 && timex < 11.45) {
        bmessage = "Period 4 & 5 Intermission - 11:40 to 11:45"
        period = "Class Intermission"
        timel = "11:45:00";
        classis = false;
    } else if (timex >= 11.45 && timex < 12.10) {
        bmessage = "Period 5A 6 and 7 Lunch - 11:45 to 12:10"
        period = "Period 5a"
        timel = "12:10:00";
        classis = true;
    } else if (timex >= 12.10 && timex < 12.35) {
        bmessage = "Period 5B 8 Lunch - 12:10 to 12:35"
        period = "Period 5b"
        timel = "12:35:00";
        classis = true;
    } else if (timex >= 12.35 && timex < 12.40) {
        bmessage = "Period 5 & 6 Intermission - 12:35 to 12:40"
        period = "Class Intermission"
        timel = "12:40:00";
        classis = false;
    } else if (timex >= 12.40 && timex < 13.05) {
        bmessage = "Period 6A - 12:40 to 1:05"
        period = "Period 6a"
        timel = "13:05:00";
        classis = true;
    } else if (timex >= 13.05 && timex < 13.30) {
        bmessage = "Period 6B - 1:05 to 1:30"
        period = "Period 6b"
        timel = "13:30:00";
        classis = true;
    } else if (timex >= 13.30 && timex < 13.35) {
        bmessage = "Period 6 & 7 Intermission - 1:30 to 1:35"
        period = "Class Intermission"
        timel = "13:35:00";
        classis = false;
    } else if (timex >= 13.35 && timex < 14.15) {
        bmessage = "Period 7 - 1:35 to 2:15"
        period = "Period 7"
        timel = "14:15:00";
        classis = false;
    } else if (timex >= 14.15 && timex < 14.20) {
        bmessage = "Period 7 & 8 Intermission - 2:15 to 2:20"
        period = "Class Intermission"
        timel = "14:20:00";
        classis = false;
    } else if (timex >= 14.20 && timex < 15.00) {
        bmessage = "Period 8 - 2:20 to 3:00"
        period = "Period 8"
        timel = "15:00:00";
        classis = false;
    } else if (timex >= 15.00 && timex < 15.30){
        bmessage = "Optional Tutorial - 3:00 to 3:30"
        period = "Tutorial"
        timel = "15:30:00";
        classis = false;
    } else if (timex >= 15.30 && timex < 17.00) {
        bmessage = "The library *MAY BE* open until 5:00 PM"
        period = "Have a great rest of your day! Library Closes in..."
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Wow, why are on here at this time. You need help! Get to class! If you see this message email me."
        timel = "1:00:00";
        classis = false;
    }
}

function GradeMeetingScheduleMiddleSchool(timex)
{
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 8.43) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 8:43"
        timel = "8:43:00";
        classis = true;
    } else if (timex >= 8.43 && timex < 8.48) {
        bmessage = "Period 1 & 2 Intermission - 8:43 to 8:48"
        period = "Class Intermission"
        timel = "8:48:00";
        classis = false;
    } else if (timex >= 8.48 && timex < 9.31) {
        period = "Period 2"
        bmessage = "Period 2 - 8:48 to 9:31"
        timel = "9:31:00";
        classis = true;
    } else if (timex >= 9.31 && timex < 9.50) {
        bmessage = "Class Meeting - 9:31 to 9:50, if your grade wasn't called stay in your second period"
        period = "Assembly"
        timel = "9:50:00";
        classis = false;
    } else if (timex >= 9.50 && timex < 10.12) {
        period = "Break"
        bmessage = "Break - 9:50 to 10:12"
        timel = "10:12:00";
        classis = true;
    }
    else if (timex >= 10.12 && timex < 10.55) {
        period = "Period 3"
        bmessage = "Period 3 - 10:12 to 10:55"
        timel = "10:55:00";
        classis = true;
    } else if (timex >= 10.55 && timex < 11.00) {
        bmessage = "Period 3 & 4 Intermission - 10:55 to 11:00"
        period = "Class Intermission"
        timel = "11:00:00";
        classis = false;
    } else if (timex >= 11.00 && timex < 11.43) {
        period = "Period 4"
        bmessage = "Period 4 - 11:00 to 11:43"
        timel = "11:43:00";
        classis = true;
    } else if (timex >= 11.43 && timex < 11.48) {
        bmessage = "Period 4 & 5 Intermission - 11:43 to 11:48"
        period = "Class Intermission"
        timel = "11:48:00";
        classis = false;
    } else if (timex >= 11.48 && timex < 12.31) {
        bmessage = "Period 5 - 11:48 to 12:31"
        period = "Period 5"
        timel = "12:31:00";
        classis = true;
    } else if (timex >= 12.31 && timex < 12.36) {
        bmessage = "Period 5 & 6 Intermission - 12:31 to 12:36"
        period = "Class Intermission"
        timel = "12:36:00";
        classis = false;
    } else if (timex >= 12.36 && timex < 13.19) {
        bmessage = "Period 6 - 12:36 to 1:19"
        period = "Period 6 LUNCH!!"
        timel = "13:19:00";
        classis = true;
    } else if (timex >= 13.19 && timex < 13.24) {
        bmessage = "Period 6 & 7 Intermission - 1:19 to 1:24"
        period = "Class Intermission"
        timel = "13:24:00";
        classis = false;
    } else if (timex >= 13.24 && timex < 14.07) {
        bmessage = "Period 7 - 1:24 to 2:07"
        period = "Period 7"
        timel = "14:07:00";
        classis = false;
    } else if (timex >= 14.07 && timex < 14.12) {
        bmessage = "Period 7 & 8 Intermission - 2:07 to 2:12"
        period = "Class Intermission"
        timel = "14:12:00";
        classis = false;
    } else if (timex >= 14.12 && timex < 14.55) {
        bmessage = "Period 8 - 2:12 to 2:55"
        period = "Period 8"
        timel = "14:55:00";
        classis = false;
    } else if (timex >= 14.55 && timex < 15.15) {
        bmessage = "Tutorial - 2:55 to 3:15"
        period = "Tutorial"
        timel = "15:15:00";
        classis = false;
    } else if (timex >= 15.15 && timex < 17.00) {
        bmessage = "The library *MAY BE* open until 5:00 PM"
        period = "Have a great rest of your day! Library Closes in..."
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Get to class!"
        timel = "1:00:00";
        classis = false;
    }
}

function tentativePSATSchedule()
{
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 8.35) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 8:35"
        timel = "8:35:00";
        classis = true;
    } else if (timex >= 8.35 && timex < 8.40) {
        bmessage = "Period 1 & 2 Intermission - 8:35 to 8:40"
        period = "Class Intermission"
        timel = "8:40:00";
        classis = false;
    } else if (timex >= 8.40 && timex < 9.10) {
        period = "Period 2"
        bmessage = "Period 2 - 8:40 to 9:10"
        timel = "9:10:00";
        classis = true;
    } else if (timex >= 9.10 && timex < 9.15) {
        bmessage = "NO BREAK"
        period = "Period 2 & 3 Intermission - 9:10 to 9:15"
        timel = "9:15:00";
        classis = false;
    }
    else if (timex >= 9.15 && timex < 9.45) {
        period = "Period 3"
        bmessage = "Period 3 - 9:15 to 9:45"
        timel = "10:55:00";
        classis = true;
    } else if (timex >= 9.45 && timex < 9.50) {
        bmessage = "Period 3 & 4 Intermission - 9:45 to 9:50"
        period = "Class Intermission"
        timel = "9:50:00";
        classis = false;
    } else if (timex >= 9.50 && timex < 10.20) {
        period = "Period 4"
        bmessage = "Period 4 - 9:50 to 10:20"
        timel = "10:20:00";
        classis = true;
    } else if (timex >= 10.20 && timex < 10.25) {
        bmessage = "Period 4 & 5 Intermission - 10:20 to 10:25"
        period = "Class Intermission"
        timel = "10:25:00";
        classis = false;
    } else if (timex >= 10.25 && timex < 10.55) {
        bmessage = "Period 5 & 6 NO LUNCH - 10:25 to 10:55"
        period = "Period 5 & 6"
        timel = "10:55:00";
        classis = true;
    } else if (timex >= 10.55 && timex < 11.00) {
        bmessage = "Period 5/6 & 7 Intermission - 10:55 to 11:00"
        period = "Class Intermission"
        timel = "11:00:00";
        classis = false;
    } else if (timex >= 11.00 && timex < 11.30) {
        bmessage = "Period 7 - 11:00 to 11:30"
        period = "Period 7"
        timel = "11:30:00";
        classis = false;
    } else if (timex >= 11.30 && timex < 11.35) {
        bmessage = "Period 7 & 8 Intermission - 11:30 to 11:35"
        period = "Class Intermission"
        timel = "11:35:00";
        classis = false;
    } else if (timex >= 11.35 && timex < 12.00) {
        bmessage = "Period 8 - 11:35 to 12:00"
        period = "Period 8"
        timel = "12:00:00";
        classis = false;
    } else if (timex >= 12.00 && timex < 17.00) {
        bmessage = "The library *MAY BE* open until 5:00 PM"
        period = "Have a great rest of your day! Library Closes in..."
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Get to class!"
        timel = "1:00:00";
        classis = false;
    }
    
}



function scheduleB() {

    /*
     * This can be re-entered from three places: the panel's onclick, the bell
     * alarm below, and the page-load hook at the bottom of the file. Each call
     * used to leave the previous run's 1-second interval and bell alarm
     * running, so the clock ticked several times a second and the bell could
     * ring over itself.
     */
    if (window.bellTimersB) {
        clearInterval(window.bellTimersB.clock);
        clearTimeout(window.bellTimersB.bell);
    }
    window.bellTimersB = { clock: null, bell: null };

    audio = new Audio('./img/guitarbell.mp3');

    var d = new Date();
    var n = d.getDay();
    getsch();

    //set the target countdown time
    function getsch() {


        //get current minute, seconds, and hours
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        var cminute = today.getMinutes();
        if (cminute < 10) {
            var cminute = "0" + cminute;
        }
        var chour = today.getHours();
        var csecond = today.getSeconds();


        //divide current minute by sixty (an hour)* and combine strings for hour + minute product*
        // new Date() and today are commensurated. ACtually, division is not necessary if the string (x.x) is accepted.
        var minute = cminute
        timex = chour + "." + cminute;

        if (n == 1) {
            dayweek = "Monday :("
            regularScheduleMiddleSchool(timex);
        }

        ///// Tuesday (Odd Block)
        if (n == 2) {
            dayweek = "Tuesday"
            OddBlock(timex);
        };

        ///// Wednesday (Even Block)
        if (n == 3) {
            dayweek = "Wednesday"
            //var timex = new Date().getHours();
            EvenBlock(timex);
        };

        if (n == 4) {
            dayweek = "Thursday"
            AssemblySchedule(timex);
        }


        if (n == 5) {
            //alert("The schedule may not be accurate today as the school never tells me when there is an assembly");
            dayweek = "Friday";
            //var timex = new Date().getHours();
            AssemblySchedule(timex);
        };

        if (n == 6) {
            dayweek = "Saturday!"
            period = "Please enjoy your weekend!"
            bmessage = "Enjoy Your Weekend!"
            timel = "24:00:00";
        };

        if (n == 0) {
            dayweek = "Sunday :|"
            period = "Just one more day please......."
            bmessage = "Enjoy Your Weekend!"
            timel = "24:00:00";
        }
    }
    

    function renderScheduleText() {
        bellSetText(["demo-b"], period);
        bellSetText(["demo2-b"], timex);
        bellSetText(["demo3-b"], dayweek);
        bellSetText(["demo4-b"], bmessage);
    }
    renderScheduleText();

    ////////////////
    //timel = "15:20:00";
    ////////////////

    // Built from numbers rather than a hand-made string -- see bellTargetTime().
    var countDownDate = bellTargetTime(timel).getTime();
    var x = setInterval;

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);






    //get everythiong again
    //get current minute, seconds, and hours
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    var cminute = today.getMinutes();
    if (cminute < 10) {
        var cminute = "0" + cminute;
    }
    var chour = today.getHours();
    var csecond = today.getSeconds();


    //divide current minute by sixty (an hour)* and combine strings for hour + minute product*
    // new Date() and today are commensurated. ACtually, division is not necessary if the string (x.x) is accepted.
    var minute = cminute;
    var timex = chour + "." + cminute;



    // Seconds left until the next bell.
    //
    // This used to be built up as `hours*60 + (minutes + hours*60)*60`, which
    // counts the hours twice: once correctly and once again in minutes. The
    // clock ran up to 23 minutes long, and the bell sound -- which is fired
    // from this same number -- rang that late too.
    finalseconds = Math.max(0, Math.floor(distance / 1000));
    window.xsec = finalseconds;


    /////////////////// Visuals preperation




    function getTimeRemaining(endtime) {
        // endtime is already a Date. Round-tripping it back through
        // Date.parse() re-parses toString() output, which is lossy and
        // engine-dependent -- another thing Safari disagreed with V8 about.
        var t = endtime.getTime() - Date.now();
        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);
        var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        return {
            'total': t,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        };
    }

    function initializeClock(endtime) {
        var clock = bellPick(['clockdiv2']);
        var daysSpan = bellPickIn(clock, ['.daysB']);
        var hoursSpan = bellPickIn(clock, ['.hoursB']);
        var minutesSpan = bellPickIn(clock, ['.minutesB']);
        var secondsSpan = bellPickIn(clock, ['.secondsB']);

        function updateClock() {
            var t = getTimeRemaining(endtime);

            // classtime.html shows the period name with no clock at all,
            // so every one of these may legitimately be absent.
            if (daysSpan) { daysSpan.innerHTML = t.days; }
            if (hoursSpan) { hoursSpan.innerHTML = ('0' + t.hours).slice(-2); }
            if (minutesSpan) { minutesSpan.innerHTML = ('0' + t.minutes).slice(-2); }
            if (secondsSpan) { secondsSpan.innerHTML = ('0' + t.seconds).slice(-2); }
            renderScheduleText();

            if (t.total <= 0) {
                clearInterval(timeinterval);
                getsch();
            }
        }
        getsch();
        checknull();
        updateClock();
        var timeinterval = setInterval(updateClock, 1000);
        window.bellTimersB.clock = timeinterval;
    }

    // Last number is mili seconds
    deadline = new Date(Date.now() + finalseconds * 1000);
    initializeClock(deadline);

    function checknull() {
        if (distance == 0) {
            getsch();
            window.location.reload();
        };

    };




    var x = document.getElementById("bell");

    function playAudio() {
        // iOS refuses to play audio that no user gesture started, and rejects
        // the play() promise. Left unhandled that rejection tears down the
        // timer callback it was fired from, so the countdown stops.
        try {
            var played = x && x.play();
            if (played && typeof played.catch === 'function') {
                played.catch(function () { /* muted by the browser: fine */ });
            }
        } catch (err) { /* no audio element on this page: fine */ }
    }

    function pauseAudio() {
        x.pause();
    }

    timeoutx = finalseconds * 1000;

    const start = Date.now();

    console.log('Starting alternate bell countdown for audio');

    window.bellTimersB.bell = setTimeout(() => {
        const millis = Date.now() - start;

        console.log(`seconds elapsed = ${Math.floor(millis / 1000)}, playing bell`);
        playAudio();
        scheduleB();
    }, timeoutx);


    document.cookie = "audioenabled = True";




    function exit(status) {

        var i;

        if (typeof status === 'string') {
            console.log(status);
        }

        window.addEventListener('error', function (e) { e.preventDefault(); e.stopPropagation(); }, false);

        var handlers = [
            'copy', 'cut', 'paste',
            'beforeunload', 'blur', 'change', 'click', 'contextmenu', 'dblclick', 'focus', 'keydown', 'keypress', 'keyup', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'resize', 'scroll',
            'DOMNodeInserted', 'DOMNodeRemoved', 'DOMNodeRemovedFromDocument', 'DOMNodeInsertedIntoDocument', 'DOMAttrModified', 'DOMCharacterDataModified', 'DOMElementNameChanged', 'DOMAttributeNameChanged', 'DOMActivate', 'DOMFocusIn', 'DOMFocusOut', 'online', 'offline', 'textInput',
            'abort', 'close', 'dragdrop', 'load', 'paint', 'reset', 'select', 'submit', 'unload'
        ];

        function stopPropagation(e) {
            e.stopPropagation();
            // e.preventDefault(); // Stop for the form controls, etc., too?
        }
        for (i = 0; i < handlers.length; i++) {
            window.addEventListener(handlers[i], function (e) { stopPropagation(e); }, true);
        }

        if (window.stop) {
            window.stop();
        }

        throw '';
    }

}


/*
 * index.html starts the clock when you tap the schedule panel. The older pages
 * (classtime.html, old-days.html, schedule-b.html) have no such trigger -- they
 * expected the missing bell.js to fill the clock in by itself. Start
 * automatically whenever this page has the markup and nothing has started yet,
 * which also means index.html's clock is already correct the moment the panel
 * opens instead of a tick later.
 */
(function () {
    function autostart() {
        if (window.bellTimersB) { return; }          // already running
        if (!bellPick(['clockdiv2', 'demo-b'])) { return; }   // not this page
        try {
            scheduleB();
        } catch (err) {
            // A page with only part of the markup should not break the rest
            // of its scripts.
            if (window.console && console.warn) { console.warn('bell: ' + err); }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autostart);
    } else {
        autostart();
    }
})();


// Published for the inline onclick="scheduleB()" handlers in the pages.
window.scheduleB = scheduleB;

})();
