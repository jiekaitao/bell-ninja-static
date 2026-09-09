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

//alert("Hi! This schedule isa werong because twe can an acseembly!!");




/*
 * 2026-2027 Riviera Preparatory bell schedule.
 *
 * `timex` is the current time encoded as HOUR.MINUTE ("13.24" is 1:24 PM), so
 * every boundary below is written the same way. Each branch ends exactly where
 * the next one begins: a gap would drop through to the fallback and start
 * counting down to 1 AM.
 */
function regularSchedule(timex, hasTutorial) {
    if (hasTutorial === undefined) { hasTutorial = true; }

    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 8.51) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 8:51"
        timel = "8:51:00";
        classis = true;
    } else if (timex >= 8.51 && timex < 8.55) {
        period = "Class Intermission"
        bmessage = "Period 1 & 2 Intermission - 8:51 to 8:55"
        timel = "8:55:00";
        classis = false;
    } else if (timex >= 8.55 && timex < 9.41) {
        period = "Period 2"
        bmessage = "Period 2 - 8:55 to 9:41"
        timel = "9:41:00";
        classis = true;
    } else if (timex >= 9.41 && timex < 10.00) {
        period = "Break Time"
        bmessage = "Break - 9:41 to 10:00"
        timel = "10:00:00";
        classis = false;
    } else if (timex >= 10.00 && timex < 10.04) {
        period = "Class Intermission"
        bmessage = "Break & Period 3 Intermission - 10:00 to 10:04"
        timel = "10:04:00";
        classis = false;
    } else if (timex >= 10.04 && timex < 10.50) {
        period = "Period 3"
        bmessage = "Period 3 - 10:04 to 10:50"
        timel = "10:50:00";
        classis = true;
    } else if (timex >= 10.50 && timex < 10.54) {
        period = "Class Intermission"
        bmessage = "Period 3 & 4 Intermission - 10:50 to 10:54"
        timel = "10:54:00";
        classis = false;
    } else if (timex >= 10.54 && timex < 11.40) {
        period = "Period 4 / Lunch 6th-7th"
        bmessage = "Period 4 / Lunch 6th-7th - 10:54 to 11:40"
        timel = "11:40:00";
        classis = true;
    } else if (timex >= 11.40 && timex < 11.44) {
        period = "Class Intermission"
        bmessage = "Period 4 & 5 Intermission - 11:40 to 11:44"
        timel = "11:44:00";
        classis = false;
    } else if (timex >= 11.44 && timex < 12.30) {
        period = "Period 5 / Lunch 8th-9th"
        bmessage = "Period 5 / Lunch 8th-9th - 11:44 to 12:30"
        timel = "12:30:00";
        classis = true;
    } else if (timex >= 12.30 && timex < 12.34) {
        period = "Class Intermission"
        bmessage = "Period 5 & 6 Intermission - 12:30 to 12:34"
        timel = "12:34:00";
        classis = false;
    } else if (timex >= 12.34 && timex < 13.20) {
        period = "Period 6 / Lunch 10th-12th"
        bmessage = "Period 6 / Lunch 10th-12th - 12:34 to 1:20"
        timel = "13:20:00";
        classis = true;
    } else if (timex >= 13.20 && timex < 13.24) {
        period = "Class Intermission"
        bmessage = "Period 6 & 7 Intermission - 1:20 to 1:24"
        timel = "13:24:00";
        classis = false;
    } else if (timex >= 13.24 && timex < 14.10) {
        period = "Period 7"
        bmessage = "Period 7 - 1:24 to 2:10"
        timel = "14:10:00";
        classis = true;
    } else if (timex >= 14.10 && timex < 14.14) {
        period = "Class Intermission"
        bmessage = "Period 7 & 8 Intermission - 2:10 to 2:14"
        timel = "14:14:00";
        classis = false;
    } else if (timex >= 14.14 && timex < 15.00) {
        period = "Period 8"
        bmessage = "Period 8 - 2:14 to 3:00"
        timel = "15:00:00";
        classis = true;
    } else if (timex >= 15.00 && timex < 15.30) {
        // Optional tutorial runs Monday, Tuesday, Thursday and Friday only.
        period = hasTutorial ? "Optional Tutorial" : "School's out!"
        bmessage = hasTutorial ? "Optional Tutorial - 3:00 to 3:30" : "No tutorial today - see you tomorrow!"
        timel = "15:30:00";
        classis = false;
    } else if (timex >= 15.30 && timex < 17.00) {
        period = "Have a great rest of your day! Library Closes in..."
        bmessage = "The library *MAY BE* open until 5:00 PM"
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great rest of your day!"
        bmessage = "See you tomorrow!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Wow, devoted. Get to class! If you see this message email me."
        bmessage = "Something is off with the schedule - please email me."
        timel = "1:00:00";
        classis = false;
    }
};

/*
 * Friday runs on its own bell times, with Thrive Time / Assembly in the
 * morning slot where Monday-Thursday has Break.
 */
function fridaySchedule(timex) {
    if (timex >= 0.00 && timex < 8.00) {
        period = "Good Morning! School Starts in..."
        bmessage = "Early Bird Until 8:00"
        timel = "8:00:00";
        classis = false;
    } else if (timex >= 8.00 && timex < 8.44) {
        period = "Period 1"
        bmessage = "Period 1 - 8:00 to 8:44"
        timel = "8:44:00";
        classis = true;
    } else if (timex >= 8.44 && timex < 8.48) {
        period = "Class Intermission"
        bmessage = "Period 1 & 2 Intermission - 8:44 to 8:48"
        timel = "8:48:00";
        classis = false;
    } else if (timex >= 8.48 && timex < 9.32) {
        period = "Period 2"
        bmessage = "Period 2 - 8:48 to 9:32"
        timel = "9:32:00";
        classis = true;
    } else if (timex >= 9.32 && timex < 9.36) {
        period = "Class Intermission"
        bmessage = "Period 2 & Thrive Time Intermission - 9:32 to 9:36"
        timel = "9:36:00";
        classis = false;
    } else if (timex >= 9.36 && timex < 10.12) {
        period = "Thrive Time / Assembly"
        bmessage = "Thrive Time - Small Groups or Assembly - 9:36 to 10:12"
        timel = "10:12:00";
        classis = false;
    } else if (timex >= 10.12 && timex < 10.16) {
        period = "Class Intermission"
        bmessage = "Thrive Time & Period 3 Intermission - 10:12 to 10:16"
        timel = "10:16:00";
        classis = false;
    } else if (timex >= 10.16 && timex < 11.00) {
        period = "Period 3"
        bmessage = "Period 3 - 10:16 to 11:00"
        timel = "11:00:00";
        classis = true;
    } else if (timex >= 11.00 && timex < 11.04) {
        period = "Class Intermission"
        bmessage = "Period 3 & 4 Intermission - 11:00 to 11:04"
        timel = "11:04:00";
        classis = false;
    } else if (timex >= 11.04 && timex < 11.48) {
        period = "Period 4 / Lunch 6th-7th"
        bmessage = "Period 4 / Lunch 6th-7th - 11:04 to 11:48"
        timel = "11:48:00";
        classis = true;
    } else if (timex >= 11.48 && timex < 11.52) {
        period = "Class Intermission"
        bmessage = "Period 4 & 5 Intermission - 11:48 to 11:52"
        timel = "11:52:00";
        classis = false;
    } else if (timex >= 11.52 && timex < 12.36) {
        period = "Period 5 / Lunch 8th-9th"
        bmessage = "Period 5 / Lunch 8th-9th - 11:52 to 12:36"
        timel = "12:36:00";
        classis = true;
    } else if (timex >= 12.36 && timex < 12.40) {
        period = "Class Intermission"
        bmessage = "Period 5 & 6 Intermission - 12:36 to 12:40"
        timel = "12:40:00";
        classis = false;
    } else if (timex >= 12.40 && timex < 13.24) {
        period = "Period 6 / Lunch 10th-12th"
        bmessage = "Period 6 / Lunch 10th-12th - 12:40 to 1:24"
        timel = "13:24:00";
        classis = true;
    } else if (timex >= 13.24 && timex < 13.28) {
        period = "Class Intermission"
        bmessage = "Period 6 & 7 Intermission - 1:24 to 1:28"
        timel = "13:28:00";
        classis = false;
    } else if (timex >= 13.28 && timex < 14.12) {
        period = "Period 7"
        bmessage = "Period 7 - 1:28 to 2:12"
        timel = "14:12:00";
        classis = true;
    } else if (timex >= 14.12 && timex < 14.16) {
        period = "Class Intermission"
        bmessage = "Period 7 & 8 Intermission - 2:12 to 2:16"
        timel = "14:16:00";
        classis = false;
    } else if (timex >= 14.16 && timex < 15.00) {
        period = "Period 8"
        bmessage = "Period 8 - 2:16 to 3:00"
        timel = "15:00:00";
        classis = true;
    } else if (timex >= 15.00 && timex < 15.30) {
        period = "Optional Tutorial"
        bmessage = "Optional Tutorial - 3:00 to 3:30"
        timel = "15:30:00";
        classis = false;
    } else if (timex >= 15.30 && timex < 17.00) {
        period = "Have a great weekend! Library Closes in..."
        bmessage = "The library *MAY BE* open until 5:00 PM"
        timel = "17:00:00";
        classis = false;
    } else if (timex >= 17.00 && timex <= 24.59) {
        period = "Have a great weekend!"
        bmessage = "Enjoy Your Weekend!"
        timel = "24:00:00";
        classis = false;
    } else {
        period = "Wow, devoted. Get to class! If you see this message email me."
        bmessage = "Something is off with the schedule - please email me."
        timel = "1:00:00";
        classis = false;
    }
};



function scheduleA() {

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
            regularSchedule(timex);
        };

        ///// Tuesday
        if (n == 2) {
            dayweek = "Tuesday"
            regularSchedule(timex);
        };

        ///// Wednesday -- same bells as Mon/Tue/Thu, but no optional tutorial.
        if (n == 3) {
            dayweek = "Wednesday"
            regularSchedule(timex, false);
        };

        if (n == 4) {
            dayweek = "Thursday"
            regularSchedule(timex);
        }


        if (n == 5) {
            dayweek = "Friday";
            fridaySchedule(timex);
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


    document.getElementById("demo-a").innerHTML = period;
    document.getElementById("demo2-a").innerHTML = timex;
    document.getElementById("demo3-a").innerHTML = dayweek;
    document.getElementById("demo4-a").innerHTML = bmessage;

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

    function initializeClock(id, endtime) {
        var clock = document.getElementById(id);
        var daysSpan = clock.querySelector('.daysA');
        var hoursSpan = clock.querySelector('.hoursA');
        var minutesSpan = clock.querySelector('.minutesA');
        var secondsSpan = clock.querySelector('.secondsA');

        function updateClock() {
            var t = getTimeRemaining(endtime);

            daysSpan.innerHTML = t.days;
            hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if (t.total <= 0) {
                clearInterval(timeinterval);
                getsch();
            }
        }
        getsch();
        checknull();
        updateClock();
        var timeinterval = setInterval(updateClock, 1000);
    }

    // Last number is mili seconds
    deadline = new Date(Date.now() + xsec * 1000);
    initializeClock('clockdiv1', deadline);

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

    setTimeout(() => {
        const millis = Date.now() - start;

        console.log(`seconds elapsed = ${Math.floor(millis / 1000)}, playing bell`);
        playAudio();
        scheduleA();
    }, timeoutx);



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
